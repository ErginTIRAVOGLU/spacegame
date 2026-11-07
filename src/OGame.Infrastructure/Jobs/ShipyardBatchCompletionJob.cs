using Hangfire;
using Microsoft.Extensions.Logging;
using OGame.Application.Common.Interfaces;

namespace OGame.Infrastructure.Jobs;

[AutomaticRetry(Attempts = 3, DelaysInSeconds = [5, 5, 5])]
public class ShipyardBatchCompletionJob(
    IDistributedLockService lockService,
    IShipyardService shipyardService,
    ILogger<ShipyardBatchCompletionJob> logger)
{
    public async Task ExecuteAsync(Guid planetId, Guid batchQueueItemId, CancellationToken cancellationToken = default)
    {
        string lockKey = $"lock:planet:{planetId}";
        await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

        logger.LogInformation(
            "Executing ShipyardBatchCompletionJob for Planet {PlanetId}, Batch {BatchQueueItemId}.",
            planetId,
            batchQueueItemId);

        await shipyardService.CompleteShipyardBatchAsync(planetId, batchQueueItemId, cancellationToken);
    }
}

