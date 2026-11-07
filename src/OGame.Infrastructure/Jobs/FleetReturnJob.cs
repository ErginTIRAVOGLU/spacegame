using Hangfire;
using Microsoft.Extensions.Logging;
using OGame.Application.Common.Interfaces;

namespace OGame.Infrastructure.Jobs;

[AutomaticRetry(Attempts = 3, DelaysInSeconds = [5, 5, 5])]
public class FleetReturnJob(
    IDistributedLockService lockService,
    IFleetMissionService fleetMissionService,
    ILogger<FleetReturnJob> logger)
{
    public async Task ExecuteAsync(Guid fleetMissionId, CancellationToken cancellationToken = default)
    {
        string fleetLockKey = $"lock:fleet:{fleetMissionId}";

        await using var fleetLock = await lockService.AcquireLockAsync(fleetLockKey, cancellationToken: cancellationToken);

        var context = await fleetMissionService.GetMissionArrivalContextAsync(fleetMissionId, cancellationToken);
        if (context is null)
        {
            logger.LogWarning("FleetMission {FleetMissionId} not found for return completion.", fleetMissionId);
            return;
        }

        string originPlanetLockKey = $"lock:planet:{context.OriginPlanetId}";
        await using var planetLock = await lockService.AcquireLockAsync(originPlanetLockKey, cancellationToken: cancellationToken);

        logger.LogInformation("Completing FleetReturnJob for Mission {FleetMissionId}.", fleetMissionId);
        await fleetMissionService.CompleteFleetReturnAsync(fleetMissionId, cancellationToken);
    }
}

