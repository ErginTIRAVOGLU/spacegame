using Microsoft.AspNetCore.Mvc;
using OGame.Application.Common.Interfaces;
using OGame.Domain.Services;

namespace OGame.Api.Endpoints;

public static class MissileAndUniverseEndpoints
{
    public static IEndpointRouteBuilder MapMissileAndUniverseEndpoints(this IEndpointRouteBuilder app)
    {
        var missileGroup = app.MapGroup("/api/missiles")
            .WithTags("Missiles");

        missileGroup.MapPost("/launch", async (
            [FromBody] MissileLaunchCommand command,
            IMissileService missileService,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var launch = await missileService.LaunchInterplanetaryMissilesAsync(
                    command,
                    cancellationToken);

                return Results.Ok(new
                {
                    launch.Id,
                    launch.AttackerUserId,
                    launch.OriginPlanetId,
                    OriginCoordinates = $"[{launch.OriginGalaxy}:{launch.OriginSystem}:{launch.OriginSlot}]",
                    launch.TargetPlanetId,
                    TargetCoordinates = $"[{launch.TargetGalaxy}:{launch.TargetSystem}:{launch.TargetSlot}]",
                    launch.MissileCount,
                    launch.PrimaryTargetDefenseType,
                    launch.LaunchedAtUtc,
                    launch.ImpactTimeUtc,
                    launch.HangfireJobId,
                    Message = $"{launch.MissileCount} adet Gezegenlerarası Roket [{launch.TargetGalaxy}:{launch.TargetSystem}:{launch.TargetSlot}] hedefine fırlatıldı."
                });
            }
            catch (Exception ex) when (ex is InvalidOperationException or ArgumentOutOfRangeException)
            {
                return Results.BadRequest(new { Error = ex.Message });
            }
        })
        .WithName("LaunchInterplanetaryMissiles");

        missileGroup.MapPost("/fire", async (
            [FromBody] MissileLaunchCommand command,
            IMissileService missileService,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var launch = await missileService.LaunchInterplanetaryMissilesAsync(
                    command,
                    cancellationToken);

                return Results.Ok(new
                {
                    launch.Id,
                    launch.AttackerUserId,
                    launch.OriginPlanetId,
                    OriginCoordinates = $"[{launch.OriginGalaxy}:{launch.OriginSystem}:{launch.OriginSlot}]",
                    launch.TargetPlanetId,
                    TargetCoordinates = $"[{launch.TargetGalaxy}:{launch.TargetSystem}:{launch.TargetSlot}]",
                    launch.MissileCount,
                    launch.PrimaryTargetDefenseType,
                    launch.LaunchedAtUtc,
                    launch.ImpactTimeUtc,
                    launch.HangfireJobId,
                    Message = $"{launch.MissileCount} adet Gezegenlerarası Roket [{launch.TargetGalaxy}:{launch.TargetSystem}:{launch.TargetSlot}] hedefine fırlatıldı."
                });
            }
            catch (Exception ex) when (ex is InvalidOperationException or ArgumentOutOfRangeException)
            {
                return Results.BadRequest(new { Error = ex.Message });
            }
        })
        .WithName("FireInterplanetaryMissiles");

        var universeGroup = app.MapGroup("/api/universe")
            .WithTags("UniverseConfig");

        universeGroup.MapGet("/config", async (
            IUniverseConfigService universeConfigService,
            CancellationToken cancellationToken) =>
        {
            var config = await universeConfigService.GetConfigAsync(cancellationToken);
            return Results.Ok(config);
        })
        .WithName("GetUniverseConfig");

        universeGroup.MapPut("/config", async (
            [FromBody] UniverseConfig request,
            IUniverseConfigService universeConfigService,
            CancellationToken cancellationToken) =>
        {
            var updated = await universeConfigService.UpdateConfigAsync(request, cancellationToken);
            return Results.Ok(updated);
        })
        .WithName("UpdateUniverseConfig");

        return app;
    }
}

