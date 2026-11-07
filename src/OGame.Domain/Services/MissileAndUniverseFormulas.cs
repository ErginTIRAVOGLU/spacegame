using OGame.Domain.Combat;
using OGame.Domain.Enums;

namespace OGame.Domain.Services;

public record UniverseConfig(
    double EconomySpeedMultiplier = 1.0,
    double FleetSpeedMultiplier = 1.0,
    double ResearchSpeedMultiplier = 1.0,
    double DebrisRatio = 0.30,
    bool DefenseToDebris = false,
    double DeutConsumptionFactor = 1.0);

public record MissileStrikeSimulationResult(
    int IncomingIpmCount,
    int InterceptedByAbmCount,
    int SurvivingIpmCount,
    int RemainingAbmCount,
    IReadOnlyDictionary<UnitType, int> DestroyedDefenses,
    IReadOnlyDictionary<UnitType, int> RemainingDefenses);

public static class MissileAndUniverseFormulas
{
    public const int SiloSlotsPerLevel = 10;
    public const int AbmSlotCost = 1;
    public const int IpmSlotCost = 2;
    public const double IpmBaseAttackPower = 12_000.0;
    public const long NoobProtectionMaxPoints = 500_000;
    public const long NoobProtectionPointRatio = 5;
    public const int InactiveExemptionDays = 30;
    public const int MaxAttacksPerPlanetPer24Hours = 6;
    public const string UniverseConfigRedisKey = "config:universe";

    private static readonly UnitType[] DefensePriorityOrder =
    [
        UnitType.RocketLauncher,
        UnitType.LightLaser,
        UnitType.HeavyLaser,
        UnitType.GaussCannon,
        UnitType.IonCannon,
        UnitType.PlasmaTurret,
        UnitType.SmallShieldDome,
        UnitType.LargeShieldDome
    ];

    /// <summary>
    /// Missile Silo Capacity: Level * 10 missile slots.
    /// </summary>
    public static int CalculateMissileSiloCapacitySlots(int siloLevel) =>
        Math.Max(0, siloLevel) * SiloSlotsPerLevel;

    /// <summary>
    /// Used Missile Silo Slots: ABM = 1 slot, IPM = 2 slots.
    /// </summary>
    public static int CalculateUsedMissileSiloSlots(int abmCount, int ipmCount) =>
        (Math.Max(0, abmCount) * AbmSlotCost) + (Math.Max(0, ipmCount) * IpmSlotCost);

    public static bool CanStoreMissilesInSilo(
        int siloLevel,
        int currentAbmCount,
        int currentIpmCount,
        int additionalAbmCount,
        int additionalIpmCount)
    {
        int capacity = CalculateMissileSiloCapacitySlots(siloLevel);
        int totalUsed = CalculateUsedMissileSiloSlots(
            currentAbmCount + Math.Max(0, additionalAbmCount),
            currentIpmCount + Math.Max(0, additionalIpmCount));

        return totalUsed <= capacity;
    }

    /// <summary>
    /// IPM Range Formula (Systems in the same galaxy):
    /// Range = (ImpulseDriveLevel * 2) - 1
    /// </summary>
    public static int CalculateIpmSystemRange(int impulseDriveLevel)
    {
        if (impulseDriveLevel <= 0)
        {
            return 0;
        }

        return (impulseDriveLevel * 2) - 1;
    }

    public static bool IsTargetWithinIpmRange(
        int originGalaxy,
        int originSystem,
        int impulseDriveLevel,
        int targetGalaxy,
        int targetSystem)
    {
        if (originGalaxy != targetGalaxy || impulseDriveLevel <= 0)
        {
            return false;
        }

        int range = CalculateIpmSystemRange(impulseDriveLevel);
        int systemDistance = Math.Abs(originSystem - targetSystem);
        return systemDistance <= range;
    }

    /// <summary>
    /// IPM Flight Duration Formula:
    /// Duration = 30 + (60 * SystemDistance) seconds
    /// </summary>
    public static double CalculateIpmFlightDurationSeconds(int originSystem, int targetSystem)
    {
        int systemDistance = Math.Abs(originSystem - targetSystem);
        return 30.0 + (60.0 * systemDistance);
    }

