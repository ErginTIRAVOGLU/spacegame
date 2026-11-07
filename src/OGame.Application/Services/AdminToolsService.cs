using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using OGame.Application.Common.Interfaces;
using OGame.Application.Interfaces;
using OGame.Domain.Entities;
using OGame.Domain.Enums;
using OGame.Domain.Services;

namespace OGame.Application.Services;

public class AdminToolsService(
    IApplicationDbContext dbContext,
    IResourceCalculationService resourceService,
    IFleetMissionService fleetMissionService,
    IUniverseConfigService universeConfigService,
    IJobScheduler jobScheduler,
    IDistributedLockService lockService) : IAdminToolsService
{
    public async Task<ForceReturnFleetResult> ForceReturnFleetAsync(
        Guid adminUserId,
        Guid fleetMissionId,
        bool instantTeleport = false,
        CancellationToken cancellationToken = default)
    {
        string lockKey = $"lock:fleet:{fleetMissionId}";
        await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

        var mission = await dbContext.FleetMissions
            .Include(m => m.Ships)
            .FirstOrDefaultAsync(m => m.Id == fleetMissionId, cancellationToken)
            ?? throw new InvalidOperationException($"Fleet mission {fleetMissionId} not found.");

        var now = DateTime.UtcNow;

        if (!string.IsNullOrWhiteSpace(mission.HangfireArrivalJobId))
        {
            jobScheduler.CancelScheduledJob(mission.HangfireArrivalJobId);
        }

        if (!string.IsNullOrWhiteSpace(mission.HangfireReturnJobId))
        {
            jobScheduler.CancelScheduledJob(mission.HangfireReturnJobId);
        }

        var returnArrivalUtc = AdminToolsFormulas.CalculateForceReturnArrivalUtc(now, instantTeleport);
        string? returnJobId = null;

        if (instantTeleport)
        {
            mission.Status = FleetMissionStatus.Returning;
            mission.ReturnUtc = now;
            await dbContext.SaveChangesAsync(cancellationToken);

            await fleetMissionService.CompleteFleetReturnAsync(mission.Id, cancellationToken);
        }
        else
        {
            mission.Status = FleetMissionStatus.Returning;
            mission.ReturnUtc = returnArrivalUtc;

            returnJobId = jobScheduler.ScheduleFleetReturn(
                mission.Id,
                new DateTimeOffset(returnArrivalUtc, TimeSpan.Zero));

            mission.HangfireReturnJobId = returnJobId;
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        var auditLog = new AdminLog
        {
            Id = Guid.NewGuid(),
            AdminUserId = adminUserId,
            Action = "ForceReturnFleet",
            TargetUserId = mission.UserId,
            DetailsJson = JsonSerializer.Serialize(new
            {
                FleetMissionId = mission.Id,
                InstantTeleport = instantTeleport,
                ReturnArrivalUtc = returnArrivalUtc,
                ReturnJobId = returnJobId
            }),
            TimestampUtc = now
        };

        dbContext.AdminLogs.Add(auditLog);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new ForceReturnFleetResult(
            FleetMissionId: mission.Id,
            NewStatus: instantTeleport ? FleetMissionStatus.Completed : FleetMissionStatus.Returning,
            InstantTeleported: instantTeleport,
            ReturnArrivalUtc: returnArrivalUtc,
            ReturnHangfireJobId: returnJobId);
    }

    public async Task<ClearPlanetQueuesResult> ClearPlanetQueuesAsync(
        Guid adminUserId,
        Guid planetId,
        CancellationToken cancellationToken = default)
    {
        string lockKey = $"lock:planet:{planetId}";
        await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

        var planet = await dbContext.Planets
            .Include(p => p.Buildings)
            .Include(p => p.BuildingQueue)
            .Include(p => p.ShipyardQueue)
            .FirstOrDefaultAsync(p => p.Id == planetId, cancellationToken)
            ?? throw new InvalidOperationException($"Planet {planetId} not found.");

        var now = DateTime.UtcNow;
        resourceService.ApplyLazyUpdate(planet, now);

        int cancelledBuildingCount = planet.BuildingQueue.Count;
        int cancelledShipyardCount = planet.ShipyardQueue.Count;

        foreach (var bItem in planet.BuildingQueue)
        {
            if (!string.IsNullOrWhiteSpace(bItem.HangfireJobId))
            {
                jobScheduler.CancelScheduledJob(bItem.HangfireJobId);
            }
        }

        foreach (var sItem in planet.ShipyardQueue)
        {
            if (!string.IsNullOrWhiteSpace(sItem.HangfireBatchJobId))
            {
                jobScheduler.CancelScheduledJob(sItem.HangfireBatchJobId);
            }
        }

        var refund = AdminToolsFormulas.CalculateQueueClearRefund(
            planet.BuildingQueue.Select(b => (b.BuildingType, b.TargetLevel)),
            planet.ShipyardQueue.Select(s => (s.UnitType, s.TotalCount, s.CompletedCount)));

        planet.Metal += refund.Metal;
        planet.Crystal += refund.Crystal;
        planet.Deuterium += refund.Deuterium;

        if (cancelledBuildingCount > 0)
        {
            dbContext.BuildingQueueItems.RemoveRange(planet.BuildingQueue);
        }

        if (cancelledShipyardCount > 0)
        {
            dbContext.ShipyardQueueItems.RemoveRange(planet.ShipyardQueue);
        }

        var auditLog = new AdminLog
        {
            Id = Guid.NewGuid(),
            AdminUserId = adminUserId,
            Action = "ClearPlanetQueues",
            TargetUserId = planet.UserId,
            DetailsJson = JsonSerializer.Serialize(new
            {
                PlanetId = planet.Id,
                CancelledBuildingQueueCount = cancelledBuildingCount,
                CancelledShipyardBatchCount = cancelledShipyardCount,
                RefundedMetal = refund.Metal,
                RefundedCrystal = refund.Crystal,
                RefundedDeuterium = refund.Deuterium
            }),
            TimestampUtc = now
        };

        dbContext.AdminLogs.Add(auditLog);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new ClearPlanetQueuesResult(
            PlanetId: planet.Id,
            CancelledBuildingQueueCount: cancelledBuildingCount,
            CancelledShipyardBatchCount: cancelledShipyardCount,
            RefundedMetal: refund.Metal,
            RefundedCrystal: refund.Crystal,
            RefundedDeuterium: refund.Deuterium);
    }

    public async Task<IReadOnlyList<AdminUserInspectionDto>> SearchUsersAndEconomyAsync(
        string? query,
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var usersQuery = dbContext.Users
            .AsNoTracking()
            .Include(u => u.Planets)
                .ThenInclude(p => p.Buildings)
            .Include(u => u.Planets)
                .ThenInclude(p => p.Units)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(query))
        {
            string normalized = query.Trim().ToLowerInvariant();
            usersQuery = usersQuery.Where(u =>
                u.Username.ToLower().Contains(normalized) ||
                u.Email.ToLower().Contains(normalized));
        }

        var users = await usersQuery
            .OrderByDescending(u => u.TotalPoints)
            .Take(50)
            .ToListAsync(cancellationToken);

        var userIds = users.Select(u => u.Id).ToList();

        var activeMissions = await dbContext.FleetMissions
            .AsNoTracking()
            .Include(m => m.Ships)
            .Where(m =>
                userIds.Contains(m.UserId) &&
                (m.Status == FleetMissionStatus.Outbound ||
                 m.Status == FleetMissionStatus.Holding ||
                 m.Status == FleetMissionStatus.Returning))
            .ToListAsync(cancellationToken);

        var results = new List<AdminUserInspectionDto>(users.Count);

        foreach (var user in users)
        {
            var userMissions = activeMissions.Where(m => m.UserId == user.Id).ToList();
            int inFlightShipsCount = userMissions.SelectMany(m => m.Ships).Sum(s => s.Count);

            var planetDtos = new List<AdminPlanetEconomySummaryDto>();
            double totalMetalPerHour = 0.0;
            double totalCrystalPerHour = 0.0;
            double totalDeutPerHour = 0.0;
            int stationedUnitsCount = 0;

            foreach (var planet in user.Planets.Where(p => !p.IsDestroyedPlanet))
            {
                planet.User = user;
                var state = resourceService.GetCurrentResources(planet, now);

                totalMetalPerHour += state.MetalPerHour;
                totalCrystalPerHour += state.CrystalPerHour;
                totalDeutPerHour += state.DeuteriumPerHour;

                var unitsDict = planet.Units
                    .Where(u => u.Count > 0)
                    .ToDictionary(u => u.UnitType, u => u.Count);

                stationedUnitsCount += unitsDict.Values.Sum();

                planetDtos.Add(new AdminPlanetEconomySummaryDto(
                    PlanetId: planet.Id,
                    Name: planet.Name,
                    Coordinates: $"[{planet.Galaxy}:{planet.System}:{planet.Slot}]",
                    IsMoon: planet.IsMoon,
                    Metal: Math.Floor(state.Metal),
                    Crystal: Math.Floor(state.Crystal),
                    Deuterium: Math.Floor(state.Deuterium),
                    MetalPerHour: state.MetalPerHour,
                    CrystalPerHour: state.CrystalPerHour,
                    DeuteriumPerHour: state.DeuteriumPerHour,
                    StationedUnits: unitsDict));
            }

            results.Add(new AdminUserInspectionDto(
                UserId: user.Id,
                Username: user.Username,
                Email: user.Email,
                Role: user.Role,
                IsBanned: user.IsBanned,
                IsVacationMode: user.IsVacationMode,
                TotalPoints: user.TotalPoints,
                TotalShipsAndDefensesCount: stationedUnitsCount + inFlightShipsCount,
                ActiveFleetMissionsCount: userMissions.Count,
                TotalMetalPerHour: totalMetalPerHour,
                TotalCrystalPerHour: totalCrystalPerHour,
                TotalDeuteriumPerHour: totalDeutPerHour,
                Planets: planetDtos));
        }

        return results;
    }

    public async Task<BanUserResult> BanUserAsync(
        Guid adminUserId,
        Guid targetUserId,
        string reason,
        CancellationToken cancellationToken = default)
    {
        var user = await dbContext.Users
            .FirstOrDefaultAsync(u => u.Id == targetUserId, cancellationToken)
            ?? throw new InvalidOperationException($"Target user {targetUserId} not found.");

        var now = DateTime.UtcNow;
        string normalizedReason = string.IsNullOrWhiteSpace(reason) ? "Terms of Service Violation" : reason.Trim();

        user.IsBanned = true;
        user.BannedAtUtc = now;
        user.BanReason = normalizedReason;

        // Cancel active attack missions originating from this user
        var activeAttackMissions = await dbContext.FleetMissions
            .Where(m =>
                m.UserId == targetUserId &&
                m.Status == FleetMissionStatus.Outbound &&
                (m.MissionType == FleetMissionType.Attack ||
                 m.MissionType == FleetMissionType.AcsAttack ||
                 m.MissionType == FleetMissionType.MoonDestruction))
            .ToListAsync(cancellationToken);

        foreach (var mission in activeAttackMissions)
        {
            if (!string.IsNullOrWhiteSpace(mission.HangfireArrivalJobId))
            {
                jobScheduler.CancelScheduledJob(mission.HangfireArrivalJobId);
            }

            var returnArrivalUtc = AdminToolsFormulas.CalculateForceReturnArrivalUtc(now, instantTeleport: false);
            mission.Status = FleetMissionStatus.Returning;
            mission.ReturnUtc = returnArrivalUtc;
            mission.HangfireReturnJobId = jobScheduler.ScheduleFleetReturn(
                mission.Id,
                new DateTimeOffset(returnArrivalUtc, TimeSpan.Zero));
        }

        // Revoke active refresh tokens to force immediate logout
        var activeTokens = await dbContext.RefreshTokens
            .Where(t => t.UserId == targetUserId && !t.IsRevoked)
            .ToListAsync(cancellationToken);

        foreach (var token in activeTokens)
        {
            token.IsRevoked = true;
            token.RevokedAtUtc = now;
        }

        var auditLog = new AdminLog
        {
            Id = Guid.NewGuid(),
            AdminUserId = adminUserId,
            Action = "BanUser",
            TargetUserId = targetUserId,
            DetailsJson = JsonSerializer.Serialize(new
            {
                TargetUserId = targetUserId,
                Reason = normalizedReason,
                CancelledAttackMissionsCount = activeAttackMissions.Count,
                RevokedRefreshTokensCount = activeTokens.Count
            }),
            TimestampUtc = now
        };

        dbContext.AdminLogs.Add(auditLog);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new BanUserResult(
            TargetUserId: targetUserId,
            IsBanned: true,
            Reason: normalizedReason,
            CancelledAttackMissionsCount: activeAttackMissions.Count,
            RevokedRefreshTokensCount: activeTokens.Count,
            BannedAtUtc: now);
    }

    public async Task<UniverseConfig> UpdateUniverseSpeedAsync(
        Guid adminUserId,
        UniverseConfig newConfig,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(newConfig);

        var now = DateTime.UtcNow;

        // 1. Update Redis cache dynamically
        var updatedConfig = await universeConfigService.UpdateConfigAsync(newConfig, cancellationToken);

        // 2. Persist in PostgreSQL UniverseSettingsRecords table
        var settingsRecord = await dbContext.UniverseSettingsRecords
            .FirstOrDefaultAsync(cancellationToken);

        if (settingsRecord is null)
        {
            settingsRecord = new UniverseSettingsRecord
            {
                Id = Guid.NewGuid()
            };
            dbContext.UniverseSettingsRecords.Add(settingsRecord);
        }

        settingsRecord.EconomySpeedMultiplier = updatedConfig.EconomySpeedMultiplier;
        settingsRecord.FleetSpeedMultiplier = updatedConfig.FleetSpeedMultiplier;
        settingsRecord.ResearchSpeedMultiplier = updatedConfig.ResearchSpeedMultiplier;
        settingsRecord.DebrisRatio = updatedConfig.DebrisRatio;
        settingsRecord.DefenseToDebris = updatedConfig.DefenseToDebris;
        settingsRecord.DeutConsumptionFactor = updatedConfig.DeutConsumptionFactor;
        settingsRecord.UpdatedAtUtc = now;
        settingsRecord.UpdatedByAdminUserId = adminUserId;

        var auditLog = new AdminLog
        {
            Id = Guid.NewGuid(),
            AdminUserId = adminUserId,
            Action = "UpdateUniverseSpeed",
            TargetUserId = null,
            DetailsJson = JsonSerializer.Serialize(updatedConfig),
            TimestampUtc = now
        };

        dbContext.AdminLogs.Add(auditLog);
        await dbContext.SaveChangesAsync(cancellationToken);

        return updatedConfig;
    }

    public async Task<IReadOnlyList<AdminLog>> GetAuditLogsAsync(
        int topCount = 100,
        CancellationToken cancellationToken = default)
    {
        return await dbContext.AdminLogs
            .AsNoTracking()
            .OrderByDescending(l => l.TimestampUtc)
            .Take(Math.Clamp(topCount, 1, 500))
            .ToListAsync(cancellationToken);
    }
}

