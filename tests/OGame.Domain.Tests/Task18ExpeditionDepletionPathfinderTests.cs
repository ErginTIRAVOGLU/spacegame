using OGame.Domain.Combat;
using OGame.Domain.Enums;
using OGame.Domain.Services;
using Xunit;

namespace OGame.Domain.Tests;

public class Task18ExpeditionDepletionPathfinderTests
{
    [Fact]
    public void CalculateMaxConcurrentExpeditions_ComputesFormulaCorrectly()
    {
        // MaxExpeditions = floor(sqrt(Astro)) + Admiral[1] + Discoverer[2] + BuffSlots
        Assert.Equal(0, ExpeditionFormulas.CalculateMaxConcurrentExpeditions(0));
        Assert.Equal(1, ExpeditionFormulas.CalculateMaxConcurrentExpeditions(1));
        Assert.Equal(1, ExpeditionFormulas.CalculateMaxConcurrentExpeditions(3));
        Assert.Equal(2, ExpeditionFormulas.CalculateMaxConcurrentExpeditions(4));
        Assert.Equal(3, ExpeditionFormulas.CalculateMaxConcurrentExpeditions(9));
        Assert.Equal(4, ExpeditionFormulas.CalculateMaxConcurrentExpeditions(16));

        // Admiral (+1)
        Assert.Equal(3, ExpeditionFormulas.CalculateMaxConcurrentExpeditions(4, hasAdmiral: true));

        // Discoverer (+2)
        Assert.Equal(4, ExpeditionFormulas.CalculateMaxConcurrentExpeditions(4, playerClass: PlayerClass.Discoverer));

        // Both + extra slot (+1)
        // floor(sqrt(9)) + 1 + 2 + 1 = 7
        Assert.Equal(7, ExpeditionFormulas.CalculateMaxConcurrentExpeditions(9, hasAdmiral: true, playerClass: PlayerClass.Discoverer, extraBuffSlots: 1));
    }

    [Fact]
    public void GetShipExpeditionPoints_And_CanParticipate_FollowWikiRules()
    {
        Assert.Equal(5, ExpeditionFormulas.GetShipExpeditionPoints(UnitType.EspionageProbe));
        Assert.Equal(20, ExpeditionFormulas.GetShipExpeditionPoints(UnitType.LightFighter));
        Assert.Equal(20, ExpeditionFormulas.GetShipExpeditionPoints(UnitType.SmallCargo));
        Assert.Equal(50, ExpeditionFormulas.GetShipExpeditionPoints(UnitType.HeavyFighter));
        Assert.Equal(60, ExpeditionFormulas.GetShipExpeditionPoints(UnitType.LargeCargo));
        Assert.Equal(135, ExpeditionFormulas.GetShipExpeditionPoints(UnitType.Cruiser));
        Assert.Equal(300, ExpeditionFormulas.GetShipExpeditionPoints(UnitType.Battleship));
        Assert.Equal(350, ExpeditionFormulas.GetShipExpeditionPoints(UnitType.Battlecruiser));
        Assert.Equal(375, ExpeditionFormulas.GetShipExpeditionPoints(UnitType.Bomber));
        Assert.Equal(550, ExpeditionFormulas.GetShipExpeditionPoints(UnitType.Destroyer));
        Assert.Equal(115, ExpeditionFormulas.GetShipExpeditionPoints(UnitType.Pathfinder));
        Assert.Equal(700, ExpeditionFormulas.GetShipExpeditionPoints(UnitType.Reaper));

        // Non-participating ships: 0 points and blocked
        Assert.Equal(0, ExpeditionFormulas.GetShipExpeditionPoints(UnitType.Deathstar));
        Assert.False(ExpeditionFormulas.CanShipParticipateInExpedition(UnitType.Deathstar));

        Assert.Equal(0, ExpeditionFormulas.GetShipExpeditionPoints(UnitType.ColonyShip));
        Assert.False(ExpeditionFormulas.CanShipParticipateInExpedition(UnitType.ColonyShip));

        Assert.Equal(0, ExpeditionFormulas.GetShipExpeditionPoints(UnitType.Recycler));
        Assert.False(ExpeditionFormulas.CanShipParticipateInExpedition(UnitType.Recycler));

        Assert.True(ExpeditionFormulas.CanShipParticipateInExpedition(UnitType.Pathfinder));
        Assert.True(ExpeditionFormulas.CanShipParticipateInExpedition(UnitType.Reaper));
    }

