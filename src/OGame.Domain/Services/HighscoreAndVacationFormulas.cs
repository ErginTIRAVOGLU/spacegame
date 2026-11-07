using OGame.Domain.Enums;

namespace OGame.Domain.Services;

public record PlayerPointBreakdown(
    long TotalPoints,
    long EconomyPoints,
    long ResearchPoints,
    long MilitaryPoints,
    double TotalMetalSpent,
    double TotalCrystalSpent,
    double TotalDeuteriumSpent);

public static class HighscoreAndVacationFormulas
{
    public const double PointsResourceDivisor = 1000.0;
    public const int MinimumVacationDurationHours = 48;

    /// <summary>
    /// Point Valuation Formula:
    /// Points = floor((TotalMetalSpent + TotalCrystalSpent + TotalDeuteriumSpent) / 1000)
    /// </summary>
    public static long CalculatePoints(
        double totalMetalSpent,
        double totalCrystalSpent,
        double totalDeuteriumSpent)
    {
        double totalSpent = Math.Max(0.0, totalMetalSpent) +
                            Math.Max(0.0, totalCrystalSpent) +
                            Math.Max(0.0, totalDeuteriumSpent);

        return (long)Math.Floor(totalSpent / PointsResourceDivisor);
    }

    /// <summary>
    /// Aggregates cumulative resources spent upgrading a building from Level 1 through currentLevel.
    /// </summary>
    public static ResourceCost CalculateCumulativeBuildingSpentCost(BuildingType buildingType, int currentLevel)
    {
        if (currentLevel <= 0)
        {
            return new ResourceCost(0.0, 0.0, 0.0);
        }

        double metal = 0.0;
        double crystal = 0.0;
        double deut = 0.0;

        for (int lvl = 1; lvl <= currentLevel; lvl++)
        {
            var cost = ConstructionFormulas.GetBuildingUpgradeCost(buildingType, lvl);
            metal += cost.Metal;
            crystal += cost.Crystal;
            deut += cost.Deuterium;
        }

        return new ResourceCost(metal, crystal, deut);
    }

    /// <summary>
    /// Aggregates cumulative resources spent researching a technology from Level 1 through currentLevel.
    /// </summary>
    public static ResourceCost CalculateCumulativeResearchSpentCost(ResearchType researchType, int currentLevel)
    {
        if (currentLevel <= 0)
        {
            return new ResourceCost(0.0, 0.0, 0.0);
        }

        double metal = 0.0;
        double crystal = 0.0;
        double deut = 0.0;

        for (int lvl = 1; lvl <= currentLevel; lvl++)
        {
            var (cost, _) = ConstructionFormulas.GetResearchDefinition(researchType, lvl);
            metal += cost.Metal;
            crystal += cost.Crystal;
            deut += cost.Deuterium;
        }

        return new ResourceCost(metal, crystal, deut);
    }

    /// <summary>
    /// Aggregates cumulative resources spent on stationed units, defenses, and active fleets.
    /// </summary>
    public static ResourceCost CalculateUnitsSpentCost(IReadOnlyDictionary<UnitType, int> unitCounts)
    {
        if (unitCounts is null || unitCounts.Count == 0)
        {
            return new ResourceCost(0.0, 0.0, 0.0);
        }

        double metal = 0.0;
        double crystal = 0.0;
        double deut = 0.0;

        foreach (var (unitType, count) in unitCounts)
        {
            if (count <= 0) continue;

            var cost = ConstructionFormulas.GetUnitCost(unitType);
            metal += cost.Metal * count;
            crystal += cost.Crystal * count;
            deut += cost.Deuterium * count;
        }

        return new ResourceCost(metal, crystal, deut);
    }

    /// <summary>
    /// Computes the full point valuation breakdown across buildings, researches, defenses, and fleets.
    /// </summary>
    public static PlayerPointBreakdown CalculatePlayerPointBreakdown(
        IEnumerable<(BuildingType BuildingType, int Level)> buildings,
        IEnumerable<(ResearchType ResearchType, int Level)> researches,
        IReadOnlyDictionary<UnitType, int> unitsAndFleets)
    {
        double bMetal = 0.0, bCrystal = 0.0, bDeut = 0.0;
        if (buildings is not null)
        {
            foreach (var (bType, level) in buildings)
            {
                if (level <= 0) continue;
                var cost = CalculateCumulativeBuildingSpentCost(bType, level);
                bMetal += cost.Metal;
                bCrystal += cost.Crystal;
                bDeut += cost.Deuterium;
            }
        }

        double rMetal = 0.0, rCrystal = 0.0, rDeut = 0.0;
        if (researches is not null)
        {
            foreach (var (rType, level) in researches)
            {
                if (level <= 0) continue;
                var cost = CalculateCumulativeResearchSpentCost(rType, level);
                rMetal += cost.Metal;
                rCrystal += cost.Crystal;
                rDeut += cost.Deuterium;
            }
        }

        var uCost = CalculateUnitsSpentCost(unitsAndFleets ?? new Dictionary<UnitType, int>());

        double totalMetal = bMetal + rMetal + uCost.Metal;
        double totalCrystal = bCrystal + rCrystal + uCost.Crystal;
        double totalDeut = bDeut + rDeut + uCost.Deuterium;

        long economyPoints = CalculatePoints(bMetal, bCrystal, bDeut);
        long researchPoints = CalculatePoints(rMetal, rCrystal, rDeut);
        long militaryPoints = CalculatePoints(uCost.Metal, uCost.Crystal, uCost.Deuterium);
        long totalPoints = CalculatePoints(totalMetal, totalCrystal, totalDeut);

        return new PlayerPointBreakdown(
            TotalPoints: totalPoints,
            EconomyPoints: economyPoints,
            ResearchPoints: researchPoints,
            MilitaryPoints: militaryPoints,
            TotalMetalSpent: totalMetal,
            TotalCrystalSpent: totalCrystal,
            TotalDeuteriumSpent: totalDeut);
    }

    /// <summary>
    /// Computes rank shift: DeltaRank = PreviousRank - CurrentRank (positive means moved up in rank).
    /// </summary>
    public static int CalculateRankDelta(int currentRank, int? previousRank)
    {
        if (!previousRank.HasValue || previousRank.Value <= 0)
        {
            return 0;
        }

        return previousRank.Value - currentRank;
    }

    /// <summary>
    /// Minimum Vacation Mode lock duration: UtcNow + 48 hours.
    /// </summary>
    public static DateTime CalculateVacationUntilUtc(DateTime utcNow) =>
        utcNow.AddHours(MinimumVacationDurationHours);

    /// <summary>
    /// Player cannot disable Vacation Mode until UtcNow >= VacationUntilUtc.
    /// </summary>
    public static bool CanDisableVacationMode(DateTime? vacationUntilUtc, DateTime utcNow) =>
        !vacationUntilUtc.HasValue || utcNow >= vacationUntilUtc.Value;
}