    /// <summary>
    /// Simulates an Interplanetary Missile (IPM) strike against planetary defenses:
    /// 1. Defending ABMs intercept incoming IPMs at a 1:1 ratio.
    /// 2. Surviving IPMs strike PrimaryTargetDefenseType first, then remaining planetary defenses.
    /// 3. Destroyed defenses do NOT trigger the 70% rebuild mechanic and do NOT produce debris.
    /// </summary>
    public static MissileStrikeSimulationResult SimulateMissileStrike(
        int incomingIpmCount,
        int attackerWeaponsLevel,
        int defendingAbmCount,
        int defenderArmourLevel,
        IReadOnlyDictionary<UnitType, int> planetaryDefenses,
        UnitType? primaryTargetDefenseType = null)
    {
        int totalIncoming = Math.Max(0, incomingIpmCount);
        int currentAbms = Math.Max(0, defendingAbmCount);

        int intercepted = Math.Min(currentAbms, totalIncoming);
        int remainingAbms = currentAbms - intercepted;
        int survivingIpms = totalIncoming - intercepted;

        var remainingDefenses = new Dictionary<UnitType, int>();
        var destroyedDefenses = new Dictionary<UnitType, int>();

        if (planetaryDefenses is not null)
        {
            foreach (var (uType, count) in planetaryDefenses)
            {
                if (uType == UnitType.AntiBallisticMissile || uType == UnitType.InterplanetaryMissile)
                {
                    continue;
                }

                if (count > 0 && CombatCatalog.GetStats(uType).IsDefense)
                {
                    remainingDefenses[uType] = count;
                }
            }
        }

        if (survivingIpms <= 0 || remainingDefenses.Count == 0)
        {
            return new MissileStrikeSimulationResult(
                IncomingIpmCount: totalIncoming,
                InterceptedByAbmCount: intercepted,
                SurvivingIpmCount: survivingIpms,
                RemainingAbmCount: remainingAbms,
                DestroyedDefenses: destroyedDefenses,
                RemainingDefenses: remainingDefenses);
        }

        double totalMissileDamage = survivingIpms * IpmBaseAttackPower * (1.0 + (0.10 * Math.Max(0, attackerWeaponsLevel)));
        double armourMultiplier = 1.0 + (0.10 * Math.Max(0, defenderArmourLevel));

        var targetOrder = new List<UnitType>();
        if (primaryTargetDefenseType.HasValue &&
            remainingDefenses.ContainsKey(primaryTargetDefenseType.Value))
        {
            targetOrder.Add(primaryTargetDefenseType.Value);
        }

        foreach (var defType in DefensePriorityOrder)
        {
            if (!targetOrder.Contains(defType) && remainingDefenses.ContainsKey(defType))
            {
                targetOrder.Add(defType);
            }
        }

        foreach (var defType in targetOrder)
        {
            if (totalMissileDamage <= 0)
            {
                break;
            }

            int currentCount = remainingDefenses[defType];
            if (currentCount <= 0)
            {
                continue;
            }

            var stats = CombatCatalog.GetStats(defType);
            double singleUnitHull = stats.BaseHull * armourMultiplier;
            if (singleUnitHull <= 0)
            {
                continue;
            }

            int maxDestroyable = (int)Math.Floor(totalMissileDamage / singleUnitHull);
            if (maxDestroyable <= 0)
            {
                continue;
            }

            int actualDestroyed = Math.Min(currentCount, maxDestroyable);
            remainingDefenses[defType] = currentCount - actualDestroyed;
            destroyedDefenses[defType] = actualDestroyed;
            totalMissileDamage -= actualDestroyed * singleUnitHull;
        }

        return new MissileStrikeSimulationResult(
            IncomingIpmCount: totalIncoming,
            InterceptedByAbmCount: intercepted,
            SurvivingIpmCount: survivingIpms,
            RemainingAbmCount: remainingAbms,
            DestroyedDefenses: destroyedDefenses,
            RemainingDefenses: remainingDefenses);
    }

    /// <summary>
    /// Noob Protection Rule:
    /// Blocks attack/espionage commands if DefenderPoints &lt; 500,000 AND AttackerPoints &gt; 5 * DefenderPoints.
    /// Exempts inactive players with &gt; 30 days without login.
    /// </summary>
    public static bool IsBlockedByNoobProtection(
        long attackerPoints,
        long defenderPoints,
        DateTime defenderLastLoginUtc,
        DateTime utcNow)
    {
        if ((utcNow - defenderLastLoginUtc).TotalDays > InactiveExemptionDays)
        {
            return false;
        }

        if (defenderPoints < NoobProtectionMaxPoints &&
            attackerPoints > (NoobProtectionPointRatio * defenderPoints))
        {
            return true;
        }

        return false;
    }

    /// <summary>
    /// Bashing Rule Validator:
    /// Limits attacks against the same planet coordinate to a maximum of 6 within a rolling 24-hour window.
    /// </summary>
    public static bool IsBlockedByBashingRule(int attacksInLast24Hours) =>
        attacksInLast24Hours >= MaxAttacksPerPlanetPer24Hours;
}

