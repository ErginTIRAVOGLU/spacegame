using OGame.Application.Common.Interfaces;
using OGame.Domain.Combat;
using OGame.Domain.Enums;

namespace OGame.Application.Services;

public class CombatEngine : ICombatEngine
{
    public const double DefaultDefenseRepairChance = 0.70;
    public const double EngineerOfficerDefenseRepairChance = 0.85;

    public CombatResult SimulateCombat(
        CombatFleetInput attacker,
        CombatFleetInput defender,
        int? seed = null,
        int maxRounds = 6,
        double debrisRatio = 0.30,
        bool defenseToDebris = false,
        bool defenderHasEngineerOfficer = false)
    {
        ArgumentNullException.ThrowIfNull(attacker);
        ArgumentNullException.ThrowIfNull(defender);

        int effectiveMaxRounds = Math.Clamp(maxRounds, 1, 6);
        var rng = seed.HasValue ? new Random(seed.Value) : new Random();

        var attackerUnits = CreateActiveUnits(attacker.Units, attacker.TechLevels ?? new CombatTechLevels());
        var defenderUnits = CreateActiveUnits(defender.Units, defender.TechLevels ?? new CombatTechLevels());

        var initialAttackerCounts = CountByType(attackerUnits);
        var initialDefenderCounts = CountByType(defenderUnits);

        var rounds = new List<CombatRoundSummary>(effectiveMaxRounds);

        for (int round = 1; round <= effectiveMaxRounds; round++)
        {
            if (attackerUnits.Count == 0 || defenderUnits.Count == 0)
            {
                break;
            }

            int attackerShots = 0;
            int defenderShots = 0;
            double attackerDamageDealt = 0.0;
            double defenderDamageDealt = 0.0;
            double attackerShieldAbsorbed = 0.0;
            double defenderShieldAbsorbed = 0.0;

            // Both sides fire simultaneously against the active opposing force of the current round.
            // 1. Attacker volley
            foreach (var unit in attackerUnits)
            {
                FireUnitWithRapidfire(
                    shooter: unit,
                    opposingForce: defenderUnits,
                    rng: rng,
                    shotsFired: ref attackerShots,
                    damageDealt: ref attackerDamageDealt,
                    targetShieldAbsorbed: ref defenderShieldAbsorbed);
            }

            // 2. Defender volley
            foreach (var unit in defenderUnits)
            {
                FireUnitWithRapidfire(
                    shooter: unit,
                    opposingForce: attackerUnits,
                    rng: rng,
                    shotsFired: ref defenderShots,
                    damageDealt: ref defenderDamageDealt,
                    targetShieldAbsorbed: ref attackerShieldAbsorbed);
            }

            // Remove destroyed units at end of round and regenerate shields of surviving units
            attackerUnits.RemoveAll(u => u.IsDestroyed);
            defenderUnits.RemoveAll(u => u.IsDestroyed);

            foreach (var unit in attackerUnits)
            {
                unit.CurrentShield = unit.MaxShield;
            }

            foreach (var unit in defenderUnits)
            {
                unit.CurrentShield = unit.MaxShield;
            }

            rounds.Add(new CombatRoundSummary(
                RoundNumber: round,
                AttackerShotsFired: attackerShots,
                DefenderShotsFired: defenderShots,
                AttackerDamageDealt: attackerDamageDealt,
                DefenderDamageDealt: defenderDamageDealt,
                AttackerShieldAbsorbed: attackerShieldAbsorbed,
                DefenderShieldAbsorbed: defenderShieldAbsorbed,
                AttackerUnitsRemaining: CountByType(attackerUnits),
                DefenderUnitsRemaining: CountByType(defenderUnits)));
        }

        var finalAttackerCounts = CountByType(attackerUnits);
        var finalDefenderCounts = CountByType(defenderUnits);

        var destroyedAttackerCounts = CalculateDestroyedCounts(initialAttackerCounts, finalAttackerCounts);
        var destroyedDefenderCounts = CalculateDestroyedCounts(initialDefenderCounts, finalDefenderCounts);

        var winner = DetermineWinner(attackerUnits.Count, defenderUnits.Count);
        var debrisField = CalculateDebrisField(
            destroyedAttackerCounts,
            destroyedDefenderCounts,
            debrisRatio,
            defenseToDebris);

        var repairedDefenses = CalculateDefenseRebuildInternal(
            destroyedDefenderCounts,
            defenderHasEngineerOfficer,
            rng);

        return new CombatResult(
            Winner: winner,
            Rounds: rounds,
            AttackerRemainingUnits: finalAttackerCounts,
            DefenderRemainingUnits: finalDefenderCounts,
            AttackerDestroyedUnits: destroyedAttackerCounts,
            DefenderDestroyedUnits: destroyedDefenderCounts,
            DebrisField: debrisField,
            DefenderRepairedDefenses: repairedDefenses);
    }

