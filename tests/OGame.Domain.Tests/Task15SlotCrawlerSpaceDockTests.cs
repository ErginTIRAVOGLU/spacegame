using OGame.Domain.Entities;
using OGame.Domain.Enums;
using OGame.Domain.Services;
using Xunit;

namespace OGame.Domain.Tests;

public class Task15SlotCrawlerSpaceDockTests
{
    [Theory]
    [InlineData(1, 96, 172, 134, 220, 260)]
    [InlineData(4, 118, 208, 163, 70, 110)]
    [InlineData(8, 156, 252, 204, 30, 70)]
    [InlineData(12, 125, 186, 156, -10, 30)]
    [InlineData(15, 90, 164, 127, -130, -90)]
    public void SlotTable_MatchesOfficialFieldsAndTemperatures(int slot, int min, int max, int mean, int tMin, int tMax)
    {
        var dist = ColonizationFormulas.GetSlotFieldDistribution(slot);
        Assert.Equal(min, dist.MinFields);
        Assert.Equal(max, dist.MaxFields);
        Assert.Equal(mean, dist.MeanFields);

        var temp = ColonizationFormulas.GetSlotTemperatureBand(slot);
        Assert.Equal(tMin, temp.TempMin);
        Assert.Equal(tMax, temp.TempMax);
    }

    [Theory]
    [InlineData(1, 1.0, 1.40)]
    [InlineData(2, 1.0, 1.30)]
    [InlineData(3, 1.0, 1.20)]
    [InlineData(4, 1.0, 1.0)]
    [InlineData(6, 1.17, 1.0)]
    [InlineData(7, 1.23, 1.0)]
    [InlineData(8, 1.35, 1.0)]
    [InlineData(9, 1.23, 1.0)]
    [InlineData(10, 1.17, 1.0)]
    [InlineData(11, 1.0, 1.0)]
    public void SlotMultipliers_MatchSpec(int slot, double metal, double crystal)
    {
        var m = ColonizationFormulas.GetSlotProductionMultipliers(slot);
        Assert.Equal(metal, m.Metal);
        Assert.Equal(crystal, m.Crystal);
    }

    [Fact]
    public void SlotBonus_And_Plasma_ReflectInPlanetProduction()
    {
        Planet Make(int slot) => new()
        {
            Slot = slot,
            TempMin = 0,
            TempMax = 40,
            Buildings = new List<Building>
            {
                new() { BuildingType = BuildingType.MetalMine, Level = 10 },
                new() { BuildingType = BuildingType.CrystalMine, Level = 10 },
                new() { BuildingType = BuildingType.SolarPlant, Level = 30 }
            }
        };

        var neutral = ResourceFormulas.CalculatePlanetProduction(Make(5), PlayerClass.None);
        var slot8 = ResourceFormulas.CalculatePlanetProduction(Make(8), PlayerClass.None);
        var slot1 = ResourceFormulas.CalculatePlanetProduction(Make(1), PlayerClass.None);

        Assert.True(slot8.MetalPerHour > neutral.MetalPerHour);
        Assert.Equal(neutral.CrystalPerHour, slot8.CrystalPerHour);
        Assert.True(slot1.CrystalPerHour > neutral.CrystalPerHour);

        Assert.Equal(0.01, ResourceFormulas.PlasmaMetalBonusPerLevel);
        Assert.Equal(0.0066, ResourceFormulas.PlasmaCrystalBonusPerLevel);
        Assert.Equal(0.0033, ResourceFormulas.PlasmaDeuteriumBonusPerLevel);
    }

    [Fact]
    public void Deuterium_UsesMaxTemperatureFormula()
    {
        // floor(10 * 5 * 1.1^5 * (1.44 - 0.004 * 40)) = floor(80.5255 * 1.28)
        double expected = Math.Floor(10.0 * 5 * Math.Pow(1.1, 5) * (1.44 - 0.004 * 40));
        Assert.Equal(expected, ResourceFormulas.CalculateDeuteriumSynthesizerHourlyByMaxTemp(5, 40));
        Assert.True(ResourceFormulas.CalculateDeuteriumSynthesizerHourlyByMaxTemp(5, -90) >
                    ResourceFormulas.CalculateDeuteriumSynthesizerHourlyByMaxTemp(5, 260));
    }

