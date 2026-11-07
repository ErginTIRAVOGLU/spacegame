using Microsoft.Extensions.Logging;
using OGame.Application.Common.Interfaces;

namespace OGame.Infrastructure.Services;

public class DefaultRealtimeNotificationService(ILogger<DefaultRealtimeNotificationService> logger) : IRealtimeNotificationService
{
    public Task SendBuildingCompletedAsync(BuildingCompletedEvent notification, CancellationToken cancellationToken = default)
    {
        logger.LogInformation(
            "SignalR BuildingCompletedEvent dispatched to User {UserId} for Planet {PlanetId} ({BuildingType} L{NewLevel}).",
            notification.UserId,
            notification.PlanetId,
            notification.BuildingType,
            notification.NewLevel);

        return Task.CompletedTask;
    }

    public Task SendToUserAsync<TEvent>(Guid userId, string eventName, TEvent payload, CancellationToken cancellationToken = default)
    {
        logger.LogInformation("SignalR event '{EventName}' dispatched to User {UserId}.", eventName, userId);
        return Task.CompletedTask;
    }
}

public class DefaultHighscoreService(ILogger<DefaultHighscoreService> logger) : IHighscoreService
{
    public Task CalculateUniverseHighscoresAsync(CancellationToken cancellationToken = default)
    {
        logger.LogInformation("Calculating universe leaderboard points.");
        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<HighscoreEntryDto>> GetLeaderboardAsync(int topCount = 100, CancellationToken cancellationToken = default)
    {
        IReadOnlyList<HighscoreEntryDto> empty = [];
        return Task.FromResult(empty);
    }
}

public class DefaultMissileService(ILogger<DefaultMissileService> logger) : IMissileService
{
    public Task<OGame.Domain.Entities.MissileLaunch> LaunchInterplanetaryMissilesAsync(
        MissileLaunchCommand command,
        CancellationToken cancellationToken = default)
    {
        logger.LogInformation("Launching IPM batch for User {UserId}.", command.AttackerUserId);
        return Task.FromResult(new OGame.Domain.Entities.MissileLaunch());
    }

    public Task ResolveMissileImpactAsync(Guid missileLaunchId, CancellationToken cancellationToken = default)
    {
        logger.LogInformation("Resolving missile impact for Launch {MissileLaunchId}.", missileLaunchId);
        return Task.CompletedTask;
    }
}
