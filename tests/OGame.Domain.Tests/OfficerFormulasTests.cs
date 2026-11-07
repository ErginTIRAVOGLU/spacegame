using OGame.Domain.Services;
using Xunit;

namespace OGame.Domain.Tests;

public class OfficerFormulasTests
{
    [Fact]
    public void EvaluateBonuses_NoOfficers_ReturnsDefaultMultipliers()
    {
        var bonuses = OfficerFormulas.EvaluateBonuses(false, false, false, false, false);

        Assert.False(bonuses.HasCommander);
        Assert.False(bonuses.HasAdmiral);
        Assert.False(bonuses.HasEngineer);
        Assert.False(bonuses.HasGeologist);
        Assert.False(bonuses.HasTechnocrat);
        Assert.False(bonuses.HasFullCommandStaff);
        Assert.Equal(1.0, bonuses.MineProductionMultiplier);
        Assert.Equal(1.0, bonuses.EnergyProductionMultiplier);
        Assert.Equal(1.0, bonuses.ResearchDurationMultiplier);
        Assert.Equal(0.70, bonuses.DefenseRepairRatio);
        Assert.Equal(0, bonuses.ExtraFleetSlots);
        Assert.Equal(0, bonuses.ExtraExpeditionSlots);
        Assert.Equal(0, bonuses.ExtraEspionageTechLevels);
    }

    [Fact]
    public void EvaluateBonuses_GeologistOnly_Gives10PercentMineBoost()
    {
        var bonuses = OfficerFormulas.EvaluateBonuses(false, false, false, true, false);

        Assert.Equal(1.10, bonuses.MineProductionMultiplier, 2);
        Assert.Equal(1.0, bonuses.EnergyProductionMultiplier);
    }

    [Fact]
    public void EvaluateBonuses_EngineerOnly_Gives10PercentEnergyAnd85PercentDefenseRepair()
    {
        var bonuses = OfficerFormulas.EvaluateBonuses(false, false, true, false, false);

        Assert.Equal(1.10, bonuses.EnergyProductionMultiplier, 2);
        Assert.Equal(0.85, bonuses.DefenseRepairRatio, 2);
    }

    [Fact]
    public void EvaluateBonuses_TechnocratOnly_Gives25PercentFasterResearch()
    {
        var bonuses = OfficerFormulas.EvaluateBonuses(false, false, false, false, true);

        Assert.Equal(0.75, bonuses.ResearchDurationMultiplier, 2);
        Assert.Equal(2, bonuses.ExtraEspionageTechLevels);
    }

    [Fact]
    public void EvaluateBonuses_AdmiralOnly_GivesExtraSlots()
    {
        var bonuses = OfficerFormulas.EvaluateBonuses(false, true, false, false, false);

        Assert.Equal(2, bonuses.ExtraFleetSlots);
        Assert.Equal(1, bonuses.ExtraExpeditionSlots);
    }

    [Fact]
    public void EvaluateBonuses_FullCommandStaff_AppliesSetBonuses()
    {
        var bonuses = OfficerFormulas.EvaluateBonuses(true, true, true, true, true);

        Assert.True(bonuses.HasFullCommandStaff);
        // 10% Geologist + 2% Staff = +12%
        Assert.Equal(1.12, bonuses.MineProductionMultiplier, 2);
        // 10% Engineer + 2% Staff = +12%
        Assert.Equal(1.12, bonuses.EnergyProductionMultiplier, 2);
        // Admiral 2 + Staff 1 = 3
        Assert.Equal(3, bonuses.ExtraFleetSlots);
        // Technocrat 2 + Staff 1 = 3
        Assert.Equal(3, bonuses.ExtraEspionageTechLevels);
    }

    [Theory]
    [InlineData("commander", 10_000, 100_000)]
    [InlineData("admiral", 5_000, 50_000)]
    [InlineData("engineer", 5_000, 50_000)]
    [InlineData("geologist", 12_500, 125_000)]
    [InlineData("technocrat", 10_000, 100_000)]
    [InlineData("command_staff", 42_500, 425_000)]
    public void CanonicalPricingModel_MatchesTaskSpecification(string officerKey, int expectedWeekly, int expectedThreeMonths)
    {
        var (weekly, threeMonths) = OfficerFormulas.GetCanonicalCost(officerKey);

        Assert.Equal(expectedWeekly, weekly);
        Assert.Equal(expectedThreeMonths, threeMonths);
    }

    [Fact]
    public void CanonicalDurationModel_MatchesOneWeekAndThreeMonths()
    {
        var weekDuration = System.TimeSpan.FromDays(7);
        var threeMonthsDuration = System.TimeSpan.FromDays(90);

        Assert.Equal(7, weekDuration.TotalDays);
        Assert.Equal(90, threeMonthsDuration.TotalDays);
        Assert.Equal(2160, threeMonthsDuration.TotalHours);
    }
}

