using OGame.Domain.Enums;

namespace OGame.Domain.Services;

public record ShipFlightStats(
    UnitType UnitType,
    double BaseSpeed,
    double FuelUsage,
    double CargoCapacity);

public static class FleetNavigationFormulas
{
    /// <summary>
    /// Spatial Distance:
    /// - Different Galaxy: |Gal1 - Gal2| * 20000
    /// - Same Galaxy, Different System: |Sys1 - Sys2| * 95 + 2700
    /// - Same System, Different Slot: |Slot1 - Slot2| * 5 + 1000
    /// - Same Slot (e.g. Planet to Moon/Debris): 5
    /// </summary>
    public static int CalculateSpatialDistance(
        int galaxy1, int system1, int slot1,
        int galaxy2, int system2, int slot2)
    {
        if (galaxy1 != galaxy2)
        {
            return Math.Abs(galaxy1 - galaxy2) * 20_000;
        }

        if (system1 != system2)
        {
            return Math.Abs(system1 - system2) * 95 + 2700;
        }

        if (slot1 != slot2)
        {
            return Math.Abs(slot1 - slot2) * 5 + 1000;
        }

        return 5;
    }

    /// <summary>
    /// Duration (Seconds):
    /// Duration = 10 + (3500 / SpeedFactor) * sqrt((Distance * 10) / SlowestShipSpeed)
    /// Note: SpeedFactor is on scale 1.0 (100%) to 0.1 (10%). If passed as percentage (10..100), normalize to 0.1..1.0.
    /// </summary>
    public static double CalculateFlightDurationSeconds(
        int distance,
        double slowestShipSpeed,
        double speedFactor = 1.0)
    {
        if (slowestShipSpeed <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(slowestShipSpeed), "Slowest ship speed must be positive.");
        }

