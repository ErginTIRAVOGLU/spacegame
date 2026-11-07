using OGame.Domain.Enums;

namespace OGame.Domain.Services;

/// <summary>
/// Space Dock (Uzay İskelesi) & Wreck Field rules (Task 15).
/// A wreck field is created when a defending planet loses a meaningful part of its ship fleet; it lives 72 hours
/// and lets the owner repair a share of the destroyed ships for free through the Space Dock.
/// </summary>
public static class SpaceDockFormulas
{
    public const int WreckFieldLifetimeHours = 72;
    public const int MinRepairMinutes = 30;
    public const int MaxRepairMinutes = 12 * 60;

    /// <summary>Minimum total resource value of destroyed ships required to spawn a wreck field.</summary>
    public const double MinDestroyedShipValue = 150_000.0;
    /// <summary>Minimum percentage of the defending planet's ship value that must be destroyed.</summary>
    public const double MinDestroyedShipRatio = 0.05;
    /// <summary>Minimum number of destroyed ships required.</summary>
    public const int MinDestroyedShipCount = 10;

    private static readonly HashSet<UnitType> RepairableShips = new()
    {
        UnitType.SmallCargo, UnitType.LargeCargo, UnitType.LightFighter, UnitType.HeavyFighter,
        UnitType.Cruiser, UnitType.Battleship, UnitType.ColonyShip, UnitType.Recycler,
        UnitType.EspionageProbe, UnitType.Bomber, UnitType.Destroyer, UnitType.Deathstar,
        UnitType.Battlecruiser, UnitType.Reaper, UnitType.Pathfinder
    };

    public static bool IsRepairableShip(UnitType unitType) => RepairableShips.Contains(unitType);

    private static double ShipValue(UnitType type, int count)
    {
        var cost = ConstructionFormulas.GetUnitCost(type);
        return (cost.Metal + cost.Crystal + cost.Deuterium) * count;
    }

    /// <summary>
    /// Computes the destroyed ships of the defender (ships only) given initial and surviving units.
    /// </summary>
    public static Dictionary<UnitType, int> CalculateDestroyedShips(
        IReadOnlyDictionary<UnitType, int> initialUnits,
        IReadOnlyDictionary<UnitType, int> survivingUnits)
    {
        var destroyed = new Dictionary<UnitType, int>();
        foreach (var (type, initial) in initialUnits)
        {
            if (!IsRepairableShip(type)) continue;
            int surviving = survivingUnits.TryGetValue(type, out int s) ? s : 0;
            int lost = Math.Max(0, initial - surviving);
            if (lost > 0) destroyed[type] = lost;
        }

        return destroyed;
    }

    public static bool ShouldCreateWreckField(
        IReadOnlyDictionary<UnitType, int> initialUnits,
        IReadOnlyDictionary<UnitType, int> destroyedShips)
    {
        int destroyedCount = destroyedShips.Values.Sum();
        if (destroyedCount < MinDestroyedShipCount) return false;

        double destroyedValue = destroyedShips.Sum(kv => ShipValue(kv.Key, kv.Value));
        if (destroyedValue < MinDestroyedShipValue) return false;

        double initialValue = initialUnits
            .Where(kv => IsRepairableShip(kv.Key))
            .Sum(kv => ShipValue(kv.Key, kv.Value));
        if (initialValue <= 0) return false;

        return destroyedValue / initialValue >= MinDestroyedShipRatio;
    }

    /// <summary>Share of destroyed ships recoverable by the Space Dock: 50% + 2% per level, capped at 80%.</summary>
    public static double CalculateRepairFraction(int spaceDockLevel)
    {
        if (spaceDockLevel <= 0) return 0.0;
        return Math.Min(0.80, 0.50 + 0.02 * spaceDockLevel);
    }

    public static Dictionary<UnitType, int> CalculateRepairableShips(
        IReadOnlyDictionary<UnitType, int> destroyedShips,
        int spaceDockLevel)
    {
        double fraction = CalculateRepairFraction(spaceDockLevel);
        var result = new Dictionary<UnitType, int>();
        foreach (var (type, count) in destroyedShips)
        {
            int repairable = (int)Math.Floor(count * fraction);
            if (repairable > 0) result[type] = repairable;
        }

        return result;
    }

    /// <summary>
    /// Repair duration in seconds: scales with the repaired ships' value and is clamped to 30 minutes .. 12 hours.
    /// Higher Space Dock levels repair faster.
    /// </summary>
    public static int CalculateRepairDurationSeconds(
        IReadOnlyDictionary<UnitType, int> repairedShips,
        int spaceDockLevel)
    {
        double value = repairedShips.Sum(kv => ShipValue(kv.Key, kv.Value));
        double seconds = value / (50.0 * (1 + Math.Max(0, spaceDockLevel)));
        return (int)Math.Clamp(Math.Floor(seconds), MinRepairMinutes * 60, MaxRepairMinutes * 60);
    }

    public static DateTime CalculateWreckFieldExpiryUtc(DateTime createdUtc) => createdUtc.AddHours(WreckFieldLifetimeHours);

    public static bool IsWreckFieldExpired(DateTime expiresUtc, DateTime nowUtc) => nowUtc >= expiresUtc;
}
