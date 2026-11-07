using OGame.Domain.Enums;

namespace OGame.Application.Common.Interfaces;

public record BuildingCompletedEvent(
    Guid UserId,
    Guid PlanetId,
    Guid QueueItemId,
    BuildingType BuildingType,
    int NewLevel,
    DateTime CompletedAtUtc);

public interface IRealtimeNotificationService
{
    Task SendBuildingCompletedAsync(BuildingCompletedEvent notification, CancellationToken cancellationToken = default);
    Task SendToUserAsync<TEvent>(Guid userId, string eventName, TEvent payload, CancellationToken cancellationToken = default);
}

