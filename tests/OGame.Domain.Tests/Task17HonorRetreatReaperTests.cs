using OGame.Domain.Combat;
using OGame.Domain.Enums;
using OGame.Domain.Services;
using Xunit;

namespace OGame.Domain.Tests;

public class Task17HonorRetreatReaperTests
{
    [Fact]
    public void CalculateHonorPoints_Formula_MatchesSpecifications()
    {
        // HP = floor((DestroyedMilitaryUnitsValue)^0.9 / 1000)
        // For value = 1,000,000: (1_000_000)^0.9 / 1000 = 251188.64 / 1000 = 251
        double militaryValue = 1_000_000.0;
        long hp = HonorAndRetreatFormulas.CalculateHonorPointsFromDestroyedValue(militaryValue);
        Assert.Equal(251, hp);

        // For value = 0: HP = 0
        Assert.Equal(0, HonorAndRetreatFormulas.CalculateHonorPointsFromDestroyedValue(0));
    }

    [Fact]
    public void DestroyedMilitaryUnitsValue_ExcludesCivilianShipsAndRepairedDefenses()
    {
        var destroyed = new Dictionary<UnitType, int>
        {
            [UnitType.LightFighter] = 10,       // 10 * (3000 + 1000) = 40,000
            [UnitType.Battleship] = 2,          // 2 * (45000 + 15000) = 120,000
            [UnitType.SmallCargo] = 20,         // Civilian -> 0
            [UnitType.LargeCargo] = 5,          // Civilian -> 0
            [UnitType.EspionageProbe] = 50,     // Civilian -> 0
            [UnitType.SolarSatellite] = 10,     // Civilian -> 0
            [UnitType.RocketLauncher] = 10      // 10 destroyed, 7 repaired (70%) -> 3 * 2000 = 6,000
        };

        var repaired = new Dictionary<UnitType, int>
        {
            [UnitType.RocketLauncher] = 7
        };

        double militaryValue = HonorAndRetreatFormulas.CalculateDestroyedMilitaryUnitsValue(destroyed, repaired);
        // 40,000 + 120,000 + 6,000 = 166,000
        Assert.Equal(166_000.0, militaryValue);
    }

    [Fact]
    public void HasMinimumShipParticipation_RequiresAtLeastOnePercentOfTotalShips()
    {
        int totalBattleShips = 1000;

        Assert.False(HonorAndRetreatFormulas.HasMinimumShipParticipation(9, totalBattleShips));
        Assert.True(HonorAndRetreatFormulas.HasMinimumShipParticipation(10, totalBattleShips));
        Assert.True(HonorAndRetreatFormulas.HasMinimumShipParticipation(50, totalBattleShips));
    }

    [Theory]
    [InlineData(1000, 10, 1500, 5, HonorRank.None, false, FightHonorableStatus.Honorable)] // Attacker mil <= Defender mil
    [InlineData(1005, 10, 1000, 12, HonorRank.None, false, FightHonorableStatus.Honorable)] // Defender mil >= Attacker mil - 10
    [InlineData(5000, 50, 1000, 120, HonorRank.None, false, FightHonorableStatus.Honorable)] // Defender rank (120) <= Attacker rank (50) + 100
    [InlineData(5000, 50, 100, 300, HonorRank.Bandit, false, FightHonorableStatus.Honorable)] // Defender is Bandit
    [InlineData(5000, 50, 100, 300, HonorRank.None, false, FightHonorableStatus.Dishonorable)] // Weaker defender, not bandit
    [InlineData(1000, 10, 100, 300, HonorRank.None, true, FightHonorableStatus.Neutral)] // Inactive defender is always Neutral
    public void Evaluate1v1FightHonorableStatus_MatchesRules(
        long attackerMil,
        int attackerRank,
        long defenderMil,
        int defenderRank,
        HonorRank defenderHonor,
        bool isInactive,
        FightHonorableStatus expected)
    {
        var result = HonorAndRetreatFormulas.Evaluate1v1FightHonorableStatus(
            attackerMilitaryPoints: attackerMil,
            attackerMilitaryRank: attackerRank,
            defenderMilitaryPoints: defenderMil,
            defenderMilitaryRank: defenderRank,
            defenderHonorRank: defenderHonor,
            isSameAlliance: false,
            isFriend: false,
            isDefenderInactive: isInactive);

        Assert.Equal(expected, result);
    }

