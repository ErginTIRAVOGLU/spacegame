using Hangfire;
using OGame.Application.Common.Interfaces;

namespace OGame.Infrastructure.Jobs;

public class HangfireJobScheduler(IBackgroundJobClient backgroundJobClient) : IJobScheduler
{
    public string ScheduleBuildingCompletion(Guid planetId, Guid queueItemId, DateTimeOffset runAt)
    {
        return backgroundJobClient.Schedule<BuildingCompletionJob>(
            job => job.ExecuteAsync(planetId, queueItemId, CancellationToken.None),
            runAt);
    }

    public string ScheduleResearchCompletion(Guid userId, Guid queueItemId, DateTimeOffset runAt)
    {
        return backgroundJobClient.Schedule<ResearchCompletionJob>(
            job => job.ExecuteAsync(userId, queueItemId, CancellationToken.None),
            runAt);
    }

    public string ScheduleShipyardBatchCompletion(Guid planetId, Guid batchQueueItemId, DateTimeOffset runAt)
    {
        return backgroundJobClient.Schedule<ShipyardBatchCompletionJob>(
            job => job.ExecuteAsync(planetId, batchQueueItemId, CancellationToken.None),
            runAt);
    }

    public string ScheduleFleetArrival(Guid fleetMissionId, DateTimeOffset runAt)
    {
        return backgroundJobClient.Schedule<FleetArrivalJob>(
            job => job.ExecuteAsync(fleetMissionId, CancellationToken.None),
            runAt);
    }

    public string ScheduleFleetReturn(Guid fleetMissionId, DateTimeOffset runAt)
    {
        return backgroundJobClient.Schedule<FleetReturnJob>(
            job => job.ExecuteAsync(fleetMissionId, CancellationToken.None),
            runAt);
    }

    public string ScheduleMissileImpact(Guid missileLaunchId, DateTimeOffset runAt)
    {
        return backgroundJobClient.Schedule<MissileImpactJob>(
            job => job.ExecuteAsync(missileLaunchId, CancellationToken.None),
            runAt);
    }

    public bool RescheduleJob(string jobId, DateTimeOffset runAt)
    {
        if (string.IsNullOrWhiteSpace(jobId))
        {
            return false;
        }

        return backgroundJobClient.Reschedule(jobId, runAt);
    }

    public bool CancelScheduledJob(string jobId)
    {
        if (string.IsNullOrWhiteSpace(jobId))
        {
            return false;
        }

        return backgroundJobClient.Delete(jobId);
    }
}
