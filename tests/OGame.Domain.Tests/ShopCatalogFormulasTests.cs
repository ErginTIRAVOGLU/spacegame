using OGame.Domain.Entities;
using OGame.Domain.Enums;
using OGame.Domain.Services;

namespace OGame.Domain.Tests;

public class ShopCatalogFormulasTests
{
    [Fact]
    public void Catalog_ShouldContainExpectedItems()
    {
        var catalog = ShopCatalogFormulas.GetCatalog();

        Assert.NotNull(catalog);
        Assert.Equal(79, catalog.Count);
    }

    [Fact]
    public void Catalog_ShouldHaveAccurateCategoryDistributions()
    {
        var catalog = ShopCatalogFormulas.GetCatalog();

        var resourceItems = catalog.Where(i => i.Category == "resource").ToList();
        var constructionItems = catalog.Where(i => i.Category == "construction").ToList();
        var shipyardItems = catalog.Where(i => i.Category == "shipyard").ToList();
        var researchItems = catalog.Where(i => i.Category == "research").ToList();
        var specialItems = catalog.Where(i => i.Category == "special").ToList();

        Assert.Equal(36, resourceItems.Count);
        Assert.Equal(12, constructionItems.Count);
        Assert.Equal(12, shipyardItems.Count);
        Assert.Equal(12, researchItems.Count);
        Assert.Equal(7, specialItems.Count);

        // Verify resource sub-types: 12 metal, 12 crystal, 12 deut
        Assert.Equal(12, resourceItems.Count(i => i.ItemKey.StartsWith("booster_metal_")));
        Assert.Equal(12, resourceItems.Count(i => i.ItemKey.StartsWith("booster_crystal_")));
        Assert.Equal(12, resourceItems.Count(i => i.ItemKey.StartsWith("booster_deut_")));

        // Verify quality tiers for Kraken, Detroid, and Newtron (3 of each tier: Bronze, Silver, Gold, Platinum)
        foreach (var group in new[] { constructionItems, shipyardItems, researchItems })
        {
            Assert.Equal(3, group.Count(i => i.Tier == "Bronze"));
            Assert.Equal(3, group.Count(i => i.Tier == "Silver"));
            Assert.Equal(3, group.Count(i => i.Tier == "Gold"));
            Assert.Equal(3, group.Count(i => i.Tier == "Platinum"));
        }
    }

    [Fact]
    public void FindItem_ShouldBeCaseInsensitive()
    {
        var item = ShopCatalogFormulas.FindItem("BOOSTER_METAL_GOLD_30D");
        Assert.NotNull(item);
        Assert.Equal("Altın Metal Güçlendirici (30 Gün)", item.Name);
        Assert.Equal(0.30, item.EffectValue);
        Assert.Equal(30, item.DurationDays);
    }

    [Fact]
    public void CalculatePlanetProduction_WithActiveBooster_ShouldIncreaseHourlyRate()
    {
        var planet = new Planet
        {
            Id = Guid.NewGuid(),
            Buildings =
            [
                new Building { BuildingType = BuildingType.MetalMine, Level = 10 },
                new Building { BuildingType = BuildingType.SolarPlant, Level = 15 }
            ]
        };

        // Production without booster
        var baseSnapshot = ResourceFormulas.CalculatePlanetProduction(planet);

        // Add 30% Gold Metal Booster
        planet.ActiveBoosters.Add(new PlanetActiveBooster
        {
            PlanetId = planet.Id,
            ResourceType = "Metal",
            Multiplier = 0.30,
            ExpiresAtUtc = DateTime.UtcNow.AddDays(7),
            ItemKey = "booster_metal_gold_7d",
            Tier = "Gold"
        });

        var boostedSnapshot = ResourceFormulas.CalculatePlanetProduction(planet);

        Assert.True(boostedSnapshot.MetalPerHour > baseSnapshot.MetalPerHour);

        // Mine production without base 30
        double baseMineHourly = baseSnapshot.MetalPerHour - ResourceFormulas.BaseMetalPerHour;
        double boostedMineHourly = boostedSnapshot.MetalPerHour - ResourceFormulas.BaseMetalPerHour;

        Assert.Equal(baseMineHourly * 1.30, boostedMineHourly, precision: 3);
    }

    [Fact]
    public void CalculateMaxConcurrentExpeditions_WithExtraBuffSlots_ShouldIncludeBuff()
    {
        // Astrophysics Level 9 -> sqrt(9) = 3 slots
        int baseSlots = ExpeditionFormulas.CalculateMaxConcurrentExpeditions(9, PlayerClass.None, extraBuffSlots: 0);
        int boostedSlots = ExpeditionFormulas.CalculateMaxConcurrentExpeditions(9, PlayerClass.None, extraBuffSlots: 2);

        Assert.Equal(3, baseSlots);
        Assert.Equal(5, boostedSlots);
    }
}
