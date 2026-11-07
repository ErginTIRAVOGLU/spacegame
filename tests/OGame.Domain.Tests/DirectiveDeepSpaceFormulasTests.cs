using OGame.Domain.Entities;
using OGame.Domain.Enums;
using OGame.Domain.Services;
using Xunit;

namespace OGame.Domain.Tests;

public class DirectiveDeepSpaceFormulasTests
{
    [Fact]
    public void DirectiveIV_Metadata_And_FinalReward_AreCorrect()
    {
        Assert.Equal(4, DirectiveDeepSpaceFormulas.DirectiveId);
        Assert.Equal("Derin Uzay", DirectiveDeepSpaceFormulas.DirectiveTitle);

        var finalReward = DirectiveDeepSpaceFormulas.FinalDirectiveReward;
        Assert.Equal(10000, finalReward.Metal);
        Assert.Equal(5000, finalReward.Crystal);
        Assert.Equal(2500, finalReward.Deuterium);
        Assert.Equal(4000, finalReward.DarkMatter);

        var allQuests = DirectiveDeepSpaceFormulas.GetAllQuests();
        Assert.Equal(10, allQuests.Count);
    }

    [Fact]
    public void Quest1_PreparationForAstrophysics_EvaluatesAll13Steps()
    {
        var planet = new Planet
        {
            Buildings = new List<Building>
            {
                new() { BuildingType = BuildingType.MetalMine, Level = 14 },
                new() { BuildingType = BuildingType.CrystalMine, Level = 12 },
                new() { BuildingType = BuildingType.DeuteriumSynthesizer, Level = 10 }
            }
        };

        var eval = DirectiveDeepSpaceFormulas.EvaluateQuest(1, planet, null, 0);

        Assert.Equal(13, eval.TotalCount);
        Assert.Equal(13, eval.CompletedCount);
        Assert.True(eval.IsFulfilled);
        Assert.Equal(50000, eval.Reward.Metal);
        Assert.Equal(15000, eval.Reward.Crystal);
        Assert.Equal(5000, eval.Reward.Deuterium);
    }

    [Fact]
    public void Quest1_PartialLevels_SetsCorrectSubsteps()
    {
        var planet = new Planet
        {
            Buildings = new List<Building>
            {
                new() { BuildingType = BuildingType.MetalMine, Level = 11 },
                new() { BuildingType = BuildingType.CrystalMine, Level = 8 },
                new() { BuildingType = BuildingType.DeuteriumSynthesizer, Level = 6 }
            }
        };

        var eval = DirectiveDeepSpaceFormulas.EvaluateQuest(1, planet, null, 0);

        Assert.Equal(13, eval.TotalCount);
        // Metal >= 10 (met), Crystal >= 8 (met), Metal >= 11 (met) -> 3 steps met
        Assert.Equal(3, eval.CompletedCount);
        Assert.False(eval.IsFulfilled);
    }

    [Fact]
    public void Quest2_BasicResearchForAstrophysics_ChecksEspionage4_And_Impulse3()
    {
        var user = new User
        {
            Researches = new List<UserResearch>
            {
                new() { ResearchType = ResearchType.EspionageTechnology, Level = 4 },
                new() { ResearchType = ResearchType.ImpulseDrive, Level = 3 }
            }
        };

        var eval = DirectiveDeepSpaceFormulas.EvaluateQuest(2, null, user, 0);

        Assert.Equal(2, eval.TotalCount);
        Assert.Equal(2, eval.CompletedCount);
        Assert.True(eval.IsFulfilled);
        Assert.Equal(12000, eval.Reward.Metal);
        Assert.Equal(30000, eval.Reward.Crystal);
        Assert.Equal(4000, eval.Reward.Deuterium);
    }

    [Fact]
    public void Quest3_AstrophysicsLevel1_EvaluatesCorrectly()
    {
        var user = new User
        {
            Researches = new List<UserResearch>
            {
                new() { ResearchType = ResearchType.Astrophysics, Level = 1 }
            }
        };

        var eval = DirectiveDeepSpaceFormulas.EvaluateQuest(3, null, user, 0);

        Assert.Single(eval.Steps);
        Assert.True(eval.IsFulfilled);
        Assert.Equal(2000, eval.Reward.Metal);
        Assert.Equal(4000, eval.Reward.Crystal);
        Assert.Equal(2000, eval.Reward.Deuterium);
    }

    [Fact]
    public void Quest4_ShipyardLevel4_EvaluatesCorrectly()
    {
        var planet = new Planet
        {
            Buildings = new List<Building>
            {
                new() { BuildingType = BuildingType.Shipyard, Level = 4 }
            }
        };

        var eval = DirectiveDeepSpaceFormulas.EvaluateQuest(4, planet, null, 0);

        Assert.Single(eval.Steps);
        Assert.True(eval.IsFulfilled);
        Assert.Equal(1000, eval.Reward.Metal);
        Assert.Equal(500, eval.Reward.Crystal);
        Assert.Equal(250, eval.Reward.Deuterium);
    }

