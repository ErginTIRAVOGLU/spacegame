using OGame.Domain.Enums;
using OGame.Domain.Services;

namespace OGame.Domain.Tests;

public class ConstructionAndQueueFormulasTests
{
    [Fact]
    public void CalculateBuildingDurationSeconds_ShouldMatchExactFormula()
    {
        // Formula: ((MetalCost + CrystalCost) / (2500 * (1 + RoboticsLevel) * 2^NaniteLevel)) * 3600
        double metalCost = 5000.0;
        double crystalCost = 2500.0;
        int roboticsLevel = 2; // 1 + 2 = 3
        int naniteLevel = 1;   // 2^1 = 2
        // Denominator = 2500 * 3 * 2 = 15000
        // (7500 / 15000) * 3600 = 0.5 * 3600 = 1800 seconds

        double duration = ConstructionFormulas.CalculateBuildingDurationSeconds(
            metalCost,
            crystalCost,
            roboticsLevel,
            naniteLevel);

        Assert.Equal(1800.0, duration, precision: 6);
    }

    [Fact]
    public void CalculateEffectiveResearchLabLevel_WithIRN_ShouldSelectOriginPlusTopNEligibleLabs()
    {
        // Origin planet has Lab Level 8.
        // Other planets have Lab Levels: [10, 7, 5, 3, 2]
        // Suppose research requires min lab level 4.
        // Eligible other labs: [10, 7, 5] (level 3 and 2 are excluded because < 4).
        // With IRN Level 2: top 2 eligible other labs are 10 and 7.
        // Effective Lab Level = 8 (origin) + 10 + 7 = 25.

        int effectiveLevel = ConstructionFormulas.CalculateEffectiveResearchLabLevel(
            originLabLevel: 8,
            otherPlanetLabLevels: [10, 7, 5, 3, 2],
            irnLevel: 2,
            requiredMinLabLevel: 4);

        Assert.Equal(25, effectiveLevel);
    }

    [Fact]
    public void CalculateResearchDurationSeconds_ShouldMatchExactFormula()
    {
        // Formula: ((MetalCost + CrystalCost) / (1000 * (1 + EffectiveLabLevel))) * 3600
        // Metal + Crystal = 10,000 + 20,000 = 30,000
        // EffectiveLabLevel = 14 -> 1000 * 15 = 15,000
        // (30,000 / 15,000) * 3600 = 7200 seconds

        double duration = ConstructionFormulas.CalculateResearchDurationSeconds(
            metalCost: 10_000,
            crystalCost: 20_000,
            effectiveLabLevel: 14);

        Assert.Equal(7200.0, duration, precision: 6);
    }

    [Fact]
    public void CalculateUnitDurationSeconds_ShouldMatchExactFormula()
    {
        // Light Fighter: 3000 Metal + 1000 Crystal = 4000
        // Shipyard Level 3 (1 + 3 = 4), Nanite Level 1 (2^1 = 2)
        // Denominator = 2500 * 4 * 2 = 20,000
        // (4000 / 20000) * 3600 = 720 seconds

        var cost = ConstructionFormulas.GetUnitCost(UnitType.LightFighter);
        double duration = ConstructionFormulas.CalculateUnitDurationSeconds(
            cost.Metal,
            cost.Crystal,
            shipyardLevel: 3,
            naniteLevel: 1);

        Assert.Equal(720.0, duration, precision: 6);
    }

    [Fact]
    public void CalculateFinishedBatchUnits_HybridResolution_ShouldCreditPartialAndCapAtRemaining()
    {
        // Batch of 5,000 Light Fighters, each taking 10 seconds
        var batchStart = new DateTime(2026, 10, 28, 10, 0, 0, DateTimeKind.Utc);
        int totalCount = 5000;
        double unitDuration = 10.0;

        // 1) After 255 seconds (25.5 units elapsed), with 0 completed -> 25 units finished
        int firstCheck = ConstructionFormulas.CalculateFinishedBatchUnits(
            totalCount,
            completedCount: 0,
            unitDurationSeconds: unitDuration,
            batchStartTimeUtc: batchStart,
            utcNow: batchStart.AddSeconds(255));

        Assert.Equal(25, firstCheck);

        // 2) Player queries again at 500 seconds (50 units elapsed total), with 25 already completed -> 25 new units
        int secondCheck = ConstructionFormulas.CalculateFinishedBatchUnits(
            totalCount,
            completedCount: 25,
            unitDurationSeconds: unitDuration,
            batchStartTimeUtc: batchStart,
            utcNow: batchStart.AddSeconds(500));

        Assert.Equal(25, secondCheck);

        // 3) After entire batch duration + extra time (e.g., 60,000 seconds), with 50 completed -> remaining 4950 units
        int finalCheck = ConstructionFormulas.CalculateFinishedBatchUnits(
            totalCount,
            completedCount: 50,
            unitDurationSeconds: unitDuration,
            batchStartTimeUtc: batchStart,
            utcNow: batchStart.AddSeconds(60_000));

        Assert.Equal(4950, finalCheck);
    }

