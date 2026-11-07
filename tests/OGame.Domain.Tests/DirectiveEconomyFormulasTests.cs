using OGame.Domain.Entities;
using OGame.Domain.Enums;
using OGame.Domain.Services;
using Xunit;

namespace OGame.Domain.Tests;

public class DirectiveEconomyFormulasTests
{
    [Fact]
    public void GetAllQuests_ShouldReturnThirteenQuests()
    {
        var quests = DirectiveEconomyFormulas.GetAllQuests();
        Assert.Equal(13, quests.Count);
        for (int i = 1; i <= 13; i++)
        {
            var q = quests[i - 1];
            Assert.Equal(i, q.QuestId);
            Assert.False(string.IsNullOrWhiteSpace(q.Title));
            Assert.NotEmpty(q.Goals);
            Assert.True(q.Reward.Metal > 0 || q.Reward.Crystal > 0 || q.Reward.Deuterium > 0 || q.Reward.DarkMatter > 0);
        }
    }

    [Fact]
    public void Quest1_ShouldFulfill_WhenTutorialPageOpened()
    {
        var resultFalse = DirectiveEconomyFormulas.EvaluateQuest(1, null, 100, 0, openedTutorialPage: false);
        Assert.False(resultFalse.IsFulfilled);
        Assert.Equal(0, resultFalse.CompletedCount);

        var resultTrue = DirectiveEconomyFormulas.EvaluateQuest(1, null, 100, 0, openedTutorialPage: true);
        Assert.True(resultTrue.IsFulfilled);
        Assert.Equal(1, resultTrue.CompletedCount);
        Assert.Equal(500, resultTrue.Reward.Metal);
    }

    [Fact]
    public void Quest2_ShouldFulfill_WhenMetalMineAtLeastLevel1()
    {
        var planet = new Planet();
        var resultZero = DirectiveEconomyFormulas.EvaluateQuest(2, planet, 100, 0, false);
        Assert.False(resultZero.IsFulfilled);

        planet.Buildings.Add(new Building { BuildingType = BuildingType.MetalMine, Level = 1 });
        var resultOne = DirectiveEconomyFormulas.EvaluateQuest(2, planet, 100, 0, false);
        Assert.True(resultOne.IsFulfilled);
        Assert.Equal(50, resultOne.Reward.Metal);
    }

    [Fact]
    public void Quest3_RequiresSolarPlantAndPositiveEnergy()
    {
        var planet = new Planet();
        // No solar plant
        var res1 = DirectiveEconomyFormulas.EvaluateQuest(3, planet, 100, 0, false);
        Assert.False(res1.IsFulfilled);
        Assert.False(res1.Steps[0].IsMet);

        // Add Metal Mine Lv 10 (huge energy consumption) and Solar Plant Lv 1 (low energy)
        planet.Buildings.Add(new Building { BuildingType = BuildingType.SolarPlant, Level = 1 });
        planet.Buildings.Add(new Building { BuildingType = BuildingType.MetalMine, Level = 10 });
        var res2 = DirectiveEconomyFormulas.EvaluateQuest(3, planet, 100, 0, false);
        Assert.True(res2.Steps[0].IsMet); // Solar plant lv 1 is met
        Assert.False(res2.Steps[1].IsMet); // Positive energy is NOT met
        Assert.False(res2.IsFulfilled);

        // Raise Solar Plant to Level 15 (abundant energy)
        planet.Buildings.First(b => b.BuildingType == BuildingType.SolarPlant).Level = 15;
        var res3 = DirectiveEconomyFormulas.EvaluateQuest(3, planet, 100, 0, false);
        Assert.True(res3.Steps[0].IsMet);
        Assert.True(res3.Steps[1].IsMet);
        Assert.True(res3.IsFulfilled);
        Assert.Equal(50, res3.Reward.Crystal);
    }

    [Fact]
    public void Quest3_ShouldFulfill_WhenSolarPlantLevel1AndSolarSatellitesProvidePositiveEnergy()
    {
        var planet = new Planet
        {
            TempMax = 50,
            Units = new List<PlanetUnit>
            {
                new PlanetUnit { UnitType = UnitType.SolarSatellite, Count = 50 }
            }
        };
        planet.Buildings.Add(new Building { BuildingType = BuildingType.SolarPlant, Level = 1 });
        planet.Buildings.Add(new Building { BuildingType = BuildingType.MetalMine, Level = 10 });

        var res = DirectiveEconomyFormulas.EvaluateQuest(3, planet, 100, 0, false);
        Assert.True(res.Steps[0].IsMet); // Solar plant level 1
        Assert.True(res.Steps[1].IsMet); // Positive energy (from satellites)
        Assert.True(res.IsFulfilled);
        Assert.Equal(2, res.CompletedCount);
    }

