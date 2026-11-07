using OGame.Application.Common.Interfaces;
using OGame.Application.Interfaces;
using OGame.Domain.Entities;
using OGame.Domain.Services;

namespace OGame.Application.Services;

public class ResourceService(IUniverseConfigService? universeConfigService = null) : IResourceCalculationService
{
    private const double SecondsPerHour = 3600.0;

    public double CalculateMetalHourly(int level) =>
        ResourceFormulas.CalculateMetalMineHourly(level);

    public double CalculateCrystalHourly(int level) =>
        ResourceFormulas.CalculateCrystalMineHourly(level);

    public double CalculateDeuteriumHourly(int level, double tempAvg) =>
        ResourceFormulas.CalculateDeuteriumSynthesizerHourly(level, tempAvg);

    public double CalculateSolarPlantEnergy(int level) =>
        ResourceFormulas.CalculateSolarPlantEnergy(level);

    public double CalculateFusionReactorEnergy(int level, int energyTechLevel, double factor = 1.0) =>
        ResourceFormulas.CalculateFusionReactorEnergy(level, energyTechLevel, factor);

    public double CalculateFusionReactorDeuteriumConsumption(int level, double factor = 1.0) =>
        ResourceFormulas.CalculateFusionReactorDeuteriumConsumption(level, factor);

    public double CalculateMetalMineEnergyConsumption(int level) =>
        ResourceFormulas.CalculateMetalMineEnergyConsumption(level);

    public double CalculateCrystalMineEnergyConsumption(int level) =>
        ResourceFormulas.CalculateCrystalMineEnergyConsumption(level);

    public double CalculateDeuteriumSynthesizerEnergyConsumption(int level) =>
        ResourceFormulas.CalculateDeuteriumSynthesizerEnergyConsumption(level);

    public double CalculateEfficiencyRatio(double producedEnergy, double consumedEnergy) =>
        ResourceFormulas.CalculateEfficiencyRatio(producedEnergy, consumedEnergy);

    public ResourceProductionSnapshot CalculateProduction(Planet planet, double fusionFactor = 1.0)
    {
        var baseSnapshot = ResourceFormulas.CalculatePlanetProduction(planet, null, fusionFactor);
        double econMultiplier = Math.Max(0.0, universeConfigService?.GetCachedConfig().EconomySpeedMultiplier ?? 1.0);
        if (Math.Abs(econMultiplier - 1.0) < 1e-9)
        {
            return baseSnapshot;
        }

        return baseSnapshot with
        {
            MetalPerHour = baseSnapshot.MetalPerHour * econMultiplier,
            CrystalPerHour = baseSnapshot.CrystalPerHour * econMultiplier,
            DeuteriumPerHour = baseSnapshot.DeuteriumPerHour * econMultiplier
        };
    }

    public PlanetResourceState GetCurrentResources(Planet planet, DateTime utcNow, double fusionFactor = 1.0)
    {
        ArgumentNullException.ThrowIfNull(planet);

        var production = CalculateProduction(planet, fusionFactor);
        double elapsedSeconds = Math.Max(0.0, (utcNow - planet.LastResourceUpdateUtc).TotalSeconds);
        double elapsedHours = elapsedSeconds / SecondsPerHour;

        double currentMetal = planet.Metal + (production.MetalPerHour * elapsedHours);
        double currentCrystal = planet.Crystal + (production.CrystalPerHour * elapsedHours);
        double currentDeuterium = planet.Deuterium + (production.DeuteriumPerHour * elapsedHours);

        return new PlanetResourceState(
            PlanetId: planet.Id,
            Metal: currentMetal,
            Crystal: currentCrystal,
            Deuterium: currentDeuterium,
            MetalPerHour: production.MetalPerHour,
            CrystalPerHour: production.CrystalPerHour,
            DeuteriumPerHour: production.DeuteriumPerHour,
            ProducedEnergy: production.ProducedEnergy,
            ConsumedEnergy: production.ConsumedEnergy,
            EfficiencyRatio: production.EfficiencyRatio,
            ComputedAtUtc: utcNow);
    }

    public void ApplyLazyUpdate(Planet planet, DateTime utcNow)
    {
        ArgumentNullException.ThrowIfNull(planet);

        var current = GetCurrentResources(planet, utcNow);
        planet.Metal = current.Metal;
        planet.Crystal = current.Crystal;
        planet.Deuterium = current.Deuterium;
        planet.LastResourceUpdateUtc = utcNow;
    }
}

