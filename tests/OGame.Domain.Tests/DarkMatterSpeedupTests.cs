using OGame.Domain.Services;
using Xunit;

namespace OGame.Domain.Tests;

public class DarkMatterSpeedupTests
{
    [Fact]
    public void CalculateHalveDurationCost_ShouldNeverFallBelowMinFloor()
    {
        // Low level, small remaining seconds hitting min floor of 50 KM
        int cost = DarkMatterFormulas.CalculateHalveDurationCost(targetLevel: 1, remainingSeconds: 5, totalDurationSeconds: 100);
        Assert.Equal(50, cost);

        // Zero or negative remaining seconds
        int costZero = DarkMatterFormulas.CalculateHalveDurationCost(targetLevel: 5, remainingSeconds: 0, totalDurationSeconds: 100);
        Assert.Equal(50, costZero);
    }

    [Fact]
    public void CalculateHalveDurationCost_ShouldScaleWithTargetLevelAndRemainingRatio()
    {
        // TargetLevel = 10 -> (1 + 10/10) = 2.0
        // RemainingSeconds = 1000, TotalDurationSeconds = 1000 -> ratio = 1.0
        // Expected: floor(750 * 2.0 * 1.0) = 1500
        int cost = DarkMatterFormulas.CalculateHalveDurationCost(targetLevel: 10, remainingSeconds: 1000, totalDurationSeconds: 1000);
        Assert.Equal(1500, cost);

        // 1st Halve: Remaining = 500, ratio = 0.5 -> Expected: floor(750 * 2.0 * 0.5) = 750 (Halved!)
        int costHalf = DarkMatterFormulas.CalculateHalveDurationCost(targetLevel: 10, remainingSeconds: 500, totalDurationSeconds: 1000);
        Assert.Equal(750, costHalf);

        // 2nd Halve: Remaining = 250, ratio = 0.25 -> Expected: floor(750 * 2.0 * 0.25) = 375 (Halved again!)
        int costQuarter = DarkMatterFormulas.CalculateHalveDurationCost(targetLevel: 10, remainingSeconds: 250, totalDurationSeconds: 1000);
        Assert.Equal(375, costQuarter);

        // 3rd Halve: Remaining = 125, ratio = 0.125 -> Expected: floor(750 * 2.0 * 0.125) = 187 (Halved again!)
        int costEighth = DarkMatterFormulas.CalculateHalveDurationCost(targetLevel: 10, remainingSeconds: 125, totalDurationSeconds: 1000);
        Assert.Equal(187, costEighth);

        // High Level (20) -> (1 + 20/10) = 3.0
        // Expected: floor(750 * 3.0 * 1.0) = 2250
        int costHigh = DarkMatterFormulas.CalculateHalveDurationCost(targetLevel: 20, remainingSeconds: 1000, totalDurationSeconds: 1000);
        Assert.Equal(2250, costHigh);
    }

    [Fact]
    public void CalculateInstantCompletionCost_ShouldNeverFallBelowBaseCost()
    {
        // Very small remaining time (e.g. 10 seconds)
        int costSmall = DarkMatterFormulas.CalculateInstantCompletionCost(targetLevel: 1, remainingSeconds: 10);
        Assert.Equal(750, costSmall);

        // Zero remaining time
        int costZero = DarkMatterFormulas.CalculateInstantCompletionCost(targetLevel: 10, remainingSeconds: 0);
        Assert.Equal(750, costZero);
    }

    [Fact]
    public void CalculateInstantCompletionCost_ShouldScaleWithTargetLevelAndSquareRootOfRemainingHours()
    {
        // TargetLevel = 10 -> levelMultiplier = 2.0
        // RemainingSeconds = 3600 (1 hour) -> sqrt(3600/3600) = 1.0
        // Expected: floor(1500 * 2.0 * 1.0) = 3000
        int cost1Hour = DarkMatterFormulas.CalculateInstantCompletionCost(targetLevel: 10, remainingSeconds: 3600);
        Assert.Equal(3000, cost1Hour);

        // RemainingSeconds = 14400 (4 hours) -> sqrt(14400/3600) = 2.0
        // Expected: floor(1500 * 2.0 * 2.0) = 6000
        int cost4Hours = DarkMatterFormulas.CalculateInstantCompletionCost(targetLevel: 10, remainingSeconds: 14400);
        Assert.Equal(6000, cost4Hours);
    }

    [Theory]
    [InlineData(0, 100, 750)]
    [InlineData(5, 3600, 2250)] // 1500 * (1 + 0.5) * 1 = 2250
    [InlineData(10, 900, 1500)]  // 1500 * 2.0 * 0.5 = 1500
    public void CalculateInstantCompletionCost_TheoryTests(int targetLevel, double remainingSeconds, int expectedCost)
    {
        int actual = DarkMatterFormulas.CalculateInstantCompletionCost(targetLevel, remainingSeconds);
        Assert.Equal(expectedCost, actual);
    }
}

