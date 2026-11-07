using OGame.Application.Services;
using OGame.Domain.Combat;
using OGame.Domain.Enums;

namespace OGame.Domain.Tests;

public class CombatEngineTests
{
    private readonly CombatEngine _sut = new();

    [Fact]
    public void ShieldBounce_LightFightersAgainstLargeShieldDome_ShouldDealZeroHullDamage()
    {
        // Arrange:
        // Light Fighter has WeaponPower = 50.
        // Large Shield Dome has Shield = 10,000, WeaponPower = 1.
        // 1% of 10,000 = 100. Since 50 < 100, every Light Fighter shot bounces!
        // And Large Shield Dome has WeaponPower = 1, which deals 1 damage to Light Fighter shield (10),
        // regenerating at the end of each round.
        // Therefore, after 6 rounds, 0 units are destroyed and the battle ends in a Draw.
        var attacker = new CombatFleetInput(
            new Dictionary<UnitType, int>
            {
                [UnitType.LightFighter] = 50
            });

        var defender = new CombatFleetInput(
            new Dictionary<UnitType, int>
            {
                [UnitType.LargeShieldDome] = 1
            });

        // Act
        var result = _sut.SimulateCombat(attacker, defender, seed: 42);

        // Assert
        Assert.Equal(CombatWinner.Draw, result.Winner);
        Assert.Equal(6, result.Rounds.Count);
        Assert.Equal(50, result.AttackerRemainingUnits[UnitType.LightFighter]);
        Assert.Equal(1, result.DefenderRemainingUnits[UnitType.LargeShieldDome]);
        Assert.Empty(result.AttackerDestroyedUnits);
        Assert.Empty(result.DefenderDestroyedUnits);
        Assert.Equal(0.0, result.DebrisField.Metal);
        Assert.Equal(0.0, result.DebrisField.Crystal);
    }

    [Fact]
    public void Rapidfire_CruiserAgainstRocketLaunchers_ShouldFireMultipleShotsInSingleRound()
    {
        // Arrange:
        // Cruiser has Rapidfire = 10 against RocketLauncher (P = 1 - 1/10 = 90% chance to fire again).
        // With 10 Cruisers vs 50 RocketLaunchers, in Round 1 the 10 Cruisers must fire significantly more than 10 shots.
        var attacker = new CombatFleetInput(
            new Dictionary<UnitType, int>
            {
                [UnitType.Cruiser] = 10
            });

        var defender = new CombatFleetInput(
            new Dictionary<UnitType, int>
            {
                [UnitType.RocketLauncher] = 50
            });

        // Act
        var result = _sut.SimulateCombat(attacker, defender, seed: 12345);

        // Assert
        Assert.NotEmpty(result.Rounds);
        var round1 = result.Rounds[0];
        Assert.True(
            round1.AttackerShotsFired > 10,
            $"Expected rapidfire to produce > 10 shots from 10 Cruisers, but got {round1.AttackerShotsFired}.");
    }

    [Fact]
    public void DebrisField_ShouldSpawn30PercentOfDestroyedShipsMetalAndCrystal_ExcludingDefensesByDefault()
    {
        // Arrange:
        // 20 Battleships vs 10 Light Fighters + 5 Rocket Launchers
        // Battleships will wipe out all 10 Light Fighters and 5 Rocket Launchers in Round 1.
        // 10 Light Fighters cost: 10 * 3000 = 30,000 Metal, 10 * 1000 = 10,000 Crystal.
        // 30% Debris = 9,000 Metal, 3,000 Crystal (Rocket Launchers are defense and do not produce debris by default).
        var attacker = new CombatFleetInput(
            new Dictionary<UnitType, int>
            {
                [UnitType.Battleship] = 20
            });

        var defender = new CombatFleetInput(
            new Dictionary<UnitType, int>
            {
                [UnitType.LightFighter] = 10,
                [UnitType.RocketLauncher] = 5
            });

        // Act
        var result = _sut.SimulateCombat(attacker, defender, seed: 99);

        // Assert
        Assert.Equal(CombatWinner.Attacker, result.Winner);
        Assert.True(result.Rounds.Count <= 6);
        Assert.Equal(10, result.DefenderDestroyedUnits[UnitType.LightFighter]);
        Assert.Equal(5, result.DefenderDestroyedUnits[UnitType.RocketLauncher]);
        Assert.Equal(9000.0, result.DebrisField.Metal, precision: 6);
        Assert.Equal(3000.0, result.DebrisField.Crystal, precision: 6);
    }

    [Fact]
    public void DeterministicSimulation_WithSameSeed_ShouldProduceIdenticalCombatResult()
    {
        var attacker = new CombatFleetInput(
            new Dictionary<UnitType, int>
            {
                [UnitType.LightFighter] = 30,
                [UnitType.Cruiser] = 5
            });

        var defender = new CombatFleetInput(
            new Dictionary<UnitType, int>
            {
                [UnitType.HeavyFighter] = 15,
                [UnitType.LightLaser] = 10
            });

        var result1 = _sut.SimulateCombat(attacker, defender, seed: 2026);
        var result2 = _sut.SimulateCombat(attacker, defender, seed: 2026);

        Assert.Equal(result1.Winner, result2.Winner);
        Assert.Equal(result1.Rounds.Count, result2.Rounds.Count);
        Assert.Equal(result1.DebrisField.Metal, result2.DebrisField.Metal);
        Assert.Equal(result1.DebrisField.Crystal, result2.DebrisField.Crystal);
        for (int i = 0; i < result1.Rounds.Count; i++)
        {
            Assert.Equal(result1.Rounds[i].AttackerShotsFired, result2.Rounds[i].AttackerShotsFired);
            Assert.Equal(result1.Rounds[i].DefenderShotsFired, result2.Rounds[i].DefenderShotsFired);
            Assert.Equal(result1.Rounds[i].AttackerDamageDealt, result2.Rounds[i].AttackerDamageDealt);
            Assert.Equal(result1.Rounds[i].DefenderDamageDealt, result2.Rounds[i].DefenderDamageDealt);
        }
    }
}

