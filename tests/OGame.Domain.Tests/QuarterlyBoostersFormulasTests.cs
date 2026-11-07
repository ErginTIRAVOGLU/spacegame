using OGame.Domain.Services;

namespace OGame.Domain.Tests;

public class QuarterlyBoostersFormulasTests
{
    [Fact]
    public void GetQuarterlyBoosters_ShouldContainExactly9Boosters()
    {
        var boosters = QuarterlyBoostersFormulas.GetQuarterlyBoosters();

        Assert.NotNull(boosters);
        Assert.Equal(9, boosters.Count);

        // Verify Bronze 90-day boosters are NOT sold in the shop
        Assert.DoesNotContain(boosters, b => b.Tier == "Bronze");

        // Verify each tier has 3 resource variants
        Assert.Equal(3, boosters.Count(b => b.Tier == "Silver"));
        Assert.Equal(3, boosters.Count(b => b.Tier == "Gold"));
        Assert.Equal(3, boosters.Count(b => b.Tier == "Platinum"));

        // Verify exact pricing and duration
        Assert.All(boosters, b => Assert.Equal(90, b.DurationDays));
        Assert.All(boosters.Where(b => b.Tier == "Silver"), b =>
        {
            Assert.Equal(80_000, b.CostDarkMatter);
            Assert.Equal(4_000, b.SavingsDarkMatter);
        });
        Assert.All(boosters.Where(b => b.Tier == "Gold"), b =>
        {
            Assert.Equal(200_000, b.CostDarkMatter);
            Assert.Equal(25_000, b.SavingsDarkMatter);
        });
        Assert.All(boosters.Where(b => b.Tier == "Platinum"), b =>
        {
            Assert.Equal(300_000, b.CostDarkMatter);
            Assert.Equal(30_000, b.SavingsDarkMatter);
        });
    }

    [Fact]
    public void GetQuarterlyOfficers_ShouldContainExactly6PackagesWithExactPricing()
    {
        var officers = QuarterlyBoostersFormulas.GetQuarterlyOfficers();

        Assert.NotNull(officers);
        Assert.Equal(6, officers.Count);

        var commander = QuarterlyBoostersFormulas.FindOfficer("Commander");
        var admiral = QuarterlyBoostersFormulas.FindOfficer("Admiral");
        var engineer = QuarterlyBoostersFormulas.FindOfficer("Engineer");
        var geologist = QuarterlyBoostersFormulas.FindOfficer("Geologist");
        var technocrat = QuarterlyBoostersFormulas.FindOfficer("Technocrat");
        var staff = QuarterlyBoostersFormulas.FindOfficer("Staff");

        Assert.NotNull(commander);
        Assert.Equal(100_000, commander.CostDarkMatter);
        Assert.Equal(90, commander.DurationDays);

        Assert.NotNull(admiral);
        Assert.Equal(75_000, admiral.CostDarkMatter);
        Assert.Equal(90, admiral.DurationDays);

        Assert.NotNull(engineer);
        Assert.Equal(75_000, engineer.CostDarkMatter);
        Assert.Equal(90, engineer.DurationDays);

        Assert.NotNull(geologist);
        Assert.Equal(62_500, geologist.CostDarkMatter);
        Assert.Equal(90, geologist.DurationDays);

        Assert.NotNull(technocrat);
        Assert.Equal(50_000, technocrat.CostDarkMatter);
        Assert.Equal(90, technocrat.DurationDays);

        Assert.NotNull(staff);
        Assert.Equal(212_500, staff.CostDarkMatter);
        Assert.Equal(90, staff.DurationDays);
    }

    [Fact]
    public void CalculateExtendedExpiration_WhenExpired_ShouldAddDaysFromNow()
    {
        var now = new DateTime(2026, 10, 30, 12, 0, 0, DateTimeKind.Utc);
        var expiredTime = now.AddDays(-10);

        var result = QuarterlyBoostersFormulas.CalculateExtendedExpiration(expiredTime, now, addDays: 90);

        Assert.Equal(now.AddDays(90), result);
    }

    [Fact]
    public void CalculateExtendedExpiration_WhenActive_ShouldStackOntoCurrentExpiration()
    {
        var now = new DateTime(2026, 10, 30, 12, 0, 0, DateTimeKind.Utc);
        var activeTime = now.AddDays(25);

        var result = QuarterlyBoostersFormulas.CalculateExtendedExpiration(activeTime, now, addDays: 90);

        Assert.Equal(activeTime.AddDays(90), result);
    }
}

