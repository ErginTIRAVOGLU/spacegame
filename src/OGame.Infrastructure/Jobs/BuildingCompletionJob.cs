using Hangfire;
using Microsoft.Extensions.Logging;
using OGame.Application.Common.Interfaces;

namespace OGame.Infrastructure.Jobs;

[AutomaticRetry(Attempts = 3, DelaysInSeconds = [5, 5, 5])]
public class BuildingCompletionJob(
    IDistributedLockService lockService,
    IBuildingService buildingService,
    IRealtimeNotificationService notificationService,
    ILogger<BuildingCompletionJob> logger)
{
    public async Task ExecuteAsync(Guid planetId, Guid queueItemId, CancellationToken cancellationToken = default)
    {
        string lockKey = $"lock:planet:{planetId}";

        await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

        logger.LogInformation(
            "Executing BuildingCompletionJob for Planet {PlanetId}, QueueItem {QueueItemId}.",
            planetId,
            queueItemId);

        var completed = await buildingService.CompleteBuildingUpgradeAsync(planetId, queueItemId, cancellationToken);
        if (completed is null)
        {
            logger.LogWarning(
                "Building queue item {QueueItemId} on planet {PlanetId} was not found or already completed.",
                queueItemId,
                planetId);
            return;
        }

        var eventPayload = new BuildingCompletedEvent(
            UserId: completed.UserId,
            PlanetId: completed.PlanetId,
            QueueItemId: completed.QueueItemId,
            BuildingType: completed.BuildingType,
            NewLevel: completed.NewLevel,
            CompletedAtUtc: completed.CompletedAtUtc);

        await notificationService.SendBuildingCompletedAsync(eventPayload, cancellationToken);
    }
}

