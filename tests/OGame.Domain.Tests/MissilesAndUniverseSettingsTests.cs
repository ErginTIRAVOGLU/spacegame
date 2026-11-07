using OGame.Domain.Enums;
using OGame.Domain.Services;

namespace OGame.Domain.Tests;

public class MissilesAndUniverseSettingsTests
{
    [Theory]
    [InlineData(1, 10, 0, 0, true)]
    [InlineData(1, 0, 5, 0, true)]
    [InlineData(1, 0, 5, 1, false)]
    [InlineData(4, 20, 10, 0, true)]
    [InlineData(4, 20, 10, 1, false)]
    public void MissileSiloCapacity_ShouldEnforceLevelTimesTenWithAbmOneSlotAndIpmTwoSlots(
        int siloLevel,
        int currentAbm,
        int currentIpm,
        int addIpm,
        bool expectedCanStore)
    {
        Assert.Equal(siloLevel * 10, MissileAndUniverseFormulas.CalculateMissileSiloCapacitySlots(siloLevel));
        bool canStore = MissileAndUniverseFormulas.CanStoreMissilesInSilo(
            siloLevel,
            currentAbm,
            currentIpm,
            additionalAbmCount: 0,
            additionalIpmCount: addIpm);

        Assert.Equal(expectedCanStore, canStore);
    }

    [Theory]
    [InlineData(0, 0)]
    [InlineData(1, 1)]
    [InlineData(3, 5)]
    [InlineData(5, 9)]
    [InlineData(10, 19)]
    public void CalculateIpmSystemRange_ShouldFollowImpulseDriveTimesTwoMinusOneFormula(
        int impulseDriveLevel,
        int expectedSystemRange)
    {
        int range = MissileAndUniverseFormulas.CalculateIpmSystemRange(impulseDriveLevel);
        Assert.Equal(expectedSystemRange, range);
    }

    [Fact]
    public void IsTargetWithinIpmRange_ShouldRequireSameGalaxyAndWithinSystemRange()
    {
        // Impulse Drive L4 -> Range = 4*2 - 1 = 7 systems
        Assert.True(MissileAndUniverseFormulas.IsTargetWithinIpmRange(
            originGalaxy: 1, originSystem: 100, impulseDriveLevel: 4, targetGalaxy: 1, targetSystem: 107));

        Assert.False(MissileAndUniverseFormulas.IsTargetWithinIpmRange(
            originGalaxy: 1, originSystem: 100, impulseDriveLevel: 4, targetGalaxy: 1, targetSystem: 108));

        // Different galaxy -> always false
        Assert.False(MissileAndUniverseFormulas.IsTargetWithinIpmRange(
            originGalaxy: 1, originSystem: 100, impulseDriveLevel: 10, targetGalaxy: 2, targetSystem: 100));
    }

    [Theory]
    [InlineData(100, 100, 30)]
    [InlineData(100, 101, 90)]
    [InlineData(100, 105, 330)]
    public void CalculateIpmFlightDurationSeconds_ShouldFollow30Plus60TimesSystemDistance(
        int originSystem,
        int targetSystem,
        double expectedSeconds)
    {
        double duration = MissileAndUniverseFormulas.CalculateIpmFlightDurationSeconds(originSystem, targetSystem);
        Assert.Equal(expectedSeconds, duration);
    }

    [Fact]
    public void SimulateMissileStrike_ShouldInterceptOneToOneWithAbmsAndDestroyPrimaryTargetFirst()
    {
        var defenses = new Dictionary<UnitType, int>
        {
            [UnitType.RocketLauncher] = 100, // BaseHull = 200
            [UnitType.PlasmaTurret] = 5      // BaseHull = 10,000
        };

        // 8 Incoming IPMs vs 3 Defending ABMs => 3 Intercepted, 5 Surviving IPMs
        // Weapons L0, Armour L0 => 5 * 12,000 = 60,000 total missile damage
        // Primary Target: PlasmaTurret (10,000 hull each) => 5 PlasmaTurrets destroyed (50,000 damage used)
        // Remaining 10,000 damage overflows to RocketLauncher (200 hull each) => 50 RocketLaunchers destroyed!
        var result = MissileAndUniverseFormulas.SimulateMissileStrike(
            incomingIpmCount: 8,
            attackerWeaponsLevel: 0,
            defendingAbmCount: 3,
            defenderArmourLevel: 0,
            planetaryDefenses: defenses,
            primaryTargetDefenseType: UnitType.PlasmaTurret);

        Assert.Equal(8, result.IncomingIpmCount);
        Assert.Equal(3, result.InterceptedByAbmCount);
        Assert.Equal(5, result.SurvivingIpmCount);
        Assert.Equal(0, result.RemainingAbmCount);

        Assert.Equal(5, result.DestroyedDefenses[UnitType.PlasmaTurret]);
        Assert.Equal(0, result.RemainingDefenses[UnitType.PlasmaTurret]);

        Assert.Equal(50, result.DestroyedDefenses[UnitType.RocketLauncher]);
        Assert.Equal(50, result.RemainingDefenses[UnitType.RocketLauncher]);
    }

    [Fact]
    public void NoobProtection_ShouldBlockWhenDefenderUnder500kAndAttackerOver5xUnlessInactiveOver30Days()
    {
        var now = new DateTime(2026, 10, 28, 12, 0, 0, DateTimeKind.Utc);

        // Active defender with 50,000 pts vs Attacker with 300,000 pts (> 5x) -> Blocked
        Assert.True(MissileAndUniverseFormulas.IsBlockedByNoobProtection(
            attackerPoints: 300_000,
            defenderPoints: 50_000,
            defenderLastLoginUtc: now.AddDays(-2),
            utcNow: now));

        // Active defender with 50,000 pts vs Attacker with 200,000 pts (<= 5x) -> Allowed
        Assert.False(MissileAndUniverseFormulas.IsBlockedByNoobProtection(
            attackerPoints: 200_000,
            defenderPoints: 50_000,
            defenderLastLoginUtc: now.AddDays(-2),
            utcNow: now));

        // Active defender with 600,000 pts (>= 500k) vs Attacker with 5,000,000 pts -> Allowed
        Assert.False(MissileAndUniverseFormulas.IsBlockedByNoobProtection(
            attackerPoints: 5_000_000,
            defenderPoints: 600_000,
            defenderLastLoginUtc: now.AddDays(-1),
            utcNow: now));

        // Inactive defender (> 30 days without login) with 10,000 pts vs Attacker with 1,000,000 pts -> Exempt (Allowed)
        Assert.False(MissileAndUniverseFormulas.IsBlockedByNoobProtection(
            attackerPoints: 1_000_000,
            defenderPoints: 10_000,
            defenderLastLoginUtc: now.AddDays(-31),
            utcNow: now));
    }

    [Theory]
    [InlineData(0, false)]
    [InlineData(5, false)]
    [InlineData(6, true)]
    [InlineData(7, true)]
    public void BashingRule_ShouldLimitAttacksToMaxSixPerRolling24Hours(
        int attacksInLast24Hours,
        bool expectedBlocked)
    {
        Assert.Equal(expectedBlocked, MissileAndUniverseFormulas.IsBlockedByBashingRule(attacksInLast24Hours));
    }
}

