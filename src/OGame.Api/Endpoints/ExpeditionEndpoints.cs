using Microsoft.EntityFrameworkCore;
using OGame.Application.Common.Interfaces;
using OGame.Application.Interfaces;
using OGame.Domain.Enums;
using OGame.Domain.Services;

namespace OGame.Api.Endpoints;

public record DispatchExpeditionRequest(
    Guid UserId,
    Guid OriginPlanetId,
    int TargetGalaxy,
    int TargetSystem,
    IReadOnlyDictionary<UnitType, int> Ships,
    int HoldHours = 1,
    double SpeedFactor = 1.0);

public static class ExpeditionEndpoints
{
    public static IEndpointRouteBuilder MapExpeditionEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/expeditions")
            .WithTags("Expeditions");

        group.MapPost("/dispatch", async (
            DispatchExpeditionRequest request,
            IFleetMissionService fleetMissionService,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var command = new FleetDispatchCommand(
                    UserId: request.UserId,
                    OriginPlanetId: request.OriginPlanetId,
                    TargetGalaxy: request.TargetGalaxy,
                    TargetSystem: request.TargetSystem,
                    TargetSlot: ExpeditionFormulas.ExpeditionSlotNumber,
                    TargetType: CoordinateType.Planet,
                    MissionType: FleetMissionType.Expedition,
                    Ships: request.Ships,
                    SpeedFactor: request.SpeedFactor,
                    HoldHours: request.HoldHours);

                var mission = await fleetMissionService.DispatchFleetAsync(command, cancellationToken);

                return Results.Ok(new
                {
                    mission.Id,
                    mission.UserId,
                    mission.OriginPlanetId,
                    Destination = $"[{mission.TargetGalaxy}:{mission.TargetSystem}:16]",
                    mission.HoldHours,
                    mission.DepartureUtc,
                    mission.ArrivalUtc,
                    mission.ReturnUtc,
                    mission.FuelConsumed,
                    mission.HangfireArrivalJobId
                });
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { Message = ex.Message });
            }
        })
        .WithName("DispatchExpedition");

        group.MapGet("/reports/{userId:guid}", async (
            Guid userId,
            IApplicationDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var reports = await dbContext.ExpeditionReports
                .AsNoTracking()
                .Where(r => r.UserId == userId)
                .OrderByDescending(r => r.CreatedAtUtc)
                .ToListAsync(cancellationToken);

            return Results.Ok(reports);
        })
        .WithName("GetExpeditionReports");

        return app;
    }
}

