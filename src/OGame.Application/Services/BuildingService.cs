using Microsoft.EntityFrameworkCore;
using OGame.Application.Common.Interfaces;
using OGame.Application.Interfaces;
using OGame.Domain.Entities;
using OGame.Domain.Enums;
using OGame.Domain.Services;

namespace OGame.Application.Services;

public class BuildingService(
    IApplicationDbContext dbContext,
    IResourceCalculationService resourceService,
    IActivityService activityService,
    IJobScheduler jobScheduler,
    IDistributedLockService lockService) : IBuildingService
{
    public async Task<BuildingQueueItem> EnqueueBuildingUpgradeAsync(
        Guid planetId,
        BuildingType buildingType,
        CancellationToken cancellationToken = default)
    {
        string lockKey = $"lock:planet:{planetId}";
        await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

        var planet = await dbContext.Planets
            .Include(p => p.Buildings)
            .Include(p => p.BuildingQueue)
            .FirstOrDefaultAsync(p => p.Id == planetId, cancellationToken)
            ?? throw new InvalidOperationException($"Planet {planetId} not found.");

        if (planet.BuildingQueue.Count > 0)
        {
            throw new InvalidOperationException("This planet already has an active building construction in queue.");
        }

        if (planet.FieldsUsed >= planet.MaxFields)
        {
            throw new InvalidOperationException("No available planet fields remaining.");
        }

        bool isMoonExclusive = buildingType is BuildingType.MoonBase or BuildingType.SensorPhalanx or BuildingType.JumpGate;
        if (isMoonExclusive && !planet.IsMoon)
        {
            throw new InvalidOperationException($"{buildingType} can only be constructed on a Moon.");
        }

        bool isForbiddenOnMoon = buildingType is BuildingType.MetalStorage or BuildingType.CrystalStorage or BuildingType.DeuteriumTank;
        if (isForbiddenOnMoon && planet.IsMoon)
        {
            throw new InvalidOperationException($"{buildingType} cannot be constructed on a Moon.");
        }

        int roboticsLevel = planet.Buildings.FirstOrDefault(b => b.BuildingType == BuildingType.RoboticsFactory)?.Level ?? 0;
        int naniteLevel = planet.Buildings.FirstOrDefault(b => b.BuildingType == BuildingType.NaniteFactory)?.Level ?? 0;

        if (buildingType == BuildingType.Shipyard && roboticsLevel < 2)
        {
            throw new InvalidOperationException("Uzay Tersanesi için Robot Fabrikası Seviye 2 gereklidir.");
        }

        if (buildingType == BuildingType.NaniteFactory)
        {
            int computerTechLevel = await dbContext.UserResearches
                .AsNoTracking()
                .Where(r => r.UserId == planet.UserId && r.ResearchType == ResearchType.ComputerTechnology)
                .Select(r => r.Level)
                .FirstOrDefaultAsync(cancellationToken);

            if (roboticsLevel < 10 || computerTechLevel < 10)
            {
                throw new InvalidOperationException("Nanit Fabrikası için Robot Fabrikası Seviye 10 ve Bilgisayar Tekniği Seviye 10 gereklidir.");
            }
        }

        if (buildingType == BuildingType.Terraformer)
        {
            int energyTechLevel = await dbContext.UserResearches
                .AsNoTracking()
                .Where(r => r.UserId == planet.UserId && r.ResearchType == ResearchType.EnergyTechnology)
                .Select(r => r.Level)
                .FirstOrDefaultAsync(cancellationToken);

            if (naniteLevel < 1 || energyTechLevel < 12)
            {
                throw new InvalidOperationException("Terraformer için Nanit Fabrikası Seviye 1 ve Enerji Tekniği Seviye 12 gereklidir.");
            }
        }

        var now = DateTime.UtcNow;
        resourceService.ApplyLazyUpdate(planet, now);

        int currentLevel = planet.Buildings.FirstOrDefault(b => b.BuildingType == buildingType)?.Level ?? 0;
        int targetLevel = currentLevel + 1;

        var cost = ConstructionFormulas.GetBuildingUpgradeCost(buildingType, targetLevel);
        if (planet.Metal < cost.Metal || planet.Crystal < cost.Crystal || planet.Deuterium < cost.Deuterium)
        {
            throw new InvalidOperationException("Insufficient resources on planet to start building upgrade.");
        }

        planet.Metal -= cost.Metal;
        planet.Crystal -= cost.Crystal;
        planet.Deuterium -= cost.Deuterium;

        double durationSeconds = ConstructionFormulas.CalculateBuildingDurationSeconds(
            cost.Metal,
            cost.Crystal,
            roboticsLevel,
            naniteLevel);

        var endTimeUtc = now.AddSeconds(durationSeconds);
        var queueItem = new BuildingQueueItem
        {
            Id = Guid.NewGuid(),
            PlanetId = planet.Id,
            BuildingType = buildingType,
            TargetLevel = targetLevel,
            StartTimeUtc = now,
            EndTimeUtc = endTimeUtc
        };

        string jobId = jobScheduler.ScheduleBuildingCompletion(
            planet.Id,
            queueItem.Id,
            new DateTimeOffset(endTimeUtc, TimeSpan.Zero));

        queueItem.HangfireJobId = jobId;

        dbContext.BuildingQueueItems.Add(queueItem);
        await dbContext.SaveChangesAsync(cancellationToken);

        await activityService.RecordActivityAsync(
            planet.Galaxy,
            planet.System,
            planet.Slot,
            planet.IsMoon ? CoordinateType.Moon : CoordinateType.Planet,
            new DateTimeOffset(now, TimeSpan.Zero),
            cancellationToken);

        return queueItem;
    }

    public async Task<BuildingQueueItem> EnqueueBuildingDemolishAsync(
        Guid planetId,
        BuildingType buildingType,
        CancellationToken cancellationToken = default)
    {
        string lockKey = $"lock:planet:{planetId}";
        await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

        var planet = await dbContext.Planets
            .Include(p => p.Buildings)
            .Include(p => p.BuildingQueue)
            .FirstOrDefaultAsync(p => p.Id == planetId, cancellationToken)
            ?? throw new InvalidOperationException($"Planet {planetId} not found.");

        if (planet.BuildingQueue.Count > 0)
        {
            throw new InvalidOperationException("This planet already has an active building construction in queue.");
        }

        if (!ConstructionFormulas.CanDemolish(buildingType))
        {
            throw new InvalidOperationException($"{buildingType} is indestructible and cannot be demolished.");
        }

        var building = planet.Buildings.FirstOrDefault(b => b.BuildingType == buildingType);
        if (building is null || building.Level <= 0)
        {
            throw new InvalidOperationException($"Cannot demolish {buildingType} because its level is 0.");
        }

        var now = DateTime.UtcNow;
        resourceService.ApplyLazyUpdate(planet, now);

        int ionTechLevel = await dbContext.UserResearches
            .AsNoTracking()
            .Where(r => r.UserId == planet.UserId && r.ResearchType == ResearchType.IonTechnology)
            .Select(r => r.Level)
            .FirstOrDefaultAsync(cancellationToken);

        var cost = ConstructionFormulas.CalculateDemolitionCost(buildingType, building.Level, ionTechLevel);
        // Demolition duration is based on the undiscounted level cost (Ion Technology never changes duration)
        var fullCost = ConstructionFormulas.CalculateDemolitionCost(buildingType, building.Level, 0);
        if (planet.Metal < cost.Metal || planet.Crystal < cost.Crystal || planet.Deuterium < cost.Deuterium)
        {
            throw new InvalidOperationException("Insufficient resources on planet to start building demolition.");
        }

        planet.Metal -= cost.Metal;
        planet.Crystal -= cost.Crystal;
        planet.Deuterium -= cost.Deuterium;

        int roboticsLevel = planet.Buildings.FirstOrDefault(b => b.BuildingType == BuildingType.RoboticsFactory)?.Level ?? 0;
        int naniteLevel = planet.Buildings.FirstOrDefault(b => b.BuildingType == BuildingType.NaniteFactory)?.Level ?? 0;

        double durationSeconds = ConstructionFormulas.CalculateBuildingDurationSeconds(
            fullCost.Metal,
            fullCost.Crystal,
            roboticsLevel,
            naniteLevel);

        int targetLevel = building.Level - 1;
        var endTimeUtc = now.AddSeconds(durationSeconds);
        var queueItem = new BuildingQueueItem
        {
            Id = Guid.NewGuid(),
            PlanetId = planet.Id,
            BuildingType = buildingType,
            TargetLevel = targetLevel,
            StartTimeUtc = now,
            EndTimeUtc = endTimeUtc
        };

        string jobId = jobScheduler.ScheduleBuildingCompletion(
            planet.Id,
            queueItem.Id,
            new DateTimeOffset(endTimeUtc, TimeSpan.Zero));

        queueItem.HangfireJobId = jobId;

        dbContext.BuildingQueueItems.Add(queueItem);
        await dbContext.SaveChangesAsync(cancellationToken);

        await activityService.RecordActivityAsync(
            planet.Galaxy,
            planet.System,
            planet.Slot,
            planet.IsMoon ? CoordinateType.Moon : CoordinateType.Planet,
            new DateTimeOffset(now, TimeSpan.Zero),
            cancellationToken);

        return queueItem;
    }

    public async Task<BuildingCompletedResult?> CompleteBuildingUpgradeAsync(
        Guid planetId,
        Guid queueItemId,
        CancellationToken cancellationToken = default)
    {
        var queueItem = await dbContext.BuildingQueueItems
            .FirstOrDefaultAsync(q => q.Id == queueItemId && q.PlanetId == planetId, cancellationToken);

        if (queueItem is null)
        {
            return null;
        }

        var planet = await dbContext.Planets
            .Include(p => p.Buildings)
            .FirstOrDefaultAsync(p => p.Id == planetId, cancellationToken);

        if (planet is null)
        {
            return null;
        }

        var now = DateTime.UtcNow;
        var effectiveCompletionUtc = now >= queueItem.EndTimeUtc ? queueItem.EndTimeUtc : now;

        // First accrue resources using the old building levels up to completion time
        resourceService.ApplyLazyUpdate(planet, effectiveCompletionUtc);

        var building = planet.Buildings.FirstOrDefault(b => b.BuildingType == queueItem.BuildingType);
        bool isDemolition = building != null && queueItem.TargetLevel < building.Level;

        if (isDemolition)
        {
            building!.Level = Math.Max(0, queueItem.TargetLevel);
            planet.FieldsUsed = Math.Max(0, planet.FieldsUsed - 1);
            if (queueItem.BuildingType == BuildingType.MoonBase)
            {
                planet.MaxFields = Math.Max(1, planet.MaxFields - MoonAndPhalanxFormulas.MoonBaseFieldsGrantedPerLevel);
            }
            else if (queueItem.BuildingType == BuildingType.Terraformer)
            {
                planet.MaxFields = Math.Max(1, planet.MaxFields - ColonizationFormulas.GetTerraformerFieldsGranted(building.Level + 1));
            }
        }
        else
        {
            if (building is null)
            {
                building = new Building
                {
                    Id = Guid.NewGuid(),
                    PlanetId = planet.Id,
                    BuildingType = queueItem.BuildingType,
                    Level = queueItem.TargetLevel
                };
                planet.Buildings.Add(building);
                dbContext.Buildings.Add(building);
            }
            else
            {
                building.Level = Math.Max(building.Level, queueItem.TargetLevel);
            }

            planet.FieldsUsed += 1;
            if (queueItem.BuildingType == BuildingType.MoonBase)
            {
                planet.MaxFields += MoonAndPhalanxFormulas.MoonBaseFieldsGrantedPerLevel;
            }
            else if (queueItem.BuildingType == BuildingType.Terraformer)
            {
                planet.MaxFields += ColonizationFormulas.GetTerraformerFieldsGranted(queueItem.TargetLevel);
            }
        }

        // If completion occurred slightly after EndTimeUtc, accrue with new level up to now
        if (now > effectiveCompletionUtc)
        {
            resourceService.ApplyLazyUpdate(planet, now);
        }

        dbContext.BuildingQueueItems.Remove(queueItem);
        await dbContext.SaveChangesAsync(cancellationToken);

        await activityService.RecordActivityAsync(
            planet.Galaxy,
            planet.System,
            planet.Slot,
            planet.IsMoon ? CoordinateType.Moon : CoordinateType.Planet,
            new DateTimeOffset(now, TimeSpan.Zero),
            cancellationToken);

        return new BuildingCompletedResult(
            UserId: planet.UserId,
            PlanetId: planet.Id,
            QueueItemId: queueItem.Id,
            BuildingType: queueItem.BuildingType,
            NewLevel: building.Level,
            CompletedAtUtc: now);
    }
}
