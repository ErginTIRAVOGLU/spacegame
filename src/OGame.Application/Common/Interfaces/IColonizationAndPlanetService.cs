namespace OGame.Application.Common.Interfaces;

public record PlanetAbandonmentResult(
    Guid PlanetId,
    string Coordinates,
    bool IsDestroyedPlanet,
    DateTime DestroyedAtUtc,
    DateTime DestroyedPlanetExpiresAtUtc);

public interface IColonizationAndPlanetService
{
    Task<PlanetAbandonmentResult> AbandonPlanetAsync(
        Guid planetId,
        Guid userId,
        string password,
        CancellationToken cancellationToken = default);

    Task<int> PurgeExpiredDestroyedPlanetsAsync(CancellationToken cancellationToken = default);
}