    [Fact]
    public void Quest5_ColonyShip_EvaluatesViaUnitsOrEvent()
    {
        var planet = new Planet
        {
            Units = new List<PlanetUnit>
            {
                new() { UnitType = UnitType.ColonyShip, Count = 1 }
            }
        };

        var eval = DirectiveDeepSpaceFormulas.EvaluateQuest(5, planet, null, 0);
        Assert.True(eval.IsFulfilled);

        // Via event
        int bitmask = DirectiveDeepSpaceFormulas.ProcessEvent(5, 0, "colony_ship_produced");
        var evalViaEvent = DirectiveDeepSpaceFormulas.EvaluateQuest(5, null, null, bitmask);
        Assert.True(evalViaEvent.IsFulfilled);
    }

    [Fact]
    public void Quest6_ColonizeNewPlanet_EvaluatesViaColonyPresenceOrEvent()
    {
        var allPlanets = new List<Planet>
        {
            new() { IsCapital = true, IsMoon = false, Name = "Homeworld" },
            new() { IsCapital = false, IsMoon = false, Name = "Colony" }
        };

        var eval = DirectiveDeepSpaceFormulas.EvaluateQuest(6, null, null, 0, allPlanets);
        Assert.True(eval.IsFulfilled);

        // Via event
        int bitmask = DirectiveDeepSpaceFormulas.ProcessEvent(6, 0, "planet_colonized");
        var evalEvent = DirectiveDeepSpaceFormulas.EvaluateQuest(6, null, null, bitmask);
        Assert.True(evalEvent.IsFulfilled);
    }

    [Fact]
    public void Quest7_ColonyRenamed_EvaluatesCorrectly()
    {
        var allPlanets = new List<Planet>
        {
            new() { IsCapital = true, IsMoon = false, Name = "Homeworld" },
            new() { IsCapital = false, IsMoon = false, Name = "New Horizon" }
        };

        var eval = DirectiveDeepSpaceFormulas.EvaluateQuest(7, null, null, 0, allPlanets);
        Assert.True(eval.IsFulfilled);

        // Via event
        int bitmask = DirectiveDeepSpaceFormulas.ProcessEvent(7, 0, "colony_renamed");
        var evalEvent = DirectiveDeepSpaceFormulas.EvaluateQuest(7, null, null, bitmask);
        Assert.True(evalEvent.IsFulfilled);
    }

    [Fact]
    public void Quest8_EconomyOnColony_Evaluates10ColonySubsteps()
    {
        var colony = new Planet
        {
            IsCapital = false,
            IsMoon = false,
            Name = "New Horizon",
            Buildings = new List<Building>
            {
                new() { BuildingType = BuildingType.MetalMine, Level = 5 },
                new() { BuildingType = BuildingType.SolarPlant, Level = 5 },
                new() { BuildingType = BuildingType.CrystalMine, Level = 3 }
            }
        };

        var allPlanets = new List<Planet>
        {
            new() { IsCapital = true, IsMoon = false, Name = "Homeworld" },
            colony
        };

        var eval = DirectiveDeepSpaceFormulas.EvaluateQuest(8, null, null, 0, allPlanets);

        Assert.Equal(10, eval.TotalCount);
        Assert.Equal(10, eval.CompletedCount);
        Assert.True(eval.IsFulfilled);
        Assert.Equal(1000, eval.Reward.Metal);
        Assert.Equal(500, eval.Reward.Crystal);
    }

    [Fact]
    public void Quest9_ComputerTechnology_EvaluatesCorrectly()
    {
        var user = new User
        {
            Researches = new List<UserResearch>
            {
                new() { ResearchType = ResearchType.ComputerTechnology, Level = 1 }
            }
        };

        var eval = DirectiveDeepSpaceFormulas.EvaluateQuest(9, null, user, 0);

        Assert.Single(eval.Steps);
        Assert.True(eval.IsFulfilled);
        Assert.Equal(200, eval.Reward.Metal);
        Assert.Equal(300, eval.Reward.Crystal);
    }

    [Fact]
    public void Quest10_ExpeditionMission_EvaluatesViaEvent()
    {
        int bitmask = DirectiveDeepSpaceFormulas.ProcessEvent(10, 0, "expedition_completed");
        var eval = DirectiveDeepSpaceFormulas.EvaluateQuest(10, null, null, bitmask);

        Assert.Single(eval.Steps);
        Assert.True(eval.IsFulfilled);
        Assert.Equal(2000, eval.Reward.Metal);
        Assert.Equal(2000, eval.Reward.Crystal);
    }
}
