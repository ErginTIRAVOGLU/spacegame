using OGame.Domain.Entities;
using OGame.Domain.Enums;
using OGame.Domain.Services;
using Xunit;

namespace OGame.Domain.Tests;

public class DirectiveLifeformsFormulasTests
{
    [Fact]
    public void DirectiveVI_Metadata_And_FinalReward_AreCorrect()
    {
        Assert.Equal(6, DirectiveLifeformsFormulas.DirectiveId);
        Assert.Equal("Dünya Dışı Yaşam", DirectiveLifeformsFormulas.DirectiveTitle);
        Assert.Equal("Birinci Subay Nova", DirectiveLifeformsFormulas.GuideCharacterName);

        var finalReward = DirectiveLifeformsFormulas.FinalDirectiveReward;
        Assert.Equal(15000, finalReward.Metal);
        Assert.Equal(7500, finalReward.Crystal);
        Assert.Equal(1500, finalReward.Deuterium);
        Assert.Equal(6000, finalReward.DarkMatter);

        var allQuests = DirectiveLifeformsFormulas.GetAllQuests();
        Assert.Equal(13, allQuests.Count);
    }

    [Fact]
    public void Quest1_BiosphereFarm22_Housing21_EvaluatesViaBitmask()
    {
        var eval0 = DirectiveLifeformsFormulas.EvaluateQuest(1, null, null, 0);
        Assert.Equal(2, eval0.TotalCount);
        Assert.Equal(0, eval0.CompletedCount);
        Assert.False(eval0.IsFulfilled);

        // Bit 0 met (Biosphere Farm 22)
        var eval1 = DirectiveLifeformsFormulas.EvaluateQuest(1, null, null, 1);
        Assert.Equal(1, eval1.CompletedCount);
        Assert.False(eval1.IsFulfilled);

        // Bit 0 & 1 met (both)
        var evalFull = DirectiveLifeformsFormulas.EvaluateQuest(1, null, null, 3);
        Assert.Equal(2, evalFull.CompletedCount);
        Assert.True(evalFull.IsFulfilled);
        Assert.Equal(35000, evalFull.Reward.Metal);
        Assert.Equal(10000, evalFull.Reward.Crystal);
    }

    [Fact]
    public void Quest2_ResearchCenter_EvaluatesAccurately()
    {
        var eval0 = DirectiveLifeformsFormulas.EvaluateQuest(2, null, null, 0);
        Assert.False(eval0.IsFulfilled);

        var eval1 = DirectiveLifeformsFormulas.EvaluateQuest(2, null, null, 1);
        Assert.True(eval1.IsFulfilled);
        Assert.Equal(10000, eval1.Reward.Metal);
        Assert.Equal(12500, eval1.Reward.Crystal);
        Assert.Equal(5000, eval1.Reward.Deuterium);
    }

    [Fact]
    public void Quest3_IntergalacticEnvoys_EvaluatesAccurately()
    {
        var eval0 = DirectiveLifeformsFormulas.EvaluateQuest(3, null, null, 0);
        Assert.False(eval0.IsFulfilled);

        var eval1 = DirectiveLifeformsFormulas.EvaluateQuest(3, null, null, 1);
        Assert.True(eval1.IsFulfilled);
        Assert.Equal(2500, eval1.Reward.Metal);
        Assert.Equal(12500 / 10, eval1.Reward.Crystal);
    }

    [Fact]
    public void Quest4_ComputerTechnologyLevel2_EvaluatesFromUserOrBitmask()
    {
        var user = new User();
        user.Researches.Add(new UserResearch { ResearchType = ResearchType.ComputerTechnology, Level = 1 });

        var eval1 = DirectiveLifeformsFormulas.EvaluateQuest(4, null, user, 0);
        Assert.False(eval1.IsFulfilled);

        user.Researches.First(r => r.ResearchType == ResearchType.ComputerTechnology).Level = 2;
        var eval2 = DirectiveLifeformsFormulas.EvaluateQuest(4, null, user, 0);
        Assert.True(eval2.IsFulfilled);
        Assert.Equal(400, eval2.Reward.Metal);
        Assert.Equal(600, eval2.Reward.Crystal);

        // Bitmask backup
        var evalMask = DirectiveLifeformsFormulas.EvaluateQuest(4, null, null, 1);
        Assert.True(evalMask.IsFulfilled);
    }

