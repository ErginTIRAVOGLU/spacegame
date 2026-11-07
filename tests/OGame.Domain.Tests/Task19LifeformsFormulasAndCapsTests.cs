using OGame.Domain.Services;
using Xunit;

namespace OGame.Domain.Tests;

public class Task19LifeformsFormulasAndCapsTests
{
    [Fact]
    public void CalculateBuildingCost_AppliesTargetLevelMultiplicationAndCostReduction()
    {
        // Cost(L) = floor(baseCost * factor^(L-1) * L * (1 - CostReduction))
        long baseCost = 1000;
        double factor = 1.2;

        // L = 1 -> 1000 * 1.2^0 * 1 = 1000
        Assert.Equal(1000, LifeformsSpeciesFormulas.CalculateBuildingCost(baseCost, factor, 1));

        // L = 2 -> 1000 * 1.2^1 * 2 = 2400
        Assert.Equal(2400, LifeformsSpeciesFormulas.CalculateBuildingCost(baseCost, factor, 2));

        // L = 3 -> 1000 * 1.2^2 * 3 = 1000 * 1.44 * 3 = 4320
        Assert.Equal(4320, LifeformsSpeciesFormulas.CalculateBuildingCost(baseCost, factor, 3));

        // With 10% cost reduction bonus at L = 2: 2400 * 0.9 = 2160
        Assert.Equal(2160, LifeformsSpeciesFormulas.CalculateBuildingCost(baseCost, factor, 2, costReductionBonus: 0.10));
    }

    [Fact]
    public void CalculateBuildingEnergy_FollowsExactFormula()
    {
        // Energy(L) = floor(L * energyBase * factor^L)
        long baseEnergy = 10;
        double factor = 1.05;

        // L = 1 -> floor(1 * 10 * 1.05^1) = 10
        Assert.Equal(10, LifeformsSpeciesFormulas.CalculateBuildingEnergy(baseEnergy, factor, 1));

        // L = 5 -> floor(5 * 10 * 1.05^5) = floor(50 * 1.27628) = 63
        Assert.Equal(63, LifeformsSpeciesFormulas.CalculateBuildingEnergy(baseEnergy, factor, 5));
    }

    [Fact]
    public void CalculateBuildingDuration_ScalesWithRoboticsNaniteAndEcoSpeed()
    {
        // T(L) = floor(L * durationBase * durationFactor^L / ((1 + Robo) * 2^Nanite * EcoSpeed))
        int durationBase = 100;

        // Base with Robo=0, Nanite=0, Eco=1
        int t0 = LifeformsSpeciesFormulas.CalculateBuildingDuration(1, durationBase: durationBase, durationFactor: 1.0, roboticsLevel: 0, naniteLevel: 0, ecoSpeed: 1.0);
        Assert.Equal(100, t0);

        // With Robotics level 9 -> denom: (1 + 9) = 10 -> duration: 10
        int tRobo = LifeformsSpeciesFormulas.CalculateBuildingDuration(1, durationBase: durationBase, durationFactor: 1.0, roboticsLevel: 9, naniteLevel: 0, ecoSpeed: 1.0);
        Assert.Equal(10, tRobo);

        // With Nanite level 2 -> denom: (1 + 0) * 2^2 = 4 -> duration: 25
        int tNanite = LifeformsSpeciesFormulas.CalculateBuildingDuration(1, durationBase: durationBase, durationFactor: 1.0, roboticsLevel: 0, naniteLevel: 2, ecoSpeed: 1.0);
        Assert.Equal(25, tNanite);

        // With EcoSpeed 5x -> denom: 5 -> duration: 20
        int tEco = LifeformsSpeciesFormulas.CalculateBuildingDuration(1, durationBase: durationBase, durationFactor: 1.0, roboticsLevel: 0, naniteLevel: 0, ecoSpeed: 5.0);
        Assert.Equal(20, tEco);
    }

    [Fact]
    public void CalculateBuildingBonus_ScalesSuperlinearly()
    {
        // Bonus(L) = L^increaseFactor * (baseValue / 100)
        double b1 = LifeformsSpeciesFormulas.CalculateBuildingBonus(1, increaseFactor: 1.10, baseValue: 2.0);
        Assert.Equal(0.02, b1, precision: 5);

        // L = 10: 10^1.1 * 0.02 = 12.589 * 0.02 = 0.25178
        double b10 = LifeformsSpeciesFormulas.CalculateBuildingBonus(10, increaseFactor: 1.10, baseValue: 2.0);
        Assert.True(b10 > 10 * b1, "Superlinear growth must be strictly greater than linear scaling");
    }

    [Fact]
    public void CalculateTotalTechBonus_CombinesSpeciesAndMetropolisBonuses()
    {
        // TotalTechBonus = Base * (1 + SpeciesBonus + MetropolisBonus)
        double baseBonus = 0.05; // 5%
        double speciesBonus = 0.06; // 6% from Level 60
        double metropolisBonus = 0.04; // 4% from Metropolis building

        double total = LifeformsSpeciesFormulas.CalculateTotalTechBonus(baseBonus, speciesBonus, metropolisBonus);
        Assert.Equal(0.05 * 1.10, total, precision: 5);
    }

