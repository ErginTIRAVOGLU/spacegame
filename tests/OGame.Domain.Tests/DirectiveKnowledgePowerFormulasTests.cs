using OGame.Domain.Entities;
using OGame.Domain.Enums;
using OGame.Domain.Services;
using Xunit;

namespace OGame.Domain.Tests;

public class DirectiveKnowledgePowerFormulasTests
{
    [Fact]
    public void GetAllQuests_ShouldReturnNineQuests()
    {
        var quests = DirectiveKnowledgePowerFormulas.GetAllQuests();
        Assert.Equal(9, quests.Count);
        for (int i = 1; i <= 9; i++)
        {
            var q = quests[i - 1];
            Assert.Equal(i, q.QuestId);
            Assert.False(string.IsNullOrWhiteSpace(q.Title));
            Assert.NotEmpty(q.Goals);
            Assert.True(q.Reward.Metal > 0 || q.Reward.Crystal > 0 || q.Reward.Deuterium > 0 || q.Reward.DarkMatter > 0);
        }
    }

    [Fact]
    public void Quest1_EnergyTechLevel3_EvaluatesAccurately()
    {
        var user = new User();
        user.Researches.Add(new UserResearch { ResearchType = ResearchType.EnergyTechnology, Level = 2 });

        var res2 = DirectiveKnowledgePowerFormulas.EvaluateQuest(1, null, user, 0);
        Assert.False(res2.IsFulfilled);

        user.Researches.First(r => r.ResearchType == ResearchType.EnergyTechnology).Level = 3;
        var res3 = DirectiveKnowledgePowerFormulas.EvaluateQuest(1, null, user, 0);
        Assert.True(res3.IsFulfilled);
        Assert.Equal(2500, res3.Reward.Metal);
        Assert.Equal(1500, res3.Reward.Crystal);
    }

    [Fact]
    public void Quest2_FusionReactorLevel1_EvaluatesAccurately()
    {
        var planet = new Planet();
        var res0 = DirectiveKnowledgePowerFormulas.EvaluateQuest(2, planet, null, 0);
        Assert.False(res0.IsFulfilled);

        planet.Buildings.Add(new Building { BuildingType = BuildingType.FusionReactor, Level = 1 });
        var res1 = DirectiveKnowledgePowerFormulas.EvaluateQuest(2, planet, null, 0);
        Assert.True(res1.IsFulfilled);
    }

    [Fact]
    public void Quest3_BuildingDemolished_EvaluatesViaBitmask()
    {
        var res0 = DirectiveKnowledgePowerFormulas.EvaluateQuest(3, null, null, 0);
        Assert.False(res0.IsFulfilled);

        var res1 = DirectiveKnowledgePowerFormulas.EvaluateQuest(3, null, null, 1);
        Assert.True(res1.IsFulfilled);
        Assert.Equal(300, res1.Reward.Metal);
    }

    [Fact]
    public void Quest4_SolarSatellitesAndMines_EvaluatesSixSubSteps()
    {
        var planet = new Planet();
        planet.Buildings.Add(new Building { BuildingType = BuildingType.MetalMine, Level = 8 });
        planet.Buildings.Add(new Building { BuildingType = BuildingType.SolarPlant, Level = 10 });
        planet.Buildings.Add(new Building { BuildingType = BuildingType.CrystalMine, Level = 7 });
        planet.Units.Add(new PlanetUnit { UnitType = UnitType.SolarSatellite, Count = 2 });
        planet.Buildings.Add(new Building { BuildingType = BuildingType.DeuteriumSynthesizer, Level = 6 });

        // Metal Mine is 8, but Step 2 requires 9
        var resPartial = DirectiveKnowledgePowerFormulas.EvaluateQuest(4, planet, null, 0);
        Assert.False(resPartial.IsFulfilled);
        Assert.Equal(6, resPartial.TotalCount);
        Assert.Equal(5, resPartial.CompletedCount);

        // Upgrade Metal Mine to 9
        planet.Buildings.First(b => b.BuildingType == BuildingType.MetalMine).Level = 9;
        var resFull = DirectiveKnowledgePowerFormulas.EvaluateQuest(4, planet, null, 0);
        Assert.True(resFull.IsFulfilled);
        Assert.Equal(6, resFull.CompletedCount);
        Assert.Equal(5000, resFull.Reward.Metal);
        Assert.Equal(2500, resFull.Reward.Crystal);
    }