        double normalizedSpeedFactor = speedFactor > 1.0 ? speedFactor / 100.0 : speedFactor;
        if (normalizedSpeedFactor <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(speedFactor), "Speed factor must be positive.");
        }

        return Math.Round(10.0 + (3500.0 / normalizedSpeedFactor) * Math.Sqrt((distance * 10.0) / slowestShipSpeed));
    }

    /// <summary>
    /// Activity Display Logic on Galaxy View:
    /// DeltaMinutes = (UtcNowEpoch - RedisActivityEpoch) / 60
    /// - If DeltaMinutes < 15: Display "(*)" (actively online / fresh activity).
    /// - If 15 <= DeltaMinutes <= 59: Display "(Xm)" (e.g., "(24m)").
    /// - If DeltaMinutes >= 60 or key expired (null): Display null (empty/idle).
    /// - Self-activity is hidden or masked when isSelf == true.
    /// </summary>
    public static string? FormatActivityIndicator(long? redisActivityEpochSeconds, long utcNowEpochSeconds, bool isSelf = false)
    {
        if (isSelf || !redisActivityEpochSeconds.HasValue)
        {
            return null;
        }

        long deltaSeconds = Math.Max(0L, utcNowEpochSeconds - redisActivityEpochSeconds.Value);
        long deltaMinutes = deltaSeconds / 60;

        if (deltaMinutes < 15)
        {
            return "(*)";
        }

        if (deltaMinutes <= 59)
        {
            return $"({deltaMinutes}m)";
        }

        return null;
    }

    public static string BuildActivityKey(int galaxy, int system, int slot, CoordinateType type = CoordinateType.Planet) =>
        $"galaxy:activity:{galaxy}:{system}:{slot}:{type}";

    public static ShipFlightStats GetShipFlightStats(UnitType unitType, PlayerClass playerClass = PlayerClass.None)
    {
        var baseStats = unitType switch
        {
            UnitType.SmallCargo => new ShipFlightStats(unitType, BaseSpeed: 5000, FuelUsage: 10, CargoCapacity: 5000),
            UnitType.LargeCargo => new ShipFlightStats(unitType, BaseSpeed: 7500, FuelUsage: 50, CargoCapacity: 25_000),
            UnitType.LightFighter => new ShipFlightStats(unitType, BaseSpeed: 12_500, FuelUsage: 20, CargoCapacity: 50),
            UnitType.HeavyFighter => new ShipFlightStats(unitType, BaseSpeed: 10_000, FuelUsage: 75, CargoCapacity: 100),
            UnitType.Cruiser => new ShipFlightStats(unitType, BaseSpeed: 15_000, FuelUsage: 300, CargoCapacity: 800),
            UnitType.Battleship => new ShipFlightStats(unitType, BaseSpeed: 10_000, FuelUsage: 500, CargoCapacity: 1500),
            UnitType.ColonyShip => new ShipFlightStats(unitType, BaseSpeed: 2500, FuelUsage: 1000, CargoCapacity: 7500),
            UnitType.Recycler => new ShipFlightStats(unitType, BaseSpeed: 2000, FuelUsage: 300, CargoCapacity: 20_000),
            UnitType.EspionageProbe => new ShipFlightStats(unitType, BaseSpeed: 100_000_000, FuelUsage: 1, CargoCapacity: 0),
            UnitType.Bomber => new ShipFlightStats(unitType, BaseSpeed: 4000, FuelUsage: 700, CargoCapacity: 500),
            UnitType.Destroyer => new ShipFlightStats(unitType, BaseSpeed: 5000, FuelUsage: 1000, CargoCapacity: 2000),
            UnitType.Deathstar => new ShipFlightStats(unitType, BaseSpeed: 100, FuelUsage: 1, CargoCapacity: 1_000_000),
            UnitType.Battlecruiser => new ShipFlightStats(unitType, BaseSpeed: 10_000, FuelUsage: 250, CargoCapacity: 750),
            UnitType.Reaper => new ShipFlightStats(unitType, BaseSpeed: 7000, FuelUsage: 1100, CargoCapacity: 10_000),
            UnitType.Pathfinder => new ShipFlightStats(unitType, BaseSpeed: 12_000, FuelUsage: 300, CargoCapacity: 10_000),
            _ => throw new ArgumentOutOfRangeException(nameof(unitType), $"Unit {unitType} is not a mobile ship.")
        };

        if (playerClass == PlayerClass.Collector)
        {
            if (unitType is UnitType.SmallCargo or UnitType.LargeCargo)
            {
                return baseStats with { BaseSpeed = baseStats.BaseSpeed * PlayerClassFormulas.CollectorTransportSpeedMultiplier };
            }
        }
        else if (playerClass == PlayerClass.General)
        {
            if (unitType is UnitType.Recycler or UnitType.Reaper)
            {
                return baseStats with { BaseSpeed = baseStats.BaseSpeed * PlayerClassFormulas.GeneralRecyclerSpeedMultiplier };
            }
            else if (unitType is UnitType.LightFighter or UnitType.HeavyFighter or UnitType.Cruiser or
                     UnitType.Battleship or UnitType.Bomber or UnitType.Destroyer or
                     UnitType.Deathstar or UnitType.Battlecruiser or UnitType.Pathfinder)
            {
                return baseStats with { BaseSpeed = baseStats.BaseSpeed * PlayerClassFormulas.GeneralCombatSpeedMultiplier };
            }
        }

        return baseStats;
    }

    public static double GetSlowestShipSpeed(IReadOnlyDictionary<UnitType, int> ships, PlayerClass playerClass = PlayerClass.None)
    {
        if (ships is null || ships.Count == 0)
        {
            throw new ArgumentException("At least one ship is required to calculate fleet speed.", nameof(ships));
        }

        double? slowest = null;
        foreach (var (unitType, count) in ships)
        {
            if (count <= 0) continue;
            var stats = GetShipFlightStats(unitType, playerClass);
            if (!slowest.HasValue || stats.BaseSpeed < slowest.Value)
            {
                slowest = stats.BaseSpeed;
            }
        }

        if (!slowest.HasValue)
        {
            throw new ArgumentException("At least one ship with count > 0 is required.", nameof(ships));
        }

        return slowest.Value;
    }

    public static double CalculateFuelConsumption(IReadOnlyDictionary<UnitType, int> ships, int distance)
    {
        double totalFuel = 0.0;
        foreach (var (unitType, count) in ships)
        {
            if (count <= 0) continue;
            var stats = GetShipFlightStats(unitType);
            totalFuel += 1.0 + Math.Round(stats.FuelUsage * count * (distance / 35_000.0));
        }

        return Math.Max(1.0, totalFuel);
    }

    public static double CalculateTotalCargoCapacity(IReadOnlyDictionary<UnitType, int> ships)
    {
        double totalCapacity = 0.0;
        foreach (var (unitType, count) in ships)
        {
            if (count <= 0) continue;
            var stats = GetShipFlightStats(unitType);
            totalCapacity += stats.CargoCapacity * count;
        }

        return totalCapacity;
    }
}

