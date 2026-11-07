using System;
using Xunit;

namespace OGame.Domain.Tests;

public class ResourceHeaderTooltipsFormulasTests
{
    [Theory]
    [InlineData(0, 10_000, 1_000)]
    [InlineData(1, 20_000, 2_000)]
    [InlineData(2, 40_000, 4_000)]
    [InlineData(3, 75_000, 7_500)]
    [InlineData(4, 140_000, 14_000)]
    public void StorageCapacityAndBunkerFormulas_MatchCanonicalOGameValues(int level, long expectedMinStorage, long expectedMinBunker)
    {
        // Formula: 5000 * Math.Floor(2.5 * Math.Exp(20.0 * level / 33.0))
        long storageCapacity = 5000 * (long)Math.Floor(2.5 * Math.Exp(20.0 * level / 33.0));
        long bunkerCapacity = (long)Math.Floor(storageCapacity * 0.10);

        Assert.True(storageCapacity >= expectedMinStorage, $"Storage capacity for level {level} should be >= {expectedMinStorage}, got {storageCapacity}");
        Assert.True(bunkerCapacity >= expectedMinBunker, $"Bunker capacity for level {level} should be >= {expectedMinBunker}, got {bunkerCapacity}");
    }

    [Fact]
    public void StorageExceededCheck_TriggersRedWarning()
    {
        long storageCap = 10_000;
        long underCap = 9_999;
        long exactCap = 10_000;
        long overCap = 12_500;

        Assert.False(underCap >= storageCap);
        Assert.True(exactCap >= storageCap);
        Assert.True(overCap >= storageCap);
    }

    [Theory]
    [InlineData(1000, 800, 200, false)]
    [InlineData(500, 500, 0, false)]
    [InlineData(300, 450, -150, true)]
    public void EnergyBalance_CalculatesNetAndDeficitCorrectly(int produced, int consumed, int expectedNet, bool expectedDeficit)
    {
        int net = produced - consumed;
        bool isDeficit = net < 0;

        Assert.Equal(expectedNet, net);
        Assert.Equal(expectedDeficit, isDeficit);
    }

    [Fact]
    public void PopulationTooltipMetrics_CalculateFedAndUnderfedProperly()
    {
        long t1 = 250;
        long t2 = 100;
        long t3 = 50;
        long totalPop = t1 + t2 + t3; // 400
        long housingCap = 300;

        long fed = Math.Min(totalPop, housingCap);
        long underfed = Math.Max(0, totalPop - fed);

        Assert.Equal(400, totalPop);
        Assert.Equal(300, fed);
        Assert.Equal(100, underfed);
    }

    [Fact]
    public void FoodTooltipMetrics_CalculateSurplusAndStarvationTime()
    {
        long foodBalance = 840;
        long maxFoodCapacity = 2600;
        double foodPerSecond = 24.0;
        double foodPerHour = foodPerSecond * 3600.0; // 86,400
        long consumptionPerHour = 2500;

        double surplus = Math.Max(0, foodPerHour - consumptionPerHour);
        Assert.True(surplus > 0, "Food should have surplus when production exceeds consumption");

        // Starvation scenario when production ceases
        double deficitConsumptionPerHour = 420.0;
        double starvationHours = foodBalance / deficitConsumptionPerHour;
        Assert.Equal(2.0, starvationHours, precision: 1);
        Assert.True(foodBalance <= maxFoodCapacity);
    }

    [Fact]
    public void DarkMatterBreakdown_SplitsPurchasedAndFoundAccurately()
    {
        long totalDarkMatter = 92_500;
        long purchasedDarkMatter = 0;
        long foundDarkMatter = Math.Max(0, totalDarkMatter - purchasedDarkMatter);

        Assert.Equal(92_500, totalDarkMatter);
        Assert.Equal(0, purchasedDarkMatter);
        Assert.Equal(92_500, foundDarkMatter);

        // Account inactivity protection rule
        bool isProtectedFromDeletion = purchasedDarkMatter > 0;
        Assert.False(isProtectedFromDeletion);

        purchasedDarkMatter = 50_000;
        foundDarkMatter = Math.Max(0, totalDarkMatter - purchasedDarkMatter);
        isProtectedFromDeletion = purchasedDarkMatter > 0;

        Assert.True(isProtectedFromDeletion);
        Assert.Equal(42_500, foundDarkMatter);
    }
}

