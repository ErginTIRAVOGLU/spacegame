using OGame.Domain.Enums;
using OGame.Domain.Services;

namespace OGame.Domain.Tests;

public class MerchantFormulasTests
{
    [Fact]
    public void CalculateTradeOutput_WithStandardRatio_ShouldConvertAccurately()
    {
        // 3 Metal = 2 Crystal = 1 Deuterium
        // If we spend 30,000 Metal and ask for Crystal:
        // Value in Deut = 30000 / 3 = 10000.
        // Crystal equivalent = 10000 * 2 = 20000.
        double crystalGained = MerchantFormulas.CalculateTradeOutput(
            targetResource: "crystal",
            spentMetal: 30000,
            spentCrystal: 0,
            spentDeuterium: 0);

        Assert.Equal(20000.0, crystalGained);

        // If we spend 20,000 Crystal and ask for Deuterium:
        // Value in Deut = 20000 / 2 = 10000.
        // Deut equivalent = 10000 * 1 = 10000.
        double deutGained = MerchantFormulas.CalculateTradeOutput(
            targetResource: "deuterium",
            spentMetal: 0,
            spentCrystal: 20000,
            spentDeuterium: 0);

        Assert.Equal(10000.0, deutGained);

        // If we spend 10,000 Deuterium and ask for Metal:
        // Value in Deut = 10000 / 1 = 10000.
        // Metal equivalent = 10000 * 3 = 30000.
        double metalGained = MerchantFormulas.CalculateTradeOutput(
            targetResource: "metal",
            spentMetal: 0,
            spentCrystal: 0,
            spentDeuterium: 10000);

        Assert.Equal(30000.0, metalGained);
    }

    [Fact]
    public void CalculateAuctionEffectiveBid_ShouldApplyExactMultipliers()
    {
        // TotalBid = (Metal * 1.0) + (Crystal * 1.5) + (Deuterium * 3.0)
        // 10,000 Metal * 1.0 = 10,000
        // 10,000 Crystal * 1.5 = 15,000
        // 10,000 Deuterium * 3.0 = 30,000
        // Total = 55,000
        double totalBid = MerchantFormulas.CalculateAuctionEffectiveBid(
            metal: 10000,
            crystal: 10000,
            deuterium: 10000);

        Assert.Equal(55000.0, totalBid);
    }

    [Fact]
    public void CalculateScrapYield_WithBargainedRate_ShouldReturnCorrectResources()
    {
        // Light Fighter base cost: 3000 Metal, 1000 Crystal, 0 Deut
        // Count: 10
        // Total raw: 30,000 Metal, 10,000 Crystal
        // Scrap rate: 50%
        // Yield: 15,000 Metal, 5,000 Crystal, 0 Deut
        var yield50 = MerchantFormulas.CalculateScrapYield(
            UnitType.LightFighter,
            count: 10,
            scrapPercentage: 50);

        Assert.Equal(15000.0, yield50.Metal);
        Assert.Equal(5000.0, yield50.Crystal);
        Assert.Equal(0.0, yield50.Deuterium);

        // Cruiser base cost: 20,000 Metal, 7000 Crystal, 2000 Deut
        // Count: 2
        // Total raw: 40,000 Metal, 14,000 Crystal, 4000 Deut
        // Scrap rate: 75%
        // Yield: 30,000 Metal, 10,500 Crystal, 3000 Deut
        var cruiserYield = MerchantFormulas.CalculateScrapYield(
            UnitType.Cruiser,
            count: 2,
            scrapPercentage: 75);

        Assert.Equal(30000.0, cruiserYield.Metal);
        Assert.Equal(10500.0, cruiserYield.Crystal);
        Assert.Equal(3000.0, cruiserYield.Deuterium);
    }
}