    [Fact]
    public void CalculateFleetExpeditionPoints_FiltersInvalidShipsAndSumsPoints()
    {
        var fleet = new Dictionary<UnitType, int>
        {
            [UnitType.LargeCargo] = 10,     // 10 * 60 = 600
            [UnitType.Pathfinder] = 2,      // 2 * 115 = 230
            [UnitType.Reaper] = 1,          // 1 * 700 = 700
            [UnitType.Deathstar] = 5,       // Invalid -> 0
            [UnitType.Recycler] = 10        // Invalid -> 0
        };

        double points = ExpeditionFormulas.CalculateFleetExpeditionPoints(fleet);
        Assert.Equal(1530.0, points);
    }

    [Fact]
    public void GetPathfinderMultiplier_DoublesWhenPathfinderIsPresent()
    {
        var fleetWithout = new Dictionary<UnitType, int>
        {
            [UnitType.LargeCargo] = 50,
            [UnitType.Cruiser] = 10
        };
        Assert.Equal(1.0, ExpeditionFormulas.GetPathfinderMultiplier(fleetWithout));

        var fleetWith = new Dictionary<UnitType, int>
        {
            [UnitType.LargeCargo] = 50,
            [UnitType.Pathfinder] = 1
        };
        Assert.Equal(2.0, ExpeditionFormulas.GetPathfinderMultiplier(fleetWith));
    }

    [Fact]
    public void CalculateBaseCapByTopPlayerScore_ScalesProperly()
    {
        // Low top player (<10k)
        Assert.Equal(12_000.0, ExpeditionFormulas.CalculateBaseCapByTopPlayerScore(5_000, 10_000));

        // High top player (>100M) capped by fleet points
        // Fleet points = 1000 -> fleet cap = 20,000
        Assert.Equal(20_000.0, ExpeditionFormulas.CalculateBaseCapByTopPlayerScore(200_000_000, 1000));

        // Massive fleet points -> capped by top player cap (1.2M)
        Assert.Equal(1_200_000.0, ExpeditionFormulas.CalculateBaseCapByTopPlayerScore(200_000_000, 100_000));
    }

    [Fact]
    public void GetDepletionLevel_And_Decay_WorkCorrectly()
    {
        var (level0, msg0) = ExpeditionFormulas.GetDepletionLevel(5);
        Assert.Equal(ExpeditionDepletionLevel.Undepleted, level0);
        Assert.Equal("Bölge henüz tükenmemiş", msg0);

        var (level1, msg1) = ExpeditionFormulas.GetDepletionLevel(15);
        Assert.Equal(ExpeditionDepletionLevel.SlightlyDepleted, level1);
        Assert.Equal("Bölge biraz tükenmiş", msg1);

        var (level2, msg2) = ExpeditionFormulas.GetDepletionLevel(30);
        Assert.Equal(ExpeditionDepletionLevel.CompletelyDepleted, level2);
        Assert.Equal("Bölge tamamen tükenmiş", msg2);

        // Decay: 1 count per 2.4 hours
        var start = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var after2_4h = start.AddHours(2.4);
        var after24h = start.AddHours(24.0);

        Assert.Equal(9, ExpeditionFormulas.CalculateDecayedDepletion(10, start, after2_4h));
        Assert.Equal(0, ExpeditionFormulas.CalculateDecayedDepletion(10, start, after24h));
        Assert.Equal(20, ExpeditionFormulas.CalculateDecayedDepletion(30, start, after24h));
    }

