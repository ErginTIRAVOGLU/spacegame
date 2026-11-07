using OGame.Domain.Entities;
using OGame.Domain.Enums;
using OGame.Domain.Services;
using Xunit;

namespace OGame.Domain.Tests;

public class PlayerClassFormulasTests
{
    [Fact]
    public void BaseCost_ShouldBe500k_AndDiscount_ShouldBe400k()
    {
        Assert.Equal(500_000, PlayerClassFormulas.BaseClassChangeCost);
        Assert.Equal(400_000, PlayerClassFormulas.DiscountedClassChangeCost);

        var normalPerks = PlayerClassFormulas.GetPerks(PlayerClass.Collector, isDiscountActive: false);
        Assert.Equal(500_000, normalPerks.BaseCostDarkMatter);
        Assert.False(normalPerks.IsDiscountActive);

        var discountPerks = PlayerClassFormulas.GetPerks(PlayerClass.Collector, isDiscountActive: true);
        Assert.Equal(400_000, discountPerks.DiscountCostDarkMatter);
        Assert.True(discountPerks.IsDiscountActive);
    }

    [Fact]
    public void Collector_ResourceMultipliers_ShouldApply25PercentMineAnd10PercentEnergy()
    {
        var planetStandard = new Planet
        {
            Id = Guid.NewGuid(),
            Buildings =
            [
                new Building { BuildingType = BuildingType.MetalMine, Level = 10 },
                new Building { BuildingType = BuildingType.SolarPlant, Level = 10 }
            ],
            TempMin = 10,
            TempMax = 50
        };

        var planetCollector = new Planet
        {
            Id = Guid.NewGuid(),
            Buildings =
            [
                new Building { BuildingType = BuildingType.MetalMine, Level = 10 },
                new Building { BuildingType = BuildingType.SolarPlant, Level = 10 }
            ],
            TempMin = 10,
            TempMax = 50
        };

        var standardSnap = ResourceFormulas.CalculatePlanetProduction(planetStandard, PlayerClass.None);
        var collectorSnap = ResourceFormulas.CalculatePlanetProduction(planetCollector, PlayerClass.Collector);

        // Produced energy should be 1.10x
        Assert.Equal(standardSnap.ProducedEnergy * 1.10, collectorSnap.ProducedEnergy, precision: 2);

        // Mine production above base should be 1.25x
        double standardMineOutput = standardSnap.MetalPerHour - ResourceFormulas.BaseMetalPerHour;
        double collectorMineOutput = collectorSnap.MetalPerHour - ResourceFormulas.BaseMetalPerHour;
        Assert.Equal(standardMineOutput * 1.25, collectorMineOutput, precision: 2);
    }

    [Fact]
    public void Collector_TransportSpeed_ShouldBeDoubled()
    {
        var smallCargoStd = FleetNavigationFormulas.GetShipFlightStats(UnitType.SmallCargo, PlayerClass.None);
        var smallCargoCol = FleetNavigationFormulas.GetShipFlightStats(UnitType.SmallCargo, PlayerClass.Collector);
        Assert.Equal(smallCargoStd.BaseSpeed * 2.0, smallCargoCol.BaseSpeed);

        var largeCargoStd = FleetNavigationFormulas.GetShipFlightStats(UnitType.LargeCargo, PlayerClass.None);
        var largeCargoCol = FleetNavigationFormulas.GetShipFlightStats(UnitType.LargeCargo, PlayerClass.Collector);
        Assert.Equal(largeCargoStd.BaseSpeed * 2.0, largeCargoCol.BaseSpeed);

        // Combat ship speed should not be doubled for Collector
        var cruiserStd = FleetNavigationFormulas.GetShipFlightStats(UnitType.Cruiser, PlayerClass.None);
        var cruiserCol = FleetNavigationFormulas.GetShipFlightStats(UnitType.Cruiser, PlayerClass.Collector);
        Assert.Equal(cruiserStd.BaseSpeed, cruiserCol.BaseSpeed);
    }

