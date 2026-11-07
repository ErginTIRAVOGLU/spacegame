using OGame.Domain.Services;
using Xunit;

namespace OGame.Domain.Tests;

public class LifeformsSpeciesFormulasTests
{
    [Fact]
    public void AllFourSpecies_AreDefinedWithAccurateRatingsAndMetadata()
    {
        var all = LifeformsSpeciesFormulas.AllSpecies;
        Assert.Equal(4, all.Count);

        var humans = LifeformsSpeciesFormulas.GetSpecies("humans");
        Assert.Equal("humans", humans.Id);
        Assert.True(humans.IsDefaultUnlocked);
        Assert.Equal("İyi", humans.Ratings["metal"]);
        Assert.Equal("Çok iyi", humans.Ratings["research"]);
        Assert.Equal(12, humans.Buildings.Count);
        Assert.Equal(18, humans.Technologies.Count);

        var rocktal = LifeformsSpeciesFormulas.GetSpecies("rocktal");
        Assert.Equal("rocktal", rocktal.Id);
        Assert.False(rocktal.IsDefaultUnlocked);
        Assert.Equal("Çok iyi", rocktal.Ratings["metal"]);
        Assert.Equal("Çok iyi", rocktal.Ratings["crystal"]);
        Assert.Equal("Çok iyi", rocktal.Ratings["deuterium"]);
        Assert.Equal(12, rocktal.Buildings.Count);
        Assert.Equal(18, rocktal.Technologies.Count);

        var mechas = LifeformsSpeciesFormulas.GetSpecies("mechas");
        Assert.Equal("mechas", mechas.Id);
        Assert.False(mechas.IsDefaultUnlocked);
        Assert.Equal("Çok iyi", mechas.Ratings["military"]);
        Assert.Equal(12, mechas.Buildings.Count);
        Assert.Equal(18, mechas.Technologies.Count);

        var kaelesh = LifeformsSpeciesFormulas.GetSpecies("kaelesh");
        Assert.Equal("kaelesh", kaelesh.Id);
        Assert.False(kaelesh.IsDefaultUnlocked);
        Assert.Equal("Çok iyi", kaelesh.Ratings["expedition"]);
        Assert.Equal(12, kaelesh.Buildings.Count);
        Assert.Equal(18, kaelesh.Technologies.Count);
    }

    [Theory]
    [InlineData("humans", 1, 200000)]
    [InlineData("rocktal", 1, 200000)]
    [InlineData("mechas", 7, 1200000)]
    [InlineData("kaelesh", 13, 13000000)]
    [InlineData("humans", 18, 448000000)]
    public void TechUnlockThresholds_AreUniformAcrossSpecies(string speciesId, int slot, long requiredPop)
    {
        var tech = LifeformsSpeciesFormulas.GetTech(speciesId, slot);
        Assert.NotNull(tech);
        Assert.Equal(requiredPop, tech.RequiredPopulation);

        Assert.False(LifeformsSpeciesFormulas.IsTechUnlocked(slot, requiredPop - 1));
        Assert.True(LifeformsSpeciesFormulas.IsTechUnlocked(slot, requiredPop));
    }

