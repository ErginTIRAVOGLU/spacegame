using OGame.Domain.Entities;
using OGame.Domain.Enums;
using OGame.Domain.Services;
using Xunit;

namespace OGame.Domain.Tests;

public class DirectiveSecureBordersFormulasTests
{
    [Fact]
    public void DirectiveV_Metadata_And_FinalReward_AreCorrect()
    {
        Assert.Equal(5, DirectiveSecureBordersFormulas.DirectiveId);
        Assert.Equal("Sınırları güven altına al", DirectiveSecureBordersFormulas.DirectiveTitle);
        Assert.Equal("Birinci Subay Nova", DirectiveSecureBordersFormulas.GuideCharacterName);

        var finalReward = DirectiveSecureBordersFormulas.FinalDirectiveReward;
        Assert.Equal(15000, finalReward.Metal);
        Assert.Equal(7500, finalReward.Crystal);
        Assert.Equal(1500, finalReward.Deuterium);
        Assert.Equal(5000, finalReward.DarkMatter);

        var allQuests = DirectiveSecureBordersFormulas.GetAllQuests();
        Assert.Equal(11, allQuests.Count);
    }

    [Fact]
    public void Quest1_RocketLauncher_EvaluatesCorrectly()
    {
        var planet = new Planet();
        planet.Units.Add(new PlanetUnit { UnitType = UnitType.RocketLauncher, Count = 1 });

        var eval = DirectiveSecureBordersFormulas.EvaluateQuest(1, planet, null, 0);

        Assert.Equal(1, eval.TotalCount);
        Assert.Equal(1, eval.CompletedCount);
        Assert.True(eval.IsFulfilled);
        Assert.Equal(1000, eval.Reward.Metal);
        Assert.Equal(0, eval.Reward.Crystal);
    }

    [Fact]
    public void Quest1_RocketLauncher_UnmetWithoutUnits_UnlessBitmaskSet()
    {
        var planet = new Planet();

        var evalUnmet = DirectiveSecureBordersFormulas.EvaluateQuest(1, planet, null, 0);
        Assert.False(evalUnmet.IsFulfilled);
        Assert.Equal(0, evalUnmet.CompletedCount);

        var evalWithBitmask = DirectiveSecureBordersFormulas.EvaluateQuest(1, planet, null, 1);
        Assert.True(evalWithBitmask.IsFulfilled);
        Assert.Equal(1, evalWithBitmask.CompletedCount);
    }

    [Fact]
    public void Quest2_LaserTech3_EvaluatesCorrectly()
    {
        var user = new User();
        user.Researches.Add(new UserResearch { ResearchType = ResearchType.LaserTechnology, Level = 3 });

        var eval = DirectiveSecureBordersFormulas.EvaluateQuest(2, null, user, 0);

        Assert.True(eval.IsFulfilled);
        Assert.Equal(700, eval.Reward.Metal);
        Assert.Equal(350, eval.Reward.Crystal);

        user.Researches.First(r => r.ResearchType == ResearchType.LaserTechnology).Level = 2;
        var evalPartial = DirectiveSecureBordersFormulas.EvaluateQuest(2, null, user, 0);
        Assert.False(evalPartial.IsFulfilled);
    }

    [Fact]
    public void Quest3_LightLaser_EvaluatesCorrectly()
    {
        var planet = new Planet();
        planet.Units.Add(new PlanetUnit { UnitType = UnitType.LightLaser, Count = 2 });

        var eval = DirectiveSecureBordersFormulas.EvaluateQuest(3, planet, null, 0);

        Assert.True(eval.IsFulfilled);
        Assert.Equal(750, eval.Reward.Metal);
        Assert.Equal(250, eval.Reward.Crystal);
    }

    [Fact]
    public void Quest4_LaserTech6_EvaluatesCorrectly()
    {
        var user = new User();
        user.Researches.Add(new UserResearch { ResearchType = ResearchType.LaserTechnology, Level = 6 });

        var eval = DirectiveSecureBordersFormulas.EvaluateQuest(4, null, user, 0);

        Assert.True(eval.IsFulfilled);
        Assert.Equal(5600, eval.Reward.Metal);
        Assert.Equal(2800, eval.Reward.Crystal);

        user.Researches.First(r => r.ResearchType == ResearchType.LaserTechnology).Level = 5;
        var evalPartial = DirectiveSecureBordersFormulas.EvaluateQuest(4, null, user, 0);
        Assert.False(evalPartial.IsFulfilled);
    }

    [Fact]
    public void Quest5_HeavyLaser_EvaluatesCorrectly()
    {
        var planet = new Planet();
        planet.Units.Add(new PlanetUnit { UnitType = UnitType.HeavyLaser, Count = 1 });

        var eval = DirectiveSecureBordersFormulas.EvaluateQuest(5, planet, null, 0);

        Assert.True(eval.IsFulfilled);
        Assert.Equal(3000, eval.Reward.Metal);
        Assert.Equal(1000, eval.Reward.Crystal);
    }

    [Fact]
    public void Quest6_ArmourTech2_EvaluatesCorrectly()
    {
        var user = new User();
        user.Researches.Add(new UserResearch { ResearchType = ResearchType.ArmourTechnology, Level = 2 });

        var eval = DirectiveSecureBordersFormulas.EvaluateQuest(6, null, user, 0);

        Assert.True(eval.IsFulfilled);
        Assert.Equal(1500, eval.Reward.Metal);
        Assert.Equal(0, eval.Reward.Crystal);

        user.Researches.First(r => r.ResearchType == ResearchType.ArmourTechnology).Level = 1;
        var evalPartial = DirectiveSecureBordersFormulas.EvaluateQuest(6, null, user, 0);
        Assert.False(evalPartial.IsFulfilled);
    }