    [Fact]
    public void CalculateFoundResources_AppliesPathfinder2xAndRatios()
    {
        // 1.0 roll, 100,000 baseCap, no Pathfinder
        var (m1, _, _) = ExpeditionFormulas.CalculateFoundResources(0, 1.0, 100_000, 1.0, 1.0, pathfinderMultiplier: 1.0);
        Assert.Equal(100_000.0, m1);

        // Same with Pathfinder (2.0x) -> 200,000 Metal
        var (m2, _, _) = ExpeditionFormulas.CalculateFoundResources(0, 1.0, 100_000, 1.0, 1.0, pathfinderMultiplier: 2.0);
        Assert.Equal(200_000.0, m2);

        // Crystal is 2/3 of Metal
        var (_, c2, _) = ExpeditionFormulas.CalculateFoundResources(1, 1.0, 100_000, 1.0, 1.0, pathfinderMultiplier: 2.0);
        Assert.Equal(Math.Floor(200_000.0 * (2.0 / 3.0)), c2);

        // Deuterium is 1/3 of Metal
        var (_, _, d2) = ExpeditionFormulas.CalculateFoundResources(2, 1.0, 100_000, 1.0, 1.0, pathfinderMultiplier: 2.0);
        Assert.Equal(Math.Floor(200_000.0 * (1.0 / 3.0)), d2);
    }

    [Fact]
    public void CalculateFoundDarkMatter_ProducesCorrectRangesAndBonus()
    {
        // Small packet (packetRoll < 0.60): 300 - 400
        int dmSmall = ExpeditionFormulas.CalculateFoundDarkMatter(0.5, gravitationSensorsBonus: 0.0, packetRoll: 0.3);
        Assert.InRange(dmSmall, 300, 400);

        // Medium packet (packetRoll 0.60 - 0.90): 500 - 700
        int dmMed = ExpeditionFormulas.CalculateFoundDarkMatter(0.5, gravitationSensorsBonus: 0.0, packetRoll: 0.7);
        Assert.InRange(dmMed, 500, 700);

        // Large packet (packetRoll >= 0.90): 1000 - 1800
        int dmLarge = ExpeditionFormulas.CalculateFoundDarkMatter(1.0, gravitationSensorsBonus: 0.0, packetRoll: 0.95);
        Assert.Equal(1800, dmLarge);

        // With 50% gravitation sensor bonus
        int dmBonus = ExpeditionFormulas.CalculateFoundDarkMatter(1.0, gravitationSensorsBonus: 0.50, packetRoll: 0.95);
        Assert.Equal(2700, dmBonus);
    }

    [Fact]
    public void GeneratePiratesOrAliensFleet_AppliesTechOffsetsAndScaling()
    {
        var playerTech = new CombatTechLevels(WeaponsLevel: 10, ShieldingLevel: 8, ArmourLevel: 9);
        var playerShips = new Dictionary<UnitType, int>
        {
            [UnitType.Cruiser] = 10,
            [UnitType.LargeCargo] = 20
        };

        // Pirates: Tech -3
        var (pirateFleet, pirateTech) = ExpeditionFormulas.GeneratePiratesOrAliensFleet(playerShips, isAlien: false, playerTech, rngFleetScale: 0.0);
        Assert.Equal(7, pirateTech.WeaponsLevel);
        Assert.Equal(5, pirateTech.ShieldingLevel);
        Assert.Equal(6, pirateTech.ArmourLevel);
        // Min fleet scale 30%
        Assert.Equal(3, pirateFleet[UnitType.Cruiser]);
        Assert.Equal(6, pirateFleet[UnitType.LargeCargo]);

        // Aliens: Tech +3
        var (alienFleet, alienTech) = ExpeditionFormulas.GeneratePiratesOrAliensFleet(playerShips, isAlien: true, playerTech, rngFleetScale: 1.0);
        Assert.Equal(13, alienTech.WeaponsLevel);
        Assert.Equal(11, alienTech.ShieldingLevel);
        Assert.Equal(12, alienTech.ArmourLevel);
        // Max fleet scale 120%
        Assert.Equal(12, alienFleet[UnitType.Cruiser]);
        Assert.Equal(24, alienFleet[UnitType.LargeCargo]);
    }
}

