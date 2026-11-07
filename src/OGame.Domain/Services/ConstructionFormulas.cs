using OGame.Domain.Enums;

namespace OGame.Domain.Services;

public record ResourceCost(double Metal, double Crystal, double Deuterium);
public record ResearchPrerequisite(ResearchType Type, int Level);

public static class ConstructionFormulas
{
    /// <summary>
    /// Building Duration Formula:
    /// Duration = ((MetalCost + CrystalCost) / (2500 * (1 + RoboticsLevel) * 2^NaniteLevel)) * 3600 seconds
    /// </summary>
    public static double CalculateBuildingDurationSeconds(
        double metalCost,
        double crystalCost,
        int roboticsLevel,
        int naniteLevel)
    {
        double denominator = 2500.0 * (1.0 + Math.Max(0, roboticsLevel)) * Math.Pow(2.0, Math.Max(0, naniteLevel));
        return Math.Max(1.0, ((metalCost + crystalCost) / denominator) * 3600.0);
    }

    /// <summary>
    /// IRN Effective Lab Level:
    /// Selects the origin planet's Research Lab plus the top N = IRNLevel highest-level Research Labs
    /// across the player's other planets (provided each lab meets the research minimum lab prerequisite).
    /// </summary>
    public static int CalculateEffectiveResearchLabLevel(
        int originLabLevel,
        IEnumerable<int> otherPlanetLabLevels,
        int irnLevel,
        int requiredMinLabLevel = 1)
    {
        if (originLabLevel < requiredMinLabLevel)
        {
            return 0;
        }

        int topCount = Math.Max(0, irnLevel);
        int additionalLabsSum = (otherPlanetLabLevels ?? [])
            .Where(level => level >= requiredMinLabLevel)
            .OrderByDescending(level => level)
            .Take(topCount)
            .Sum();

        return originLabLevel + additionalLabsSum;
    }

    /// <summary>
    /// Research Duration Formula:
    /// ResearchDuration = ((MetalCost + CrystalCost) / (1000 * (1 + EffectiveLabLevel))) * 3600 seconds
    /// </summary>
    public static double CalculateResearchDurationSeconds(
        double metalCost,
        double crystalCost,
        int effectiveLabLevel)
    {
        double denominator = 1000.0 * (1.0 + Math.Max(0, effectiveLabLevel));
        return Math.Max(1.0, ((metalCost + crystalCost) / denominator) * 3600.0);
    }

    /// <summary>
    /// Shipyard / Defense Unit Build Duration Formula:
    /// UnitDuration = ((MetalCost + CrystalCost) / (2500 * (1 + ShipyardLevel) * 2^NaniteLevel)) * 3600 seconds
    /// </summary>
    public static double CalculateUnitDurationSeconds(
        double metalCost,
        double crystalCost,
        int shipyardLevel,
        int naniteLevel)
    {
        double denominator = 2500.0 * (1.0 + Math.Max(0, shipyardLevel)) * Math.Pow(2.0, Math.Max(0, naniteLevel));
        return Math.Max(1.0, ((metalCost + crystalCost) / denominator) * 3600.0);
    }

    /// <summary>
    /// Shipyard Batch Lazy Evaluation Formula:
    /// FinishedUnits = min(TotalCount - CompletedCount, floor((UtcNow - BatchStartTimeUtc) / UnitDuration) - CompletedCount)
    /// </summary>
    public static int CalculateFinishedBatchUnits(
        int totalCount,
        int completedCount,
        double unitDurationSeconds,
        DateTime batchStartTimeUtc,
        DateTime utcNow)
    {
        if (completedCount >= totalCount || unitDurationSeconds <= 0)
        {
            return 0;
        }

        double elapsedSeconds = (utcNow - batchStartTimeUtc).TotalSeconds;
        if (elapsedSeconds <= 0)
        {
            return 0;
        }

        int totalElapsedUnits = (int)Math.Floor(elapsedSeconds / unitDurationSeconds);
        int newlyFinished = totalElapsedUnits - completedCount;
        if (newlyFinished <= 0)
        {
            return 0;
        }

        int remaining = totalCount - completedCount;
        return Math.Min(remaining, newlyFinished);
    }

