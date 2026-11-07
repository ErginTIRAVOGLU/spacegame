using OGame.Domain.Enums;

namespace OGame.Domain.Services;

public enum FleetIntelVisibilityTier
{
    TotalCountOnly = 1,
    ShipClassesOnly = 2,
    FullDetails = 3
}

public record ResolvedShipIntel(
    UnitType UnitType,
    string ShipName,
    int? ExactCount,
    string DisplayCount
);

public static class HostileFleetAlertFormulas
{
    public static readonly IReadOnlyDictionary<UnitType, string> CanonicalShipNames = new Dictionary<UnitType, string>
    {
        [UnitType.SmallCargo] = "Küçük Nakliye Gemisi",
        [UnitType.LargeCargo] = "Büyük Nakliye Gemisi",
        [UnitType.LightFighter] = "Hafif Avcı",
        [UnitType.HeavyFighter] = "Ağır Avcı",
        [UnitType.Cruiser] = "Kruvazör",
        [UnitType.Battleship] = "Komuta Gemisi",
        [UnitType.ColonyShip] = "Koloni Gemisi",
        [UnitType.Recycler] = "Geri Dönüşümcü",
        [UnitType.EspionageProbe] = "Casus Sondası",
        [UnitType.Bomber] = "Bombardıman Gemisi",
        [UnitType.SolarSatellite] = "Güneş Uydusu",
        [UnitType.Destroyer] = "Muhrip",
        [UnitType.Deathstar] = "Ölüm Yıldızı",
        [UnitType.Battlecruiser] = "Fırkateyn",
        [UnitType.Reaper] = "Azrail",
        [UnitType.Pathfinder] = "Rehber"
    };

    public static string GetCanonicalShipName(UnitType unitType)
    {
        return CanonicalShipNames.TryGetValue(unitType, out var name)
            ? name
            : unitType.ToString();
    }

    /// <summary>
    /// Intelligence Resolver Logic based on Espionage Tech Difference:
    /// DeltaEsp = DefenderEspionageLevel - AttackerEspionageLevel
    /// DeltaEsp < 2: TotalCountOnly (Shows only total ship count)
    /// DeltaEsp in [2, 3]: ShipClassesOnly (Shows ship classes, counts obscured as '?')
    /// DeltaEsp >= 4: FullDetails (Reveals exact ship counts per ship type)
    /// </summary>
    public static FleetIntelVisibilityTier ResolveIntelTier(int defenderEspionageLevel, int attackerEspionageLevel)
    {
        int delta = defenderEspionageLevel - attackerEspionageLevel;
        if (delta < 2)
        {
            return FleetIntelVisibilityTier.TotalCountOnly;
        }

        if (delta <= 3)
        {
            return FleetIntelVisibilityTier.ShipClassesOnly;
        }

        return FleetIntelVisibilityTier.FullDetails;
    }

    public static IReadOnlyList<ResolvedShipIntel> ResolveShipBreakdown(
        IEnumerable<(UnitType UnitType, int Count)> rawShips,
        int defenderEspionageLevel,
        int attackerEspionageLevel)
    {
        var tier = ResolveIntelTier(defenderEspionageLevel, attackerEspionageLevel);
        var ships = rawShips.Where(s => s.Count > 0).ToList();

        if (tier == FleetIntelVisibilityTier.TotalCountOnly)
        {
            return Array.Empty<ResolvedShipIntel>();
        }

        if (tier == FleetIntelVisibilityTier.ShipClassesOnly)
        {
            return ships.Select(s => new ResolvedShipIntel(
                UnitType: s.UnitType,
                ShipName: GetCanonicalShipName(s.UnitType),
                ExactCount: null,
                DisplayCount: "?"
            )).ToList();
        }

        return ships.Select(s => new ResolvedShipIntel(
            UnitType: s.UnitType,
            ShipName: GetCanonicalShipName(s.UnitType),
            ExactCount: s.Count,
            DisplayCount: s.Count.ToString("N0")
        )).ToList();
    }

    public static string FormatArrivalCountdown(TimeSpan remaining)
    {
        if (remaining <= TimeSpan.Zero)
        {
            return "00dk 00sn";
        }

        int minutes = (int)remaining.TotalMinutes;
        int seconds = remaining.Seconds;
        return $"{minutes:D2}dk {seconds:D2}sn";
    }
}

