using Microsoft.EntityFrameworkCore;
using OGame.Application.Common.Interfaces;
using OGame.Application.Interfaces;
using OGame.Domain.Enums;
using OGame.Domain.Services;

namespace OGame.Application.Services;

public class VacationModeService(
    IApplicationDbContext dbContext,
    IResourceCalculationService resourceService,
    IDistributedLockService lockService) : IVacationModeService
{
    public async Task<VacationModeStateResult> EnableVacationModeAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        string lockKey = $"lock:user:vacation:{userId}";
        await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

        var user = await dbContext.Users
            .Include(u => u.Planets)
                .ThenInclude(p => p.Buildings)
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken)
            ?? throw new InvalidOperationException($"User {userId} not found.");

        var now = DateTime.UtcNow;

        if (user.IsVacationMode)
        {
            return new VacationModeStateResult(
                UserId: user.Id,
                IsVacationMode: true,
                VacationUntilUtc: user.VacationUntilUtc,
                CanDisableNow: HighscoreAndVacationFormulas.CanDisableVacationMode(user.VacationUntilUtc, now));
        }

        var planetIds = user.Planets.Select(p => p.Id).ToList();

        // 1. Player must have 0 active BuildingQueueItem records across all planets
        bool hasActiveBuildingQueue = await dbContext.BuildingQueueItems
            .AnyAsync(q => planetIds.Contains(q.PlanetId), cancellationToken);

        if (hasActiveBuildingQueue)
        {
            throw new InvalidOperationException(
                "Cannot enable Vacation Mode while any planet has an active building construction queue.");
        }

        // 2. Any existing research queue must be complete
        bool hasActiveResearchQueue = await dbContext.ResearchQueueItems
            .AnyAsync(q => q.UserId == userId, cancellationToken);

        if (hasActiveResearchQueue)
        {
            throw new InvalidOperationException(
                "Cannot enable Vacation Mode while a research technology upgrade is in progress.");
        }

        // 3. Player must have 0 outgoing or incoming fleets associated with their planets
        bool hasActiveFleets = await dbContext.FleetMissions
            .AnyAsync(m =>
                (m.Status == FleetMissionStatus.Outbound ||
                 m.Status == FleetMissionStatus.Holding ||
                 m.Status == FleetMissionStatus.Returning) &&
                (m.UserId == userId ||
                 planetIds.Contains(m.OriginPlanetId) ||
                 (m.TargetPlanetId.HasValue && planetIds.Contains(m.TargetPlanetId.Value))),
                cancellationToken);

        if (hasActiveFleets)
        {
            throw new InvalidOperationException(
                "Cannot enable Vacation Mode while there are outgoing or incoming fleets associated with your planets.");
        }

        // Settle current accrued resources before freezing production
        foreach (var planet in user.Planets)
        {
            resourceService.ApplyLazyUpdate(planet, now);
            planet.IsProductionFrozen = true;
        }

        var vacationUntilUtc = HighscoreAndVacationFormulas.CalculateVacationUntilUtc(now);
        user.IsVacationMode = true;
        user.VacationUntilUtc = vacationUntilUtc;

        await dbContext.SaveChangesAsync(cancellationToken);

        return new VacationModeStateResult(
            UserId: user.Id,
            IsVacationMode: true,
            VacationUntilUtc: vacationUntilUtc,
            CanDisableNow: false);
    }

    public async Task<VacationModeStateResult> DisableVacationModeAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        string lockKey = $"lock:user:vacation:{userId}";
        await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

        var user = await dbContext.Users
            .Include(u => u.Planets)
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken)
            ?? throw new InvalidOperationException($"User {userId} not found.");

        var now = DateTime.UtcNow;

        if (!user.IsVacationMode)
        {
            return new VacationModeStateResult(
                UserId: user.Id,
                IsVacationMode: false,
                VacationUntilUtc: null,
                CanDisableNow: true);
        }

        if (!HighscoreAndVacationFormulas.CanDisableVacationMode(user.VacationUntilUtc, now))
        {
            throw new InvalidOperationException(
                $"Cannot disable Vacation Mode before the minimum 48-hour duration expires at {user.VacationUntilUtc:O}.");
        }

        user.IsVacationMode = false;
        user.VacationUntilUtc = null;

        foreach (var planet in user.Planets)
        {
            planet.IsProductionFrozen = false;
            planet.LastResourceUpdateUtc = now;
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        return new VacationModeStateResult(
            UserId: user.Id,
            IsVacationMode: false,
            VacationUntilUtc: null,
            CanDisableNow: true);
    }
}