    [Fact]
    public void Quest7_ResearchLab4_EvaluatesCorrectly()
    {
        var planet = new Planet();
        planet.Buildings.Add(new Building { BuildingType = BuildingType.ResearchLab, Level = 4 });

        var eval = DirectiveSecureBordersFormulas.EvaluateQuest(7, planet, null, 0);

        Assert.True(eval.IsFulfilled);
        Assert.Equal(800, eval.Reward.Metal);
        Assert.Equal(1600, eval.Reward.Crystal);
        Assert.Equal(800, eval.Reward.Deuterium);
    }

    [Fact]
    public void Quest8_WeaponsTech1_EvaluatesCorrectly()
    {
        var user = new User();
        user.Researches.Add(new UserResearch { ResearchType = ResearchType.WeaponsTechnology, Level = 1 });

        var eval = DirectiveSecureBordersFormulas.EvaluateQuest(8, null, user, 0);

        Assert.True(eval.IsFulfilled);
        Assert.Equal(400, eval.Reward.Metal);
        Assert.Equal(100, eval.Reward.Crystal);
    }

    [Fact]
    public void Quest9_ResearchLab6_EvaluatesCorrectly()
    {
        var planet = new Planet();
        planet.Buildings.Add(new Building { BuildingType = BuildingType.ResearchLab, Level = 6 });

        var eval = DirectiveSecureBordersFormulas.EvaluateQuest(9, planet, null, 0);

        Assert.True(eval.IsFulfilled);
        Assert.Equal(4800, eval.Reward.Metal);
        Assert.Equal(9600, eval.Reward.Crystal);
        Assert.Equal(4800, eval.Reward.Deuterium);

        planet.Buildings.First(b => b.BuildingType == BuildingType.ResearchLab).Level = 5;
        var evalPartial = DirectiveSecureBordersFormulas.EvaluateQuest(9, planet, null, 0);
        Assert.False(evalPartial.IsFulfilled);
    }

    [Fact]
    public void Quest10_ShieldTech1_EvaluatesCorrectly()
    {
        var user = new User();
        user.Researches.Add(new UserResearch { ResearchType = ResearchType.ShieldingTechnology, Level = 1 });

        var eval = DirectiveSecureBordersFormulas.EvaluateQuest(10, null, user, 0);

        Assert.True(eval.IsFulfilled);
        Assert.Equal(100, eval.Reward.Metal);
        Assert.Equal(300, eval.Reward.Crystal);
    }

    [Fact]
    public void Quest11_HeavyFighter_EvaluatesCorrectly()
    {
        var planet = new Planet();
        planet.Units.Add(new PlanetUnit { UnitType = UnitType.HeavyFighter, Count = 1 });

        var eval = DirectiveSecureBordersFormulas.EvaluateQuest(11, planet, null, 0);

        Assert.True(eval.IsFulfilled);
        Assert.Equal(3000, eval.Reward.Metal);
        Assert.Equal(2000, eval.Reward.Crystal);
    }

    [Fact]
    public void ProcessEvent_UpdatesBitmask_ForDefenseAndFighter()
    {
        int mask1 = DirectiveSecureBordersFormulas.ProcessEvent(1, 0, "rocket_launcher_produced");
        Assert.Equal(1, mask1);

        int mask3 = DirectiveSecureBordersFormulas.ProcessEvent(3, 0, "defense_produced:LightLaser");
        Assert.Equal(1, mask3);

        int mask5 = DirectiveSecureBordersFormulas.ProcessEvent(5, 0, "defense_produced:HeavyLaser");
        Assert.Equal(1, mask5);

        int mask11 = DirectiveSecureBordersFormulas.ProcessEvent(11, 0, "ship_produced:HeavyFighter");
        Assert.Equal(1, mask11);

        int maskOther = DirectiveSecureBordersFormulas.ProcessEvent(11, 0, "ship_produced:SolarSatellite");
        Assert.Equal(0, maskOther);
    }

    [Fact]
    public void GetNextDirectiveSummary_ReturnsExpectedOutputs()
    {
        var completedSummary = DirectiveSecureBordersFormulas.GetNextDirectiveSummary(
            11,
            true,
            new DirectiveEvaluationResult(11, "Ağır savaşçılara ihtiyacımız var", "", "", new(), new(0, 0, 0, 0), 0, 0, true, 1));
        Assert.Contains("tamamlandı", completedSummary);

        var fulfilledEval = new DirectiveEvaluationResult(
            1,
            "Bir roketatar yap",
            "",
            "",
            new() { new(0, "Roketatar inşa et", true) },
            new(1000, 0, 0, 0),
            1,
            1,
            true,
            1);
        var fulfilledSummary = DirectiveSecureBordersFormulas.GetNextDirectiveSummary(1, false, fulfilledEval);
        Assert.Equal("Bir roketatar yap tamamlandı! Ödülü al.", fulfilledSummary);

        var unfulfilledEval = new DirectiveEvaluationResult(
            1,
            "Bir roketatar yap",
            "",
            "",
            new() { new(0, "Savunma menüsünde 1 defa Roketatar inşa et", false) },
            new(1000, 0, 0, 0),
            0,
            1,
            false,
            0);
        var unfulfilledSummary = DirectiveSecureBordersFormulas.GetNextDirectiveSummary(1, false, unfulfilledEval);
        Assert.Equal("Savunma menüsünde 1 defa Roketatar inşa et", unfulfilledSummary);
    }
}
