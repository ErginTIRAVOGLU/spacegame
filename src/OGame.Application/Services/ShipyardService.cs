using Microsoft.EntityFrameworkCore;
using OGame.Application.Common.Interfaces;
using OGame.Application.Interfaces;
using OGame.Domain.Entities;
using OGame.Domain.Enums;
using OGame.Domain.Services;

namespace OGame.Application.Services;

public class ShipyardService(
    IApplicationDbContext dbContext,
    IResourceCalculationService resourceService,
    IJobScheduler jobScheduler,
    IDistributedLockService lockService) : IShipyardService
{
    public async Task<ShipyardQueueItem> EnqueueUnitBatchAsync(
        Guid planetId,
        UnitType unitType,
        int count,
        CancellationToken cancellationToken = default)
    {
        if (count <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(count), "Batch count must be greater than zero.");
        }

        string lockKey = $"lock:planet:{planetId}";
        await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

        var planet = await dbContext.Planets
            .Include(p => p.Buildings)
            .Include(p => p.ShipyardQueue)
            .Include(p => p.Units)
            .FirstOrDefaultAsync(p => p.Id == planetId, cancellationToken)
            ?? throw new InvalidOperationException($"Planet {planetId} not found.");

        int shipyardLevel = planet.Buildings.FirstOrDefault(b => b.BuildingType == BuildingType.Shipyard)?.Level ?? 0;
        if (shipyardLevel <= 0)
        {
            throw new InvalidOperationException("A Shipyard is required on this planet to construct units.");
        }

        if (unitType == UnitType.SmallShieldDome || unitType == UnitType.LargeShieldDome)
        {
            int existingCount = planet.Units.FirstOrDefault(u => u.UnitType == unitType)?.Count ?? 0;
            int queuedCount = planet.ShipyardQueue.Where(q => q.UnitType == unitType).Sum(q => q.TotalCount - q.CompletedCount);
            if (existingCount + queuedCount + count > 1)
            {
                throw new InvalidOperationException($"{unitType} gezegen başına en fazla 1 adet inşa edilebilir.");
            }
        }

        if (unitType == UnitType.AntiBallisticMissile || unitType == UnitType.InterplanetaryMissile)
        {
            int siloLevel = planet.Buildings.FirstOrDefault(b => b.BuildingType == BuildingType.MissileSilo)?.Level ?? 0;
            int currentAbm = (planet.Units.FirstOrDefault(u => u.UnitType == UnitType.AntiBallisticMissile)?.Count ?? 0) +
                             planet.ShipyardQueue.Where(q => q.UnitType == UnitType.AntiBallisticMissile).Sum(q => q.TotalCount - q.CompletedCount);
            int currentIpm = (planet.Units.FirstOrDefault(u => u.UnitType == UnitType.InterplanetaryMissile)?.Count ?? 0) +
                             planet.ShipyardQueue.Where(q => q.UnitType == UnitType.InterplanetaryMissile).Sum(q => q.TotalCount - q.CompletedCount);

            int addAbm = unitType == UnitType.AntiBallisticMissile ? count : 0;
            int addIpm = unitType == UnitType.InterplanetaryMissile ? count : 0;

            if (!MissileAndUniverseFormulas.CanStoreMissilesInSilo(siloLevel, currentAbm, currentIpm, addAbm, addIpm))
            {
                int capacity = MissileAndUniverseFormulas.CalculateMissileSiloCapacitySlots(siloLevel);
                throw new InvalidOperationException(
                    $"Insufficient Missile Silo capacity (Level {siloLevel} = {capacity} slots; ABM = 1 slot, IPM = 2 slots).");
            }
        }

        int naniteLevel = planet.Buildings.FirstOrDefault(b => b.BuildingType == BuildingType.NaniteFactory)?.Level ?? 0;

        var now = DateTime.UtcNow;
        resourceService.ApplyLazyUpdate(planet, now);

        var unitCost = ConstructionFormulas.GetUnitCost(unitType);
        double totalMetal = unitCost.Metal * count;
        double totalCrystal = unitCost.Crystal * count;
        double totalDeuterium = unitCost.Deuterium * count;

        if (planet.Metal < totalMetal || planet.Crystal < totalCrystal || planet.Deuterium < totalDeuterium)
        {
            throw new InvalidOperationException("Insufficient resources on planet to queue unit batch.");
        }

        planet.Metal -= totalMetal;
        planet.Crystal -= totalCrystal;
        planet.Deuterium -= totalDeuterium;

        double unitDurationSeconds = ConstructionFormulas.CalculateUnitDurationSeconds(
            unitCost.Metal,
            unitCost.Crystal,
            shipyardLevel,
            naniteLevel);

        // If there are already queued batches on this planet, chain after the last batch finishes
        DateTime batchStartUtc = now;
        if (planet.ShipyardQueue.Count > 0)
        {
            var lastBatchEnd = planet.ShipyardQueue
                .Max(q => q.BatchStartTimeUtc.AddSeconds(q.TotalCount * q.UnitDurationSeconds));

            if (lastBatchEnd > now)
            {
                batchStartUtc = lastBatchEnd;
            }
        }

        var nextUnitFinishUtc = batchStartUtc.AddSeconds(unitDurationSeconds);
        var batchEndUtc = batchStartUtc.AddSeconds(count * unitDurationSeconds);

        var batchItem = new ShipyardQueueItem
        {
            Id = Guid.NewGuid(),
            PlanetId = planet.Id,
            UnitType = unitType,
            TotalCount = count,
            CompletedCount = 0,
            UnitDurationSeconds = unitDurationSeconds,
            BatchStartTimeUtc = batchStartUtc,
            NextUnitFinishUtc = nextUnitFinishUtc
        };

        // Schedule a SINGLE Hangfire delayed job for the entire batch completion (TotalCount * UnitDuration)
        string jobId = jobScheduler.ScheduleShipyardBatchCompletion(
            planet.Id,
            batchItem.Id,
            new DateTimeOffset(batchEndUtc, TimeSpan.Zero));

        batchItem.HangfireBatchJobId = jobId;

        dbContext.ShipyardQueueItems.Add(batchItem);
        await dbContext.SaveChangesAsync(cancellationToken);

        return batchItem;
    }

    public async Task<ShipyardEvaluationSnapshot> EvaluatePlanetShipyardQueueAsync(
        Guid planetId,
        DateTime utcNow,
        CancellationToken cancellationToken = default)
    {
        string lockKey = $"lock:planet:{planetId}";
        await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

        return await EvaluatePlanetShipyardQueueInternalAsync(planetId, utcNow, cancellationToken);
    }

    public async Task CompleteShipyardBatchAsync(
        Guid planetId,
        Guid batchQueueItemId,
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var batch = await dbContext.ShipyardQueueItems
            .FirstOrDefaultAsync(q => q.Id == batchQueueItemId && q.PlanetId == planetId, cancellationToken);

        if (batch is null)
        {
            return;
        }

        var effectiveEvaluationTime = batch.BatchStartTimeUtc.AddSeconds(batch.TotalCount * batch.UnitDurationSeconds);
        if (now > effectiveEvaluationTime)
        {
            effectiveEvaluationTime = now;
        }

        await EvaluatePlanetShipyardQueueInternalAsync(planetId, effectiveEvaluationTime, cancellationToken);
    }

    private async Task<ShipyardEvaluationSnapshot> EvaluatePlanetShipyardQueueInternalAsync(
        Guid planetId,
        DateTime utcNow,
        CancellationToken cancellationToken)
    {
        var queueItems = await dbContext.ShipyardQueueItems
            .Where(q => q.PlanetId == planetId)
            .OrderBy(q => q.BatchStartTimeUtc)
            .ToListAsync(cancellationToken);

        var stationedUnits = await dbContext.PlanetUnits
            .Where(u => u.PlanetId == planetId)
            .ToListAsync(cancellationToken);

        int totalNewlyCompleted = 0;

        foreach (var batch in queueItems.ToList())
        {
            int finishedUnits = ConstructionFormulas.CalculateFinishedBatchUnits(
                batch.TotalCount,
                batch.CompletedCount,
                batch.UnitDurationSeconds,
                batch.BatchStartTimeUtc,
                utcNow);

            if (finishedUnits <= 0)
            {
                continue;
            }

            batch.CompletedCount += finishedUnits;
            totalNewlyCompleted += finishedUnits;

            var planetUnit = stationedUnits.FirstOrDefault(u => u.UnitType == batch.UnitType);
            if (planetUnit is null)
            {
                planetUnit = new PlanetUnit
                {
                    Id = Guid.NewGuid(),
                    PlanetId = planetId,
                    UnitType = batch.UnitType,
                    Count = finishedUnits
                };
                stationedUnits.Add(planetUnit);
                dbContext.PlanetUnits.Add(planetUnit);
            }
            else
            {
                planetUnit.Count += finishedUnits;
            }

            if (batch.CompletedCount >= batch.TotalCount)
            {
                dbContext.ShipyardQueueItems.Remove(batch);
                queueItems.Remove(batch);
            }
            else
            {
                batch.NextUnitFinishUtc = batch.BatchStartTimeUtc.AddSeconds((batch.CompletedCount + 1) * batch.UnitDurationSeconds);
            }
        }

        if (totalNewlyCompleted > 0)
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        return new ShipyardEvaluationSnapshot(
            PlanetId: planetId,
            NewlyCompletedUnitsTotal: totalNewlyCompleted,
            ActiveQueueItems: queueItems,
            StationedUnits: stationedUnits);
    }
}

