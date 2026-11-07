using Microsoft.AspNetCore.Mvc;
using OGame.Application.Common.Interfaces;

namespace OGame.Api.Endpoints;

public record VacationModeRequest(Guid UserId);

public static class HighscoreAndVacationEndpoints
{
    public static IEndpointRouteBuilder MapHighscoreAndVacationEndpoints(this IEndpointRouteBuilder app)
    {
        var highscoresGroup = app.MapGroup("/api/highscores")
            .WithTags("Highscores");

        highscoresGroup.MapGet("/", async (
            [FromQuery] int? topCount,
            IHighscoreService highscoreService,
            CancellationToken cancellationToken) =>
        {
            var leaderboard = await highscoreService.GetLeaderboardAsync(
                topCount ?? 100,
                cancellationToken);

            return Results.Ok(leaderboard);
        })
        .WithName("GetUniverseHighscores");

        highscoresGroup.MapPost("/recalculate", async (
            IHighscoreService highscoreService,
            CancellationToken cancellationToken) =>
        {
            await highscoreService.CalculateUniverseHighscoresAsync(cancellationToken);
            return Results.Ok(new
            {
                Message = "Universe highscore recalculation completed.",
                TimestampUtc = DateTime.UtcNow
            });
        })
        .WithName("RecalculateUniverseHighscores");

        var vacationGroup = app.MapGroup("/api/user/vacation-mode")
            .WithTags("VacationMode");

        vacationGroup.MapPost("/enable", async (
            [FromBody] VacationModeRequest request,
            IVacationModeService vacationModeService,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var result = await vacationModeService.EnableVacationModeAsync(
                    request.UserId,
                    cancellationToken);

                return Results.Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { Error = ex.Message });
            }
        })
        .WithName("EnableVacationMode");

        vacationGroup.MapPost("/disable", async (
            [FromBody] VacationModeRequest request,
            IVacationModeService vacationModeService,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var result = await vacationModeService.DisableVacationModeAsync(
                    request.UserId,
                    cancellationToken);

                return Results.Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { Error = ex.Message });
            }
        })
        .WithName("DisableVacationMode");

        return app;
    }
}

