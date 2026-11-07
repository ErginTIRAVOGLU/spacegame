using OGame.Domain.Enums;

namespace OGame.Domain.Services;

public static class MerchantFormulas
{
    /// <summary>
    /// Standard OGame Merchant ratio: 3 Metal = 2 Crystal = 1 Deuterium.
    /// Converts given spent resources into target resource equivalent.
    /// </summary>
    public static double CalculateTradeOutput(
        string targetResource,
        double spentMetal,
        double spentCrystal,
        double spentDeuterium)
    {
        double valueInDeut = (Math.Max(0, spentMetal) / 3.0) +
                             (Math.Max(0, spentCrystal) / 2.0) +
                             (Math.Max(0, spentDeuterium) / 1.0);

        return targetResource.ToLowerInvariant() switch
        {
            "metal" => Math.Floor(valueInDeut * 3.0),
            "crystal" => Math.Floor(valueInDeut * 2.0),
            "deuterium" => Math.Floor(valueInDeut * 1.0),
            _ => 0
        };
    }

    /// <summary>
    /// Auction effective bid formula:
    /// TotalBid = (Metal * 1.0) + (Crystal * 1.5) + (Deuterium * 3.0)
    /// </summary>
    public static double CalculateAuctionEffectiveBid(
        double metal,
        double crystal,
        double deuterium)
    {
        return Math.Floor((Math.Max(0, metal) * 1.0) +
                          (Math.Max(0, crystal) * 1.5) +
                          (Math.Max(0, deuterium) * 3.0));
    }

    /// <summary>
    /// Scrapper recovery calculation:
    /// Yield = UnitCost * Count * (ScrapRate / 100.0)
    /// </summary>
    public static ResourceCost CalculateScrapYield(
        UnitType unitType,
        int count,
        int scrapPercentage)
    {
        if (count <= 0 || scrapPercentage <= 0)
        {
            return new ResourceCost(0, 0, 0);
        }

        double rate = Math.Clamp(scrapPercentage, 1, 100) / 100.0;
        var cost = ConstructionFormulas.GetUnitCost(unitType);

        return new ResourceCost(
            Metal: Math.Floor(cost.Metal * count * rate),
            Crystal: Math.Floor(cost.Crystal * count * rate),
            Deuterium: Math.Floor(cost.Deuterium * count * rate));
    }
}

