using OGame.Domain.Enums;
using OGame.Domain.Services;
using Xunit;

namespace OGame.Domain.Tests;

public class HostileFleetAlertFormulasTests
{
    [Theory]
    [InlineData(0, 0, FleetIntelVisibilityTier.TotalCountOnly)]
    [InlineData(5, 5, FleetIntelVisibilityTier.TotalCountOnly)]
    [InlineData(6, 5, FleetIntelVisibilityTier.TotalCountOnly)]  // delta = 1 < 2
    [InlineData(3, 10, FleetIntelVisibilityTier.TotalCountOnly)] // delta = -7 < 2
    [InlineData(7, 5, FleetIntelVisibilityTier.ShipClassesOnly)] // delta = 2 in [2, 3]
    [InlineData(8, 5, FleetIntelVisibilityTier.ShipClassesOnly)] // delta = 3 in [2, 3]
    [InlineData(9, 5, FleetIntelVisibilityTier.FullDetails)]     // delta = 4 >= 4
    [InlineData(12, 5, FleetIntelVisibilityTier.FullDetails)]    // delta = 7 >= 4
    public void ResolveIntelTier_CalculatesAccuratelyBasedOnDeltaEsp(
        int defenderEsp,
        int attackerEsp,
        FleetIntelVisibilityTier expectedTier)
    {
        var tier = HostileFleetAlertFormulas.ResolveIntelTier(defenderEsp, attackerEsp);
        Assert.Equal(expectedTier, tier);
    }

    [Fact]
    public void LowEspionageDelta_ReturnsNoShipBreakdown()
    {
        var rawShips = new List<(UnitType, int)>
        {
            (UnitType.SmallCargo, 4),
            (UnitType.LightFighter, 2)
        };

        // Delta = 5 - 4 = 1 (< 2)
        var intel = HostileFleetAlertFormulas.ResolveShipBreakdown(rawShips, defenderEspionageLevel: 5, attackerEspionageLevel: 4);
        Assert.Empty(intel);
    }

    [Fact]
    public void MidEspionageDelta_ShowsShipClassesWithObscuredQuestionMarkCounts()
    {
        var rawShips = new List<(UnitType, int)>
        {
            (UnitType.SmallCargo, 4),
            (UnitType.LightFighter, 2)
        };

        // Delta = 7 - 5 = 2 in [2, 3]
        var intel = HostileFleetAlertFormulas.ResolveShipBreakdown(rawShips, defenderEspionageLevel: 7, attackerEspionageLevel: 5);
        Assert.Equal(2, intel.Count);

        Assert.Equal("Küçük Nakliye Gemisi", intel[0].ShipName);
        Assert.Null(intel[0].ExactCount);
        Assert.Equal("?", intel[0].DisplayCount);

        Assert.Equal("Hafif Avcı", intel[1].ShipName);
        Assert.Null(intel[1].ExactCount);
        Assert.Equal("?", intel[1].DisplayCount);
    }

    [Fact]
    public void HighEspionageDelta_RevealsExactShipCounts()
    {
        var rawShips = new List<(UnitType, int)>
        {
            (UnitType.SmallCargo, 4),
            (UnitType.LightFighter, 2)
        };

        // Delta = 10 - 6 = 4 >= 4
        var intel = HostileFleetAlertFormulas.ResolveShipBreakdown(rawShips, defenderEspionageLevel: 10, attackerEspionageLevel: 6);
        Assert.Equal(2, intel.Count);

        Assert.Equal("Küçük Nakliye Gemisi", intel[0].ShipName);
        Assert.Equal(4, intel[0].ExactCount);
        Assert.Equal("4", intel[0].DisplayCount);

        Assert.Equal("Hafif Avcı", intel[1].ShipName);
        Assert.Equal(2, intel[1].ExactCount);
        Assert.Equal("2", intel[1].DisplayCount);
    }

    [Fact]
    public void CanonicalTurkishShipNames_AreAccurate()
    {
        Assert.Equal("Küçük Nakliye Gemisi", HostileFleetAlertFormulas.GetCanonicalShipName(UnitType.SmallCargo));
        Assert.Equal("Büyük Nakliye Gemisi", HostileFleetAlertFormulas.GetCanonicalShipName(UnitType.LargeCargo));
        Assert.Equal("Hafif Avcı", HostileFleetAlertFormulas.GetCanonicalShipName(UnitType.LightFighter));
        Assert.Equal("Kruvazör", HostileFleetAlertFormulas.GetCanonicalShipName(UnitType.Cruiser));
        Assert.Equal("Azrail", HostileFleetAlertFormulas.GetCanonicalShipName(UnitType.Reaper));
        Assert.Equal("Rehber", HostileFleetAlertFormulas.GetCanonicalShipName(UnitType.Pathfinder));
    }

    [Fact]
    public void FormatArrivalCountdown_FormatsAsMinutesAndSeconds()
    {
        var time = TimeSpan.FromMinutes(4) + TimeSpan.FromSeconds(32);
        string formatted = HostileFleetAlertFormulas.FormatArrivalCountdown(time);
        Assert.Equal("04dk 32sn", formatted);

        string zeroFormatted = HostileFleetAlertFormulas.FormatArrivalCountdown(TimeSpan.Zero);
        Assert.Equal("00dk 00sn", zeroFormatted);
    }
}

