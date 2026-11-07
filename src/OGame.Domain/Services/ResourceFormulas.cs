using OGame.Domain.Entities;
using OGame.Domain.Enums;

namespace OGame.Domain.Services;

public record ResourceProductionSnapshot(
    double MetalPerHour,
    double CrystalPerHour,
    double DeuteriumPerHour,
    double ProducedEnergy,
    double ConsumedEnergy,
    double EfficiencyRatio);

public static class ResourceFormulas
{
    public const double BaseMetalPerHour = 30.0;
    public const double BaseCrystalPerHour = 15.0;
    public const double BaseDeuteriumPerHour = 0.0;

    /// <summary>
    /// Metal Hourly: 30 * Level * 1.1^Level
    /// </summary>
    public static double CalculateMetalMineHourly(int level)
    {
        if (level <= 0) return 0.0;
        return 30.0 * level * Math.Pow(1.1, level);
    }

    /// <summary>
    /// Crystal Hourly: 20 * Level * 1.1^Level
    /// </summary>
    public static double CalculateCrystalMineHourly(int level)
    {
        if (level <= 0) return 0.0;
        return 20.0 * level * Math.Pow(1.1, level);
    }

    /// <summary>
    /// Deuterium Hourly: 10 * Level * 1.1^Level * (-0.004 * TempAvg + 1.36)
    /// </summary>
    public static double CalculateDeuteriumSynthesizerHourly(int level, double tempAvg)
    {
        if (level <= 0) return 0.0;
        return 10.0 * level * Math.Pow(1.1, level) * (-0.004 * tempAvg + 1.36);
    }

    // Plasma Technology per-level production bonuses
    public const double PlasmaMetalBonusPerLevel = 0.01;
    public const double PlasmaCrystalBonusPerLevel = 0.0066;
    public const double PlasmaDeuteriumBonusPerLevel = 0.0033;

    /// <summary>
    /// Deuterium Base (Task 15): floor(10 * L * 1.1^L * (1.44 - 0.004 * TMax)).
    /// </summary>
    public static double CalculateDeuteriumSynthesizerHourlyByMaxTemp(int level, double tempMax)
    {
        if (level <= 0) return 0.0;
        double factor = Math.Max(0.0, 1.44 - 0.004 * tempMax);
        return Math.Floor(10.0 * level * Math.Pow(1.1, level) * factor);
    }

    /// <summary>
    /// Solar Plant Energy: 20 * Level * 1.1^Level
    /// </summary>
    public static double CalculateSolarPlantEnergy(int level)
    {
        if (level <= 0) return 0.0;
        return 20.0 * level * Math.Pow(1.1, level);
    }

    /// <summary>
    /// Metal Mine Energy Consumption: 10 * Level * 1.1^Level
    /// </summary>
    public static double CalculateMetalMineEnergyConsumption(int level)
    {
        if (level <= 0) return 0.0;
        return 10.0 * level * Math.Pow(1.1, level);
    }

    /// <summary>
    /// Crystal Mine Energy Consumption: 10 * Level * 1.1^Level
    /// </summary>
    public static double CalculateCrystalMineEnergyConsumption(int level)
    {
        if (level <= 0) return 0.0;
        return 10.0 * level * Math.Pow(1.1, level);
    }

    /// <summary>
    /// Deuterium Synthesizer Energy Consumption: 30 * Level * 1.1^Level
    /// </summary>
    public static double CalculateDeuteriumSynthesizerEnergyConsumption(int level)
    {
        if (level <= 0) return 0.0;
        return 30.0 * level * Math.Pow(1.1, level);
    }

    /// <summary>
    /// Fusion Reactor Energy: floor(30 * Level * (1 + 0.01 * EnergyTechLevel)^Level) * Factor
    /// </summary>
    public static double CalculateFusionReactorEnergy(int level, int energyTechLevel, double factor = 1.0)
    {
        if (level <= 0 || factor <= 0.0) return 0.0;
        double clampedFactor = Math.Clamp(factor, 0.0, 1.0);
        double baseEnergy = Math.Floor(30.0 * level * Math.Pow(1.0 + (0.01 * energyTechLevel), level));
        return Math.Floor(baseEnergy * clampedFactor);
    }

