using OGame.Application.Common.Interfaces;
using OGame.Domain.Enums;

namespace OGame.Api.Endpoints;

public record PhalanxScanRequest(
    Guid ScannerUserId,
    Guid OriginMoonId,
    int TargetGalaxy,
    int TargetSystem,
    int TargetSlot);

public record JumpGateTransferRequest(
    Guid UserId,
    Guid OriginMoonId,
    Guid DestinationMoonId,
    IReadOnlyDictionary<UnitType, int> Ships);

public static class MoonEndpoints
{
    public static IEndpointRouteBuilder MapMoonEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/moons")
            .WithTags("Moons");

        group.MapPost("/phalanx/scan", async (
            PhalanxScanRequest request,
            IMoonAndPhalanxService moonService,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var movements = await moonService.ScanWithSensorPhalanxAsync(
                    request.ScannerUserId,
                    request.OriginMoonId,
                    request.TargetGalaxy,
                    request.TargetSystem,
                    request.TargetSlot,
                    cancellationToken);

                return Results.Ok(new
                {
                    TargetCoordinates = $"[{request.TargetGalaxy}:{request.TargetSystem}:{request.TargetSlot}]",
                    DeuteriumConsumed = 5000,
                    Movements = movements
                });
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { Message = ex.Message });
            }
        })
        .WithName("ScanWithSensorPhalanx");

        group.MapPost("/jumpgate/transfer", async (
            JumpGateTransferRequest request,
            IMoonAndPhalanxService moonService,
            CancellationToken cancellationToken) =>
        {
            try
            {
                await moonService.TransferFleetViaJumpGateAsync(
                    request.UserId,
                    request.OriginMoonId,
                    request.DestinationMoonId,
                    request.Ships,
                    cancellationToken);

                return Results.Ok(new
                {
                    Status = "Transferred",
                    request.OriginMoonId,
                    request.DestinationMoonId,
                    CooldownMinutes = 60,
                    DeuteriumCost = 0,
                    FlightDurationSeconds = 0
                });
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { Message = ex.Message });
            }
        })
        .WithName("TransferFleetViaJumpGate");

        return app;
    }
}

