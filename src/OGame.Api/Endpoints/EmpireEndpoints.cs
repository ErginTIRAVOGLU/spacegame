using Microsoft.EntityFrameworkCore;
using OGame.Application.Common.Interfaces;
using OGame.Application.Interfaces;
using OGame.Domain.Entities;
using OGame.Domain.Enums;
using OGame.Domain.Services;

namespace OGame.Api.Endpoints;

public static class EmpireEndpoints
{
    public static IEndpointRouteBuilder MapEmpireEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/empire")
            .WithTags("Empire");

        group.MapGet("/summary", async (
            Guid? userId,
            IApplicationDbContext dbContext,
            IResourceCalculationService resourceService,
            CancellationToken cancellationToken) =>
        {
            var user = userId.HasValue
                ? await dbContext.Users
                    .Include(u => u.Researches)
                    .FirstOrDefaultAsync(u => u.Id == userId.Value, cancellationToken)
                : await dbContext.Users
                    .Include(u => u.Researches)
                    .FirstOrDefaultAsync(cancellationToken);

            if (user is null)
            {
                return Results.NotFound(new { Message = "User not found." });
            }

            var now = DateTime.UtcNow;

            var planets = await dbContext.Planets
                .AsNoTracking()
                .Include(p => p.Buildings)
                .Include(p => p.Units)
                .Where(p => p.UserId == user.Id && !p.IsDestroyedPlanet)
                .OrderByDescending(p => p.IsCapital)
                .ThenBy(p => p.Galaxy)
                .ThenBy(p => p.System)
                .ThenBy(p => p.Slot)
                .ToListAsync(cancellationToken);

            var planetIds = planets.Select(p => p.Id).ToHashSet();

            // Active missions involving user's planets
            var activeMissions = await dbContext.FleetMissions
                .AsNoTracking()
                .Where(m =>
                    (m.Status == FleetMissionStatus.Outbound || m.Status == FleetMissionStatus.Returning || m.Status == FleetMissionStatus.Holding) &&
                    (m.UserId == user.Id || (m.TargetPlanetId.HasValue && planetIds.Contains(m.TargetPlanetId.Value))))
                .ToListAsync(cancellationToken);

            // Researches map: ResearchType (int) -> Level (int)
            var researches = user.Researches.ToDictionary(r => (int)r.ResearchType, r => r.Level);

            var planetSummaries = new List<object>(planets.Count);

            foreach (var p in planets)
            {
                var resources = resourceService.GetCurrentResources(p, now);

                var metalStorageLevel = p.Buildings.FirstOrDefault(b => b.BuildingType == BuildingType.MetalStorage)?.Level ?? 0;
                var crystalStorageLevel = p.Buildings.FirstOrDefault(b => b.BuildingType == BuildingType.CrystalStorage)?.Level ?? 0;
                var deutTankLevel = p.Buildings.FirstOrDefault(b => b.BuildingType == BuildingType.DeuteriumTank)?.Level ?? 0;

                var metalCap = ResourceFormulas.CalculateStorageCapacity(metalStorageLevel);
                var crystalCap = ResourceFormulas.CalculateStorageCapacity(crystalStorageLevel);
                var deutCap = ResourceFormulas.CalculateStorageCapacity(deutTankLevel);

                int missionsCount = activeMissions.Count(m =>
                    m.OriginPlanetId == p.Id || m.TargetPlanetId == p.Id);

                // Buildings mapping: BuildingType (int) -> Level
                var buildingsMap = p.Buildings.ToDictionary(b => (int)b.BuildingType, b => b.Level);

                // Units mapping: UnitType (int) -> Count
                var unitsMap = p.Units.ToDictionary(u => (int)u.UnitType, u => u.Count);

                planetSummaries.Add(new
                {
                    p.Id,
                    p.Name,
                    Coords = $"[{p.Galaxy}:{p.System}:{p.Slot}]",
                    p.Galaxy,
                    p.System,
                    p.Slot,
                    p.IsMoon,
                    p.FieldsUsed,
                    p.MaxFields,
                    p.TempMin,
                    p.TempMax,
                    p.Diameter,
                    ActiveMissionsCount = missionsCount,
                    Resources = new
                    {
                        Metal = Math.Floor(resources.Metal),
                        Crystal = Math.Floor(resources.Crystal),
                        Deuterium = Math.Floor(resources.Deuterium),
                        ProducedEnergy = Math.Round(resources.ProducedEnergy),
                        ConsumedEnergy = Math.Round(resources.ConsumedEnergy),
                        NetEnergy = Math.Round(resources.ProducedEnergy - resources.ConsumedEnergy),
                        MetalPerHour = Math.Round(resources.MetalPerHour),
                        CrystalPerHour = Math.Round(resources.CrystalPerHour),
                        DeuteriumPerHour = Math.Round(resources.DeuteriumPerHour)
                    },
                    Storages = new
                    {
                        MetalCapacity = metalCap,
                        CrystalCapacity = crystalCap,
                        DeuteriumCapacity = deutCap
                    },
                    Buildings = buildingsMap,
                    Units = unitsMap
                });
            }

            return Results.Ok(new
            {
                User = new
                {
                    user.Id,
                    user.Username,
                    user.DarkMatter,
                    user.TotalPoints
                },
                Researches = researches,
                Planets = planetSummaries,
                ServerTimeUtc = now.ToString("O")
            });
        })
        .WithName("GetEmpireSummary");

        return app;
    }
}

