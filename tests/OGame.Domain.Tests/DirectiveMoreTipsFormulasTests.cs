using OGame.Domain.Entities;
using OGame.Domain.Enums;
using OGame.Domain.Services;
using Xunit;

namespace OGame.Domain.Tests;

public class DirectiveMoreTipsFormulasTests
{
    [Fact]
    public void DirectiveVII_Metadata_And_FinalReward_AreCorrect()
    {
        Assert.Equal(7, DirectiveMoreTipsFormulas.DirectiveId);
        Assert.Equal("Daha Fazla İpucu", DirectiveMoreTipsFormulas.DirectiveTitle);
        Assert.Equal("Birinci Subay Nova", DirectiveMoreTipsFormulas.GuideCharacterName);

        var finalReward = DirectiveMoreTipsFormulas.FinalDirectiveReward;
        Assert.Equal(5000, finalReward.Metal);
        Assert.Equal(2500, finalReward.Crystal);
        Assert.Equal(1500, finalReward.Deuterium);
        Assert.Equal(3000, finalReward.DarkMatter);

        var allQuests = DirectiveMoreTipsFormulas.GetAllQuests();
        Assert.Equal(4, allQuests.Count);
    }

    [Fact]
    public void Quest1_Recycler_EvaluatesAccurately()
    {
        var planet = new Planet();
        var eval0 = DirectiveMoreTipsFormulas.EvaluateQuest(1, planet, null, 0);
        Assert.False(eval0.IsFulfilled);

        planet.Units.Add(new PlanetUnit { UnitType = UnitType.Recycler, Count = 1 });
        var eval1 = DirectiveMoreTipsFormulas.EvaluateQuest(1, planet, null, 0);
        Assert.True(eval1.IsFulfilled);
        Assert.Equal(5000, eval1.Reward.Metal);
        Assert.Equal(2500, eval1.Reward.Crystal);
        Assert.Equal(1000, eval1.Reward.Deuterium);

        // Bitmask fallback
        var evalMask = DirectiveMoreTipsFormulas.EvaluateQuest(1, null, null, 1);
        Assert.True(evalMask.IsFulfilled);
    }

    [Fact]
    public void Quest2_DebrisHarvested_EvaluatesAccurately()
    {
        var eval0 = DirectiveMoreTipsFormulas.EvaluateQuest(2, null, null, 0);
        Assert.False(eval0.IsFulfilled);

        var eval1 = DirectiveMoreTipsFormulas.EvaluateQuest(2, null, null, 1);
        Assert.True(eval1.IsFulfilled);
        Assert.Equal(10000, eval1.Reward.Metal);
        Assert.Equal(5000, eval1.Reward.Crystal);
    }

    [Fact]
    public void Quest3_CharacterClassSelected_EvaluatesAccurately()
    {
        var user = new User { PlayerClass = PlayerClass.None };
        var eval0 = DirectiveMoreTipsFormulas.EvaluateQuest(3, null, user, 0);
        Assert.False(eval0.IsFulfilled);

        user.PlayerClass = PlayerClass.Collector;
        var eval1 = DirectiveMoreTipsFormulas.EvaluateQuest(3, null, user, 0);
        Assert.True(eval1.IsFulfilled);
        Assert.Equal(2500, eval1.Reward.Metal);
        Assert.Equal(1000, eval1.Reward.Crystal);
        Assert.Equal(500, eval1.Reward.Deuterium);

        user.PlayerClass = PlayerClass.General;
        var evalGeneral = DirectiveMoreTipsFormulas.EvaluateQuest(3, null, user, 0);
        Assert.True(evalGeneral.IsFulfilled);

        user.PlayerClass = PlayerClass.Discoverer;
        var evalDiscoverer = DirectiveMoreTipsFormulas.EvaluateQuest(3, null, user, 0);
        Assert.True(evalDiscoverer.IsFulfilled);
    }

    [Fact]
    public void Quest4_MerchantSummoned_EvaluatesAccurately()
    {
        var eval0 = DirectiveMoreTipsFormulas.EvaluateQuest(4, null, null, 0);
        Assert.False(eval0.IsFulfilled);

        var eval1 = DirectiveMoreTipsFormulas.EvaluateQuest(4, null, null, 1);
        Assert.True(eval1.IsFulfilled);
        Assert.Equal(0, eval1.Reward.Metal);
        Assert.Equal(2500, eval1.Reward.DarkMatter);
    }

    [Fact]
    public void ProcessEvent_CorrectlyUpdatesBitmask()
    {
        int mask1 = DirectiveMoreTipsFormulas.ProcessEvent(1, 0, "recycler_produced");
        Assert.Equal(1, mask1);

        int mask2 = DirectiveMoreTipsFormulas.ProcessEvent(2, 0, "debris_harvested");
        Assert.Equal(1, mask2);

        int mask3 = DirectiveMoreTipsFormulas.ProcessEvent(3, 0, "character_class_selected");
        Assert.Equal(1, mask3);

        int mask4 = DirectiveMoreTipsFormulas.ProcessEvent(4, 0, "merchant_summoned");
        Assert.Equal(1, mask4);

        int maskIrrelevant = DirectiveMoreTipsFormulas.ProcessEvent(4, 0, "unknown_event");
        Assert.Equal(0, maskIrrelevant);
    }

    [Fact]
    public void GetNextDirectiveSummary_ReturnsExpectedOutputs()
    {
        var completedSummary = DirectiveMoreTipsFormulas.GetNextDirectiveSummary(
            4,
            true,
            new DirectiveEvaluationResult(4, "Tüccarı çağır", "", "", new(), new(0, 0, 0, 0), 0, 0, true, 1));
        Assert.Contains("tamamlandı", completedSummary);

        var fulfilledEval = new DirectiveEvaluationResult(
            1,
            "Bir geri dönüşümcü inşa et",
            "",
            "",
            new() { new(0, "Tersanede 1 defa Geri Dönüşümcü inşa et", true) },
            new(5000, 2500, 1000, 0),
            1,
            1,
            true,
            1);
        var fulfilledSummary = DirectiveMoreTipsFormulas.GetNextDirectiveSummary(1, false, fulfilledEval);
        Assert.Equal("Bir geri dönüşümcü inşa et tamamlandı! Ödülü al.", fulfilledSummary);

        var unfulfilledEval = new DirectiveEvaluationResult(
            1,
            "Bir geri dönüşümcü inşa et",
            "",
            "",
            new() { new(0, "Tersanede 1 defa Geri Dönüşümcü inşa et", false) },
            new(5000, 2500, 1000, 0),
            0,
            1,
            false,
            0);
        var unfulfilledSummary = DirectiveMoreTipsFormulas.GetNextDirectiveSummary(1, false, unfulfilledEval);
        Assert.Equal("Tersanede 1 defa Geri Dönüşümcü inşa et", unfulfilledSummary);
    }
}