    [Fact]
    public void General_CombatAndRecyclerSpeed_ShouldApplyCorrectMultipliers()
    {
        var lightFighterStd = FleetNavigationFormulas.GetShipFlightStats(UnitType.LightFighter, PlayerClass.None);
        var lightFighterGen = FleetNavigationFormulas.GetShipFlightStats(UnitType.LightFighter, PlayerClass.General);
        Assert.Equal(lightFighterStd.BaseSpeed * 1.10, lightFighterGen.BaseSpeed, precision: 2);

        var recyclerStd = FleetNavigationFormulas.GetShipFlightStats(UnitType.Recycler, PlayerClass.None);
        var recyclerGen = FleetNavigationFormulas.GetShipFlightStats(UnitType.Recycler, PlayerClass.General);
        Assert.Equal(recyclerStd.BaseSpeed * 1.25, recyclerGen.BaseSpeed, precision: 2);

        var reaperStd = FleetNavigationFormulas.GetShipFlightStats(UnitType.Reaper, PlayerClass.None);
        var reaperGen = FleetNavigationFormulas.GetShipFlightStats(UnitType.Reaper, PlayerClass.General);
        Assert.Equal(reaperStd.BaseSpeed * 1.25, reaperGen.BaseSpeed, precision: 2);

        var perks = PlayerClassFormulas.GetPerks(PlayerClass.General);
        Assert.Equal(2, perks.ExtraFleetSlots);
    }

    [Fact]
    public void Discoverer_ExpeditionAndResearch_ShouldApplyBonuses()
    {
        int standardSlots = ExpeditionFormulas.CalculateMaxConcurrentExpeditions(astrophysicsLevel: 9, PlayerClass.None); // sqrt(9) = 3
        int discovererSlots = ExpeditionFormulas.CalculateMaxConcurrentExpeditions(astrophysicsLevel: 9, PlayerClass.Discoverer); // 3 + 2 = 5
        Assert.Equal(3, standardSlots);
        Assert.Equal(5, discovererSlots);

        var perks = PlayerClassFormulas.GetPerks(PlayerClass.Discoverer);
        Assert.Equal(1.5, perks.ExpeditionYieldMultiplier);
        Assert.Equal(0.75, perks.InactivePlunderRatio);
        Assert.Equal(0.75, perks.ResearchDurationMultiplier);
    }

    [Fact]
    public void CrawlerMaxCapacityAndBoost_CalculatesAccurately()
    {
        // 10 metal, 10 crystal, 10 deut -> 30 * 8 = 240
        int maxNoGeologist = PlayerClassFormulas.CalculateMaxCrawlers(10, 10, 10, hasGeologist: false);
        Assert.Equal(240, maxNoGeologist);

        // With Geologist: 240 * 1.10 = 264
        int maxWithGeologist = PlayerClassFormulas.CalculateMaxCrawlers(10, 10, 10, hasGeologist: true);
        Assert.Equal(264, maxWithGeologist);

        // Standard boost: 100 * 0.0002 = 0.02 (2%)
        double boostStandard = PlayerClassFormulas.CalculateCrawlerBoost(100, PlayerClass.None, 10, 10, 10);
        Assert.Equal(0.02, boostStandard, precision: 4);

        // Collector boost: 100 * 0.0003 = 0.03 (3%, +50% boost)
        double boostCollector = PlayerClassFormulas.CalculateCrawlerBoost(100, PlayerClass.Collector, 10, 10, 10);
        Assert.Equal(0.03, boostCollector, precision: 4);

        // Overload test: 300 crawlers on a 240 max planet
        // Without overload: clamped to 240
        double boostNormalCap = PlayerClassFormulas.CalculateCrawlerBoost(300, PlayerClass.Collector, 10, 10, 10, false, overloadEnabled: false);
        Assert.Equal(240 * 0.0003, boostNormalCap, precision: 4);

        // With overload: 240 * 1.50 = 360, so 300 are all active
        double boostOverloaded = PlayerClassFormulas.CalculateCrawlerBoost(300, PlayerClass.Collector, 10, 10, 10, false, overloadEnabled: true);
        Assert.Equal(300 * 0.0003, boostOverloaded, precision: 4);
    }

    [Fact]
    public void GeneralAndDiscovererMechanics_ConstantsVerified()
    {
        Assert.Equal(0.00001, PlayerClassFormulas.GeneralDeathstarOneShotChancePerLightFighter);
        Assert.Equal(0.10, PlayerClassFormulas.GeneralScrapRecoveryRatio);
    }
}
