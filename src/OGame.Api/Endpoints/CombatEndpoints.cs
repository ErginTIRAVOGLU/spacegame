using OGame.Application.Common.Interfaces;
using OGame.Domain.Combat;

namespace OGame.Api.Endpoints;

public static class CombatEndpoints
{
    public record SimulateCombatRequest(
        CombatFleetInput Attacker,
        CombatFleetInput Defender,
        int? Seed = null);

    public static IEndpointRouteBuilder MapCombatEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/combat")
            .WithTags("Combat");

        group.MapPost("/simulate", (SimulateCombatRequest request, ICombatEngine combatEngine) =>
        {
            var result = combatEngine.SimulateCombat(
                request.Attacker,
                request.Defender,
                request.Seed);

            return Results.Ok(result);
        })
        .WithName("SimulateCombat");

        return app;
    }
}