    [Fact]
    public void Directive6_LiveLevels_StrictlyEvaluatesAndClearsCorruptedBitmask()
    {
        // Quest 1: Player is at level 3 for bioFarm and level 3 for residential, but old corrupted bitmask had 3
        var lowLevels = new Dictionary<string, int>
        {
            ["biosphereFarm"] = 3,
            ["residentialSector"] = 3,
            ["researchCentre"] = 2
        };
        var lowTechs = new Dictionary<int, int>
        {
            [1] = 1
        };

        var q1Eval = DirectiveLifeformsFormulas.EvaluateQuest(1, null, null, 3, lowLevels, lowTechs);
        Assert.False(q1Eval.IsFulfilled);
        Assert.Equal(0, q1Eval.CompletedCount);
        Assert.Equal(0, q1Eval.ComputedBitmask); // Corrupted bitmask cleared!

        // Target levels met (22 and 21)
        var highLevels = new Dictionary<string, int>
        {
            ["biosphereFarm"] = 22,
            ["residentialSector"] = 21,
            ["researchCentre"] = 2
        };
        var q1MetEval = DirectiveLifeformsFormulas.EvaluateQuest(1, null, null, 0, highLevels, lowTechs);
        Assert.True(q1MetEval.IsFulfilled);
        Assert.Equal(2, q1MetEval.CompletedCount);
        Assert.Equal(3, q1MetEval.ComputedBitmask);

        // Quest 2: Research centre level 2 (target 1) should be fulfilled even if bitmask is 0
        var q2Eval = DirectiveLifeformsFormulas.EvaluateQuest(2, null, null, 0, lowLevels, lowTechs);
        Assert.True(q2Eval.IsFulfilled);
        Assert.Equal(1, q2Eval.CompletedCount);

        // Quest 3: Intergalactic envoys researched (tech 1 >= 1)
        var q3Eval = DirectiveLifeformsFormulas.EvaluateQuest(3, null, null, 0, lowLevels, lowTechs);
        Assert.True(q3Eval.IsFulfilled);
        Assert.Equal(1, q3Eval.CompletedCount);
    }

    [Fact]
    public void Quest5_LifeformDiscoveryFleet_EvaluatesAccurately()
    {
        var eval0 = DirectiveLifeformsFormulas.EvaluateQuest(5, null, null, 0);
        Assert.False(eval0.IsFulfilled);

        var eval1 = DirectiveLifeformsFormulas.EvaluateQuest(5, null, null, 1);
        Assert.True(eval1.IsFulfilled);
        Assert.Equal(2500, eval1.Reward.Metal);
        Assert.Equal(500, eval1.Reward.Crystal);
        Assert.Equal(250, eval1.Reward.Deuterium);
    }

    [Fact]
    public void Quest6_SpeciesDiscovered_EvaluatesAccurately()
    {
        var eval0 = DirectiveLifeformsFormulas.EvaluateQuest(6, null, null, 0);
        Assert.False(eval0.IsFulfilled);

        var eval1 = DirectiveLifeformsFormulas.EvaluateQuest(6, null, null, 1);
        Assert.True(eval1.IsFulfilled);
        Assert.Equal(2500, eval1.Reward.Metal);
        Assert.Equal(5000, eval1.Reward.Crystal);
        Assert.Equal(2500, eval1.Reward.Deuterium);
    }

    [Fact]
    public void Quest7_SpeciesAssignedToColony_EvaluatesAccurately()
    {
        var eval0 = DirectiveLifeformsFormulas.EvaluateQuest(7, null, null, 0);
        Assert.False(eval0.IsFulfilled);

        var eval1 = DirectiveLifeformsFormulas.EvaluateQuest(7, null, null, 1);
        Assert.True(eval1.IsFulfilled);
        Assert.Equal(5000, eval1.Reward.Metal);
        Assert.Equal(2000, eval1.Reward.Crystal);
        Assert.Equal(500, eval1.Reward.Deuterium);

        var evalColony = DirectiveLifeformsFormulas.EvaluateQuest(7, null, null, 0, null, null, hasColonyWithLifeform: true);
        Assert.True(evalColony.IsFulfilled);
        Assert.Equal("Bir sömürgeye bir canlı türü ata", evalColony.Steps[0].Description);
    }

    [Fact]
    public void Quest8_Biosphere23_Housing22_EvaluatesAccurately()
    {
        var eval0 = DirectiveLifeformsFormulas.EvaluateQuest(8, null, null, 0);
        Assert.Equal(2, eval0.TotalCount);
        Assert.False(eval0.IsFulfilled);

        var evalFull = DirectiveLifeformsFormulas.EvaluateQuest(8, null, null, 3);
        Assert.True(evalFull.IsFulfilled);
        Assert.Equal(9000, evalFull.Reward.Metal);
        Assert.Equal(3000, evalFull.Reward.Crystal);
    }

    [Fact]
    public void Quest9_Slot2Unlocked_EvaluatesAccurately()
    {
        var eval0 = DirectiveLifeformsFormulas.EvaluateQuest(9, null, null, 0);
        Assert.False(eval0.IsFulfilled);

        var eval1 = DirectiveLifeformsFormulas.EvaluateQuest(9, null, null, 1);
        Assert.True(eval1.IsFulfilled);
        Assert.Equal(2000, eval1.Reward.Metal);
        Assert.Equal(1000, eval1.Reward.Crystal);
    }

    [Fact]
    public void Quest10_TechSelected_EvaluatesAccurately()
    {
        var eval0 = DirectiveLifeformsFormulas.EvaluateQuest(10, null, null, 0);
        Assert.False(eval0.IsFulfilled);

        var eval1 = DirectiveLifeformsFormulas.EvaluateQuest(10, null, null, 1);
        Assert.True(eval1.IsFulfilled);
        Assert.Equal(500, eval1.Reward.Metal);
        Assert.Equal(500, eval1.Reward.Crystal);
        Assert.Equal(500, eval1.Reward.Deuterium);
    }

