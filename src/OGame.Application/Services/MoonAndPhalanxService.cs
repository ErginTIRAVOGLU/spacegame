using Microsoft.EntityFrameworkCore;
using OGame.Application.Common.Interfaces;
using OGame.Application.Interfaces;
using OGame.Domain.Entities;
using OGame.Domain.Enums;
using OGame.Domain.Services;

namespace OGame.Application.Services;

public class MoonAndPhalanxService(
    IApplicationDbContext dbContext,
    IResourceCalculationService resourceService,
    IJumpGateCooldownService jumpGateCooldownService,
    IDistributedLockService lockService) : IMoonAndPhalanxService
{
    public async Task<Planet?> TryFormMoonFromDebrisAsync(
        Planet parentPlanet,
        double debrisMetal,
        double debrisCrystal,
        int? seed = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(parentPlanet);

        if (parentPlanet.IsMoon)
        {
            return null;
        }

        int moonChance = MoonAndPhalanxFormulas.CalculateMoonChancePercent(debrisMetal, debrisCrystal);
        if (moonChance <= 0)
        {
            return null;
        }

        bool moonAlreadyExists = await dbContext.Planets
            .AnyAsync(p =>
                p.Galaxy == parentPlanet.Galaxy &&
                p.System == parentPlanet.System &&
                p.Slot == parentPlanet.Slot &&
                p.IsMoon,
                cancellationToken);

        if (moonAlreadyExists)
        {
            return null;
        }

        var rng = seed.HasValue ? new Random(seed.Value) : new Random();
        int roll = rng.Next(1, 101); // 1..100
        if (roll > moonChance)
        {
            return null;
        }

        double debrisTotal = Math.Max(0.0, debrisMetal) + Math.Max(0.0, debrisCrystal);
        int diameterKm = MoonAndPhalanxFormulas.CalculateMoonDiameterKm(debrisTotal, rng.NextDouble());
        int maxFields = MoonAndPhalanxFormulas.CalculateMoonMaxFields(moonBaseLevel: 0);

        var moon = new Planet
        {
            Id = Guid.NewGuid(),
            UserId = parentPlanet.UserId,
            Name = "Moon",
            Galaxy = parentPlanet.Galaxy,
            System = parentPlanet.System,
            Slot = parentPlanet.Slot,
            IsMoon = true,
            ParentPlanetId = parentPlanet.Id,
            Metal = 0,
            Crystal = 0,
            Deuterium = 0,
            LastResourceUpdateUtc = DateTime.UtcNow,
            TempMin = parentPlanet.TempMin - 20,
            TempMax = parentPlanet.TempMax - 20,
            Diameter = diameterKm,
            FieldsUsed = 0,
            MaxFields = maxFields
        };

        dbContext.Planets.Add(moon);
        await dbContext.SaveChangesAsync(cancellationToken);

        return moon;
    }

    public async Task<IReadOnlyList<PhalanxFleetMovementDto>> ScanWithSensorPhalanxAsync(
        Guid scannerUserId,
        Guid originMoonId,
        int targetGalaxy,
        int targetSystem,
        int targetSlot,
        CancellationToken cancellationToken = default)
    {
        string lockKey = $"lock:planet:{originMoonId}";
        await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

        var originMoon = await dbContext.Planets
            .Include(p => p.Buildings)
            .FirstOrDefaultAsync(p => p.Id == originMoonId && p.UserId == scannerUserId, cancellationToken)
            ?? throw new InvalidOperationException($"Origin moon {originMoonId} not found for user {scannerUserId}.");

        if (!originMoon.IsMoon)
        {
            throw new InvalidOperationException("Sensor Phalanx scans can only be initiated from a Moon.");
        }

        int phalanxLevel = originMoon.Buildings
            .FirstOrDefault(b => b.BuildingType == BuildingType.SensorPhalanx)?.Level ?? 0;

        if (phalanxLevel <= 0)
        {
            throw new InvalidOperationException("This Moon does not have a Sensor Phalanx constructed.");
        }

        var scannerUser = await dbContext.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == scannerUserId, cancellationToken);
        double discovererBonus = scannerUser?.PlayerClass == PlayerClass.Discoverer ? 0.20 : 0.0;

        bool inRange = MoonAndPhalanxFormulas.IsTargetWithinPhalanxRange(
            originMoon.Galaxy,
            originMoon.System,
            phalanxLevel,
            targetGalaxy,
            targetSystem,
            discovererBonus);

        if (!inRange)
        {
            int maxRange = MoonAndPhalanxFormulas.CalculatePhalanxScanRangeSystems(phalanxLevel, discovererBonus);
            throw new InvalidOperationException(
                $"Target system [{targetGalaxy}:{targetSystem}] is outside Sensor Phalanx Level {phalanxLevel} range ({maxRange} systems).");
        }

        var now = DateTime.UtcNow;
        resourceService.ApplyLazyUpdate(originMoon, now);

        if (originMoon.Deuterium < MoonAndPhalanxFormulas.PhalanxScanDeuteriumCost)
        {
            throw new InvalidOperationException(
                $"Sensor Phalanx requires {MoonAndPhalanxFormulas.PhalanxScanDeuteriumCost} Deuterium per scan.");
        }

        originMoon.Deuterium -= MoonAndPhalanxFormulas.PhalanxScanDeuteriumCost;
        await dbContext.SaveChangesAsync(cancellationToken);

        // Query all active fleet movements targeting or originating from the scanned planet coordinates
        var activeMissions = await dbContext.FleetMissions
            .AsNoTracking()
            .Include(m => m.Ships)
            .Where(m =>
                (m.Status == FleetMissionStatus.Outbound ||
                 m.Status == FleetMissionStatus.Holding ||
                 m.Status == FleetMissionStatus.Returning ||
                 m.Status == FleetMissionStatus.Recalled) &&
                ((m.OriginGalaxy == targetGalaxy && m.OriginSystem == targetSystem && m.OriginSlot == targetSlot) ||
                 (m.TargetGalaxy == targetGalaxy && m.TargetSystem == targetSystem && m.TargetSlot == targetSlot)))
            .OrderBy(m => m.ArrivalUtc)
            .ToListAsync(cancellationToken);

        var visibleMovements = activeMissions
            .Where(m => MoonAndPhalanxFormulas.IsFleetMovementVisibleToPhalanx(
                targetGalaxy, targetSystem, targetSlot,
                m.OriginGalaxy, m.OriginSystem, m.OriginSlot, m.OriginType,
                m.TargetGalaxy, m.TargetSystem, m.TargetSlot, m.TargetType,
                m.MissionType, m.Status))
            .Select(m => new PhalanxFleetMovementDto(
                FleetMissionId: m.Id,
                MissionType: m.MissionType,
                Status: m.Status,
                OriginCoordinates: $"[{m.OriginGalaxy}:{m.OriginSystem}:{m.OriginSlot}]",
                OriginType: m.OriginType,
                TargetCoordinates: $"[{m.TargetGalaxy}:{m.TargetSystem}:{m.TargetSlot}]",
                TargetType: m.TargetType,
                DepartureUtc: m.DepartureUtc,
                ArrivalUtc: m.ArrivalUtc,
                ReturnUtc: m.ReturnUtc,
                Ships: m.Ships.ToDictionary(s => s.UnitType, s => s.Count)))
            .ToList();

        return visibleMovements;
    }

    public async Task TransferFleetViaJumpGateAsync(
        Guid userId,
        Guid originMoonId,
        Guid destinationMoonId,
        IReadOnlyDictionary<UnitType, int> ships,
        CancellationToken cancellationToken = default)
    {
        if (originMoonId == destinationMoonId)
        {
            throw new InvalidOperationException("Origin and destination Moons must be different.");
        }

        if (ships is null || ships.Count == 0 || ships.Values.All(c => c <= 0))
        {
            throw new InvalidOperationException("Select at least one ship to transfer via Jump Gate.");
        }

        // Acquire locks in deterministic GUID order to prevent deadlocks
        var (firstId, secondId) = originMoonId.CompareTo(destinationMoonId) < 0
            ? (originMoonId, destinationMoonId)
            : (destinationMoonId, originMoonId);

        await using var lock1 = await lockService.AcquireLockAsync($"lock:planet:{firstId}", cancellationToken: cancellationToken);
        await using var lock2 = await lockService.AcquireLockAsync($"lock:planet:{secondId}", cancellationToken: cancellationToken);

        var remainingOriginCooldown = await jumpGateCooldownService.GetRemainingCooldownAsync(originMoonId, cancellationToken);
        if (remainingOriginCooldown.HasValue && remainingOriginCooldown.Value > TimeSpan.Zero)
        {
            throw new InvalidOperationException(
                $"Origin Jump Gate is on cooldown for another {Math.Ceiling(remainingOriginCooldown.Value.TotalSeconds)} seconds.");
        }

        var remainingDestCooldown = await jumpGateCooldownService.GetRemainingCooldownAsync(destinationMoonId, cancellationToken);
        if (remainingDestCooldown.HasValue && remainingDestCooldown.Value > TimeSpan.Zero)
        {
            throw new InvalidOperationException(
                $"Destination Jump Gate is on cooldown for another {Math.Ceiling(remainingDestCooldown.Value.TotalSeconds)} seconds.");
        }

        var moons = await dbContext.Planets
            .Include(p => p.Buildings)
            .Include(p => p.Units)
            .Where(p => (p.Id == originMoonId || p.Id == destinationMoonId) && p.UserId == userId)
            .ToListAsync(cancellationToken);

        var originMoon = moons.FirstOrDefault(m => m.Id == originMoonId)
            ?? throw new InvalidOperationException("Origin Moon not found or not owned by player.");

        var destinationMoon = moons.FirstOrDefault(m => m.Id == destinationMoonId)
            ?? throw new InvalidOperationException("Destination Moon not found or not owned by player.");

        if (!originMoon.IsMoon || !destinationMoon.IsMoon)
        {
            throw new InvalidOperationException("Jump Gate transfers are only possible between two Moons.");
        }

        int originGateLevel = originMoon.Buildings.FirstOrDefault(b => b.BuildingType == BuildingType.JumpGate)?.Level ?? 0;
        int destGateLevel = destinationMoon.Buildings.FirstOrDefault(b => b.BuildingType == BuildingType.JumpGate)?.Level ?? 0;

        if (originGateLevel <= 0 || destGateLevel <= 0)
        {
            throw new InvalidOperationException("Both origin and destination Moons must have an operational Jump Gate.");
        }

        foreach (var (unitType, count) in ships)
        {
            if (count <= 0) continue;

            // Validate unit is a mobile ship (throws if defense or solar satellite)
            _ = FleetNavigationFormulas.GetShipFlightStats(unitType);

            var originUnit = originMoon.Units.FirstOrDefault(u => u.UnitType == unitType);
            if (originUnit is null || originUnit.Count < count)
            {
                throw new InvalidOperationException($"Insufficient {unitType} stationed on origin Moon.");
            }
        }

        // Instant transfer (0 Deuterium, 0 flight duration)
        foreach (var (unitType, count) in ships)
        {
            if (count <= 0) continue;

            var originUnit = originMoon.Units.First(u => u.UnitType == unitType);
            originUnit.Count -= count;

            var destUnit = destinationMoon.Units.FirstOrDefault(u => u.UnitType == unitType);
            if (destUnit is null)
            {
                destUnit = new PlanetUnit
                {
                    Id = Guid.NewGuid(),
                    PlanetId = destinationMoon.Id,
                    UnitType = unitType,
                    Count = count
                };
                destinationMoon.Units.Add(destUnit);
                dbContext.PlanetUnits.Add(destUnit);
            }
            else
            {
                destUnit.Count += count;
            }
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        var cooldown = TimeSpan.FromMinutes(MoonAndPhalanxFormulas.JumpGateCooldownMinutes);
        await jumpGateCooldownService.SetCooldownAsync(originMoonId, cooldown, cancellationToken);
        await jumpGateCooldownService.SetCooldownAsync(destinationMoonId, cooldown, cancellationToken);
    }

    public async Task<MoonDestructionResult> ExecuteMoonDestructionAsync(
        Planet targetMoon,
        int deathstarCount,
        int? seed = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(targetMoon);

        if (!targetMoon.IsMoon || deathstarCount <= 0)
        {
            return new MoonDestructionResult(
                MoonDestroyed: false,
                DeathstarsDestroyed: false,
                DestructionChancePercent: 0,
                RipLossChancePercent: 0,
                SurvivingDeathstars: Math.Max(0, deathstarCount));
        }

        double destructionChance = MoonAndPhalanxFormulas.CalculateMoonDestructionChancePercent(
            targetMoon.Diameter,
            deathstarCount);

        double ripLossChance = MoonAndPhalanxFormulas.CalculateRipLossChancePercent(targetMoon.Diameter, deathstarCount);

        var rng = seed.HasValue ? new Random(seed.Value) : new Random();
        bool moonDestroyed = (rng.NextDouble() * 100.0) <= destructionChance;
        bool ripsDestroyed = (rng.NextDouble() * 100.0) <= ripLossChance;

        if (moonDestroyed)
        {
            // Redirect all stationed units & active fleets back to the parent planet coordinates
            Planet? parentPlanet = null;
            if (targetMoon.ParentPlanetId.HasValue)
            {
                parentPlanet = await dbContext.Planets
                    .Include(p => p.Units)
                    .FirstOrDefaultAsync(p => p.Id == targetMoon.ParentPlanetId.Value, cancellationToken);
            }

            parentPlanet ??= await dbContext.Planets
                .Include(p => p.Units)
                .FirstOrDefaultAsync(p =>
                    p.Galaxy == targetMoon.Galaxy &&
                    p.System == targetMoon.System &&
                    p.Slot == targetMoon.Slot &&
                    !p.IsMoon,
                    cancellationToken);

            var moonUnits = await dbContext.PlanetUnits
                .Where(u => u.PlanetId == targetMoon.Id)
                .ToListAsync(cancellationToken);

            if (parentPlanet is not null)
            {
                foreach (var moonUnit in moonUnits)
                {
                    if (moonUnit.Count <= 0) continue;

                    var parentUnit = parentPlanet.Units.FirstOrDefault(u => u.UnitType == moonUnit.UnitType);
                    if (parentUnit is null)
                    {
                        parentUnit = new PlanetUnit
                        {
                            Id = Guid.NewGuid(),
                            PlanetId = parentPlanet.Id,
                            UnitType = moonUnit.UnitType,
                            Count = moonUnit.Count
                        };
                        parentPlanet.Units.Add(parentUnit);
                        dbContext.PlanetUnits.Add(parentUnit);
                    }
                    else
                    {
                        parentUnit.Count += moonUnit.Count;
                    }
                }

                // Redirect fleets originating from or targeting the destroyed moon to the parent planet
                var fleetsFromMoon = await dbContext.FleetMissions
                    .Where(m => m.OriginPlanetId == targetMoon.Id)
                    .ToListAsync(cancellationToken);

                foreach (var fleet in fleetsFromMoon)
                {
                    fleet.OriginPlanetId = parentPlanet.Id;
                    fleet.OriginType = CoordinateType.Planet;
                }

                var fleetsToMoon = await dbContext.FleetMissions
                    .Where(m => m.TargetPlanetId == targetMoon.Id)
                    .ToListAsync(cancellationToken);

                foreach (var fleet in fleetsToMoon)
                {
                    fleet.TargetPlanetId = parentPlanet.Id;
                    fleet.TargetType = CoordinateType.Planet;
                }
            }

            dbContext.Planets.Remove(targetMoon);
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        return new MoonDestructionResult(
            MoonDestroyed: moonDestroyed,
            DeathstarsDestroyed: ripsDestroyed,
            DestructionChancePercent: destructionChance,
            RipLossChancePercent: ripLossChance,
            SurvivingDeathstars: ripsDestroyed ? 0 : deathstarCount);
    }
}

