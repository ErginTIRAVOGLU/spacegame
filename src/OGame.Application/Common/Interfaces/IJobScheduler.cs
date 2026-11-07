namespace OGame.Application.Common.Interfaces;

public interface IJobScheduler
{
    string ScheduleBuildingCompletion(Guid planetId, Guid queueItemId, DateTimeOffset runAt);
    string ScheduleResearchCompletion(Guid userId, Guid queueItemId, DateTimeOffset runAt);
    string ScheduleShipyardBatchCompletion(Guid planetId, Guid batchQueueItemId, DateTimeOffset runAt);
    string ScheduleFleetArrival(Guid fleetMissionId, DateTimeOffset runAt);
    string ScheduleFleetReturn(Guid fleetMissionId, DateTimeOffset runAt);
    string ScheduleMissileImpact(Guid missileLaunchId, DateTimeOffset runAt);
    bool RescheduleJob(string jobId, DateTimeOffset runAt);
    bool CancelScheduledJob(string jobId);
}