    /// <summary>
    /// Fusion Reactor Deuterium Hourly Consumption: floor(10 * Level * 1.1^Level) * Factor
    /// </summary>
    public static double CalculateFusionReactorDeuteriumConsumption(int level, double factor = 1.0)
    {
        if (level <= 0 || factor <= 0.0) return 0.0;
        double clampedFactor = Math.Clamp(factor, 0.0, 1.0);
        double baseCost = Math.Floor(10.0 * level * Math.Pow(1.1, level));
        return Math.Floor(baseCost * clampedFactor);
    }

    /// <summary>
    /// Efficiency Ratio: If ProducedEnergy < ConsumedEnergy, scale production by (Produced / Consumed).
    /// </summary>
    public static double CalculateEfficiencyRatio(double producedEnergy, double consumedEnergy)
    {
        if (consumedEnergy <= 0.0) return 1.0;
        if (producedEnergy <= 0.0) return 0.0;
        if (producedEnergy < consumedEnergy)
        {
            return producedEnergy / consumedEnergy;
        }
        return 1.0;
    }

    public static ResourceProductionSnapshot CalculatePlanetProduction(
        Planet planet,
        PlayerClass? explicitClass = null,
        double fusionFactor = 1.0)
    {
        ArgumentNullException.ThrowIfNull(planet);

        var buildings = planet.Buildings ?? [];
        int metalLevel = buildings.FirstOrDefault(b => b.BuildingType == BuildingType.MetalMine)?.Level ?? 0;
        int crystalLevel = buildings.FirstOrDefault(b => b.BuildingType == BuildingType.CrystalMine)?.Level ?? 0;
        int deutLevel = buildings.FirstOrDefault(b => b.BuildingType == BuildingType.DeuteriumSynthesizer)?.Level ?? 0;
        int solarLevel = buildings.FirstOrDefault(b => b.BuildingType == BuildingType.SolarPlant)?.Level ?? 0;
        int fusionLevel = buildings.FirstOrDefault(b => b.BuildingType == BuildingType.FusionReactor)?.Level ?? 0;

        int energyTechLevel = (planet.User?.Researches ?? [])
            .FirstOrDefault(r => r.ResearchType == ResearchType.EnergyTechnology)?.Level ?? 0;

        int solarSatCount = (planet.Units ?? [])
            .FirstOrDefault(u => u.UnitType == UnitType.SolarSatellite)?.Count ?? 0;

        double tempAvg = (planet.TempMin + planet.TempMax) / 2.0;

        double solarSatEnergy = solarSatCount > 0
            ? solarSatCount * ColonizationFormulas.CalculateSolarSatelliteEnergyPerUnit(planet.TempMax)
            : 0.0;

        bool hasDeuteriumFuel = fusionLevel > 0 && (planet.Deuterium > 0.0 || deutLevel > 0);
        double rawFusionEnergy = hasDeuteriumFuel
            ? CalculateFusionReactorEnergy(fusionLevel, energyTechLevel, fusionFactor)
            : 0.0;
        double fusionDeutConsumption = hasDeuteriumFuel
            ? CalculateFusionReactorDeuteriumConsumption(fusionLevel, fusionFactor)
            : 0.0;

        var effectiveClass = explicitClass ?? planet.User?.PlayerClass ?? PlayerClass.None;
        double energyMultiplier = effectiveClass == PlayerClass.Collector ? PlayerClassFormulas.CollectorEnergyMultiplier : 1.0;
        double mineMultiplier = effectiveClass == PlayerClass.Collector ? PlayerClassFormulas.CollectorMineMultiplier : 1.0;

        var now = DateTime.UtcNow;
        bool hasGeologist = (planet.User?.Officers ?? [])
            .Any(o => o.Type == OfficerType.Geologist && o.ExpiresAtUtc > now);
        bool hasEngineer = (planet.User?.Officers ?? [])
            .Any(o => o.Type == OfficerType.Engineer && o.ExpiresAtUtc > now);
        double geologistBonus = hasGeologist ? 0.10 : 0.0;
        double engineerBonus = hasEngineer ? 0.10 : 0.0;

        var activeBoosters = (planet.ActiveBoosters ?? [])
            .Where(b => b.ExpiresAtUtc > now)
            .ToList();

        double metalBooster = activeBoosters.FirstOrDefault(b => b.ResourceType.Equals("Metal", StringComparison.OrdinalIgnoreCase))?.Multiplier ?? 0.0;
        double crystalBooster = activeBoosters.FirstOrDefault(b => b.ResourceType.Equals("Crystal", StringComparison.OrdinalIgnoreCase))?.Multiplier ?? 0.0;
        double deutBooster = activeBoosters.FirstOrDefault(b => b.ResourceType.Equals("Deuterium", StringComparison.OrdinalIgnoreCase))?.Multiplier ?? 0.0;

        double grossEnergy = CalculateSolarPlantEnergy(solarLevel) + solarSatEnergy + rawFusionEnergy;
        double producedEnergy = grossEnergy * (energyMultiplier + engineerBonus);
        double consumedEnergy =
            CalculateMetalMineEnergyConsumption(metalLevel) +
            CalculateCrystalMineEnergyConsumption(crystalLevel) +
            CalculateDeuteriumSynthesizerEnergyConsumption(deutLevel);

        double efficiency = CalculateEfficiencyRatio(producedEnergy, consumedEnergy);

        if (planet.IsProductionFrozen || planet.IsDestroyedPlanet || planet.User?.IsVacationMode == true)
        {
            return new ResourceProductionSnapshot(
                MetalPerHour: 0.0,
                CrystalPerHour: 0.0,
                DeuteriumPerHour: 0.0,
                ProducedEnergy: 0.0,
                ConsumedEnergy: 0.0,
                EfficiencyRatio: 0.0);
        }

        if (planet.IsMoon)
        {
            return new ResourceProductionSnapshot(
                MetalPerHour: 0.0,
                CrystalPerHour: 0.0,
                DeuteriumPerHour: 0.0,
                ProducedEnergy: producedEnergy,
                ConsumedEnergy: consumedEnergy,
                EfficiencyRatio: efficiency);
        }

        int plasmaLevel = (planet.User?.Researches ?? [])
            .FirstOrDefault(r => r.ResearchType == ResearchType.PlasmaTechnology)?.Level ?? 0;
        double plasmaMetalBonus = plasmaLevel * PlasmaMetalBonusPerLevel;
        double plasmaCrystalBonus = plasmaLevel * PlasmaCrystalBonusPerLevel;
        double plasmaDeutBonus = plasmaLevel * PlasmaDeuteriumBonusPerLevel;

        var (slotMetalMult, slotCrystalMult) = ColonizationFormulas.GetSlotProductionMultipliers(planet.Slot);

        double metalMineBase = CalculateMetalMineHourly(metalLevel) * slotMetalMult;
        double crystalMineBase = CalculateCrystalMineHourly(crystalLevel) * slotCrystalMult;
        double deutMineBase = deutLevel > 0
            ? 10.0 * deutLevel * Math.Pow(1.1, deutLevel) * Math.Max(0.0, 1.44 - 0.004 * planet.TempMax)
            : 0.0;

        double metalPerHour = BaseMetalPerHour + (metalMineBase * efficiency * (mineMultiplier + metalBooster + geologistBonus + plasmaMetalBonus));
        double crystalPerHour = BaseCrystalPerHour + (crystalMineBase * efficiency * (mineMultiplier + crystalBooster + geologistBonus + plasmaCrystalBonus));
        double grossDeutPerHour = BaseDeuteriumPerHour + (deutMineBase * efficiency * (mineMultiplier + deutBooster + geologistBonus + plasmaDeutBonus));
        double deutPerHour = Math.Max(0.0, grossDeutPerHour - fusionDeutConsumption);

        return new ResourceProductionSnapshot(
            MetalPerHour: metalPerHour,
            CrystalPerHour: crystalPerHour,
            DeuteriumPerHour: deutPerHour,
            ProducedEnergy: producedEnergy,
            ConsumedEnergy: consumedEnergy,
            EfficiencyRatio: efficiency);
    }

    /// <summary>
    /// Storage Capacity Formula:
    /// Capacity = 5000 * floor(2.5 * e^(20 * Level / 33))
    /// Base capacity at Level 0 is 10,000.
    /// </summary>
    public static double CalculateStorageCapacity(int level)
    {
        if (level <= 0) return 10_000.0;
        return 5000.0 * Math.Floor(2.5 * Math.Exp(20.0 * level / 33.0));
    }
}

