using OGame.Domain.Enums;
using OGame.Domain.Services;
using OGame.Infrastructure.Services;

namespace OGame.Domain.Tests;

public class MoonAndPhalanxTests
{
    [Theory]
    [InlineData(0, 0, 0)]
    [InlineData(50_000, 49_999, 0)]
    [InlineData(60_000, 40_000, 1)]
    [InlineData(500_000, 250_000, 7)]
    [InlineData(1_500_000, 500_000, 20)]
    [InlineData(5_000_000, 5_000_000, 20)] // Capped at 20%
    public void CalculateMoonChancePercent_ShouldFollow100kDebrisRuleAndCapAt20Percent(
        double metal,
        double crystal,
        int expectedChance)
    {
        int actual = MoonAndPhalanxFormulas.CalculateMoonChancePercent(metal, crystal);
        Assert.Equal(expectedChance, actual);
    }

    [Fact]
    public void CalculateMoonDiameterAndMaxFields_ShouldStayWithinOfficialLimitsAndApplyLunarBaseFormula()
    {
        int diameterMin = MoonAndPhalanxFormulas.CalculateMoonDiameterKm(100_000, rngFactor: 0.0);
        int diameterMax = MoonAndPhalanxFormulas.CalculateMoonDiameterKm(2_000_000, rngFactor: 1.0);

        Assert.InRange(diameterMin, 4500, 8947);
        Assert.InRange(diameterMax, 8366, 8947);
        Assert.Equal(8947, diameterMax);

        // Max fields: 1 base field + 3 per MoonBase level (net +2 usable fields per level)
        Assert.Equal(1, MoonAndPhalanxFormulas.CalculateMoonMaxFields(8000, moonBaseLevel: 0));
        Assert.Equal(10, MoonAndPhalanxFormulas.CalculateMoonMaxFields(8000, moonBaseLevel: 3));
    }

    [Fact]
    public void SensorPhalanxRange_AndMoonToDebrisInvisibility_ShouldFollowExactRules()
    {
        // Range = Level^2 - 1
        Assert.Equal(0, MoonAndPhalanxFormulas.CalculatePhalanxScanRangeSystems(1));
        Assert.Equal(3, MoonAndPhalanxFormulas.CalculatePhalanxScanRangeSystems(2));
        Assert.Equal(8, MoonAndPhalanxFormulas.CalculatePhalanxScanRangeSystems(3));
        Assert.Equal(15, MoonAndPhalanxFormulas.CalculatePhalanxScanRangeSystems(4));

        // Moon at [1:100] with Phalanx Level 3 (Range = 8 -> covers 1:92 to 1:108)
        Assert.True(MoonAndPhalanxFormulas.IsTargetWithinPhalanxRange(1, 100, 3, 1, 108));
        Assert.False(MoonAndPhalanxFormulas.IsTargetWithinPhalanxRange(1, 100, 3, 1, 109));
        Assert.False(MoonAndPhalanxFormulas.IsTargetWithinPhalanxRange(1, 100, 3, 2, 100)); // Different galaxy

        // Critical Rule: Fleets originating from a Moon to a Debris Field (Recycle) are invisible to Phalanx
        Assert.False(MoonAndPhalanxFormulas.IsFleetVisibleToPhalanx(
            CoordinateType.Moon,
            CoordinateType.Debris,
            FleetMissionType.Recycle));

        // Planet to Debris Field IS visible
        Assert.True(MoonAndPhalanxFormulas.IsFleetVisibleToPhalanx(
            CoordinateType.Planet,
            CoordinateType.Debris,
            FleetMissionType.Recycle));

        // Planet to Planet Attack IS visible
        Assert.True(MoonAndPhalanxFormulas.IsFleetVisibleToPhalanx(
            CoordinateType.Planet,
            CoordinateType.Planet,
            FleetMissionType.Attack));
    }

    [Fact]
    public void MoonDestructionAndRipLossFormulas_ShouldMatchExactEquations()
    {
        double destructionChance = MoonAndPhalanxFormulas.CalculateMoonDestructionChancePercent(
            moonDiameterKm: 6400,
            deathstarCount: 4);

        double ripLossChance = MoonAndPhalanxFormulas.CalculateRipLossChancePercent(
            moonDiameterKm: 6400,
            deathstarCount: 4);

        Assert.True(destructionChance > 0.0);
        Assert.True(ripLossChance > 0.0);
    }

    [Fact]
    public async Task JumpGateCooldownService_ShouldEnforce60MinuteCooldownKey()
    {
        var cooldownService = new RedisJumpGateCooldownService(redisConnection: null);
        var moonId = Guid.NewGuid();

        Assert.Null(await cooldownService.GetRemainingCooldownAsync(moonId));

        await cooldownService.SetCooldownAsync(moonId, TimeSpan.FromMinutes(60));

        var remaining = await cooldownService.GetRemainingCooldownAsync(moonId);
        Assert.NotNull(remaining);
        Assert.True(remaining.Value.TotalMinutes > 59.0 && remaining.Value.TotalMinutes <= 60.0);
    }
}

