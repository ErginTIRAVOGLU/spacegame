using System.Reflection;
using Hangfire;
using Hangfire.Common;
using Hangfire.States;
using Microsoft.Extensions.Logging.Abstractions;
using OGame.Application.Common.Interfaces;
using OGame.Domain.Common;
using OGame.Domain.Enums;
using OGame.Infrastructure.Jobs;
using OGame.Infrastructure.Locking;

namespace OGame.Domain.Tests;

public class JobSchedulerAndHandlersTests
{
    [Fact]
    public void HangfireJobScheduler_ShouldScheduleBuildingFleetAndMissileJobs_WithExactTargetTimestamp()
    {
        // Arrange
        var fakeClient = new FakeBackgroundJobClient();
        var scheduler = new HangfireJobScheduler(fakeClient);
        var planetId = Guid.NewGuid();
        var queueItemId = Guid.NewGuid();
        var missionId = Guid.NewGuid();
        var missileId = Guid.NewGuid();
        var runAt = new DateTimeOffset(2026, 10, 28, 12, 30, 45, TimeSpan.Zero);

        // Act
        string buildingJobId = scheduler.ScheduleBuildingCompletion(planetId, queueItemId, runAt);
        string fleetJobId = scheduler.ScheduleFleetArrival(missionId, runAt);
        string missileJobId = scheduler.ScheduleMissileImpact(missileId, runAt);
        bool cancelled = scheduler.CancelScheduledJob(buildingJobId);

        // Assert
        Assert.NotEmpty(buildingJobId);
        Assert.NotEmpty(fleetJobId);
        Assert.NotEmpty(missileJobId);
        Assert.True(cancelled);
        Assert.Equal(3, fakeClient.CreatedJobs.Count);
        Assert.All(fakeClient.CreatedJobs, item =>
        {
            var scheduledState = Assert.IsType<ScheduledState>(item.State);
            Assert.Equal(runAt.UtcDateTime, scheduledState.EnqueueAt);
        });
    }

    [Fact]
    public async Task BuildingCompletionJob_ShouldAcquirePlanetLock_CompleteUpgrade_AndSendSignalRNotification()
    {
        // Arrange
        var lockTracker = new TrackingDistributedLockService();
        var buildingService = new FakeBuildingService();
        var notificationService = new FakeNotificationService();
        var job = new BuildingCompletionJob(
            lockTracker,
            buildingService,
            notificationService,
            NullLogger<BuildingCompletionJob>.Instance);

        var planetId = Guid.NewGuid();
        var queueItemId = Guid.NewGuid();

        // Act
        await job.ExecuteAsync(planetId, queueItemId);

        // Assert
        Assert.Contains($"lock:planet:{planetId}", lockTracker.AcquiredKeys);
        Assert.Equal(1, buildingService.CallCount);
        Assert.Single(notificationService.SentEvents);
        Assert.Equal(planetId, notificationService.SentEvents[0].PlanetId);
        Assert.Equal(queueItemId, notificationService.SentEvents[0].QueueItemId);
        Assert.Equal(BuildingType.MetalMine, notificationService.SentEvents[0].BuildingType);
    }

    [Fact]
    public async Task FleetArrivalJob_ShouldAcquireFleetAndTargetPlanetLocks_AndScheduleReturnWhenReturning()
    {
        // Arrange
        var lockTracker = new TrackingDistributedLockService();
        var missionId = Guid.NewGuid();
        var originPlanetId = Guid.NewGuid();
        var targetPlanetId = Guid.NewGuid();
        var returnAt = DateTimeOffset.UtcNow.AddMinutes(15);

        var fleetService = new FakeFleetMissionService(
            new FleetMissionArrivalContext(
                FleetMissionId: missionId,
                OriginPlanetId: originPlanetId,
                OriginGalaxy: 1,
                OriginSystem: 1,
                OriginSlot: 1,
                OriginType: CoordinateType.Planet,
                TargetPlanetId: targetPlanetId,
                TargetGalaxy: 1,
                TargetSystem: 2,
                TargetSlot: 4,
                TargetType: CoordinateType.Planet,
                MissionType: FleetMissionType.Attack,
                ReturnArrivalUtc: returnAt),
            new FleetMissionArrivalResolution(missionId, FleetMissionType.Attack, RequiresReturnTrip: true, ReturnTimeUtc: returnAt));

        var fakeClient = new FakeBackgroundJobClient();
        var scheduler = new HangfireJobScheduler(fakeClient);
        var job = new FleetArrivalJob(
            lockTracker,
            fleetService,
            scheduler,
            NullLogger<FleetArrivalJob>.Instance);

        // Act
        await job.ExecuteAsync(missionId);

        // Assert
        Assert.Equal(
            [$"lock:fleet:{missionId}", $"lock:planet:{targetPlanetId}"],
            lockTracker.AcquiredKeys);
        Assert.Single(fakeClient.CreatedJobs);
        Assert.Equal(typeof(FleetReturnJob), fakeClient.CreatedJobs[0].Job.Type);
    }

