using Microsoft.EntityFrameworkCore;
using OGame.Application.Common.Interfaces;
using OGame.Application.Interfaces;
using OGame.Domain.Enums;
using OGame.Domain.Services;

namespace OGame.Application.Services;

public class ColonizationAndPlanetService(
    IApplicationDbContext dbContext,
    IDistributedLockService lockService) : IColonizationAndPlanetService
{
    public async Task<PlanetAbandonmentResult> AbandonPlanetAsync(
        Guid planetId,
        Guid userId,
        string password,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(password))
        {
            throw new InvalidOperationException("Password verification is required to abandon a planet.");
        }

        string lockKey = $"lock:planet:{planetId}";
        await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

        var user = await dbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken)
            ?? throw new InvalidOperationException($"User {userId} not found.");

        if (!string.Equals(user.PasswordHash, password, StringComparison.Ordinal))
        {
            throw new InvalidOperationException("Invalid password verification for planet abandonment.");
        }

        var planet = await dbContext.Planets
            .Include(p => p.Buildings)
            .Include(p => p.BuildingQueue)
            .Include(p => p.ShipyardQueue)
            .Include(p => p.Units)
            .FirstOrDefaultAsync(p => p.Id == planetId && p.UserId == userId, cancellationToken)
            ?? throw new InvalidOperationException($"Planet {planetId} not found for user {userId}.");

        if (planet.IsCapital)
        {
            throw new InvalidOperationException("Cannot abandon your Home Planet (Capital).");
        }

        if (planet.IsDestroyedPlanet)
        {
            throw new InvalidOperationException("This planet has already been abandoned.");
        }

        bool hasActiveFleets = await dbContext.FleetMissions
            .AnyAsync(m =>
                (m.Status == FleetMissionStatus.Outbound ||
                 m.Status == FleetMissionStatus.Holding ||
                 m.Status == FleetMissionStatus.Returning) &&
                (m.OriginPlanetId == planetId || m.TargetPlanetId == planetId),
                cancellationToken);

        if (hasActiveFleets)
        {
            throw new InvalidOperationException(
                "Cannot abandon a planet while it has outgoing or incoming fleets.");
        }

        var now = DateTime.UtcNow;
        var expiresAtUtc = ColonizationFormulas.CalculateDestroyedPlanetExpiryUtc(now);

        if (planet.BuildingQueue.Count > 0)
        {
            dbContext.BuildingQueueItems.RemoveRange(planet.BuildingQueue);
        }

        if (planet.ShipyardQueue.Count > 0)
        {
            dbContext.ShipyardQueueItems.RemoveRange(planet.ShipyardQueue);
        }

        if (planet.Units.Count > 0)
        {
            dbContext.PlanetUnits.RemoveRange(planet.Units);
        }

        if (planet.Buildings.Count > 0)
        {
            dbContext.Buildings.RemoveRange(planet.Buildings);
        }

        planet.Name = "Destroyed Planet";
        planet.Metal = 0;
        planet.Crystal = 0;
        planet.Deuterium = 0;
        planet.FieldsUsed = 0;
        planet.IsProductionFrozen = true;
        planet.IsDestroyedPlanet = true;
        planet.DestroyedAtUtc = now;
        planet.DestroyedPlanetExpiresAtUtc = expiresAtUtc;
        planet.LastResourceUpdateUtc = now;

        await dbContext.SaveChangesAsync(cancellationToken);

        return new PlanetAbandonmentResult(
            PlanetId: planet.Id,
            Coordinates: $"[{planet.Galaxy}:{planet.System}:{planet.Slot}]",
            IsDestroyedPlanet: true,
            DestroyedAtUtc: now,
            DestroyedPlanetExpiresAtUtc: expiresAtUtc);
    }

    public async Task<int> PurgeExpiredDestroyedPlanetsAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var expiredPlanets = await dbContext.Planets
            .Where(p => p.IsDestroyedPlanet && p.DestroyedPlanetExpiresAtUtc.HasValue && p.DestroyedPlanetExpiresAtUtc.Value <= now)
            .ToListAsync(cancellationToken);

        if (expiredPlanets.Count == 0)
        {
            return 0;
        }

        dbContext.Planets.RemoveRange(expiredPlanets);
        await dbContext.SaveChangesAsync(cancellationToken);
        return expiredPlanets.Count;
    }
}

