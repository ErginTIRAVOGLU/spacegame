using OGame.Domain.Services;

namespace OGame.Domain.Tests;

public class ProfileCustomizationFormulasTests
{
    [Theory]
    [InlineData("", false)]
    [InlineData("ab", false)]
    [InlineData("a_very_long_username_that_exceeds_twenty_characters", false)]
    [InlineData("Commander@123", false)]
    [InlineData("User Name", false)]
    [InlineData("Commander", true)]
    [InlineData("Dark_Lord-99", true)]
    [InlineData("Neo", true)]
    public void ValidateUsername_ShouldValidateCorrectly(string username, bool expectedValid)
    {
        bool isValid = ProfileCustomizationFormulas.ValidateUsername(username, out string error);

        Assert.Equal(expectedValid, isValid);
        if (!expectedValid)
        {
            Assert.NotEmpty(error);
        }
        else
        {
            Assert.Empty(error);
        }
    }

    [Theory]
    [InlineData(0, 100, 5, false)]
    [InlineData(10, 100, 5, false)]
    [InlineData(1, 0, 5, false)]
    [InlineData(1, 500, 5, false)]
    [InlineData(1, 100, 0, false)]
    [InlineData(1, 100, 16, false)]
    [InlineData(1, 1, 1, true)]
    [InlineData(5, 250, 8, true)]
    [InlineData(9, 499, 15, true)]
    public void ValidateRelocationTarget_ShouldValidateCoordinates(int galaxy, int system, int slot, bool expectedValid)
    {
        var (isValid, error) = ProfileCustomizationFormulas.ValidateRelocationTarget(galaxy, system, slot);

        Assert.Equal(expectedValid, isValid);
        if (!expectedValid)
        {
            Assert.NotEmpty(error);
        }
        else
        {
            Assert.Empty(error);
        }
    }

    [Fact]
    public void CalculateNewTemperature_ShouldReturnCanonicalTemperatureBand()
    {
        var slot1 = ProfileCustomizationFormulas.CalculateNewTemperature(1);
        Assert.Equal(220, slot1.TempMin);
        Assert.Equal(260, slot1.TempMax);

        var slot8 = ProfileCustomizationFormulas.CalculateNewTemperature(8);
        Assert.Equal(30, slot8.TempMin);
        Assert.Equal(70, slot8.TempMax);

        var slot15 = ProfileCustomizationFormulas.CalculateNewTemperature(15);
        Assert.Equal(-130, slot15.TempMin);
        Assert.Equal(-90, slot15.TempMax);
    }

    [Fact]
    public void Cosmetics_Catalog_ShouldHaveDefaultsAndPaidItems()
    {
        var avatars = ProfileCustomizationFormulas.GetAvatars();
        var titles = ProfileCustomizationFormulas.GetTitles();

        Assert.NotEmpty(avatars);
        Assert.NotEmpty(titles);

        Assert.Contains(avatars, a => a.IsDefault && a.CostDarkMatter == 0);
        Assert.Contains(avatars, a => a.Id == "avatar_general" && a.CostDarkMatter == 30_000);

        Assert.Contains(titles, t => t.IsDefault && t.CostDarkMatter == 0);
        Assert.Contains(titles, t => t.Id == "title_fleet_legend" && t.CostDarkMatter == 35_000);
    }
}