    [Fact]
    public void HighscoreRecurringJob_AndOtherJobHandlers_ShouldHaveCorrectRetryAndCronConfiguration()
    {
        // Verify Cron is 0 */6 * * *
        Assert.Equal("0 */6 * * *", HighscoreRecurringJob.CronExpression);

        // Verify AutomaticRetry(Attempts = 3, DelaysInSeconds = [5, 5, 5]) on job handlers
        Type[] jobTypes =
        [
            typeof(BuildingCompletionJob),
            typeof(FleetArrivalJob),
            typeof(FleetReturnJob),
            typeof(MissileImpactJob),
            typeof(HighscoreRecurringJob)
        ];

        foreach (var type in jobTypes)
        {
            var retryAttr = type.GetCustomAttribute<AutomaticRetryAttribute>();
            Assert.NotNull(retryAttr);
            Assert.Equal(3, retryAttr.Attempts);
            Assert.Equal([5, 5, 5], retryAttr.DelaysInSeconds);
        }
    }

    [Fact]
    public async Task RedisDistributedLockService_FallbackConcurrency_ShouldThrowWhenLockAlreadyHeld()
    {
        var lockService = new RedisDistributedLockService(null, NullLogger<RedisDistributedLockService>.Instance);
        string lockKey = $"lock:planet:{Guid.NewGuid()}";

        await using var firstLock = await lockService.AcquireLockAsync(lockKey);

        await Assert.ThrowsAsync<ConcurrencyLockException>(async () =>
        {
            var tcs = new TaskCompletionSource();
            using (ExecutionContext.SuppressFlow())
            {
                var thread = new Thread(() =>
                {
                    try
                    {
                        var handle = lockService.AcquireLockAsync(lockKey).GetAwaiter().GetResult();
                        tcs.SetResult();
                    }
                    catch (Exception ex)
                    {
                        tcs.SetException(ex);
                    }
                });
                thread.Start();
            }
            await tcs.Task;
        });
    }

    private sealed class FakeBackgroundJobClient : IBackgroundJobClient
    {
        public List<(Job Job, IState State)> CreatedJobs { get; } = [];
        public HashSet<string> DeletedJobIds { get; } = [];

        public string Create(Job job, IState state)
        {
            CreatedJobs.Add((job, state));
            return $"job-{CreatedJobs.Count}";
        }

        public bool ChangeState(string jobId, IState state, string expectedState)
        {
            if (state is DeletedState)
            {
                DeletedJobIds.Add(jobId);
                return true;
            }
            return false;
        }
    }

    private sealed class TrackingDistributedLockService : IDistributedLockService
    {
        public List<string> AcquiredKeys { get; } = [];

        public Task<IAsyncDisposable> AcquireLockAsync(
            string lockKey,
            TimeSpan? expiry = null,
            CancellationToken cancellationToken = default)
        {
            AcquiredKeys.Add(lockKey);
            return Task.FromResult<IAsyncDisposable>(new NoOpDisposable());
        }

        private sealed class NoOpDisposable : IAsyncDisposable
        {
            public ValueTask DisposeAsync() => ValueTask.CompletedTask;
        }
    }

    private sealed class FakeBuildingService : IBuildingService
    {
        public int CallCount { get; private set; }

        public Task<OGame.Domain.Entities.BuildingQueueItem> EnqueueBuildingUpgradeAsync(
            Guid planetId,
            BuildingType buildingType,
            CancellationToken cancellationToken = default) =>
            throw new NotImplementedException();

        public Task<OGame.Domain.Entities.BuildingQueueItem> EnqueueBuildingDemolishAsync(
            Guid planetId,
            BuildingType buildingType,
            CancellationToken cancellationToken = default) =>
            throw new NotImplementedException();

        public Task<BuildingCompletedResult?> CompleteBuildingUpgradeAsync(
            Guid planetId,
            Guid queueItemId,
            CancellationToken cancellationToken = default)
        {
            CallCount++;
            return Task.FromResult<BuildingCompletedResult?>(new BuildingCompletedResult(
                UserId: Guid.NewGuid(),
                PlanetId: planetId,
                QueueItemId: queueItemId,
                BuildingType: BuildingType.MetalMine,
                NewLevel: 5,
                CompletedAtUtc: DateTime.UtcNow));
        }
    }

    private sealed class FakeNotificationService : IRealtimeNotificationService
    {
        public List<BuildingCompletedEvent> SentEvents { get; } = [];

        public Task SendBuildingCompletedAsync(BuildingCompletedEvent notification, CancellationToken cancellationToken = default)
        {
            SentEvents.Add(notification);
            return Task.CompletedTask;
        }

        public Task SendToUserAsync<TEvent>(Guid userId, string eventName, TEvent payload, CancellationToken cancellationToken = default) =>
            Task.CompletedTask;
    }

    private sealed class FakeFleetMissionService(
        FleetMissionArrivalContext context,
        FleetMissionArrivalResolution resolution) : IFleetMissionService
    {
        public Task<OGame.Domain.Entities.FleetMission> DispatchFleetAsync(
            FleetDispatchCommand command,
            CancellationToken cancellationToken = default) =>
            throw new NotImplementedException();

        public Task<FleetMissionArrivalContext?> GetMissionArrivalContextAsync(
            Guid fleetMissionId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<FleetMissionArrivalContext?>(context);

        public Task<FleetMissionArrivalResolution> EvaluateMissionArrivalAsync(
            Guid fleetMissionId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(resolution);

        public Task CompleteFleetReturnAsync(
            Guid fleetMissionId,
            CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task<OGame.Domain.Entities.FleetMission> RecallFleetAsync(
            Guid fleetMissionId,
            Guid? userId = null,
            CancellationToken cancellationToken = default) =>
            throw new NotImplementedException();
    }
}

