using Hangfire;
using Microsoft.Extensions.Logging;
using OGame.Application.Common.Interfaces;
using OGame.Domain.Enums;

namespace OGame.Infrastructure.Jobs;

[AutomaticRetry(Attempts = 3, DelaysInSeconds = [5, 5, 5])]
public class FleetArrivalJob(
    IDistributedLockService lockService,
    IFleetMissionService fleetMissionService,
    IJobScheduler jobScheduler,
    ILogger<FleetArrivalJob> logger)
{
    public async Task ExecuteAsync(Guid fleetMissionId, CancellationToken cancellationToken = default)
    {
        string fleetLockKey = $"lock:fleet:{fleetMissionId}";

        await using var fleetLock = await lockService.AcquireLockAsync(fleetLockKey, cancellationToken: cancellationToken);

        var context = await fleetMissionService.GetMissionArrivalContextAsync(fleetMissionId, cancellationToken);
        if (context is null)
        {
            logger.LogWarning("FleetMission {FleetMissionId} not found or already processed.", fleetMissionId);
            return;
        }

        IAsyncDisposable? planetLock = null;
        try
        {
            if (context.TargetPlanetId.HasValue)
            {
                string planetLockKey = $"lock:planet:{context.TargetPlanetId.Value}";
                planetLock = await lockService.AcquireLockAsync(planetLockKey, cancellationToken: cancellationToken);
            }

            logger.LogInformation(
                "Evaluating FleetArrivalJob for Mission {FleetMissionId} (Type: {MissionType}).",
                fleetMissionId,
                context.MissionType);

            var resolution = await fleetMissionService.EvaluateMissionArrivalAsync(fleetMissionId, cancellationToken);

            // Evaluate mission type (Combat/Attack, Transport, Colonize, Recycle, etc.)
            switch (resolution.MissionType)
            {
                case FleetMissionType.Attack:
                case FleetMissionType.AcsAttack:
                case FleetMissionType.Transport:
                case FleetMissionType.Colonize:
                case FleetMissionType.Recycle:
                default:
                    break;
            }

            if (resolution.RequiresReturnTrip && resolution.ReturnTimeUtc.HasValue)
            {
                string returnJobId = jobScheduler.ScheduleFleetReturn(fleetMissionId, resolution.ReturnTimeUtc.Value);
                logger.LogInformation(
                    "Scheduled FleetReturnJob ({ReturnJobId}) for Mission {FleetMissionId} at {ReturnTimeUtc}.",
                    returnJobId,
                    fleetMissionId,
                    resolution.ReturnTimeUtc.Value);
            }
        }
        finally
        {
            if (planetLock is not null)
            {
                await planetLock.DisposeAsync();
            }
        }
    }
}

