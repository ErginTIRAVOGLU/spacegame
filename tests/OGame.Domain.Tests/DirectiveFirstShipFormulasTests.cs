using OGame.Domain.Entities;
using OGame.Domain.Enums;
using OGame.Domain.Services;
using Xunit;

namespace OGame.Domain.Tests;

public class DirectiveFirstShipFormulasTests
{
    [Fact]
    public void GetAllQuests_ShouldReturnTenQuests()
    {
        var quests = DirectiveFirstShipFormulas.GetAllQuests();
        Assert.Equal(10, quests.Count);
        for (int i = 1; i <= 10; i++)
        {
            var q = quests[i - 1];
            Assert.Equal(i, q.QuestId);
            Assert.False(string.IsNullOrWhiteSpace(q.Title));
            Assert.NotEmpty(q.Goals);
            Assert.True(q.Reward.Metal > 0 || q.Reward.Crystal > 0 || q.Reward.Deuterium > 0 || q.Reward.DarkMatter > 0);
        }
    }

    [Fact]
    public void Quest1_TechTreeModal_FulfilledWhenBitmaskSet()
    {
        var resNotMet = DirectiveFirstShipFormulas.EvaluateQuest(1, null, null, 0);
        Assert.False(resNotMet.IsFulfilled);

        // Bit 0 set via event
        var resMet = DirectiveFirstShipFormulas.EvaluateQuest(1, null, null, 1);
        Assert.True(resMet.IsFulfilled);
        Assert.Equal(300, resMet.Reward.Crystal);
    }

    [Fact]
    public void Quest2_ResearchLab_FulfilledWhenLevelAtLeast1()
    {
        var planet = new Planet();
        var res0 = DirectiveFirstShipFormulas.EvaluateQuest(2, planet, null, 0);
        Assert.False(res0.IsFulfilled);

        planet.Buildings.Add(new Building { BuildingType = BuildingType.ResearchLab, Level = 1 });
        var res1 = DirectiveFirstShipFormulas.EvaluateQuest(2, planet, null, 0);
        Assert.True(res1.IsFulfilled);
        Assert.Equal(100, res1.Reward.Metal);
        Assert.Equal(200, res1.Reward.Crystal);
        Assert.Equal(100, res1.Reward.Deuterium);
    }

    [Fact]
    public void Quest3_And_4_ResearchTechnologies()
    {
        var user = new User();
        // Energy Tech Level 1
        var q3NotMet = DirectiveFirstShipFormulas.EvaluateQuest(3, null, user, 0);
        Assert.False(q3NotMet.IsFulfilled);

        user.Researches.Add(new UserResearch { ResearchType = ResearchType.EnergyTechnology, Level = 1 });
        var q3Met = DirectiveFirstShipFormulas.EvaluateQuest(3, null, user, 0);
        Assert.True(q3Met.IsFulfilled);

        // Combustion Drive Level 2
        var q4NotMet = DirectiveFirstShipFormulas.EvaluateQuest(4, null, user, 0);
        Assert.False(q4NotMet.IsFulfilled);

        user.Researches.Add(new UserResearch { ResearchType = ResearchType.CombustionDrive, Level = 1 });
        var q4Lv1 = DirectiveFirstShipFormulas.EvaluateQuest(4, null, user, 0);
        Assert.False(q4Lv1.IsFulfilled); // requires level 2

        user.Researches.First(r => r.ResearchType == ResearchType.CombustionDrive).Level = 2;
        var q4Met = DirectiveFirstShipFormulas.EvaluateQuest(4, null, user, 0);
        Assert.True(q4Met.IsFulfilled);
    }

    [Fact]
    public void Quest5_And_6_FacilitiesLevel2()
    {
        var planet = new Planet();
        planet.Buildings.Add(new Building { BuildingType = BuildingType.RoboticsFactory, Level = 2 });
        planet.Buildings.Add(new Building { BuildingType = BuildingType.Shipyard, Level = 2 });

        var q5 = DirectiveFirstShipFormulas.EvaluateQuest(5, planet, null, 0);
        Assert.True(q5.IsFulfilled);

        var q6 = DirectiveFirstShipFormulas.EvaluateQuest(6, planet, null, 0);
        Assert.True(q6.IsFulfilled);
    }

    [Fact]
    public void Quest7_SmallCargo_FulfilledWhenUnitPresent()
    {
        var planet = new Planet();
        var q7NotMet = DirectiveFirstShipFormulas.EvaluateQuest(7, planet, null, 0);
        Assert.False(q7NotMet.IsFulfilled);

        planet.Units.Add(new PlanetUnit { UnitType = UnitType.SmallCargo, Count = 1 });
        var q7Met = DirectiveFirstShipFormulas.EvaluateQuest(7, planet, null, 0);
        Assert.True(q7Met.IsFulfilled);
    }

    [Fact]
    public void Quest8_Alliance_FulfilledWhenAllianceTagPresent()
    {
        var user = new User();
        var q8NotMet = DirectiveFirstShipFormulas.EvaluateQuest(8, null, user, 0);
        Assert.False(q8NotMet.IsFulfilled);

        user.AllianceTag = "NOVA";
        var q8Met = DirectiveFirstShipFormulas.EvaluateQuest(8, null, user, 0);
        Assert.True(q8Met.IsFulfilled);
    }

    [Fact]
    public void Quest9_PlanetRename_FulfilledWhenRenamed()
    {
        var planet = new Planet { Name = "Homeworld" };
        var q9Default = DirectiveFirstShipFormulas.EvaluateQuest(9, planet, null, 0);
        Assert.False(q9Default.IsFulfilled);

        planet.Name = "Aethelgard Prime";
        var q9Aethel = DirectiveFirstShipFormulas.EvaluateQuest(9, planet, null, 0);
        Assert.False(q9Aethel.IsFulfilled);

        planet.Name = "Nova Imperium";
        var q9Custom = DirectiveFirstShipFormulas.EvaluateQuest(9, planet, null, 0);
        Assert.True(q9Custom.IsFulfilled);
    }

    [Fact]
    public void Quest10_FriendRequest_FulfilledViaEventBitmask()
    {
        var res0 = DirectiveFirstShipFormulas.EvaluateQuest(10, null, null, 0);
        Assert.False(res0.IsFulfilled);

        var res1 = DirectiveFirstShipFormulas.EvaluateQuest(10, null, null, 1);
        Assert.True(res1.IsFulfilled);
    }

    [Fact]
    public void FinalDirectiveReward_ShouldMatchSpecification()
    {
        var reward = DirectiveFirstShipFormulas.FinalDirectiveReward;
        Assert.Equal(1500, reward.Metal);
        Assert.Equal(750, reward.Crystal);
        Assert.Equal(250, reward.Deuterium);
        Assert.Equal(2000, reward.DarkMatter);
    }
}