    public IReadOnlyDictionary<UnitType, int> CalculateDefenseRebuild(
        IReadOnlyDictionary<UnitType, int> destroyedUnits,
        bool hasEngineerOfficer = false,
        int? seed = null)
    {
        ArgumentNullException.ThrowIfNull(destroyedUnits);
        var rng = seed.HasValue ? new Random(seed.Value) : new Random();
        return CalculateDefenseRebuildInternal(destroyedUnits, hasEngineerOfficer, rng);
    }

    private static Dictionary<UnitType, int> CalculateDefenseRebuildInternal(
        IReadOnlyDictionary<UnitType, int> destroyedUnits,
        bool hasEngineerOfficer,
        Random rng)
    {
        double repairChance = hasEngineerOfficer
            ? EngineerOfficerDefenseRepairChance
            : DefaultDefenseRepairChance;

        var repaired = new Dictionary<UnitType, int>();

        foreach (var (unitType, destroyedCount) in destroyedUnits.OrderBy(k => (int)k.Key))
        {
            if (destroyedCount <= 0)
            {
                continue;
            }

            var stats = CombatCatalog.GetStats(unitType);
            if (!stats.IsDefense)
            {
                continue;
            }

            int repairedCount = 0;
            for (int i = 0; i < destroyedCount; i++)
            {
                if (rng.NextDouble() < repairChance)
                {
                    repairedCount++;
                }
            }

            if (repairedCount > 0)
            {
                repaired[unitType] = repairedCount;
            }
        }

        return repaired;
    }

    /// <summary>
    /// Evaluates whether a single hit bounces off the shield:
    /// If hit damage < 1% of current shield, damage is ignored.
    /// </summary>
    public static bool IsShieldBounce(double weaponDamage, double currentShield)
    {
        if (currentShield <= 0.0)
        {
            return false;
        }

        return weaponDamage < (0.01 * currentShield);
    }

    /// <summary>
    /// Rapidfire chance: If unit shoots a target with rapidfire R, roll chance P = 1 - (1 / R).
    /// </summary>
    public static double CalculateRapidfireChance(int rapidfireCount)
    {
        if (rapidfireCount <= 1)
        {
            return 0.0;
        }

        return 1.0 - (1.0 / rapidfireCount);
    }

    private static void FireUnitWithRapidfire(
        CombatUnitState shooter,
        List<CombatUnitState> opposingForce,
        Random rng,
        ref int shotsFired,
        ref double damageDealt,
        ref double targetShieldAbsorbed)
    {
        if (opposingForce.Count == 0)
        {
            return;
        }

        bool shootAgain = true;
        while (shootAgain && opposingForce.Count > 0)
        {
            int targetIndex = rng.Next(opposingForce.Count);
            var target = opposingForce[targetIndex];

            shotsFired++;
            damageDealt += shooter.WeaponPower;

            ApplyHit(shooter.WeaponPower, target, rng, ref targetShieldAbsorbed);

            int rapidfire = CombatCatalog.GetRapidfireCount(shooter.UnitType, target.UnitType);
            if (rapidfire > 1)
            {
                double chance = CalculateRapidfireChance(rapidfire);
                shootAgain = rng.NextDouble() < chance;
            }
            else
            {
                shootAgain = false;
            }
        }
    }

    private static void ApplyHit(
        double weaponDamage,
        CombatUnitState target,
        Random rng,
        ref double targetShieldAbsorbed)
    {
        if (target.IsDestroyed)
        {
            return;
        }

        if (IsShieldBounce(weaponDamage, target.CurrentShield))
        {
            targetShieldAbsorbed += weaponDamage;
            return;
        }

        if (target.CurrentShield >= weaponDamage)
        {
            target.CurrentShield -= weaponDamage;
            targetShieldAbsorbed += weaponDamage;
            return;
        }

        double excessDamage = weaponDamage - target.CurrentShield;
        targetShieldAbsorbed += target.CurrentShield;
        target.CurrentShield = 0.0;

        target.CurrentHull = Math.Max(0.0, target.CurrentHull - excessDamage);
        if (target.CurrentHull <= 0.0)
        {
            target.IsDestroyed = true;
            return;
        }

        double hullRatio = target.CurrentHull / target.MaxHull;
        if (hullRatio < 0.70)
        {
            double explosionChance = 1.0 - hullRatio;
            if (rng.NextDouble() < explosionChance)
            {
                target.CurrentHull = 0.0;
                target.IsDestroyed = true;
            }
        }
    }

