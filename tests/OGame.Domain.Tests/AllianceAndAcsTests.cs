using OGame.Domain.Enums;
using OGame.Domain.Services;

namespace OGame.Domain.Tests;

public class AllianceAndAcsTests
{
    [Fact]
    public void EvaluateJoinTimeSync_ShouldAllowUpTo30PercentSlowdown_AndRejectAbove30Percent()
    {
        var now = new DateTime(2026, 10, 28, 12, 0, 0, DateTimeKind.Utc);
        // Group has 1000 seconds remaining until arrival
        var currentGroupArrival = now.AddSeconds(1000);

        // 1) Faster joining fleet (arrives in 800s) -> synchronized to currentGroupArrival (1000s), 0% slowdown
        var fasterResult = AcsFormulas.EvaluateJoinTimeSync(
            currentGroupArrival,
            joiningFleetArrivalUtc: now.AddSeconds(800),
            utcNow: now);

        Assert.True(fasterResult.IsAllowed);
        Assert.Equal(currentGroupArrival, fasterResult.SynchronizedArrivalUtc);
        Assert.Equal(0.0, fasterResult.SlowdownRatio, precision: 6);

        // 2) Slower joining fleet within 30% limit (arrives in 1250s -> 25% slowdown) -> allowed and extends arrival to 1250s
        var slowerAllowed = AcsFormulas.EvaluateJoinTimeSync(
            currentGroupArrival,
            joiningFleetArrivalUtc: now.AddSeconds(1250),
            utcNow: now);

        Assert.True(slowerAllowed.IsAllowed);
        Assert.Equal(now.AddSeconds(1250), slowerAllowed.SynchronizedArrivalUtc);
        Assert.Equal(0.25, slowerAllowed.SlowdownRatio, precision: 6);

        // 3) Exact boundary (arrives in 1300s -> 30.0% slowdown) -> allowed
        var exactBoundary = AcsFormulas.EvaluateJoinTimeSync(
            currentGroupArrival,
            joiningFleetArrivalUtc: now.AddSeconds(1300),
            utcNow: now);

        Assert.True(exactBoundary.IsAllowed);
        Assert.Equal(now.AddSeconds(1300), exactBoundary.SynchronizedArrivalUtc);
        Assert.Equal(0.30, exactBoundary.SlowdownRatio, precision: 6);

        // 4) Slower joining fleet exceeding 30% limit (arrives in 1301s -> 30.1% slowdown) -> rejected!
        var rejected = AcsFormulas.EvaluateJoinTimeSync(
            currentGroupArrival,
            joiningFleetArrivalUtc: now.AddSeconds(1301),
            utcNow: now);

        Assert.False(rejected.IsAllowed);
        Assert.NotNull(rejected.RejectionReason);
    }

    [Fact]
    public void DistributeSurvivingUnitsProportionally_ShouldShareLossesProportionallyToShipCount()
    {
        // Fleet A sent 75 Light Fighters, Fleet B sent 25 Light Fighters (Total = 100, 3:1 ratio).
        // After unified combat, 60 Light Fighters survived (40 lost).
        // Fleet A should receive 45 surviving Light Fighters (75% of 60).
        // Fleet B should receive 15 surviving Light Fighters (25% of 60).
        var participantInitial = new List<IReadOnlyDictionary<UnitType, int>>
        {
            new Dictionary<UnitType, int> { [UnitType.LightFighter] = 75, [UnitType.Cruiser] = 10 },
            new Dictionary<UnitType, int> { [UnitType.LightFighter] = 25 }
        };

        var unifiedSurviving = new Dictionary<UnitType, int>
        {
            [UnitType.LightFighter] = 60,
            [UnitType.Cruiser] = 8
        };

        var distributed = AcsFormulas.DistributeSurvivingUnitsProportionally(
            participantInitial,
            unifiedSurviving);

        Assert.Equal(2, distributed.Count);
        Assert.Equal(45, distributed[0][UnitType.LightFighter]);
        Assert.Equal(8, distributed[0][UnitType.Cruiser]);
        Assert.Equal(15, distributed[1][UnitType.LightFighter]);
    }

    [Fact]
    public void CalculateHoldingDeuteriumConsumption_ShouldScaleByHoldHoursAndClampBetween1And32Hours()
    {
        var ships = new Dictionary<UnitType, int>
        {
            // Cruiser FuelUsage = 300 -> 10% per hour = 30 fuel/hr per Cruiser. 10 Cruisers = 300 fuel/hr.
            [UnitType.Cruiser] = 10
        };

        // 5 hours hold -> 5 * 300 = 1500 Deuterium
        double fuel5Hours = AcsFormulas.CalculateHoldingDeuteriumConsumption(ships, holdHours: 5);
        Assert.Equal(1500.0, fuel5Hours, precision: 6);

        // 32 hours hold -> 32 * 300 = 9600 Deuterium
        double fuel32Hours = AcsFormulas.CalculateHoldingDeuteriumConsumption(ships, holdHours: 32);
        Assert.Equal(9600.0, fuel32Hours, precision: 6);
    }

    [Fact]
    public void BuildAcsLockKey_ShouldFormatRedisKeyProperly()
    {
        var groupId = Guid.NewGuid();
        Assert.Equal($"acs:{groupId}", AcsFormulas.BuildAcsLockKey(groupId));
    }
}

