using Microsoft.EntityFrameworkCore;
using OGame.Application.Common.Interfaces;
using OGame.Application.Interfaces;
using OGame.Application.Services;
using OGame.Domain.Entities;
using OGame.Domain.Enums;
using OGame.Domain.Services;

namespace OGame.Api.Endpoints;

public static class SpaceDockEndpoints
{
    public static IEndpointRouteBuilder MapSpaceDockEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/planets").WithTags("SpaceDock");

        // GET /api/planets/{id}/space-dock — wreck field + repair status
        group.MapGet("/{planetId:guid}/space-dock", async (
            Guid planetId,
            IApplicationDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var planet = await dbContext.Planets
                .Include(p => p.Buildings)
                .Include(p => p.Units)
                .FirstOrDefaultAsync(p => p.Id == planetId, cancellationToken);
            if (planet is null) return Results.NotFound(new { Message = $"Planet {planetId} not found." });

            var now = DateTime.UtcNow;
            if (await CompleteRepairIfDueAsync(planet, dbContext, now, cancellationToken))
            {
                await dbContext.SaveChangesAsync(cancellationToken);
            }

            return Results.Ok(BuildStatus(planet, now));
        })
        .WithName("GetSpaceDockStatus");

        // POST /api/planets/{id}/space-dock/repair — start free repair of destroyed defending ships
        group.MapPost("/{planetId:guid}/space-dock/repair", async (
            Guid planetId,
            IApplicationDbContext dbContext,
            IDistributedLockService lockService,
            CancellationToken cancellationToken) =>
        {
            var planet = await dbContext.Planets
                .Include(p => p.Buildings)
                .Include(p => p.Units)
                .FirstOrDefaultAsync(p => p.Id == planetId, cancellationToken);
            if (planet is null) return Results.NotFound(new { Message = $"Planet {planetId} not found." });

            await using var lockHandle = await lockService.AcquireLockAsync($"lock:planet:{planet.Id}", cancellationToken: cancellationToken);

            var now = DateTime.UtcNow;
            await CompleteRepairIfDueAsync(planet, dbContext, now, cancellationToken);

            int dockLevel = planet.Buildings.FirstOrDefault(b => b.BuildingType == BuildingType.SpaceDock)?.Level ?? 0;
            if (dockLevel <= 0)
            {
                return Results.BadRequest(new { Message = "Onarım için Uzay İskelesi gereklidir." });
            }

            var wreck = WreckFieldStore.Get(planet.Id, now);
            if (wreck is null || wreck.IsRepaired)
            {
                return Results.BadRequest(new { Message = "Bu gezegende onarılabilir bir enkaz alanı yok." });
            }

            if (SpaceDockFormulas.IsWreckFieldExpired(wreck.ExpiresAtUtc, now))
            {
                return Results.BadRequest(new { Message = "Enkaz alanının 72 saatlik süresi doldu." });
            }

            if (wreck.RepairingShips is not null)
            {
                return Results.BadRequest(new { Message = "Zaten devam eden bir onarım var." });
            }

            var repairable = SpaceDockFormulas.CalculateRepairableShips(wreck.DestroyedShips, dockLevel);
            if (repairable.Count == 0)
            {
                return Results.BadRequest(new { Message = "Onarılabilir gemi bulunamadı." });
            }

            int duration = SpaceDockFormulas.CalculateRepairDurationSeconds(repairable, dockLevel);
            wreck.RepairingShips = repairable;
            wreck.RepairStartedUtc = now;
            wreck.RepairEndsUtc = now.AddSeconds(duration);

            return Results.Ok(BuildStatus(planet, now));
        })
        .WithName("StartSpaceDockRepair");

        return app;
    }

    private static async Task<bool> CompleteRepairIfDueAsync(
        Planet planet,
        IApplicationDbContext dbContext,
        DateTime now,
        CancellationToken cancellationToken)
    {
        var wreck = WreckFieldStore.Get(planet.Id, now);
        if (wreck?.RepairingShips is null || !wreck.RepairEndsUtc.HasValue || wreck.RepairEndsUtc.Value > now)
        {
            return false;
        }

        foreach (var (type, count) in wreck.RepairingShips)
        {
            var unit = planet.Units.FirstOrDefault(u => u.UnitType == type);
            if (unit is null)
            {
                unit = new PlanetUnit { Id = Guid.NewGuid(), PlanetId = planet.Id, UnitType = type, Count = 0 };
                planet.Units.Add(unit);
                dbContext.PlanetUnits.Add(unit);
            }

            unit.Count += count;
        }

        wreck.IsRepaired = true;
        wreck.RepairingShips = null;
        WreckFieldStore.Remove(planet.Id);
        await Task.CompletedTask;
        return true;
    }

    private static object BuildStatus(Planet planet, DateTime now)
    {
        int dockLevel = planet.Buildings.FirstOrDefault(b => b.BuildingType == BuildingType.SpaceDock)?.Level ?? 0;
        var wreck = WreckFieldStore.Get(planet.Id, now);

        if (wreck is null)
        {
            return new
            {
                SpaceDockLevel = dockLevel,
                HasWreckField = false,
                RepairFraction = SpaceDockFormulas.CalculateRepairFraction(dockLevel),
                CanDemolish = false
            };
        }

        var repairable = SpaceDockFormulas.CalculateRepairableShips(wreck.DestroyedShips, dockLevel);
        return new
        {
            SpaceDockLevel = dockLevel,
            HasWreckField = true,
            RepairFraction = SpaceDockFormulas.CalculateRepairFraction(dockLevel),
            CanDemolish = false,
            CreatedAtUtc = wreck.CreatedAtUtc.ToString("O"),
            ExpiresAtUtc = wreck.ExpiresAtUtc.ToString("O"),
            DestroyedShips = wreck.DestroyedShips.ToDictionary(kv => (int)kv.Key, kv => kv.Value),
            RepairableShips = repairable.ToDictionary(kv => (int)kv.Key, kv => kv.Value),
            EstimatedRepairSeconds = repairable.Count > 0 ? SpaceDockFormulas.CalculateRepairDurationSeconds(repairable, dockLevel) : 0,
            IsRepairing = wreck.RepairingShips is not null,
            RepairStartedUtc = wreck.RepairStartedUtc?.ToString("O"),
            RepairEndsUtc = wreck.RepairEndsUtc?.ToString("O")
        };
    }
}

