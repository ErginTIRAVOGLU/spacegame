using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using OGame.Application.Common.Interfaces;
using OGame.Application.Interfaces;
using OGame.Domain.Entities;
using OGame.Domain.Enums;
using OGame.Domain.Services;

namespace OGame.Application.Services;

public class MissileService(
    IApplicationDbContext dbContext,
    IShipyardService shipyardService,
    IInboxAndCombatReportService inboxService,
    IRealtimeNotificationService notificationService,
    IJobScheduler jobScheduler,
    IDistributedLockService lockService) : IMissileService
{
    public async Task<MissileLaunch> LaunchInterplanetaryMissilesAsync(
        MissileLaunchCommand command,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(command);

        if (command.MissileCount <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(command), "At least 1 Interplanetary Missile must be launched.");
        }

        string lockKey = $"lock:planet:{command.OriginPlanetId}";
        await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

        var now = DateTime.UtcNow;

        // Settle any completed missiles in the shipyard queue
        await shipyardService.EvaluatePlanetShipyardQueueAsync(command.OriginPlanetId, now, cancellationToken);

        var originPlanet = await dbContext.Planets
            .Include(p => p.User)
            .Include(p => p.Units)
            .FirstOrDefaultAsync(p => p.Id == command.OriginPlanetId && p.UserId == command.AttackerUserId, cancellationToken)
            ?? throw new InvalidOperationException($"Origin planet {command.OriginPlanetId} not found for user {command.AttackerUserId}.");

        if (originPlanet.User?.IsVacationMode == true || originPlanet.IsProductionFrozen)
        {
            throw new InvalidOperationException("Cannot launch Interplanetary Missiles while in Vacation Mode.");
        }

        var targetPlanet = await dbContext.Planets
            .AsNoTracking()
            .Include(p => p.User)
            .FirstOrDefaultAsync(p =>
                p.Galaxy == command.TargetGalaxy &&
                p.System == command.TargetSystem &&
                p.Slot == command.TargetSlot &&
                !p.IsMoon &&
                !p.IsDestroyedPlanet,
                cancellationToken)
            ?? throw new InvalidOperationException($"Target planet at [{command.TargetGalaxy}:{command.TargetSystem}:{command.TargetSlot}] not found.");

        if (targetPlanet.User?.IsVacationMode == true || targetPlanet.IsProductionFrozen)
        {
            throw new InvalidOperationException("Target player is in Vacation Mode and cannot be targeted by Interplanetary Missiles.");
        }

        if (originPlanet.User is not null &&
            targetPlanet.User is not null &&
            originPlanet.UserId != targetPlanet.UserId &&
            MissileAndUniverseFormulas.IsBlockedByNoobProtection(
                originPlanet.User.TotalPoints,
                targetPlanet.User.TotalPoints,
                targetPlanet.User.LastLoginUtc,
                now))
        {
            throw new InvalidOperationException("Target player is protected by Noob Protection.");
        }

        int impulseLevel = await dbContext.UserResearches
            .AsNoTracking()
            .Where(r => r.UserId == command.AttackerUserId && r.ResearchType == ResearchType.ImpulseDrive)
            .Select(r => r.Level)
            .FirstOrDefaultAsync(cancellationToken);

        if (!MissileAndUniverseFormulas.IsTargetWithinIpmRange(
                originPlanet.Galaxy,
                originPlanet.System,
                impulseLevel,
                command.TargetGalaxy,
                command.TargetSystem))
        {
            int maxRange = MissileAndUniverseFormulas.CalculateIpmSystemRange(impulseLevel);
            throw new InvalidOperationException(
                $"Target system is outside Interplanetary Missile range ({maxRange} systems in the same galaxy for Impulse Drive Level {impulseLevel}).");
        }

        var ipmUnit = originPlanet.Units.FirstOrDefault(u => u.UnitType == UnitType.InterplanetaryMissile);
        if (ipmUnit is null || ipmUnit.Count < command.MissileCount)
        {
            throw new InvalidOperationException("Insufficient Interplanetary Missiles in the origin planet's Missile Silo.");
        }

        // Deduct IPMs from origin planet silo
        ipmUnit.Count -= command.MissileCount;

        double durationSeconds = MissileAndUniverseFormulas.CalculateIpmFlightDurationSeconds(
            originPlanet.System,
            command.TargetSystem);

        var impactTimeUtc = now.AddSeconds(durationSeconds);

        var launch = new MissileLaunch
        {
            Id = Guid.NewGuid(),
            AttackerUserId = command.AttackerUserId,
            OriginPlanetId = originPlanet.Id,
            TargetPlanetId = targetPlanet.Id,
            OriginGalaxy = originPlanet.Galaxy,
            OriginSystem = originPlanet.System,
            OriginSlot = originPlanet.Slot,
            TargetGalaxy = targetPlanet.Galaxy,
            TargetSystem = targetPlanet.System,
            TargetSlot = targetPlanet.Slot,
            MissileCount = command.MissileCount,
            PrimaryTargetDefenseType = command.PrimaryTargetDefenseType,
            LaunchedAtUtc = now,
            ImpactTimeUtc = impactTimeUtc,
            IsResolved = false
        };

        string jobId = jobScheduler.ScheduleMissileImpact(
            launch.Id,
            new DateTimeOffset(launch.ImpactTimeUtc, TimeSpan.Zero));

        launch.HangfireJobId = jobId;

        dbContext.MissileLaunches.Add(launch);
        await dbContext.SaveChangesAsync(cancellationToken);

        return launch;
    }

    public async Task ResolveMissileImpactAsync(
        Guid missileLaunchId,
        CancellationToken cancellationToken = default)
    {
        var launch = await dbContext.MissileLaunches
            .FirstOrDefaultAsync(l => l.Id == missileLaunchId, cancellationToken);

        if (launch is null || launch.IsResolved)
        {
            return;
        }

        string lockKey = $"lock:planet:{launch.TargetPlanetId}";
        await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

        // Re-check inside distributed lock
        if (launch.IsResolved)
        {
            return;
        }

        var now = DateTime.UtcNow;
        await shipyardService.EvaluatePlanetShipyardQueueAsync(launch.TargetPlanetId, now, cancellationToken);

        var targetPlanet = await dbContext.Planets
            .Include(p => p.Units)
            .FirstOrDefaultAsync(p => p.Id == launch.TargetPlanetId, cancellationToken);

        if (targetPlanet is null)
        {
            launch.IsResolved = true;
            await dbContext.SaveChangesAsync(cancellationToken);
            return;
        }

        int attackerWeaponsLevel = await dbContext.UserResearches
            .AsNoTracking()
            .Where(r => r.UserId == launch.AttackerUserId && r.ResearchType == ResearchType.WeaponsTechnology)
            .Select(r => r.Level)
            .FirstOrDefaultAsync(cancellationToken);

        int defenderArmourLevel = await dbContext.UserResearches
            .AsNoTracking()
            .Where(r => r.UserId == targetPlanet.UserId && r.ResearchType == ResearchType.ArmourTechnology)
            .Select(r => r.Level)
            .FirstOrDefaultAsync(cancellationToken);

        var abmUnit = targetPlanet.Units.FirstOrDefault(u => u.UnitType == UnitType.AntiBallisticMissile);
        int currentAbmCount = abmUnit?.Count ?? 0;

        var currentDefenses = targetPlanet.Units
            .Where(u => u.Count > 0 && u.UnitType != UnitType.AntiBallisticMissile && u.UnitType != UnitType.InterplanetaryMissile)
            .ToDictionary(u => u.UnitType, u => u.Count);

        var simResult = MissileAndUniverseFormulas.SimulateMissileStrike(
            incomingIpmCount: launch.MissileCount,
            attackerWeaponsLevel: attackerWeaponsLevel,
            defendingAbmCount: currentAbmCount,
            defenderArmourLevel: defenderArmourLevel,
            planetaryDefenses: currentDefenses,
            primaryTargetDefenseType: launch.PrimaryTargetDefenseType);

        if (abmUnit is not null)
        {
            abmUnit.Count = simResult.RemainingAbmCount;
        }

        foreach (var (defType, remainingCount) in simResult.RemainingDefenses)
        {
            var unitEntity = targetPlanet.Units.FirstOrDefault(u => u.UnitType == defType);
            if (unitEntity is not null)
            {
                unitEntity.Count = remainingCount;
            }
        }

        launch.IsResolved = true;

        string targetCoords = $"[{launch.TargetGalaxy}:{launch.TargetSystem}:{launch.TargetSlot}]";
        string originCoords = $"[{launch.OriginGalaxy}:{launch.OriginSystem}:{launch.OriginSlot}]";
        string alertJson = JsonSerializer.Serialize(new
        {
            LaunchId = launch.Id,
            OriginCoordinates = originCoords,
            TargetCoordinates = targetCoords,
            IncomingIpmCount = simResult.IncomingIpmCount,
            InterceptedByAbmCount = simResult.InterceptedByAbmCount,
            SurvivingIpmCount = simResult.SurvivingIpmCount,
            DestroyedDefenses = simResult.DestroyedDefenses,
            ImpactTimeUtc = now
        });

        var activityLog = new PlayerActivityLog
        {
            Id = Guid.NewGuid(),
            UserId = targetPlanet.UserId,
            PlanetId = targetPlanet.Id,
            Message = $"Interplanetary Missile strike ({launch.MissileCount} IPMs) from {originCoords} impacted {targetCoords}.",
            CreatedAtUtc = now
        };
        dbContext.PlayerActivityLogs.Add(activityLog);

        await dbContext.SaveChangesAsync(cancellationToken);

        await inboxService.SendMessageAsync(
            targetPlanet.UserId,
            senderUserId: null,
            folder: MessageFolder.Combat,
            subject: $"Missile Strike Impact at {targetCoords}",
            contentJson: alertJson,
            cancellationToken);

        await notificationService.SendToUserAsync(
            targetPlanet.UserId,
            "MissileImpactAlert",
            new
            {
                LaunchId = launch.Id,
                PlanetId = targetPlanet.Id,
                OriginCoordinates = originCoords,
                TargetCoordinates = targetCoords,
                IncomingIpmCount = simResult.IncomingIpmCount,
                InterceptedByAbmCount = simResult.InterceptedByAbmCount,
                DestroyedDefenses = simResult.DestroyedDefenses,
                TimestampUtc = now
            },
            cancellationToken);
    }
}