    [Fact]
    public void AllSpecies_HaveTotal48Buildings_And_72Technologies_WithAccurateKeys()
    {
        int totalBuildings = LifeformsSpeciesFormulas.AllSpecies.Sum(s => s.Buildings.Count);
        int totalTechnologies = LifeformsSpeciesFormulas.AllSpecies.Sum(s => s.Technologies.Count);

        Assert.Equal(48, totalBuildings);
        Assert.Equal(72, totalTechnologies);

        // Verify Rock'tal canonical keys
        var rocktal = LifeformsSpeciesFormulas.GetSpecies("rocktal");
        Assert.Contains(rocktal.Buildings, b => b.Key == "meditationEnclave");
        Assert.Contains(rocktal.Buildings, b => b.Key == "crystalFarm");
        Assert.Contains(rocktal.Buildings, b => b.Key == "runeTechnologium");
        Assert.Contains(rocktal.Buildings, b => b.Key == "disruptionChamber");
        Assert.Contains(rocktal.Buildings, b => b.Key == "megalith");
        Assert.Contains(rocktal.Buildings, b => b.Key == "crystalRefinery");
        Assert.Contains(rocktal.Buildings, b => b.Key == "deuteriumSynthesiserRocktal");
        Assert.Contains(rocktal.Buildings, b => b.Key == "mineralResearchCentre");
        Assert.Contains(rocktal.Buildings, b => b.Key == "advancedRecyclingPlant");

        // Verify Mechas canonical keys
        var mechas = LifeformsSpeciesFormulas.GetSpecies("mechas");
        Assert.Contains(mechas.Buildings, b => b.Key == "assemblyLine");
        Assert.Contains(mechas.Buildings, b => b.Key == "fusionCellFactory");
        Assert.Contains(mechas.Buildings, b => b.Key == "roboticsResearchCentre");
        Assert.Contains(mechas.Buildings, b => b.Key == "highPerformanceSynthesiser");
        Assert.Contains(mechas.Buildings, b => b.Key == "nanoRepairBots");

        // Verify Kaelesh canonical keys
        var kaelesh = LifeformsSpeciesFormulas.GetSpecies("kaelesh");
        Assert.Contains(kaelesh.Buildings, b => b.Key == "sanctuary");
        Assert.Contains(kaelesh.Buildings, b => b.Key == "antimatterCondenser");
        Assert.Contains(kaelesh.Buildings, b => b.Key == "vortexChamber");
        Assert.Contains(kaelesh.Buildings, b => b.Key == "bioModifier");
        Assert.Contains(kaelesh.Buildings, b => b.Key == "supraRefractor");
    }

    [Fact]
    public void ArtefactCosts_And_ExplorationRules_MatchWikiSpecifications()
    {
        // Artefact costs per tier
        Assert.Equal(200, LifeformsSpeciesFormulas.GetArtefactCostForSlot(1));
        Assert.Equal(200, LifeformsSpeciesFormulas.GetArtefactCostForSlot(6));
        Assert.Equal(400, LifeformsSpeciesFormulas.GetArtefactCostForSlot(7));
        Assert.Equal(400, LifeformsSpeciesFormulas.GetArtefactCostForSlot(12));
        Assert.Equal(600, LifeformsSpeciesFormulas.GetArtefactCostForSlot(13));
        Assert.Equal(600, LifeformsSpeciesFormulas.GetArtefactCostForSlot(18));
        Assert.Equal(3600, LifeformsSpeciesFormulas.MaxArtefactsCapacity);

        // Exploration flight rules
        Assert.Equal((5000, 1000, 500), LifeformsSpeciesFormulas.ExplorationFlightCost);
        Assert.Equal(50, LifeformsSpeciesFormulas.ExplorationDailyAllotment);
        Assert.Equal(7, LifeformsSpeciesFormulas.ExplorationCoordinateCooldownDays);
        Assert.Equal(100, LifeformsSpeciesFormulas.MaxSpeciesLevel);
        Assert.Equal(10.0, LifeformsSpeciesFormulas.MaxSpeciesBonusPercent);

        // Species switch cooldown
        Assert.Equal(48, LifeformsSpeciesFormulas.SpeciesSwitchCooldownHours);
    }

    [Fact]
    public void Upgrades_CanBeCalculatedForAnySpecies()
    {
        var rocktalBuildingCost = LifeformsSpeciesFormulas.CalculateBuildingUpgrade("rocktal", "meditationEnclave", 0);
        Assert.True(rocktalBuildingCost.Metal > 0);
        Assert.True(rocktalBuildingCost.DurationSeconds > 0);

        var mechaTechCost = LifeformsSpeciesFormulas.CalculateTechUpgrade("mechas", 1, 0, 1);
        Assert.True(mechaTechCost.Metal > 0);
        Assert.True(mechaTechCost.DurationSeconds > 0);
    }
}

