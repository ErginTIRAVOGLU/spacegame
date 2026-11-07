using Microsoft.EntityFrameworkCore;
using OGame.Application.Common.Interfaces;
using OGame.Application.Interfaces;

namespace OGame.Api.Endpoints;

public record ExecuteEspionageScanRequest(
    Guid ScannerUserId,
    Guid TargetPlanetId,
    int ProbeCount,
    int? Seed = null);

public static class EspionageEndpoints
{
    public static IEndpointRouteBuilder MapEspionageEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/espionage")
            .WithTags("Espionage");

        group.MapPost("/scan", async (
            ExecuteEspionageScanRequest request,
            IEspionageService espionageService,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var result = await espionageService.ExecuteEspionageScanAsync(
                    request.ScannerUserId,
                    request.TargetPlanetId,
                    request.ProbeCount,
                    request.Seed,
                    cancellationToken);

                return Results.Ok(new
                {
                    result.Report.Id,
                    result.Report.TargetPlanetId,
                    result.Report.ScannerUserId,
                    result.Report.TierLevel,
                    result.Report.DataJson,
                    result.Report.CreatedAtUtc,
                    result.SurvivingProbes,
                    result.CounterEspionageTriggered
                });
            }
            catch (Exception ex) when (ex is InvalidOperationException or ArgumentOutOfRangeException)
            {
                return Results.BadRequest(new { Message = ex.Message });
            }
        })
        .WithName("ExecuteEspionageScan");

        group.MapGet("/reports/{userId:guid}", async (
            Guid userId,
            IApplicationDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var reports = await dbContext.EspionageReports
                .AsNoTracking()
                .Where(r => r.ScannerUserId == userId)
                .OrderByDescending(r => r.CreatedAtUtc)
                .ToListAsync(cancellationToken);

            return Results.Ok(reports);
        })
        .WithName("GetEspionageReportsForUser");

        return app;
    }
}

