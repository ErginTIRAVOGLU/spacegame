using OGame.Domain.Enums;
using OGame.Domain.Services;
using Xunit;

namespace OGame.Domain.Tests;

public class ExpeditionEngineTests
{
    [Theory]
    [InlineData(0.0, ExpeditionOutcomeType.FindResources)]
    [InlineData(30.0, ExpeditionOutcomeType.FindResources)]
    [InlineData(35.0, ExpeditionOutcomeType.FindShips)]
    [InlineData(50.0, ExpeditionOutcomeType.FindShips)]
    [InlineData(60.0, ExpeditionOutcomeType.NothingHappens)]
    [InlineData(70.0, ExpeditionOutcomeType.NothingHappens)]
    [InlineData(75.0, ExpeditionOutcomeType.FindDarkMatter)]
    [InlineData(81.0, ExpeditionOutcomeType.FindDarkMatter)]
    [InlineData(85.0, ExpeditionOutcomeType.Delay)]
    [InlineData(90.0, ExpeditionOutcomeType.Pirates)]
    [InlineData(95.0, ExpeditionOutcomeType.Aliens)]
    [InlineData(98.0, ExpeditionOutcomeType.EarlyReturn)]
    [InlineData(99.2, ExpeditionOutcomeType.FindMerchant)]
    [InlineData(100.0, ExpeditionOutcomeType.TotalBlackHoleLoss)]
    public void ResolveOutcomeByPercentile_ShouldMatchExactWeightedDistribution(
        double percentile,
        ExpeditionOutcomeType expectedOutcome)
    {
        var actual = ExpeditionFormulas.ResolveOutcomeByPercentile(percentile);
        Assert.Equal(expectedOutcome, actual);
    }

    [Theory]
    [InlineData(0, 0)]
    [InlineData(1, 1)]
    [InlineData(3, 1)]
    [InlineData(4, 2)]
    [InlineData(9, 3)]
    [InlineData(16, 4)]
    public void CalculateMaxConcurrentExpeditions_ShouldScaleWithSquareRootOfAstrophysicsLevel(
        int astrophysicsLevel,
        int expectedMaxExpeditions)
    {
        int actual = ExpeditionFormulas.CalculateMaxConcurrentExpeditions(astrophysicsLevel);
        Assert.Equal(expectedMaxExpeditions, actual);
    }

    [Fact]
    public void CalculateFoundDarkMatter_ShouldYieldBetween300And1800()
    {
        // Small packet (packetRoll < 0.60): 300 to 400
        Assert.Equal(300, ExpeditionFormulas.CalculateFoundDarkMatter(0.0, packetRoll: 0.1));
        Assert.Equal(350, ExpeditionFormulas.CalculateFoundDarkMatter(0.5, packetRoll: 0.1));
        Assert.Equal(400, ExpeditionFormulas.CalculateFoundDarkMatter(1.0, packetRoll: 0.1));

        // Large packet (packetRoll >= 0.90): 1000 to 1800
        Assert.Equal(1000, ExpeditionFormulas.CalculateFoundDarkMatter(0.0, packetRoll: 0.95));
        Assert.Equal(1400, ExpeditionFormulas.CalculateFoundDarkMatter(0.5, packetRoll: 0.95));
        Assert.Equal(1800, ExpeditionFormulas.CalculateFoundDarkMatter(1.0, packetRoll: 0.95));
    }

    [Fact]
    public void GenerateNpcFleet_ShouldScaleByEncounterStrength()
    {
        var expeditionShips = new Dictionary<UnitType, int>
        {
            [UnitType.LightFighter] = 100,
            [UnitType.Cruiser] = 20
        };

        var weaker = ExpeditionFormulas.GenerateNpcFleet(expeditionShips, ExpeditionNpcStrength.Weaker);
        var normal = ExpeditionFormulas.GenerateNpcFleet(expeditionShips, ExpeditionNpcStrength.Normal);
        var stronger = ExpeditionFormulas.GenerateNpcFleet(expeditionShips, ExpeditionNpcStrength.Stronger);

        Assert.Equal(30, weaker[UnitType.LightFighter]);
        Assert.Equal(50, normal[UnitType.LightFighter]);
        Assert.Equal(80, stronger[UnitType.LightFighter]);
    }
}
