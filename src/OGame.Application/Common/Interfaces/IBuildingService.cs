using OGame.Domain.Entities;
using OGame.Domain.Enums;

namespace OGame.Application.Common.Interfaces;

public record BuildingCompletedResult(
    Guid UserId,
    Guid PlanetId,
    Guid QueueItemId,
    BuildingType BuildingType,
    int NewLevel,
    DateTime CompletedAtUtc);

public interface IBuildingService
{
    Task<BuildingQueueItem> EnqueueBuildingUpgradeAsync(
        Guid planetId,
        BuildingType buildingType,
        CancellationToken cancellationToken = default);

    Task<BuildingQueueItem> EnqueueBuildingDemolishAsync(
        Guid planetId,
        BuildingType buildingType,
        CancellationToken cancellationToken = default);

    Task<BuildingCompletedResult?> CompleteBuildingUpgradeAsync(
        Guid planetId,
        Guid queueItemId,
        CancellationToken cancellationToken = default);
}
