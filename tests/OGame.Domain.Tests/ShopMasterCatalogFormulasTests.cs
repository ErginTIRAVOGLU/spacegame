namespace OGame.Domain.Tests;

using OGame.Domain.Entities;
using OGame.Domain.Enums;
using OGame.Domain.Services;
using Xunit;

public class ShopMasterCatalogFormulasTests
{
    [Fact]
    public void GetCategoryCounts_ReturnsExactCanonicalCounts()
    {
        // Act
        var counts = ShopMasterCatalogFormulas.GetCategoryCounts();

        // Assert
        Assert.Equal(4, counts["special"]);
        Assert.Equal(6, counts["classes"]);
        Assert.Equal(37, counts["construction"]);
        Assert.Equal(71, counts["resources"]);
        Assert.Equal(24, counts["boosters-30d"]);
        Assert.Equal(21, counts["boosters-90d"]);
        Assert.Equal(22, counts["profile"]);
        Assert.Equal(176, counts["all"]);
    }

    [Fact]
    public void GetAllItems_HasExactly176UniqueItems()
    {
        // Act
        var allItems = ShopMasterCatalogFormulas.GetAllItems();
        var uniqueKeys = allItems.Select(i => i.ItemKey).Distinct(StringComparer.OrdinalIgnoreCase).ToList();

        // Assert
        Assert.Equal(176, allItems.Count);
        Assert.Equal(176, uniqueKeys.Count);
    }

    [Theory]
    [InlineData("special", 4)]
    [InlineData("classes", 6)]
    [InlineData("construction", 37)]
    [InlineData("resources", 71)]
    [InlineData("boosters-30d", 24)]
    [InlineData("boosters-90d", 21)]
    [InlineData("profile", 22)]
    [InlineData("all", 176)]
    public void GetItemsByCategory_ReturnsExpectedCounts(string category, int expectedCount)
    {
        // Act
        var items = ShopMasterCatalogFormulas.GetItemsByCategory(category);

        // Assert
        Assert.Equal(expectedCount, items.Count);
    }

    [Fact]
    public void CheckStorageOverflow_WhenStorageIsExceeded_ReturnsHazardWarning()
    {
        // Arrange: Planet with level 0 storage (Cap = 10,000) and 9,000 existing metal
        var planet = new Planet
        {
            Id = Guid.NewGuid(),
            Metal = 9_000,
            Crystal = 1_000,
            Deuterium = 500,
            Buildings =
            [
                new Building { BuildingType = BuildingType.MetalStorage, Level = 0 },
                new Building { BuildingType = BuildingType.CrystalStorage, Level = 0 },
                new Building { BuildingType = BuildingType.DeuteriumTank, Level = 0 }
            ]
        };

        // Item with 100,000 Metal
        var item = ShopMasterCatalogFormulas.FindItem("pack_metal_small_100k");
        Assert.NotNull(item);

        // Act
        var (hasOverflow, warningMsg, metalOverflow, _, _) = ShopMasterCatalogFormulas.CheckStorageOverflow(item, planet);

        // Assert
        Assert.True(hasOverflow);
        Assert.NotNull(warningMsg);
        Assert.Contains("Dikkat: Yeterli depo alanın yok!", warningMsg);
        Assert.Equal(99_000, metalOverflow); // (9,000 + 100,000) - 10,000 = 99,000
    }

    [Fact]
    public void CheckStorageOverflow_WhenStorageIsSufficient_ReturnsNoWarning()
    {
        // Arrange: Planet with high level storage (Cap > 1,000,000)
        var planet = new Planet
        {
            Id = Guid.NewGuid(),
            Metal = 10_000,
            Crystal = 5_000,
            Deuterium = 2_000,
            Buildings =
            [
                new Building { BuildingType = BuildingType.MetalStorage, Level = 15 },
                new Building { BuildingType = BuildingType.CrystalStorage, Level = 15 },
                new Building { BuildingType = BuildingType.DeuteriumTank, Level = 15 }
            ]
        };

        var item = ShopMasterCatalogFormulas.FindItem("pack_metal_small_100k");
        Assert.NotNull(item);

        // Act
        var (hasOverflow, warningMsg, metalOverflow, _, _) = ShopMasterCatalogFormulas.CheckStorageOverflow(item, planet);

        // Assert
        Assert.False(hasOverflow);
        Assert.Null(warningMsg);
        Assert.Equal(0, metalOverflow);
    }
}
