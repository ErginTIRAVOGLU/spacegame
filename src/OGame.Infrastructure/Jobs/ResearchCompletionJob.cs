using Hangfire;
using Microsoft.Extensions.Logging;
using OGame.Application.Common.Interfaces;

namespace OGame.Infrastructure.Jobs;

[AutomaticRetry(Attempts = 3, DelaysInSeconds = [5, 5, 5])]
public class ResearchCompletionJob(
    IDistributedLockService lockService,
    IResearchService researchService,
    IRealtimeNotificationService notificationService,
    ILogger<ResearchCompletionJob> logger)
{
    public async Task ExecuteAsync(Guid userId, Guid queueItemId, CancellationToken cancellationToken = default)
    {
        string lockKey = $"lock:user:research:{userId}";
        await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

        logger.LogInformation(
            "Executing ResearchCompletionJob for User {UserId}, QueueItem {QueueItemId}.",
            userId,
            queueItemId);

        var completed = await researchService.CompleteResearchAsync(userId, queueItemId, cancellationToken);
        if (completed is null)
        {
            return;
        }

        await notificationService.SendToUserAsync(
            userId,
            "ResearchCompletedEvent",
            completed,
            cancellationToken);
    }
}