    [Theory]
    [InlineData(0, 0)]
    [InlineData(1, 1)]
    [InlineData(2, 1)]
    [InlineData(3, 2)]
    [InlineData(8, 4)]
    public void MaxColonies_IsFloorOfAstroPlusOneOverTwo(int astro, int colonies)
    {
        Assert.Equal(colonies, ColonizationFormulas.CalculateMaxColonies(astro));
        Assert.Equal(colonies + 1, ColonizationFormulas.CalculateMaxPlanets(astro));
    }

    [Fact]
    public void ColonyFieldBonuses_AndTerraformerFields()
    {
        Assert.Equal(163, ColonizationFormulas.HomeworldFields);
        Assert.Equal(110, ColonizationFormulas.ApplyColonyFieldBonuses(100, true, false));
        Assert.Equal(105, ColonizationFormulas.ApplyColonyFieldBonuses(100, false, true));
        Assert.Equal(6, ColonizationFormulas.GetTerraformerFieldsGranted(1));
        Assert.Equal(5, ColonizationFormulas.GetTerraformerFieldsGranted(2));
        Assert.Equal(6, ColonizationFormulas.GetTerraformerFieldsGranted(3));
        Assert.True(ColonizationFormulas.CanRelocateToSlot(1, 15));
        Assert.False(ColonizationFormulas.CanRelocateToSlot(6, 2));
        Assert.True(ColonizationFormulas.CanRelocateToSlot(6, 11));
    }

    [Fact]
    public void Crawler_MaxActive_AndGeologistOnlyForCollector()
    {
        Assert.Equal(240, PlayerClassFormulas.CalculateMaxActiveCrawlers(10, 10, 10, PlayerClass.None, true));
        Assert.Equal(264, PlayerClassFormulas.CalculateMaxActiveCrawlers(10, 10, 10, PlayerClass.Collector, true));
        Assert.Equal(240, PlayerClassFormulas.CalculateMaxActiveCrawlers(10, 10, 10, PlayerClass.Collector, false));
    }

    [Fact]
    public void Crawler_PercentOptions_BoostAndEnergy()
    {
        Assert.Equal(11, PlayerClassFormulas.GetAllowedCrawlerPercents(PlayerClass.None).Count);
        var collector = PlayerClassFormulas.GetAllowedCrawlerPercents(PlayerClass.Collector);
        Assert.Contains(110, collector);
        Assert.Contains(150, collector);
        Assert.Equal(100, PlayerClassFormulas.ClampCrawlerPercent(150, PlayerClass.None));
        Assert.Equal(150, PlayerClassFormulas.ClampCrawlerPercent(200, PlayerClass.Collector));

        Assert.Equal(0.0002, PlayerClassFormulas.CalculateCrawlerBoostPerUnit(PlayerClass.None, 100), 10);
        Assert.Equal(0.0003, PlayerClassFormulas.CalculateCrawlerBoostPerUnit(PlayerClass.Collector, 100), 10);
        Assert.Equal(0.00045, PlayerClassFormulas.CalculateCrawlerBoostPerUnit(PlayerClass.Collector, 150), 10);

        Assert.Equal(50, PlayerClassFormulas.CalculateCrawlerEnergyPerUnit(100));
        Assert.Equal(60, PlayerClassFormulas.CalculateCrawlerEnergyPerUnit(110));
        Assert.Equal(100, PlayerClassFormulas.CalculateCrawlerEnergyPerUnit(150));
        Assert.Equal(1000, PlayerClassFormulas.CalculateCrawlerEnergyConsumption(10, 150));
    }

