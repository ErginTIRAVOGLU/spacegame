using OGame.Domain.Entities;
using OGame.Domain.Enums;
using OGame.Domain.Services;

namespace OGame.Domain.Tests;

public class ColonizationAndAstrophysicsTests
{
    [Theory]
    [InlineData(0, 1)]
    [InlineData(1, 2)]
    [InlineData(2, 2)]
    [InlineData(3, 3)]
    [InlineData(4, 3)]
    [InlineData(5, 4)]
    [InlineData(7, 5)]
    public void CalculateMaxPlanets_ShouldFollowOnePlusCeilHalfAstrophysicsFormula(
        int astrophysicsLevel,
        int expectedMaxPlanets)
    {
        int maxPlanets = ColonizationFormulas.CalculateMaxPlanets(astrophysicsLevel);
        Assert.Equal(expectedMaxPlanets, maxPlanets);
    }

    [Theory]
    [InlineData(4, 1, true)]
    [InlineData(8, 1, true)]
    [InlineData(12, 1, true)]
    [InlineData(4, 0, false)]
    [InlineData(3, 3, false)]
    [InlineData(3, 4, true)]
    [InlineData(13, 3, false)]
    [InlineData(13, 4, true)]
    [InlineData(2, 5, false)]
    [InlineData(2, 6, true)]
    [InlineData(14, 5, false)]
    [InlineData(14, 6, true)]
    [InlineData(1, 7, false)]
    [InlineData(1, 8, true)]
    [InlineData(15, 7, false)]
    [InlineData(15, 8, true)]
    public void CanColonizeSlot_ShouldEnforceAstrophysicsPositionLocks(
        int slot,
        int astrophysicsLevel,
        bool expectedAllowed)
    {
        bool canColonize = ColonizationFormulas.CanColonizeSlot(slot, astrophysicsLevel);
        Assert.Equal(expectedAllowed, canColonize);
    }

    [Fact]
    public void RollPlanetCharacteristics_ShouldMatchSlotTemperatureAndFieldBands()
    {
        // Slot 1: 220°C to 260°C, 96..172 fields
        var slot1 = ColonizationFormulas.RollPlanetCharacteristics(slot: 1, seed: 101);
        Assert.Equal(220, slot1.TempMin);
        Assert.Equal(260, slot1.TempMax);
        Assert.InRange(slot1.MaxFields, 96, 172);

        // Slot 8: 30°C to 70°C, 156..252 fields
        var slot8 = ColonizationFormulas.RollPlanetCharacteristics(slot: 8, seed: 202);
        Assert.Equal(30, slot8.TempMin);
        Assert.Equal(70, slot8.TempMax);
        Assert.InRange(slot8.MaxFields, 156, 252);

        // Slot 15: -130°C to -90°C, 90..164 fields
        var slot15 = ColonizationFormulas.RollPlanetCharacteristics(slot: 15, seed: 303);
        Assert.Equal(-130, slot15.TempMin);
        Assert.Equal(-90, slot15.TempMax);
        Assert.InRange(slot15.MaxFields, 90, 164);
    }

    [Fact]
    public void SlotTemperature_ShouldDetermineSolarSatelliteAndDeuteriumEfficiency()
    {
        var hotSlot1 = ColonizationFormulas.RollPlanetCharacteristics(slot: 1, seed: 1);
        var coldSlot15 = ColonizationFormulas.RollPlanetCharacteristics(slot: 15, seed: 1);

        // Slot 1 has much higher Solar Satellite energy per unit than Slot 15
        Assert.True(hotSlot1.SolarSatelliteEnergyPerUnit > coldSlot15.SolarSatelliteEnergyPerUnit);

        // Slot 15 (cold) has much higher Deuterium Synthesizer output than Slot 1 (hot)
        double hotTempAvg = (hotSlot1.TempMin + hotSlot1.TempMax) / 2.0;
        double coldTempAvg = (coldSlot15.TempMin + coldSlot15.TempMax) / 2.0;

        double hotDeutHourly = ResourceFormulas.CalculateDeuteriumSynthesizerHourly(level: 10, tempAvg: hotTempAvg);
        double coldDeutHourly = ResourceFormulas.CalculateDeuteriumSynthesizerHourly(level: 10, tempAvg: coldTempAvg);

        Assert.True(coldDeutHourly > hotDeutHourly);
    }

    [Fact]
    public void DestroyedPlanetPlaceholder_ShouldExpireWithin24To48HoursAndHaveZeroProduction()
    {
        var now = new DateTime(2026, 10, 28, 12, 0, 0, DateTimeKind.Utc);
        var expiresAt = ColonizationFormulas.CalculateDestroyedPlanetExpiryUtc(now);

        Assert.InRange((expiresAt - now).TotalHours, 24.0, 48.0);

        var destroyedPlanet = new Planet
        {
            Id = Guid.NewGuid(),
            Name = "Destroyed Planet",
            IsDestroyedPlanet = true,
            DestroyedAtUtc = now,
            DestroyedPlanetExpiresAtUtc = expiresAt,
            Buildings =
            [
                new Building { BuildingType = BuildingType.MetalMine, Level = 15 }
            ]
        };

        var production = ResourceFormulas.CalculatePlanetProduction(destroyedPlanet);
        Assert.Equal(0.0, production.MetalPerHour);
        Assert.Equal(0.0, production.CrystalPerHour);
        Assert.Equal(0.0, production.DeuteriumPerHour);
    }
}

