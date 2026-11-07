using OGame.Domain.Entities;
using OGame.Domain.Services;

namespace OGame.Application.Interfaces;

public record PlanetResourceState(
    Guid PlanetId,
    double Metal,
    double Crystal,
    double Deuterium,
    double MetalPerHour,
    double CrystalPerHour,
    double DeuteriumPerHour,
    double ProducedEnergy,
    double ConsumedEnergy,
    double EfficiencyRatio,
    DateTime ComputedAtUtc);

public interface IResourceCalculationService
{
    double CalculateMetalHourly(int level);
    double CalculateCrystalHourly(int level);
    double CalculateDeuteriumHourly(int level, double tempAvg);
    double CalculateSolarPlantEnergy(int level);
    double CalculateFusionReactorEnergy(int level, int energyTechLevel, double factor = 1.0);
    double CalculateFusionReactorDeuteriumConsumption(int level, double factor = 1.0);
    double CalculateMetalMineEnergyConsumption(int level);
    double CalculateCrystalMineEnergyConsumption(int level);
    double CalculateDeuteriumSynthesizerEnergyConsumption(int level);
    double CalculateEfficiencyRatio(double producedEnergy, double consumedEnergy);

    ResourceProductionSnapshot CalculateProduction(Planet planet, double fusionFactor = 1.0);

    /// <summary>
    /// Computes the current resources dynamically without mutating the planet state.
    /// </summary>
    PlanetResourceState GetCurrentResources(Planet planet, DateTime utcNow, double fusionFactor = 1.0);

    /// <summary>
    /// Mutates the planet's Metal, Crystal, Deuterium, and sets LastResourceUpdateUtc = utcNow.
    /// Call this only when state mutates (e.g., spending resources, upgrading buildings, fleet arrival).
    /// </summary>
    void ApplyLazyUpdate(Planet planet, DateTime utcNow);
}

