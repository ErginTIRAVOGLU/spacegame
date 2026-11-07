using OGame.Domain.Services;

namespace OGame.Domain.Tests;

public class MonthlyBoostersFormulasTests
{
    [Fact]
    public void GetMonthlyBoosters_ShouldContainExactly9Boosters()
    {
        var boosters = MonthlyBoostersFormulas.GetMonthlyBoosters();

        Assert.NotNull(boosters);
        Assert.Equal(9, boosters.Count);

        // Verify that Bronze 30-day boosters are NOT present in the shop
        Assert.DoesNotContain(boosters, b => b.Tier == "Bronze");

        // Verify each tier has 3 resource variants
        Assert.Equal(3, boosters.Count(b => b.Tier == "Silver"));
        Assert.Equal(3, boosters.Count(b => b.Tier == "Gold"));
        Assert.Equal(3, boosters.Count(b => b.Tier == "Platinum"));

        // Verify exact pricing
        Assert.All(boosters.Where(b => b.Tier == "Silver"), b => Assert.Equal(28_000, b.CostDarkMatter));
        Assert.All(boosters.Where(b => b.Tier == "Gold"), b => Assert.Equal(75_000, b.CostDarkMatter));
        Assert.All(boosters.Where(b => b.Tier == "Platinum"), b => Assert.Equal(110_000, b.CostDarkMatter));
    }

    [Fact]
    public void GetMonthlyOfficers_ShouldContainExactly6PackagesWithExactPricing()
    {
        var officers = MonthlyBoostersFormulas.GetMonthlyOfficers();

        Assert.NotNull(officers);
        Assert.Equal(6, officers.Count);

        var commander = MonthlyBoostersFormulas.FindOfficer("Commander");
        var admiral = MonthlyBoostersFormulas.FindOfficer("Admiral");
        var engineer = MonthlyBoostersFormulas.FindOfficer("Engineer");
        var geologist = MonthlyBoostersFormulas.FindOfficer("Geologist");
        var technocrat = MonthlyBoostersFormulas.FindOfficer("Technocrat");
        var staff = MonthlyBoostersFormulas.FindOfficer("Staff");

        Assert.NotNull(commander);
        Assert.Equal(20_000, commander.CostDarkMatter);

        Assert.NotNull(admiral);
        Assert.Equal(15_000, admiral.CostDarkMatter);

        Assert.NotNull(engineer);
        Assert.Equal(15_000, engineer.CostDarkMatter);

        Assert.NotNull(geologist);
        Assert.Equal(12_500, geologist.CostDarkMatter);

        Assert.NotNull(technocrat);
        Assert.Equal(10_000, technocrat.CostDarkMatter);

        Assert.NotNull(staff);
        Assert.Equal(42_500, staff.CostDarkMatter);
    }

    [Fact]
    public void CalculateExtendedExpiration_WhenExpired_ShouldAddDaysFromNow()
    {
        var now = new DateTime(2026, 10, 30, 12, 0, 0, DateTimeKind.Utc);
        var expiredTime = now.AddDays(-5);

        var result = MonthlyBoostersFormulas.CalculateExtendedExpiration(expiredTime, now, addDays: 30);

        Assert.Equal(now.AddDays(30), result);
    }

    [Fact]
    public void CalculateExtendedExpiration_WhenActive_ShouldStackOntoCurrentExpiration()
    {
        var now = new DateTime(2026, 10, 30, 12, 0, 0, DateTimeKind.Utc);
        var activeTime = now.AddDays(10);

        var result = MonthlyBoostersFormulas.CalculateExtendedExpiration(activeTime, now, addDays: 30);

        Assert.Equal(activeTime.AddDays(30), result);
    }
}