    [Fact]
    public void SpeciesExperience_LevelBonus_And_XpCap_WorkCorrectly()
    {
        // Max Level 100. +0.1% per level (+10% max at Level 100)
        Assert.Equal(0.0, LifeformsSpeciesFormulas.CalculateSpeciesLevelBonus(0));
        Assert.Equal(0.01, LifeformsSpeciesFormulas.CalculateSpeciesLevelBonus(10), precision: 5);
        Assert.Equal(0.05, LifeformsSpeciesFormulas.CalculateSpeciesLevelBonus(50), precision: 5);
        Assert.Equal(0.10, LifeformsSpeciesFormulas.CalculateSpeciesLevelBonus(100), precision: 5);

        // Clamped at 100
        Assert.Equal(0.10, LifeformsSpeciesFormulas.CalculateSpeciesLevelBonus(120), precision: 5);

        // Awarded XP: beyond Level 100 awards 0 XP
        Assert.Equal(25, LifeformsSpeciesFormulas.CalculateAwardedXp(currentLevel: 50, earnedXp: 25));
        Assert.Equal(25, LifeformsSpeciesFormulas.CalculateAwardedXp(currentLevel: 99, earnedXp: 25));
        Assert.Equal(0, LifeformsSpeciesFormulas.CalculateAwardedXp(currentLevel: 100, earnedXp: 25));
        Assert.Equal(0, LifeformsSpeciesFormulas.CalculateAwardedXp(currentLevel: 105, earnedXp: 50));
    }

    [Fact]
    public void BuildingHardCaps_EnforceDesignLimits()
    {
        // Rock'tal Rune Technologium: Max -25% research cost, Max -99% research duration
        Assert.Equal(0.20, LifeformsSpeciesFormulas.CapRuneTechnologiumCostReduction(0.20));
        Assert.Equal(0.25, LifeformsSpeciesFormulas.CapRuneTechnologiumCostReduction(0.35));

        Assert.Equal(0.80, LifeformsSpeciesFormulas.CapRuneTechnologiumTimeReduction(0.80));
        Assert.Equal(0.99, LifeformsSpeciesFormulas.CapRuneTechnologiumTimeReduction(1.20));

        // Rock'tal Rune Forge / Deut Synthesiser / Advanced Recycling: Max 50% bonus
        Assert.Equal(0.30, LifeformsSpeciesFormulas.CapRocktalBonus(0.30));
        Assert.Equal(0.50, LifeformsSpeciesFormulas.CapRocktalBonus(0.75));

        // Kaelesh Psionic Modulator: Max -25% population reduction for the 18 slots
        Assert.Equal(0.15, LifeformsSpeciesFormulas.CapPsionicModulatorReduction(0.15));
        Assert.Equal(0.25, LifeformsSpeciesFormulas.CapPsionicModulatorReduction(0.40));

        // Effective population threshold reduction check
        long baseSlot1Pop = 200_000;
        long effectiveSlot1Pop = LifeformsSpeciesFormulas.CalculateEffectivePopulationThreshold(baseSlot1Pop, 0.25);
        Assert.Equal(150_000, effectiveSlot1Pop);

        // Kaelesh Ship Manufacturing Hall: Max -70% shipyard build duration
        Assert.Equal(0.50, LifeformsSpeciesFormulas.CapShipManufacturingHallReduction(0.50));
        Assert.Equal(0.70, LifeformsSpeciesFormulas.CapShipManufacturingHallReduction(0.90));

        // Kaelesh Supra Refractor: Max moon chance 30%, Max moon diameter 9400 km
        var (chance, diameter) = LifeformsSpeciesFormulas.CalculateSupraRefractorMoonBonus(
            baseMaxChance: 20.0,
            baseMaxDiameter: 8944,
            supraRefractorChanceBonus: 15.0, // 20 + 15 = 35 -> capped at 30
            supraRefractorDiameterBonus: 800  // 8944 + 800 = 9744 -> capped at 9400
        );
        Assert.Equal(30.0, chance);
        Assert.Equal(9400, diameter);
    }

    [Fact]
    public void BioModifier_FieldRemoval_And_ConstructionRule()
    {
        // When Kaelesh Bio Modifier is active, it grants fields (+1 per level)
        Assert.Equal(5, LifeformsSpeciesFormulas.CalculateBioModifierFields(5));

        // When switching away from Kaelesh, if UsedFields > NewMaxFields:
        // Existing buildings remain intact, but new construction is blocked
        Assert.False(LifeformsSpeciesFormulas.CanConstructStandardBuilding(usedFields: 200, maxFields: 195));
        Assert.False(LifeformsSpeciesFormulas.CanConstructStandardBuilding(usedFields: 195, maxFields: 195));
        Assert.True(LifeformsSpeciesFormulas.CanConstructStandardBuilding(usedFields: 194, maxFields: 195));
    }

    [Fact]
    public void TierPauseRule_EnforcesStrictPrerequisiteDependencies()
    {
        // Tier 1 is always active
        Assert.True(LifeformsSpeciesFormulas.IsTierActive(tier: 1, tier1FilledSlots: 0, tier2FilledSlots: 0));
        Assert.True(LifeformsSpeciesFormulas.IsTierActive(tier: 1, tier1FilledSlots: 6, tier2FilledSlots: 6));

        // Tier 2 is active ONLY when Tier 1 has 6 slots filled
        Assert.False(LifeformsSpeciesFormulas.IsTierActive(tier: 2, tier1FilledSlots: 5, tier2FilledSlots: 0));
        Assert.True(LifeformsSpeciesFormulas.IsTierActive(tier: 2, tier1FilledSlots: 6, tier2FilledSlots: 0));

        // Tier 3 is active ONLY when BOTH Tier 1 and Tier 2 have 6 slots filled
        Assert.False(LifeformsSpeciesFormulas.IsTierActive(tier: 3, tier1FilledSlots: 6, tier2FilledSlots: 5));
        Assert.False(LifeformsSpeciesFormulas.IsTierActive(tier: 3, tier1FilledSlots: 5, tier2FilledSlots: 6));
        Assert.True(LifeformsSpeciesFormulas.IsTierActive(tier: 3, tier1FilledSlots: 6, tier2FilledSlots: 6));
    }
}

