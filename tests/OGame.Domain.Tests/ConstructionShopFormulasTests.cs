using OGame.Domain.Services;

namespace OGame.Domain.Tests;

public class ConstructionShopFormulasTests
{
    [Fact]
    public void Catalog_ShouldContainExpectedItems()
    {
        var catalog = ConstructionShopFormulas.GetCatalog();

        Assert.NotNull(catalog);
        Assert.NotEmpty(catalog);
        Assert.Equal(14, catalog.Count);

        // Verify Kraken series
        Assert.Contains(catalog, i => i.ItemKey == "kraken_bronze_30m" && i.Category == "construction");
        Assert.Contains(catalog, i => i.ItemKey == "kraken_bronze_2h" && i.Category == "construction");
        Assert.Contains(catalog, i => i.ItemKey == "kraken_silver_6h" && i.Category == "construction");
        Assert.Contains(catalog, i => i.ItemKey == "kraken_gold_12h" && i.Category == "construction");
        Assert.Contains(catalog, i => i.ItemKey == "kraken_platinum_24h" && i.Category == "construction");

        // Verify Fields series
        Assert.Contains(catalog, i => i.ItemKey == "field_bronze_4" && i.Category == "field" && i.EffectValue == 4);
        Assert.Contains(catalog, i => i.ItemKey == "field_silver_9" && i.Category == "field" && i.EffectValue == 9);
        Assert.Contains(catalog, i => i.ItemKey == "field_gold_15" && i.Category == "field" && i.EffectValue == 15);
        Assert.Contains(catalog, i => i.ItemKey == "field_platinum_20" && i.Category == "field" && i.EffectValue == 20);
        Assert.Contains(catalog, i => i.ItemKey == "field_moon_8" && i.Category == "field" && i.EffectValue == 8);

        // Verify Detroid series
        Assert.Contains(catalog, i => i.ItemKey == "detroid_bronze_30m" && i.Category == "lifeform");
        Assert.Contains(catalog, i => i.ItemKey == "detroid_silver_2h" && i.Category == "lifeform");
        Assert.Contains(catalog, i => i.ItemKey == "detroid_gold_6h" && i.Category == "lifeform");
        Assert.Contains(catalog, i => i.ItemKey == "detroid_platinum_24h" && i.Category == "lifeform");
    }

    [Fact]
    public void FindItem_ShouldBeCaseInsensitive()
    {
        var itemLower = ConstructionShopFormulas.FindItem("kraken_silver_6h");
        var itemUpper = ConstructionShopFormulas.FindItem("KRAKEN_SILVER_6H");

        Assert.NotNull(itemLower);
        Assert.NotNull(itemUpper);
        Assert.Equal(itemLower.ItemKey, itemUpper.ItemKey);
        Assert.Equal(21600, itemLower.EffectValue);
    }

    [Fact]
    public void FindItem_NonExistent_ShouldReturnNull()
    {
        var item = ConstructionShopFormulas.FindItem("non_existent_item");
        Assert.Null(item);
    }

    [Theory]
    [InlineData(1800, 1800, true, 0.0)]
    [InlineData(1200, 1800, true, 0.0)]
    [InlineData(3600, 1800, false, 1800.0)]
    [InlineData(7200, 3600, false, 3600.0)]
    public void CalculateQueueReduction_ShouldCalculateAccurately(
        double remainingSeconds,
        double reductionSeconds,
        bool expectedInstant,
        double expectedRemaining)
    {
        var (isInstant, newRemaining) = ConstructionShopFormulas.CalculateQueueReduction(remainingSeconds, reductionSeconds);

        Assert.Equal(expectedInstant, isInstant);
        Assert.Equal(expectedRemaining, newRemaining, precision: 3);
    }
}