    private static List<CombatUnitState> CreateActiveUnits(
        IReadOnlyDictionary<UnitType, int> unitCounts,
        CombatTechLevels tech)
    {
        var list = new List<CombatUnitState>();
        if (unitCounts is null)
        {
            return list;
        }

        double weaponMultiplier = 1.0 + (0.10 * Math.Max(0, tech.WeaponsLevel));
        double shieldMultiplier = 1.0 + (0.10 * Math.Max(0, tech.ShieldingLevel));
        double hullMultiplier = 1.0 + (0.10 * Math.Max(0, tech.ArmourLevel));

        foreach (var (unitType, count) in unitCounts.OrderBy(k => (int)k.Key))
        {
            if (count <= 0)
            {
                continue;
            }

            var stats = CombatCatalog.GetStats(unitType);
            double maxHull = stats.BaseHull * hullMultiplier;
            double maxShield = stats.Shield * shieldMultiplier;
            double weaponPower = stats.WeaponPower * weaponMultiplier;

            for (int i = 0; i < count; i++)
            {
                list.Add(new CombatUnitState
                {
                    UnitType = unitType,
                    MaxHull = maxHull,
                    CurrentHull = maxHull,
                    MaxShield = maxShield,
                    CurrentShield = maxShield,
                    WeaponPower = weaponPower
                });
            }
        }

        return list;
    }

    private static Dictionary<UnitType, int> CountByType(IEnumerable<CombatUnitState> units)
    {
        return units
            .Where(u => !u.IsDestroyed)
            .GroupBy(u => u.UnitType)
            .ToDictionary(g => g.Key, g => g.Count());
    }

    private static Dictionary<UnitType, int> CalculateDestroyedCounts(
        IReadOnlyDictionary<UnitType, int> initial,
        IReadOnlyDictionary<UnitType, int> remaining)
    {
        var destroyed = new Dictionary<UnitType, int>();
        foreach (var (unitType, initialCount) in initial)
        {
            int rem = remaining.TryGetValue(unitType, out int r) ? r : 0;
            int lost = Math.Max(0, initialCount - rem);
            if (lost > 0)
            {
                destroyed[unitType] = lost;
            }
        }

        return destroyed;
    }

    private static CombatWinner DetermineWinner(int attackerAlive, int defenderAlive)
    {
        if (attackerAlive > 0 && defenderAlive == 0)
        {
            return CombatWinner.Attacker;
        }

        if (defenderAlive > 0 && attackerAlive == 0)
        {
            return CombatWinner.Defender;
        }

        return CombatWinner.Draw;
    }

    private static DebrisFieldResources CalculateDebrisField(
        IReadOnlyDictionary<UnitType, int> attackerDestroyed,
        IReadOnlyDictionary<UnitType, int> defenderDestroyed,
        double debrisRatio,
        bool defenseToDebris)
    {
        double totalMetal = 0.0;
        double totalCrystal = 0.0;

        void Accumulate(IReadOnlyDictionary<UnitType, int> losses)
        {
            foreach (var (unitType, count) in losses)
            {
                if (count <= 0) continue;

                var stats = CombatCatalog.GetStats(unitType);
                if (stats.IsDefense && !defenseToDebris)
                {
                    continue;
                }

                totalMetal += stats.MetalCost * count * debrisRatio;
                totalCrystal += stats.CrystalCost * count * debrisRatio;
            }
        }

        Accumulate(attackerDestroyed);
        Accumulate(defenderDestroyed);

        return new DebrisFieldResources(
            Metal: Math.Floor(totalMetal),
            Crystal: Math.Floor(totalCrystal));
    }

    private sealed class CombatUnitState
    {
        public required UnitType UnitType { get; init; }
        public required double MaxHull { get; init; }
        public required double CurrentHull { get; set; }
        public required double MaxShield { get; init; }
        public required double CurrentShield { get; set; }
        public required double WeaponPower { get; init; }
        public bool IsDestroyed { get; set; }
    }
}