    public static ResourceCost GetBuildingUpgradeCost(BuildingType buildingType, int targetLevel)
    {
        int level = Math.Max(1, targetLevel);
        var (baseMetal, baseCrystal, baseDeut, factor) = buildingType switch
        {
            BuildingType.MetalMine => (60.0, 15.0, 0.0, 1.5),
            BuildingType.CrystalMine => (48.0, 24.0, 0.0, 1.6),
            BuildingType.DeuteriumSynthesizer => (225.0, 75.0, 0.0, 1.5),
            BuildingType.SolarPlant => (75.0, 30.0, 0.0, 1.5),
            BuildingType.FusionReactor => (900.0, 360.0, 180.0, 1.8),
            BuildingType.RoboticsFactory => (400.0, 120.0, 200.0, 2.0),
            BuildingType.NaniteFactory => (1_000_000.0, 500_000.0, 100_000.0, 2.0),
            BuildingType.Shipyard => (400.0, 200.0, 100.0, 2.0),
            BuildingType.MetalStorage => (1000.0, 0.0, 0.0, 2.0),
            BuildingType.CrystalStorage => (1000.0, 500.0, 0.0, 2.0),
            BuildingType.DeuteriumTank => (1000.0, 1000.0, 0.0, 2.0),
            BuildingType.ResearchLab => (200.0, 400.0, 200.0, 2.0),
            BuildingType.Terraformer => (0.0, 50_000.0, 100_000.0, 2.0),
            BuildingType.AllianceDepot => (20_000.0, 40_000.0, 0.0, 2.0),
            BuildingType.SpaceDock => (200.0, 0.0, 50.0, 5.0),
            BuildingType.MoonBase => (20_000.0, 40_000.0, 20_000.0, 2.0),
            BuildingType.SensorPhalanx => (20_000.0, 40_000.0, 20_000.0, 2.0),
            BuildingType.JumpGate => (2_000_000.0, 4_000_000.0, 2_000_000.0, 2.0),
            BuildingType.MissileSilo => (20_000.0, 20_000.0, 1000.0, 2.0),
            _ => (100.0, 100.0, 0.0, 2.0)
        };

        double multiplier = Math.Pow(factor, level - 1);
        return new ResourceCost(
            Metal: Math.Floor(baseMetal * multiplier),
            Crystal: Math.Floor(baseCrystal * multiplier),
            Deuterium: Math.Floor(baseDeut * multiplier));
    }

    /// <summary>
    /// Indestructible buildings (Task 15): Space Dock, Terraformer and Lunar Base (Moon Base) can never be demolished.
    /// </summary>
    public static bool CanDemolish(BuildingType buildingType)
    {
        return buildingType is not (BuildingType.SpaceDock or BuildingType.Terraformer or BuildingType.MoonBase);
    }

    /// <summary>Ion Technology discount on demolition: 4% per level, 100% (free) at level 25.</summary>
    public static double CalculateDemolitionDiscountFactor(int ionTechLevel)
    {
        return Math.Max(0.0, 1.0 - 0.04 * Math.Max(0, ionTechLevel));
    }

    /// <summary>
    /// Demolition Cost Formula:
    /// DeconstructCost = floor(BaseCost * Factor^(Level-1) * max(0, 1 - 0.04 * IonTechLevel))
    /// </summary>
    public static ResourceCost CalculateDemolitionCost(BuildingType buildingType, int currentLevel, int ionTechLevel)
    {
        if (currentLevel <= 0)
        {
            return new ResourceCost(0, 0, 0);
        }

        var baseCost = GetBuildingUpgradeCost(buildingType, currentLevel);
        double factor = CalculateDemolitionDiscountFactor(ionTechLevel);

        return new ResourceCost(
            Metal: Math.Floor(baseCost.Metal * factor),
            Crystal: Math.Floor(baseCost.Crystal * factor),
            Deuterium: Math.Floor(baseCost.Deuterium * factor));
    }

    public static (ResourceCost Cost, int RequiredLabLevel) GetResearchDefinition(ResearchType researchType, int targetLevel)
    {
        int level = Math.Max(1, targetLevel);
        var (baseMetal, baseCrystal, baseDeut, factor, minLabLevel) = researchType switch
        {
            ResearchType.EnergyTechnology => (0.0, 800.0, 400.0, 2.0, 1),
            ResearchType.LaserTechnology => (200.0, 100.0, 0.0, 2.0, 1),
            ResearchType.IonTechnology => (1000.0, 300.0, 100.0, 2.0, 4),
            ResearchType.HyperspaceTechnology => (0.0, 4000.0, 2000.0, 2.0, 7),
            ResearchType.PlasmaTechnology => (2000.0, 4000.0, 1000.0, 2.0, 4),
            ResearchType.CombustionDrive => (400.0, 0.0, 600.0, 2.0, 1),
            ResearchType.ImpulseDrive => (2000.0, 4000.0, 600.0, 2.0, 2),
            ResearchType.HyperspaceDrive => (10_000.0, 20_000.0, 6000.0, 2.0, 7),
            ResearchType.EspionageTechnology => (200.0, 1000.0, 200.0, 2.0, 3),
            ResearchType.ComputerTechnology => (0.0, 400.0, 600.0, 2.0, 1),
            ResearchType.Astrophysics => (4000.0, 8000.0, 4000.0, 1.75, 3),
            ResearchType.IntergalacticResearchNetwork => (240_000.0, 400_000.0, 160_000.0, 2.0, 10),
            ResearchType.GravitonTechnology => (0.0, 0.0, 0.0, 3.0, 12),
            ResearchType.WeaponsTechnology => (800.0, 200.0, 0.0, 2.0, 4),
            ResearchType.ShieldingTechnology => (200.0, 600.0, 0.0, 2.0, 6),
            ResearchType.ArmourTechnology => (1000.0, 0.0, 0.0, 2.0, 2),
            _ => (200.0, 200.0, 0.0, 2.0, 1)
        };

        double multiplier = Math.Pow(factor, level - 1);
        return (
            new ResourceCost(
                Metal: Math.Floor(baseMetal * multiplier),
                Crystal: Math.Floor(baseCrystal * multiplier),
                Deuterium: Math.Floor(baseDeut * multiplier)),
            minLabLevel);
    }