    [Fact]
    public void Quest11_Artifacts200_EvaluatesAccurately()
    {
        var eval0 = DirectiveLifeformsFormulas.EvaluateQuest(11, null, null, 0);
        Assert.False(eval0.IsFulfilled);

        var eval1 = DirectiveLifeformsFormulas.EvaluateQuest(11, null, null, 1);
        Assert.True(eval1.IsFulfilled);
        Assert.Equal(62500, eval1.Reward.Metal);
        Assert.Equal(12500, eval1.Reward.Crystal);
        Assert.Equal(6250, eval1.Reward.Deuterium);
    }

    [Fact]
    public void Quest12_ThreeSteps_Biosphere24_Housing23_Slot3_EvaluatesAccurately()
    {
        var eval0 = DirectiveLifeformsFormulas.EvaluateQuest(12, null, null, 0);
        Assert.Equal(3, eval0.TotalCount);
        Assert.Equal(0, eval0.CompletedCount);
        Assert.False(eval0.IsFulfilled);

        var evalPartial = DirectiveLifeformsFormulas.EvaluateQuest(12, null, null, 5); // Bit 0 & Bit 2
        Assert.Equal(2, evalPartial.CompletedCount);
        Assert.False(evalPartial.IsFulfilled);

        var evalFull = DirectiveLifeformsFormulas.EvaluateQuest(12, null, null, 7); // Bits 0, 1, 2
        Assert.Equal(3, evalFull.CompletedCount);
        Assert.True(evalFull.IsFulfilled);
        Assert.Equal(10000, evalFull.Reward.Metal);
        Assert.Equal(3500, evalFull.Reward.Crystal);
    }

    [Fact]
    public void Quest13_ArtifactsSpent_EvaluatesAccurately()
    {
        var eval0 = DirectiveLifeformsFormulas.EvaluateQuest(13, null, null, 0);
        Assert.False(eval0.IsFulfilled);

        var eval1 = DirectiveLifeformsFormulas.EvaluateQuest(13, null, null, 1);
        Assert.True(eval1.IsFulfilled);
        Assert.Equal(5000, eval1.Reward.Metal);
        Assert.Equal(2500, eval1.Reward.Crystal);
    }

    [Fact]
    public void ProcessEvent_CorrectlySetsBitmasks_ForEvents()
    {
        int mask1 = DirectiveLifeformsFormulas.ProcessEvent(1, 0, "biosphere_farm_22");
        Assert.Equal(1, mask1);

        int mask1Both = DirectiveLifeformsFormulas.ProcessEvent(1, 0, "lifeform_buildings_q1_completed");
        Assert.Equal(3, mask1Both);

        int mask2 = DirectiveLifeformsFormulas.ProcessEvent(2, 0, "research_center_built");
        Assert.Equal(1, mask2);

        int mask5 = DirectiveLifeformsFormulas.ProcessEvent(5, 0, "lifeform_discovery_dispatched");
        Assert.Equal(1, mask5);

        int mask12 = DirectiveLifeformsFormulas.ProcessEvent(12, 0, "lifeform_q12_all_met");
        Assert.Equal(7, mask12);

        int mask13 = DirectiveLifeformsFormulas.ProcessEvent(13, 0, "artifacts_spent");
        Assert.Equal(1, mask13);
    }

    [Fact]
    public void GetNextDirectiveSummary_ReturnsExpectedOutputs()
    {
        var completedSummary = DirectiveLifeformsFormulas.GetNextDirectiveSummary(
            13,
            true,
            new DirectiveEvaluationResult(13, "Eserlerle bir teknoloji satın al", "", "", new(), new(0, 0, 0, 0), 0, 0, true, 1));
        Assert.Contains("tamamlandı", completedSummary);

        var fulfilledEval = new DirectiveEvaluationResult(
            1,
            "Canlı türlerinin temelleri",
            "",
            "",
            new() { new(0, "Biyosfer Çiftliği binasını 22. seviyeye yükselt", true) },
            new(35000, 10000, 0, 0),
            1,
            1,
            true,
            3);
        var fulfilledSummary = DirectiveLifeformsFormulas.GetNextDirectiveSummary(1, false, fulfilledEval);
        Assert.Equal("Canlı türlerinin temelleri tamamlandı! Ödülü al.", fulfilledSummary);

        var unfulfilledEval = new DirectiveEvaluationResult(
            1,
            "Canlı türlerinin temelleri",
            "",
            "",
            new() { new(0, "Biyosfer Çiftliği binasını 22. seviyeye yükselt", false) },
            new(35000, 10000, 0, 0),
            0,
            1,
            false,
            0);
        var unfulfilledSummary = DirectiveLifeformsFormulas.GetNextDirectiveSummary(1, false, unfulfilledEval);
        Assert.Equal("Biyosfer Çiftliği binasını 22. seviyeye yükselt", unfulfilledSummary);
    }
}

