using OGame.Domain.Services;
using Xunit;

namespace OGame.Domain.Tests;

public class LifeformsHumansFormulasTests
{
    [Fact]
    public void CanonicalLore_And_Metadata_AreAccurate()
    {
        Assert.Equal("İnsanlar", LifeformsHumansFormulas.SpeciesName);
        Assert.Contains("İnsanlar çok yönlü yeteneklere sahip bir canlı türüdür", LifeformsHumansFormulas.CanonicalLore);
        Assert.Contains("Sınıf bonusunu güçlendirmezler", LifeformsHumansFormulas.CanonicalLore);
    }

    [Fact]
    public void PopulationGrowth_Formula_CalculatesNetGrowth_And_HandlesStarvation()
    {
        // 1. Full food reserve: NetGrowth = (BaseGrowthRate + HousingBonus) * 1.0
        double normalGrowth = LifeformsHumansFormulas.CalculateNetGrowthRate(
            baseGrowthRate: 10.0,
            housingBonus: 5.0,
            foodReserve: 1000.0,
            foodConsumption: 500.0,
            currentPopulation: 1000.0);
        Assert.Equal(15.0, normalGrowth, precision: 2);

        // 2. Partial food reserve: NetGrowth = (BaseGrowthRate + HousingBonus) * (FoodReserve / FoodConsumption)
        double halfGrowth = LifeformsHumansFormulas.CalculateNetGrowthRate(
            baseGrowthRate: 10.0,
            housingBonus: 5.0,
            foodReserve: 250.0,
            foodConsumption: 500.0,
            currentPopulation: 1000.0);
        Assert.Equal(7.5, halfGrowth, precision: 2);

        // 3. Starvation: FoodReserve <= 0 -> Growth stops and population degrades
        double starvedGrowth = LifeformsHumansFormulas.CalculateNetGrowthRate(
            baseGrowthRate: 10.0,
            housingBonus: 5.0,
            foodReserve: 0.0,
            foodConsumption: 500.0,
            currentPopulation: 1000.0);
        Assert.True(starvedGrowth < 0, "When food is depleted, growth must be negative (pop degradation).");
        Assert.Equal(-20.0, starvedGrowth, precision: 2);
    }

    [Fact]
    public void PopulationCapacity_And_Tiers_Transformation_WorkCorrectly()
    {
        // Zero levels
        var (t1Zero, t2Zero, t3Zero) = LifeformsHumansFormulas.CalculatePopulationTiers(0, 0, 0, 0);
        Assert.Equal(0, t1Zero);
        Assert.Equal(0, t2Zero);
        Assert.Equal(0, t3Zero);

        // Level 2 Residential, Level 0 Skyscraper, Level 0 Academy, Level 0 Neuro
        var (t1Only, t2None, t3None) = LifeformsHumansFormulas.CalculatePopulationTiers(2, 0, 0, 0);
        Assert.Equal(250, t1Only);
        Assert.Equal(0, t2None);
        Assert.Equal(0, t3None);

        // With Academy and Neuro-calibration
        var (t1, t2, t3) = LifeformsHumansFormulas.CalculatePopulationTiers(
            residentialLevel: 10,
            skyscraperLevel: 2,
            academyLevel: 3,
            neuroLevel: 2);

        Assert.True(t1 > 0);
        Assert.True(t2 > 0);
        Assert.True(t3 > 0);
        Assert.True(t2 <= academyLevelMax(3));
        Assert.True(t3 <= neuroLevelMax(2));

        static int academyLevelMax(int lvl) => lvl * 80;
        static int neuroLevelMax(int lvl) => lvl * 40;
    }

    [Fact]
    public void Catalog_Contains12Buildings_And_18Technologies_Across3Tiers()
    {
        Assert.Equal(12, LifeformsHumansFormulas.Buildings.Count);
        Assert.Equal(18, LifeformsHumansFormulas.Technologies.Count);

        // Verify 12 building keys
        var expectedBuildingKeys = new[]
        {
            "residentialSector", "biosphereFarm", "researchCentre", "academyOfSciences",
            "neuroCalibrationCentre", "highEnergySmelting", "foodSilo", "fusionPoweredProduction",
            "skyscraper", "biotechLab", "metropolis", "planetaryShield"
        };

        foreach (var key in expectedBuildingKeys)
        {
            Assert.Contains(LifeformsHumansFormulas.Buildings, b => b.Key == key);
        }

        // Verify 6 techs per tier (T1: 1-6, T2: 7-12, T3: 13-18)
        var t1Techs = LifeformsHumansFormulas.Technologies.Where(t => t.Tier == 1).ToList();
        var t2Techs = LifeformsHumansFormulas.Technologies.Where(t => t.Tier == 2).ToList();
        var t3Techs = LifeformsHumansFormulas.Technologies.Where(t => t.Tier == 3).ToList();

        Assert.Equal(6, t1Techs.Count);
        Assert.Equal(6, t2Techs.Count);
        Assert.Equal(6, t3Techs.Count);

        // Check population unlock requirement progression (Official Sidian OGame Wiki thresholds)
        Assert.True(LifeformsHumansFormulas.IsTechUnlocked(1, 200000));
        Assert.False(LifeformsHumansFormulas.IsTechUnlocked(1, 199999));

        Assert.True(LifeformsHumansFormulas.IsTechUnlocked(7, 1200000));
        Assert.False(LifeformsHumansFormulas.IsTechUnlocked(7, 1199999));

        Assert.True(LifeformsHumansFormulas.IsTechUnlocked(18, 448000000));
        Assert.False(LifeformsHumansFormulas.IsTechUnlocked(18, 447999999));
    }

    [Fact]
    public void ResearchCentre_Reduces_TechUpgradeCosts_AndDuration()
    {
        var costNoResearchCenter = LifeformsHumansFormulas.CalculateTechUpgrade(slot: 1, currentLevel: 0, researchCentreLevel: 0);
        var costHighResearchCenter = LifeformsHumansFormulas.CalculateTechUpgrade(slot: 1, currentLevel: 0, researchCentreLevel: 10);

        Assert.True(costHighResearchCenter.Metal < costNoResearchCenter.Metal);
        Assert.True(costHighResearchCenter.Crystal < costNoResearchCenter.Crystal);
        Assert.True(costHighResearchCenter.DurationSeconds <= costNoResearchCenter.DurationSeconds);
    }
}