    public static IReadOnlyList<ResearchPrerequisite> GetResearchPrerequisites(ResearchType researchType) =>
        researchType switch
        {
            ResearchType.EnergyTechnology => [],
            ResearchType.LaserTechnology => [new(ResearchType.EnergyTechnology, 2)],
            ResearchType.IonTechnology => [new(ResearchType.EnergyTechnology, 4), new(ResearchType.LaserTechnology, 5)],
            ResearchType.HyperspaceTechnology => [new(ResearchType.EnergyTechnology, 5), new(ResearchType.ShieldingTechnology, 5)],
            ResearchType.PlasmaTechnology => [new(ResearchType.EnergyTechnology, 8), new(ResearchType.LaserTechnology, 10), new(ResearchType.IonTechnology, 5)],
            ResearchType.CombustionDrive => [new(ResearchType.EnergyTechnology, 1)],
            ResearchType.ImpulseDrive => [new(ResearchType.EnergyTechnology, 1)],
            ResearchType.HyperspaceDrive => [new(ResearchType.HyperspaceTechnology, 3)],
            ResearchType.EspionageTechnology => [],
            ResearchType.ComputerTechnology => [],
            ResearchType.Astrophysics => [new(ResearchType.EspionageTechnology, 4), new(ResearchType.ImpulseDrive, 3)],
            ResearchType.IntergalacticResearchNetwork => [new(ResearchType.ComputerTechnology, 8), new(ResearchType.HyperspaceTechnology, 8)],
            ResearchType.GravitonTechnology => [],
            ResearchType.WeaponsTechnology => [],
            ResearchType.ShieldingTechnology => [new(ResearchType.EnergyTechnology, 3)],
            ResearchType.ArmourTechnology => [],
            _ => []
        };

    public static ResourceCost GetUnitCost(UnitType unitType)
    {
        return unitType switch
        {
            UnitType.SmallCargo => new ResourceCost(2000, 2000, 0),
            UnitType.LargeCargo => new ResourceCost(6000, 6000, 0),
            UnitType.LightFighter => new ResourceCost(3000, 1000, 0),
            UnitType.HeavyFighter => new ResourceCost(6000, 4000, 0),
            UnitType.Cruiser => new ResourceCost(20_000, 7000, 2000),
            UnitType.Battleship => new ResourceCost(45_000, 15_000, 0),
            UnitType.ColonyShip => new ResourceCost(10_000, 20_000, 10_000),
            UnitType.Recycler => new ResourceCost(10_000, 6000, 2000),
            UnitType.EspionageProbe => new ResourceCost(0, 1000, 0),
            UnitType.Bomber => new ResourceCost(50_000, 25_000, 15_000),
            UnitType.SolarSatellite => new ResourceCost(0, 2000, 500),
            UnitType.Destroyer => new ResourceCost(60_000, 50_000, 15_000),
            UnitType.Deathstar => new ResourceCost(5_000_000, 4_000_000, 1_000_000),
            UnitType.Battlecruiser => new ResourceCost(30_000, 40_000, 15_000),
            UnitType.Crawler => new ResourceCost(2000, 2000, 1000),
            UnitType.Reaper => new ResourceCost(85_000, 55_000, 20_000),
            UnitType.Pathfinder => new ResourceCost(12_000, 15_000, 8000),
            UnitType.RocketLauncher => new ResourceCost(2000, 0, 0),
            UnitType.LightLaser => new ResourceCost(1500, 500, 0),
            UnitType.HeavyLaser => new ResourceCost(6000, 2000, 0),
            UnitType.GaussCannon => new ResourceCost(20_000, 15_000, 2000),
            UnitType.IonCannon => new ResourceCost(2000, 6000, 0),
            UnitType.PlasmaTurret => new ResourceCost(50_000, 50_000, 30_000),
            UnitType.SmallShieldDome => new ResourceCost(10_000, 10_000, 0),
            UnitType.LargeShieldDome => new ResourceCost(50_000, 50_000, 0),
            UnitType.AntiBallisticMissile => new ResourceCost(8000, 0, 2000),
            UnitType.InterplanetaryMissile => new ResourceCost(12_500, 2500, 10_000),
            _ => new ResourceCost(1000, 1000, 0)
        };
    }
}

