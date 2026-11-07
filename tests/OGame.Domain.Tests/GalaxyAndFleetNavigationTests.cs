using OGame.Domain.Enums;
using OGame.Domain.Services;
using OGame.Infrastructure.Services;

namespace OGame.Domain.Tests;

public class GalaxyAndFleetNavigationTests
{
    [Fact]
    public void CalculateSpatialDistance_ShouldMatchExactFormulas_ForGalaxySystemAndSlot()
    {
        // Different Galaxy: |Gal1 - Gal2| * 20000
        int diffGalaxy = FleetNavigationFormulas.CalculateSpatialDistance(1, 100, 4, 3, 250, 8);
        Assert.Equal(40_000, diffGalaxy);

        // Same Galaxy, Different System: |Sys1 - Sys2| * 95 + 2700
        int diffSystem = FleetNavigationFormulas.CalculateSpatialDistance(1, 10, 4, 1, 20, 8);
        Assert.Equal(10 * 95 + 2700, diffSystem); // 3650

        // Same System, Different Slot: |Slot1 - Slot2| * 5 + 1000
        int diffSlot = FleetNavigationFormulas.CalculateSpatialDistance(1, 10, 4, 1, 10, 12);
        Assert.Equal(8 * 5 + 1000, diffSlot); // 1040
    }

    [Fact]
    public void CalculateFlightDurationSeconds_ShouldMatchExactFormula()
    {
        // Formula: Duration = 10 + (3500 / SpeedFactor) * sqrt((Distance * 10) / SlowestShipSpeed)
        // Let Distance = 1000, SlowestShipSpeed = 10,000 (e.g. Heavy Fighter / Battleship), SpeedFactor = 1.0 (100%)
        // sqrt((1000 * 10) / 10000) = sqrt(1) = 1
        // Duration = 10 + 3500 * 1 = 3510 seconds
        double durationFullSpeed = FleetNavigationFormulas.CalculateFlightDurationSeconds(
            distance: 1000,
            slowestShipSpeed: 10_000,
            speedFactor: 1.0);

        Assert.Equal(3510.0, durationFullSpeed, precision: 6);

        // At 50% speed (0.5): 10 + (3500 / 0.5) * 1 = 7010 seconds
        double durationHalfSpeed = FleetNavigationFormulas.CalculateFlightDurationSeconds(
            distance: 1000,
            slowestShipSpeed: 10_000,
            speedFactor: 0.5);

        Assert.Equal(7010.0, durationHalfSpeed, precision: 6);
    }

    [Fact]
    public void ActivityIndicatorDisplay_ShouldFollow15MinAnd59MinAndSelfMaskingRules()
    {
        long nowEpoch = 1_700_000_000L;

        // 1) Delta < 15 minutes (e.g. 5 minutes = 300s ago) -> "(*)"
        Assert.Equal("(*)", FleetNavigationFormulas.FormatActivityIndicator(nowEpoch - 300, nowEpoch, isSelf: false));

        // 2) Delta = 14 minutes 59 seconds (899s ago) -> "(*)"
        Assert.Equal("(*)", FleetNavigationFormulas.FormatActivityIndicator(nowEpoch - 899, nowEpoch, isSelf: false));

        // 3) 15 <= Delta <= 59 minutes (e.g. 24 minutes = 1440s ago) -> "(24m)"
        Assert.Equal("(24m)", FleetNavigationFormulas.FormatActivityIndicator(nowEpoch - (24 * 60), nowEpoch, isSelf: false));

        // 4) Delta = 59 minutes -> "(59m)"
        Assert.Equal("(59m)", FleetNavigationFormulas.FormatActivityIndicator(nowEpoch - (59 * 60), nowEpoch, isSelf: false));

        // 5) Delta >= 60 minutes -> null
        Assert.Null(FleetNavigationFormulas.FormatActivityIndicator(nowEpoch - (60 * 60), nowEpoch, isSelf: false));

        // 6) Self-activity is masked -> null even when < 15 min
        Assert.Null(FleetNavigationFormulas.FormatActivityIndicator(nowEpoch - 60, nowEpoch, isSelf: true));
    }

    [Fact]
    public async Task RedisActivityService_ShouldRecordAndFormatCoordinateActivity()
    {
        var service = new RedisActivityService(redisConnection: null);
        var t0 = new DateTimeOffset(2026, 10, 28, 12, 0, 0, TimeSpan.Zero);

        await service.RecordActivityAsync(1, 50, 7, CoordinateType.Planet, t0);

        string? fresh = await service.GetActivityDisplayAsync(1, 50, 7, CoordinateType.Planet, isSelf: false, nowUtc: t0.AddMinutes(5));
        string? minutes = await service.GetActivityDisplayAsync(1, 50, 7, CoordinateType.Planet, isSelf: false, nowUtc: t0.AddMinutes(32));
        string? selfMasked = await service.GetActivityDisplayAsync(1, 50, 7, CoordinateType.Planet, isSelf: true, nowUtc: t0.AddMinutes(5));
        string? expired = await service.GetActivityDisplayAsync(1, 50, 7, CoordinateType.Planet, isSelf: false, nowUtc: t0.AddMinutes(61));

        Assert.Equal("(*)", fresh);
        Assert.Equal("(32m)", minutes);
        Assert.Null(selfMasked);
        Assert.Null(expired);
    }

    [Fact]
    public void CalculateTotalCargoCapacity_EspionageProbeOnly_ShouldBeZero()
    {
        var ships = new Dictionary<UnitType, int>
        {
            [UnitType.EspionageProbe] = 10
        };

        double capacity = FleetNavigationFormulas.CalculateTotalCargoCapacity(ships);
        Assert.Equal(0.0, capacity);
    }

    [Fact]
    public void CalculateTotalCargoCapacity_HybridFleetWithProbesAndCargoShips_AllowsCapacity()
    {
        var hybridFleet = new Dictionary<UnitType, int>
        {
            [UnitType.EspionageProbe] = 3,  // 0 capacity
            [UnitType.SmallCargo] = 2,      // 5,000 * 2 = 10,000
            [UnitType.LargeCargo] = 1       // 25,000 * 1 = 25,000
        };

        double totalCapacity = FleetNavigationFormulas.CalculateTotalCargoCapacity(hybridFleet);
        Assert.Equal(35_000.0, totalCapacity);
    }
}

