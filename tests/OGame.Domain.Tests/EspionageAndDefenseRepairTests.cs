using OGame.Application.Services;
using OGame.Domain.Combat;
using OGame.Domain.Enums;
using OGame.Domain.Services;

namespace OGame.Domain.Tests;

public class EspionageAndDefenseRepairTests
{
    private readonly CombatEngine _combatEngine = new();

    [Fact]
    public void CalculateEffectiveProbes_ShouldMatchExponentialLevelDifferentialFormula()
    {
        // Formula:
        // DeltaLevel = AttackerEspionageLevel - DefenderEspionageLevel
        // EffectiveProbes = ProbeCount * (DeltaLevel > 0 ? 2^DeltaLevel : 0.5^|DeltaLevel|)

        // 1) Equal levels (Delta = 0): 4 * 0.5^0 = 4
        Assert.Equal(4.0, EspionageFormulas.CalculateEffectiveProbes(4, 5, 5), precision: 6);

        // 2) Attacker higher by 2 (Delta = +2): 3 * 2^2 = 12
        Assert.Equal(12.0, EspionageFormulas.CalculateEffectiveProbes(3, 7, 5), precision: 6);

        // 3) Attacker lower by 2 (Delta = -2): 8 * 0.5^2 = 8 * 0.25 = 2
        Assert.Equal(2.0, EspionageFormulas.CalculateEffectiveProbes(8, 3, 5), precision: 6);
    }

    [Theory]
    [InlineData(0.5, 0)]
    [InlineData(1.0, 1)]
    [InlineData(1.9, 1)]
    [InlineData(2.0, 2)]
    [InlineData(3.0, 3)]
    [InlineData(4.9, 3)]
    [InlineData(5.0, 4)]
    [InlineData(6.9, 4)]
    [InlineData(7.0, 5)]
    [InlineData(12.0, 5)]
    public void GetVisibilityTierLevel_ShouldMatchCumulativeThresholds(double effectiveProbes, int expectedTier)
    {
        int actualTier = EspionageFormulas.GetVisibilityTierLevel(effectiveProbes);
        Assert.Equal(expectedTier, actualTier);
    }

    [Fact]
    public void CalculateCounterEspionageChancePercent_ShouldMatchFormulaAndClampTo100()
    {
        // Formula: min(100, ((ShipsOnTarget * EffectiveProbes) / 4) * (1 / 2^DeltaLevel))
        // Let ShipsOnTarget = 40, ProbeCount = 4, Attacker = 5, Defender = 5 (Delta = 0 -> EffectiveProbes = 4)
        // Chance = ((40 * 4) / 4) * (1 / 2^0) = 40%
        double chanceEqual = EspionageFormulas.CalculateCounterEspionageChancePercent(
            shipsOnTarget: 40,
            effectiveProbes: 4.0,
            attackerEspionageLevel: 5,
            defenderEspionageLevel: 5);

        Assert.Equal(40.0, chanceEqual, precision: 6);

        // With high ship count (e.g. 500 ships), clamps at 100%
        double chanceClamped = EspionageFormulas.CalculateCounterEspionageChancePercent(
            shipsOnTarget: 500,
            effectiveProbes: 4.0,
            attackerEspionageLevel: 5,
            defenderEspionageLevel: 5);

        Assert.Equal(100.0, chanceClamped, precision: 6);

        // With 0 ships on target -> 0% detection chance
        double chanceZeroShips = EspionageFormulas.CalculateCounterEspionageChancePercent(
            shipsOnTarget: 0,
            effectiveProbes: 10.0,
            attackerEspionageLevel: 5,
            defenderEspionageLevel: 5);

        Assert.Equal(0.0, chanceZeroShips, precision: 6);
    }

    [Fact]
    public void CounterEspionage1RoundCombat_DestroyedProbes_ShouldYield30PercentCrystalDebris()
    {
        // 5 Espionage Probes (each 1,000 Crystal) vs 20 Cruisers (RF 5 vs Probes) in 1-round combat
        var probes = new CombatFleetInput(
            new Dictionary<UnitType, int> { [UnitType.EspionageProbe] = 5 });

        var defenders = new CombatFleetInput(
            new Dictionary<UnitType, int> { [UnitType.Cruiser] = 20 });

        var result = _combatEngine.SimulateCombat(probes, defenders, seed: 7, maxRounds: 1);

        Assert.Single(result.Rounds);
        Assert.Equal(5, result.AttackerDestroyedUnits[UnitType.EspionageProbe]);
        Assert.Equal(0.0, result.DebrisField.Metal, precision: 6);
        // 5 * 1000 Crystal * 0.30 = 1500 Crystal debris
        Assert.Equal(1500.0, result.DebrisField.Crystal, precision: 6);
    }

    [Fact]
    public void DefenseRebuildAlgorithm_ShouldRepairApproximately70PercentOfDestroyedDefenses_And85PercentWithEngineer()
    {
        // Arrange: 1000 destroyed Rocket Launchers, 500 Light Lasers, and 200 Light Fighters (ships must NOT be repaired)
        var destroyed = new Dictionary<UnitType, int>
        {
            [UnitType.RocketLauncher] = 1000,
            [UnitType.LightLaser] = 500,
            [UnitType.LightFighter] = 200
        };

        // Act 1: Standard 70% repair chance
        var repairedStandard = _combatEngine.CalculateDefenseRebuild(destroyed, hasEngineerOfficer: false, seed: 42);

        // Act 2: Engineer Officer 85% repair chance
        var repairedEngineer = _combatEngine.CalculateDefenseRebuild(destroyed, hasEngineerOfficer: true, seed: 42);

        // Assert: Ships are never repaired
        Assert.False(repairedStandard.ContainsKey(UnitType.LightFighter));
        Assert.False(repairedEngineer.ContainsKey(UnitType.LightFighter));

        // Standard 70% on 1000 Rocket Launchers -> expected ~700 (within reasonable binomial band 640..760)
        int standardRockets = repairedStandard[UnitType.RocketLauncher];
        Assert.InRange(standardRockets, 640, 760);

        // Engineer 85% on 1000 Rocket Launchers -> expected ~850 (within 800..900) and strictly greater than standard with same seed
        int engineerRockets = repairedEngineer[UnitType.RocketLauncher];
        Assert.InRange(engineerRockets, 800, 900);
        Assert.True(engineerRockets > standardRockets);
    }
}