    [Fact]
    public void GetResearchPrerequisites_ShouldMatchOGameTechnologyTree()
    {
        // Plasma Technology: Energy 8, Laser 10, Ion 5
        var plasmaPrereqs = ConstructionFormulas.GetResearchPrerequisites(ResearchType.PlasmaTechnology);
        Assert.Contains(plasmaPrereqs, p => p.Type == ResearchType.EnergyTechnology && p.Level == 8);
        Assert.Contains(plasmaPrereqs, p => p.Type == ResearchType.LaserTechnology && p.Level == 10);
        Assert.Contains(plasmaPrereqs, p => p.Type == ResearchType.IonTechnology && p.Level == 5);

        // IRN: Computer 8, Hyperspace 8
        var irnPrereqs = ConstructionFormulas.GetResearchPrerequisites(ResearchType.IntergalacticResearchNetwork);
        Assert.Contains(irnPrereqs, p => p.Type == ResearchType.ComputerTechnology && p.Level == 8);
        Assert.Contains(irnPrereqs, p => p.Type == ResearchType.HyperspaceTechnology && p.Level == 8);
    }

    [Fact]
    public void GetResearchDefinition_GravitonTechnology_ShouldHaveZeroCostAndLab12()
    {
        var (cost, minLabLevel) = ConstructionFormulas.GetResearchDefinition(ResearchType.GravitonTechnology, 1);
        Assert.Equal(0, cost.Metal);
        Assert.Equal(0, cost.Crystal);
        Assert.Equal(0, cost.Deuterium);
        Assert.Equal(12, minLabLevel);
    }

    [Fact]
    public void CalculateDemolitionCost_WithoutIonTechnology_ShouldEqualFullCurrentLevelCost()
    {
        // Robotics Factory level 1: base cost (400 metal, 120 crystal, 200 deut)
        var fullCost = ConstructionFormulas.GetBuildingUpgradeCost(BuildingType.RoboticsFactory, 1);
        var demoCost = ConstructionFormulas.CalculateDemolitionCost(BuildingType.RoboticsFactory, currentLevel: 1, ionTechLevel: 0);

        Assert.Equal(fullCost.Metal, demoCost.Metal);
        Assert.Equal(fullCost.Crystal, demoCost.Crystal);
        Assert.Equal(fullCost.Deuterium, demoCost.Deuterium);
    }

    [Fact]
    public void CalculateDemolitionCost_WithIonTechnology_ShouldApplyFourPercentPerLevelDiscount()
    {
        // Robotics Factory level 3: factor 2.0 -> multiplier = 4 -> metal 1600, crystal 480, deut 800
        // Ion Technology level 5 -> 5 * 0.04 = 0.20 (20% discount) -> factor = 0.80
        // Metal: 1600 * 0.8 = 1280
        // Crystal: 480 * 0.8 = 384
        // Deut: 800 * 0.8 = 640
        var demoCost = ConstructionFormulas.CalculateDemolitionCost(BuildingType.RoboticsFactory, currentLevel: 3, ionTechLevel: 5);

        Assert.Equal(1280.0, demoCost.Metal);
        Assert.Equal(384.0, demoCost.Crystal);
        Assert.Equal(640.0, demoCost.Deuterium);
    }

    [Fact]
    public void CalculateDemolitionCost_HighIonTechnology_ShouldNotExceedOneHundredPercentDiscount()
    {
        // Ion Technology 30 -> 30 * 0.04 = 1.20 -> capped at 1.0 -> 0 cost
        var demoCost = ConstructionFormulas.CalculateDemolitionCost(BuildingType.RoboticsFactory, currentLevel: 2, ionTechLevel: 30);

        Assert.Equal(0.0, demoCost.Metal);
        Assert.Equal(0.0, demoCost.Crystal);
        Assert.Equal(0.0, demoCost.Deuterium);
    }
}