    [Fact]
    public void Quest5_And_Quest7_VerifyResourceSettingsPercentages()
    {
        // Quest 5 requires 90%
        var q5NotMet = DirectiveEconomyFormulas.EvaluateQuest(5, null, metalPercentage: 100, 0, false);
        Assert.False(q5NotMet.IsFulfilled);

        var q5Met = DirectiveEconomyFormulas.EvaluateQuest(5, null, metalPercentage: 90, 0, false);
        Assert.True(q5Met.IsFulfilled);

        // Bitmask persistence preserves progress even if player changes back to 100%
        int bitmaskWithStep0 = q5Met.ComputedBitmask;
        var q5Preserved = DirectiveEconomyFormulas.EvaluateQuest(5, null, metalPercentage: 100, bitmaskWithStep0, false);
        Assert.True(q5Preserved.IsFulfilled);

        // Quest 7 requires 100%
        var q7Met = DirectiveEconomyFormulas.EvaluateQuest(7, null, metalPercentage: 100, 0, false);
        Assert.True(q7Met.IsFulfilled);
    }

    [Fact]
    public void Quest8_MultiStep_EvaluatesThreeGoals()
    {
        var planet = new Planet();
        planet.Buildings.Add(new Building { BuildingType = BuildingType.MetalMine, Level = 3 });
        planet.Buildings.Add(new Building { BuildingType = BuildingType.SolarPlant, Level = 2 });

        var partial = DirectiveEconomyFormulas.EvaluateQuest(8, planet, 100, 0, false);
        Assert.False(partial.IsFulfilled);
        Assert.Equal(3, partial.TotalCount);
        Assert.Equal(1, partial.CompletedCount); // only Metal 3 is met

        // Upgrade Solar to 3 and Metal to 4
        planet.Buildings.First(b => b.BuildingType == BuildingType.SolarPlant).Level = 3;
        planet.Buildings.First(b => b.BuildingType == BuildingType.MetalMine).Level = 4;

        var full = DirectiveEconomyFormulas.EvaluateQuest(8, planet, 100, 0, false);
        Assert.True(full.IsFulfilled);
        Assert.Equal(3, full.CompletedCount);
        Assert.Equal(150, full.Reward.Metal);
        Assert.Equal(50, full.Reward.Crystal);
    }

    [Fact]
    public void Quest13_VerifiesThreeStorageFacilities()
    {
        var planet = new Planet();
        planet.Buildings.Add(new Building { BuildingType = BuildingType.MetalStorage, Level = 1 });
        planet.Buildings.Add(new Building { BuildingType = BuildingType.CrystalStorage, Level = 1 });
        planet.Buildings.Add(new Building { BuildingType = BuildingType.DeuteriumTank, Level = 1 });

        var res = DirectiveEconomyFormulas.EvaluateQuest(13, planet, 100, 0, false);
        Assert.True(res.IsFulfilled);
        Assert.Equal(3, res.CompletedCount);
        Assert.Equal(3000, res.Reward.Metal);
        Assert.Equal(1500, res.Reward.Crystal);
    }

    [Fact]
    public void FinalDirectiveReward_ShouldMatchSpecification()
    {
        var reward = DirectiveEconomyFormulas.FinalDirectiveReward;
        Assert.Equal(5000, reward.Metal);
        Assert.Equal(2500, reward.Crystal);
        Assert.Equal(500, reward.Deuterium);
        Assert.Equal(1000, reward.DarkMatter);
    }

    [Fact]
    public void GetNextDirectiveSummary_ReturnsNextGoalTextOrCompletion()
    {
        var planet = new Planet();
        var evalNotMet = DirectiveEconomyFormulas.EvaluateQuest(2, planet, 100, 0, false);
        var summary1 = DirectiveEconomyFormulas.GetNextDirectiveSummary(2, false, evalNotMet);
        Assert.Equal("Metal Madeni binasını 1. seviyeye yükselt", summary1);

        planet.Buildings.Add(new Building { BuildingType = BuildingType.MetalMine, Level = 1 });
        var evalMet = DirectiveEconomyFormulas.EvaluateQuest(2, planet, 100, 0, false);
        var summary2 = DirectiveEconomyFormulas.GetNextDirectiveSummary(2, false, evalMet);
        Assert.Contains("tamamlandı! Ödülü al", summary2);

        var summaryFinished = DirectiveEconomyFormulas.GetNextDirectiveSummary(13, true, evalMet);
        Assert.Contains("tamamlandı", summaryFinished);
    }
}