    [Fact]
    public void CalculateHonorPointsDelta_DishonorableAttack_AttackerLosesHp_DefenderGainsHp()
    {
        double attackerDestroyedMil = 200_000.0;
        double defenderDestroyedMil = 500_000.0;

        var (attackerDelta, defenderDelta) = HonorAndRetreatFormulas.CalculateHonorPointsDelta(
            FightHonorableStatus.Dishonorable,
            attackerDestroyedMil,
            defenderDestroyedMil,
            attackerQualifiedForHp: true,
            defenderQualifiedForHp: true);

        long hpDefenderCasualties = HonorAndRetreatFormulas.CalculateHonorPointsFromDestroyedValue(defenderDestroyedMil);
        long hpAttackerCasualties = HonorAndRetreatFormulas.CalculateHonorPointsFromDestroyedValue(attackerDestroyedMil);

        Assert.Equal(-hpDefenderCasualties, attackerDelta); // Negative for attacker
        Assert.Equal(hpAttackerCasualties, defenderDelta);  // Positive for defender
    }

    [Theory]
    [InlineData(20_000, 5, HonorRank.GrandEmperor)]
    [InlineData(3_000, 50, HonorRank.Emperor)]
    [InlineData(600, 150, HonorRank.StarLord)]
    [InlineData(-600, 850, HonorRank.Bandit)]
    [InlineData(-3_000, 950, HonorRank.BanditLord)]
    [InlineData(-20_000, 995, HonorRank.BanditKing)]
    public void DetermineHonorRank_IdentifiesRanksCorrectly(long hp, int pos, HonorRank expected)
    {
        var rank = HonorAndRetreatFormulas.DetermineHonorRank(hp, pos, totalPlayers: 1000);
        Assert.Equal(expected, rank);
    }

    [Theory]
    [InlineData(FightHonorableStatus.Honorable, HonorRank.None, false, PlayerClass.None, 0.75)]
    [InlineData(FightHonorableStatus.Dishonorable, HonorRank.Bandit, false, PlayerClass.None, 1.00)]
    [InlineData(FightHonorableStatus.Dishonorable, HonorRank.None, true, PlayerClass.Discoverer, 0.75)]
    [InlineData(FightHonorableStatus.Dishonorable, HonorRank.None, false, PlayerClass.None, 0.50)]
    public void DeterminePlunderRatio_AppliesCorrectPercentage(
        FightHonorableStatus status,
        HonorRank defenderHonor,
        bool isInactive,
        PlayerClass playerClass,
        double expectedRatio)
    {
        double ratio = HonorAndRetreatFormulas.DeterminePlunderRatio(status, defenderHonor, isInactive, playerClass);
        Assert.Equal(expectedRatio, ratio);
    }

    [Fact]
    public void CalculateFleetTacticalPoints_WeightsWarshipsAt100PercentAndCivilianAt25Percent()
    {
        var units = new Dictionary<UnitType, int>
        {
            [UnitType.LightFighter] = 10,   // 10 * 4000 * 1.0 = 40,000
            [UnitType.SmallCargo] = 10,     // 10 * 4000 * 0.25 = 10,000
            [UnitType.EspionageProbe] = 50, // 0%
            [UnitType.SolarSatellite] = 20, // 0%
            [UnitType.RocketLauncher] = 15  // Defense -> 0%
        };

        double tactical = HonorAndRetreatFormulas.CalculateFleetTacticalPoints(units);
        Assert.Equal(50_000.0, tactical);
    }

    [Fact]
    public void EvaluateTacticalRetreat_TriggersAt5To1_WhenEligibleAndHasFuel()
    {
        var attackerUnits = new Dictionary<UnitType, int>
        {
            [UnitType.Battleship] = 10 // 10 * 60,000 = 600,000 tactical points
        };

        var defenderUnits = new Dictionary<UnitType, int>
        {
            [UnitType.Cruiser] = 3, // 3 * 29,000 = 87,000 tactical points
            [UnitType.RocketLauncher] = 20 // Defense does not count
        };

        // Ratio is 600,000 / 87,000 = 6.89 >= 5.0
        var result = HonorAndRetreatFormulas.EvaluateTacticalRetreat(
            defenderTotalPoints: 40_000, // < 500k noob protection
            status: FightHonorableStatus.Dishonorable,
            defenderHonorRank: HonorRank.None,
            attackerUnits: attackerUnits,
            defenderUnits: defenderUnits,
            availablePlanetDeuterium: 50_000,
            hasAdmiralOfficer: false,
            fleetRetreatRatio3To1Enabled: false);

        Assert.True(result.CanRetreat);
        Assert.True(result.Triggered);
        Assert.True(result.RetreatingUnits.ContainsKey(UnitType.Cruiser));
        Assert.False(result.RetreatingUnits.ContainsKey(UnitType.RocketLauncher));
        Assert.True(result.RemainingUnitsInBattle.ContainsKey(UnitType.RocketLauncher));
    }

