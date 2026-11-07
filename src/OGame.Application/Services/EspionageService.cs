using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using OGame.Application.Common.Interfaces;
using OGame.Application.Interfaces;
using OGame.Domain.Combat;
using OGame.Domain.Entities;
using OGame.Domain.Enums;
using OGame.Domain.Services;

namespace OGame.Application.Services;

public class EspionageService(
    IApplicationDbContext dbContext,
    IResourceCalculationService resourceService,
    ICombatEngine combatEngine,
    IActivityService activityService,
    IRealtimeNotificationService notificationService) : IEspionageService
{
    public async Task<EspionageExecutionResult> ExecuteEspionageScanAsync(
        Guid scannerUserId,
        Guid targetPlanetId,
        int probeCount,
        int? seed = null,
        CancellationToken cancellationToken = default)
    {
        if (probeCount <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(probeCount), "At least 1 espionage probe is required.");
        }

        var targetPlanet = await dbContext.Planets
            .Include(p => p.User)
            .Include(p => p.Buildings)
            .Include(p => p.Units)
            .FirstOrDefaultAsync(p => p.Id == targetPlanetId, cancellationToken)
            ?? throw new InvalidOperationException($"Target planet {targetPlanetId} not found.");

        if (targetPlanet.User?.IsVacationMode == true || targetPlanet.IsProductionFrozen)
        {
            throw new InvalidOperationException("Target player is in Vacation Mode and cannot be scanned by espionage probes.");
        }

        var now = DateTime.UtcNow;

        var scannerUser = await dbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == scannerUserId, cancellationToken);

        if (scannerUser?.IsVacationMode == true)
        {
            throw new InvalidOperationException("Cannot execute espionage scans while in Vacation Mode.");
        }

        if (scannerUser is not null &&
            targetPlanet.User is not null &&
            scannerUserId != targetPlanet.UserId &&
            MissileAndUniverseFormulas.IsBlockedByNoobProtection(
                scannerUser.TotalPoints,
                targetPlanet.User.TotalPoints,
                targetPlanet.User.LastLoginUtc,
                now))
        {
            throw new InvalidOperationException("Target player is protected by Noob Protection.");
        }

        var resourceState = resourceService.GetCurrentResources(targetPlanet, now);

        // Update activity on target planet coordinate due to probe scan
        await activityService.RecordActivityAsync(
            targetPlanet.Galaxy,
            targetPlanet.System,
            targetPlanet.Slot,
            targetPlanet.IsMoon ? CoordinateType.Moon : CoordinateType.Planet,
            new DateTimeOffset(now, TimeSpan.Zero),
            cancellationToken);

        var attackerResearches = await dbContext.UserResearches
            .AsNoTracking()
            .Where(r => r.UserId == scannerUserId)
            .ToListAsync(cancellationToken);

        var defenderResearches = await dbContext.UserResearches
            .AsNoTracking()
            .Where(r => r.UserId == targetPlanet.UserId)
            .ToListAsync(cancellationToken);

        int attackerEspionageLevel = attackerResearches
            .FirstOrDefault(r => r.ResearchType == ResearchType.EspionageTechnology)?.Level ?? 0;

        int defenderEspionageLevel = defenderResearches
            .FirstOrDefault(r => r.ResearchType == ResearchType.EspionageTechnology)?.Level ?? 0;

        double effectiveProbes = EspionageFormulas.CalculateEffectiveProbes(
            probeCount,
            attackerEspionageLevel,
            defenderEspionageLevel);

        int tierLevel = EspionageFormulas.GetVisibilityTierLevel(effectiveProbes);

        // Separate stationed ships and defenses on target planet
        var defendingShips = new Dictionary<UnitType, int>();
        var defendingDefenses = new Dictionary<UnitType, int>();

        foreach (var unit in targetPlanet.Units.Where(u => u.Count > 0))
        {
            var stats = CombatCatalog.GetStats(unit.UnitType);
            if (stats.IsDefense)
            {
                defendingDefenses[unit.UnitType] = unit.Count;
            }
            else
            {
                defendingShips[unit.UnitType] = unit.Count;
            }
        }

        int totalShipsOnTarget = defendingShips.Values.Sum();

        double detectionChance = EspionageFormulas.CalculateCounterEspionageChancePercent(
            totalShipsOnTarget,
            effectiveProbes,
            attackerEspionageLevel,
            defenderEspionageLevel);

        var rng = seed.HasValue ? new Random(seed.Value) : new Random();
        bool counterEspionageTriggered = detectionChance > 0.0 && (rng.NextDouble() * 100.0) < detectionChance;

        int survivingProbes = probeCount;

        if (counterEspionageTriggered && totalShipsOnTarget > 0)
        {
            // Immediate 1-round combat between defending fleet and probes. Destroyed probes yield debris.
            var probeInput = new CombatFleetInput(
                new Dictionary<UnitType, int> { [UnitType.EspionageProbe] = probeCount });

            var defenderFleetInput = new CombatFleetInput(defendingShips);

            var combatResult = combatEngine.SimulateCombat(
                attacker: probeInput,
                defender: defenderFleetInput,
                seed: seed,
                maxRounds: 1);

            survivingProbes = combatResult.AttackerRemainingUnits.TryGetValue(UnitType.EspionageProbe, out int rem)
                ? rem
                : 0;

            if (combatResult.DebrisField.Metal > 0 || combatResult.DebrisField.Crystal > 0)
            {
                var debris = await dbContext.DebrisFields
                    .FirstOrDefaultAsync(d =>
                        d.Galaxy == targetPlanet.Galaxy &&
                        d.System == targetPlanet.System &&
                        d.Slot == targetPlanet.Slot,
                        cancellationToken);

                if (debris is null)
                {
                    debris = new DebrisField
                    {
                        Id = Guid.NewGuid(),
                        Galaxy = targetPlanet.Galaxy,
                        System = targetPlanet.System,
                        Slot = targetPlanet.Slot,
                        Metal = combatResult.DebrisField.Metal,
                        Crystal = combatResult.DebrisField.Crystal,
                        UpdatedAtUtc = now
                    };
                    dbContext.DebrisFields.Add(debris);
                }
                else
                {
                    debris.Metal += combatResult.DebrisField.Metal;
                    debris.Crystal += combatResult.DebrisField.Crystal;
                    debris.UpdatedAtUtc = now;
                }
            }
        }

        // Build cumulative visibility payload based on TierLevel (1..5)
        EspionageResourcesSnapshot? resourcesSection = tierLevel >= 1
            ? new EspionageResourcesSnapshot(
                Metal: Math.Floor(resourceState.Metal),
                Crystal: Math.Floor(resourceState.Crystal),
                Deuterium: Math.Floor(resourceState.Deuterium),
                Energy: resourceState.ProducedEnergy)
            : null;

        IReadOnlyDictionary<UnitType, int>? fleetsSection = tierLevel >= 2
            ? defendingShips
            : null;

        IReadOnlyDictionary<UnitType, int>? defensesSection = tierLevel >= 3
            ? defendingDefenses
            : null;

        IReadOnlyDictionary<BuildingType, int>? buildingsSection = tierLevel >= 4
            ? targetPlanet.Buildings.ToDictionary(b => b.BuildingType, b => b.Level)
            : null;

        IReadOnlyDictionary<ResearchType, int>? technologiesSection = tierLevel >= 5
            ? defenderResearches.ToDictionary(r => r.ResearchType, r => r.Level)
            : null;

        var payload = new EspionageReportPayload(
            TargetPlanetId: targetPlanet.Id,
            TargetPlanetName: targetPlanet.Name,
            Coordinates: $"[{targetPlanet.Galaxy}:{targetPlanet.System}:{targetPlanet.Slot}]",
            TierLevel: tierLevel,
            EffectiveProbes: effectiveProbes,
            DetectionChancePercent: detectionChance,
            CounterEspionageTriggered: counterEspionageTriggered,
            Resources: resourcesSection,
            StationedFleets: fleetsSection,
            PlanetaryDefenses: defensesSection,
            PlanetaryBuildings: buildingsSection,
            ResearchedTechnologies: technologiesSection);

        var report = new EspionageReport
        {
            Id = Guid.NewGuid(),
            TargetPlanetId = targetPlanet.Id,
            ScannerUserId = scannerUserId,
            TierLevel = tierLevel,
            DataJson = JsonSerializer.Serialize(payload),
            CreatedAtUtc = now
        };

        dbContext.EspionageReports.Add(report);

        // Emit event to target player's activity log: "An unknown fleet was scanned near your planet"
        var activityLog = new PlayerActivityLog
        {
            Id = Guid.NewGuid(),
            UserId = targetPlanet.UserId,
            PlanetId = targetPlanet.Id,
            Message = EspionageFormulas.UnknownFleetScannedAlertMessage,
            CreatedAtUtc = now
        };

        dbContext.PlayerActivityLogs.Add(activityLog);
        await dbContext.SaveChangesAsync(cancellationToken);

        await notificationService.SendToUserAsync(
            targetPlanet.UserId,
            "PlayerActivityAlert",
            new
            {
                PlanetId = targetPlanet.Id,
                Message = EspionageFormulas.UnknownFleetScannedAlertMessage,
                TimestampUtc = now
            },
            cancellationToken);

        return new EspionageExecutionResult(
            Report: report,
            SurvivingProbes: survivingProbes,
            CounterEspionageTriggered: counterEspionageTriggered);
    }
}