    [Theory]
    [InlineData(BuildingType.SpaceDock, false)]
    [InlineData(BuildingType.Terraformer, false)]
    [InlineData(BuildingType.MoonBase, false)]
    [InlineData(BuildingType.MetalMine, true)]
    [InlineData(BuildingType.RoboticsFactory, true)]
    public void IndestructibleBuildings_CannotBeDemolished(BuildingType type, bool canDemolish)
    {
        Assert.Equal(canDemolish, ConstructionFormulas.CanDemolish(type));
    }

    [Fact]
    public void IonTechnology_Level25_MakesDemolitionFree_AndDiscountIs4PercentPerLevel()
    {
        var free = ConstructionFormulas.CalculateDemolitionCost(BuildingType.MetalMine, 10, 25);
        Assert.Equal(0, free.Metal);
        Assert.Equal(0, free.Crystal);
        Assert.Equal(0, free.Deuterium);

        var full = ConstructionFormulas.CalculateDemolitionCost(BuildingType.MetalMine, 10, 0);
        var tenIon = ConstructionFormulas.CalculateDemolitionCost(BuildingType.MetalMine, 10, 10);
        Assert.Equal(Math.Floor(full.Metal * 0.6), tenIon.Metal);

        var beyond = ConstructionFormulas.CalculateDemolitionCost(BuildingType.MetalMine, 10, 40);
        Assert.Equal(0, beyond.Metal);
    }

    [Fact]
    public void WreckField_Thresholds_Repair_And_Duration()
    {
        var initial = new Dictionary<UnitType, int> { [UnitType.Battleship] = 20, [UnitType.RocketLauncher] = 500 };
        var surviving = new Dictionary<UnitType, int> { [UnitType.Battleship] = 5 };
        var destroyed = SpaceDockFormulas.CalculateDestroyedShips(initial, surviving);

        Assert.Equal(15, destroyed[UnitType.Battleship]);
        Assert.DoesNotContain(UnitType.RocketLauncher, destroyed.Keys);
        Assert.True(SpaceDockFormulas.ShouldCreateWreckField(initial, destroyed));

        var tiny = new Dictionary<UnitType, int> { [UnitType.LightFighter] = 3 };
        Assert.False(SpaceDockFormulas.ShouldCreateWreckField(
            new Dictionary<UnitType, int> { [UnitType.LightFighter] = 100 }, tiny));

        Assert.Equal(0.0, SpaceDockFormulas.CalculateRepairFraction(0));
        Assert.Equal(0.52, SpaceDockFormulas.CalculateRepairFraction(1), 6);
        Assert.Equal(0.80, SpaceDockFormulas.CalculateRepairFraction(50));

        var repairable = SpaceDockFormulas.CalculateRepairableShips(destroyed, 5);
        Assert.Equal((int)Math.Floor(15 * 0.60), repairable[UnitType.Battleship]);

        int seconds = SpaceDockFormulas.CalculateRepairDurationSeconds(repairable, 5);
        Assert.InRange(seconds, 30 * 60, 12 * 3600);
        Assert.Equal(30 * 60, SpaceDockFormulas.CalculateRepairDurationSeconds(
            new Dictionary<UnitType, int> { [UnitType.LightFighter] = 1 }, 10));
        Assert.Equal(12 * 3600, SpaceDockFormulas.CalculateRepairDurationSeconds(
            new Dictionary<UnitType, int> { [UnitType.Deathstar] = 100 }, 1));

        var created = new DateTime(2026, 11, 5, 12, 0, 0, DateTimeKind.Utc);
        var expiry = SpaceDockFormulas.CalculateWreckFieldExpiryUtc(created);
        Assert.Equal(72, (expiry - created).TotalHours);
        Assert.True(SpaceDockFormulas.IsWreckFieldExpired(expiry, expiry));
        Assert.False(SpaceDockFormulas.IsWreckFieldExpired(expiry, expiry.AddSeconds(-1)));
    }
}