    [Fact]
    public void Quest5_EspionageInfrastructure_EvaluatesFourSubSteps()
    {
        var planet = new Planet();
        planet.Buildings.Add(new Building { BuildingType = BuildingType.ResearchLab, Level = 3 });
        planet.Buildings.Add(new Building { BuildingType = BuildingType.Shipyard, Level = 3 });

        var user = new User();
        user.Researches.Add(new UserResearch { ResearchType = ResearchType.EspionageTechnology, Level = 2 });
        user.Researches.Add(new UserResearch { ResearchType = ResearchType.CombustionDrive, Level = 3 });

        var res = DirectiveKnowledgePowerFormulas.EvaluateQuest(5, planet, user, 0);
        Assert.True(res.IsFulfilled);
        Assert.Equal(4, res.CompletedCount);
        Assert.Equal(3500, res.Reward.Metal);
        Assert.Equal(4500, res.Reward.Crystal);
        Assert.Equal(2500, res.Reward.Deuterium);
    }

    [Fact]
    public void Quest6_FirstEspionageProbe_EvaluatesAccurately()
    {
        var planet = new Planet();
        var res0 = DirectiveKnowledgePowerFormulas.EvaluateQuest(6, planet, null, 0);
        Assert.False(res0.IsFulfilled);

        planet.Units.Add(new PlanetUnit { UnitType = UnitType.EspionageProbe, Count = 1 });
        var res1 = DirectiveKnowledgePowerFormulas.EvaluateQuest(6, planet, null, 0);
        Assert.True(res1.IsFulfilled);
        Assert.Equal(1000, res1.Reward.Crystal);
    }

    [Fact]
    public void Quest7_8_9_ActionEvents_EvaluateViaBitmask()
    {
        // Quest 7: Espionage
        var q7 = DirectiveKnowledgePowerFormulas.EvaluateQuest(7, null, null, 1);
        Assert.True(q7.IsFulfilled);

        // Quest 8: Fleet Save to slot 16
        var q8 = DirectiveKnowledgePowerFormulas.EvaluateQuest(8, null, null, 1);
        Assert.True(q8.IsFulfilled);

        // Quest 9: Fleet Recall
        var q9 = DirectiveKnowledgePowerFormulas.EvaluateQuest(9, null, null, 1);
        Assert.True(q9.IsFulfilled);
    }

    [Fact]
    public void ProcessEvent_Quest9_FleetRecalled_SetsBitmask()
    {
        int bitmask = DirectiveKnowledgePowerFormulas.ProcessEvent(9, 0, "fleet_recalled");
        Assert.Equal(1, bitmask);
        var eval = DirectiveKnowledgePowerFormulas.EvaluateQuest(9, null, null, bitmask);
        Assert.True(eval.IsFulfilled);
        Assert.Equal(500, eval.Reward.Metal);
        Assert.Equal(500, eval.Reward.Crystal);
        Assert.Equal(500, eval.Reward.Deuterium);
    }

    [Fact]
    public void FinalDirectiveReward_ShouldMatchSpecification()
    {
        var reward = DirectiveKnowledgePowerFormulas.FinalDirectiveReward;
        Assert.Equal(4000, reward.Metal);
        Assert.Equal(1500, reward.Crystal);
        Assert.Equal(1000, reward.Deuterium);
        Assert.Equal(3000, reward.DarkMatter);
    }
}