    [Fact]
    public void EvaluateTacticalRetreat_WithAdmiral_TriggersAt3To1()
    {
        var attackerUnits = new Dictionary<UnitType, int>
        {
            [UnitType.Battleship] = 5 // 5 * 60,000 = 300,000 tactical points
        };

        var defenderUnits = new Dictionary<UnitType, int>
        {
            [UnitType.Cruiser] = 3 // 3 * 29,000 = 87,000 tactical points -> ratio 3.44:1
        };

        // Without Admiral (5:1 needed): should NOT trigger
        var withoutAdmiral = HonorAndRetreatFormulas.EvaluateTacticalRetreat(
            defenderTotalPoints: 30_000,
            status: FightHonorableStatus.Dishonorable,
            defenderHonorRank: HonorRank.None,
            attackerUnits: attackerUnits,
            defenderUnits: defenderUnits,
            availablePlanetDeuterium: 50_000,
            hasAdmiralOfficer: false,
            fleetRetreatRatio3To1Enabled: false);
        Assert.False(withoutAdmiral.Triggered);

        // With Admiral & 3:1 option: should trigger
        var withAdmiral = HonorAndRetreatFormulas.EvaluateTacticalRetreat(
            defenderTotalPoints: 30_000,
            status: FightHonorableStatus.Dishonorable,
            defenderHonorRank: HonorRank.None,
            attackerUnits: attackerUnits,
            defenderUnits: defenderUnits,
            availablePlanetDeuterium: 50_000,
            hasAdmiralOfficer: true,
            fleetRetreatRatio3To1Enabled: true);
        Assert.True(withAdmiral.Triggered);
    }

    [Fact]
    public void EvaluateTacticalRetreat_BlockedForBanditOrHonorableFight()
    {
        var attackerUnits = new Dictionary<UnitType, int> { [UnitType.Battleship] = 100 };
        var defenderUnits = new Dictionary<UnitType, int> { [UnitType.Cruiser] = 1 };

        // Bandit defender cannot retreat
        var banditRetreat = HonorAndRetreatFormulas.EvaluateTacticalRetreat(
            defenderTotalPoints: 30_000,
            status: FightHonorableStatus.Dishonorable,
            defenderHonorRank: HonorRank.Bandit,
            attackerUnits: attackerUnits,
            defenderUnits: defenderUnits,
            availablePlanetDeuterium: 50_000);
        Assert.False(banditRetreat.Triggered);

        // Honorable fight cannot retreat
        var honorableRetreat = HonorAndRetreatFormulas.EvaluateTacticalRetreat(
            defenderTotalPoints: 30_000,
            status: FightHonorableStatus.Honorable,
            defenderHonorRank: HonorRank.None,
            attackerUnits: attackerUnits,
            defenderUnits: defenderUnits,
            availablePlanetDeuterium: 50_000);
        Assert.False(honorableRetreat.Triggered);
    }

    [Fact]
    public void CalculateReaperDebrisSkim_Collects25Percent_CappedByCargo()
    {
        // 10 Reapers -> total cargo 10 * 10,000 = 100,000
        // Debris: 200,000 Metal, 100,000 Crystal -> Total 300,000
        // 25% is 50,000 Metal, 25,000 Crystal = 75,000 (fits within 100,000)
        var result = HonorAndRetreatFormulas.CalculateReaperDebrisSkim(
            survivingReaperCount: 10,
            newlyCreatedDebrisMetal: 200_000,
            newlyCreatedDebrisCrystal: 100_000);

        Assert.Equal(50_000.0, result.SkimmedMetal);
        Assert.Equal(25_000.0, result.SkimmedCrystal);
        Assert.Equal(150_000.0, result.RemainingDebrisMetal);
        Assert.Equal(75_000.0, result.RemainingDebrisCrystal);
    }

    [Fact]
    public void CalculateAuctionBidValue_IncludesHonorPointsAt100BidPointsEach()
    {
        // 10,000 Metal (1.0) + 5,000 Crystal (1.5) + 2,000 Deut (3.0) + 100 HP (100.0)
        // 10,000 + 7,500 + 6,000 + 10,000 = 33,500
        double totalBid = HonorAndRetreatFormulas.CalculateAuctionBidValue(
            metal: 10_000,
            crystal: 5_000,
            deuterium: 2_000,
            honorPoints: 100);

        Assert.Equal(33_500.0, totalBid);
    }
}

