using OGame.Application.Services;
using OGame.Domain.Entities;
using OGame.Domain.Enums;
using OGame.Domain.Services;

namespace OGame.Domain.Tests;

public class ResourceCalculationServiceTests
{
    private readonly ResourceService _sut = new();

    [Fact]
    public void ZeroEnergy_ShouldResultInZeroMineProduction_ExcludingBaseGeneration()
    {
        // Arrange: Planet with mines at level 10, but Solar Plant at level 0 (0 produced energy)
        var t0 = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var planet = new Planet
        {
            Id = Guid.NewGuid(),
            Metal = 0,
            Crystal = 0,
            Deuterium = 0,
            TempMin = 10,
            TempMax = 50,
            LastResourceUpdateUtc = t0,
            Buildings =
            [
                new Building { BuildingType = BuildingType.MetalMine, Level = 10 },
                new Building { BuildingType = BuildingType.CrystalMine, Level = 10 },
                new Building { BuildingType = BuildingType.DeuteriumSynthesizer, Level = 10 },
                new Building { BuildingType = BuildingType.SolarPlant, Level = 0 }
            ]
        };

        // Act
        var production = _sut.CalculateProduction(planet);
        var afterOneHour = _sut.GetCurrentResources(planet, t0.AddSeconds(3600));

        // Assert
        Assert.Equal(0.0, production.ProducedEnergy);
        Assert.True(production.ConsumedEnergy > 0.0);
        Assert.Equal(0.0, production.EfficiencyRatio);

        // Only base generation: Metal 30/hr, Crystal 15/hr, Deuterium 0/hr
        Assert.Equal(30.0, production.MetalPerHour, precision: 6);
        Assert.Equal(15.0, production.CrystalPerHour, precision: 6);
        Assert.Equal(0.0, production.DeuteriumPerHour, precision: 6);

        Assert.Equal(30.0, afterOneHour.Metal, precision: 6);
        Assert.Equal(15.0, afterOneHour.Crystal, precision: 6);
        Assert.Equal(0.0, afterOneHour.Deuterium, precision: 6);
    }

    [Fact]
    public void AccumulationAcross3600Seconds_WithFullEnergy_ShouldMatchExactFormulas()
    {
        // Arrange
        var t0 = new DateTime(2026, 1, 1, 12, 0, 0, DateTimeKind.Utc);
        var planet = new Planet
        {
            Id = Guid.NewGuid(),
            Metal = 500.0,
            Crystal = 500.0,
            Deuterium = 100.0,
            TempMin = 20,
            TempMax = 60, // TempAvg = 40
            LastResourceUpdateUtc = t0,
            Buildings =
            [
                new Building { BuildingType = BuildingType.MetalMine, Level = 5 },
                new Building { BuildingType = BuildingType.CrystalMine, Level = 4 },
                new Building { BuildingType = BuildingType.DeuteriumSynthesizer, Level = 3 },
                new Building { BuildingType = BuildingType.SolarPlant, Level = 10 } // Enough energy
            ]
        };

        // Expected hourly production from mines:
        double expectedMetalMine = 30.0 * 5 * Math.Pow(1.1, 5);
        double expectedCrystalMine = 20.0 * 4 * Math.Pow(1.1, 4);
        double expectedDeutSynth = 10.0 * 3 * Math.Pow(1.1, 3) * (-0.004 * 40.0 + 1.36);

        // Act: 3600 seconds (1 hour) later
        var state = _sut.GetCurrentResources(planet, t0.AddSeconds(3600));

        // Assert
        Assert.Equal(1.0, state.EfficiencyRatio, precision: 6);
        Assert.Equal(500.0 + 30.0 + expectedMetalMine, state.Metal, precision: 6);
        Assert.Equal(500.0 + 15.0 + expectedCrystalMine, state.Crystal, precision: 6);
        Assert.Equal(100.0 + expectedDeutSynth, state.Deuterium, precision: 6);
    }

    [Fact]
    public void PartialEnergyEfficiency_ShouldScaleMineProductionLinearly()
    {
        // Arrange:
        // Metal Mine L1 consumes 10 * 1 * 1.1^1 = 11
        // Crystal Mine L1 consumes 10 * 1 * 1.1^1 = 11
        // Total consumed = 22.
        // Wait: if Solar Plant L1 produces 20 * 1 * 1.1^1 = 22, let's add Deut Synth L1 which consumes 30 * 1.1 = 33.
        // Total consumed = 11 + 11 + 33 = 55.
        // Produced = 22.
        // Efficiency Ratio = 22 / 55 = 0.4.
        var t0 = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var planet = new Planet
        {
            Id = Guid.NewGuid(),
            Metal = 0,
            Crystal = 0,
            Deuterium = 0,
            TempMin = 0,
            TempMax = 40, // TempAvg = 20
            LastResourceUpdateUtc = t0,
            Buildings =
            [
                new Building { BuildingType = BuildingType.MetalMine, Level = 1 },
                new Building { BuildingType = BuildingType.CrystalMine, Level = 1 },
                new Building { BuildingType = BuildingType.DeuteriumSynthesizer, Level = 1 },
                new Building { BuildingType = BuildingType.SolarPlant, Level = 1 }
            ]
        };

        // Act
        var state = _sut.GetCurrentResources(planet, t0.AddSeconds(3600));

        // Assert
        Assert.Equal(0.4, state.EfficiencyRatio, precision: 6);

        double expectedMetal = 30.0 + (30.0 * 1 * 1.1 * 0.4);
        double expectedCrystal = 15.0 + (20.0 * 1 * 1.1 * 0.4);
        double expectedDeut = (10.0 * 1 * 1.1 * (-0.004 * 20.0 + 1.36)) * 0.4;

        Assert.Equal(expectedMetal, state.Metal, precision: 6);
        Assert.Equal(expectedCrystal, state.Crystal, precision: 6);
        Assert.Equal(expectedDeut, state.Deuterium, precision: 6);
    }

    [Fact]
    public void ApplyLazyUpdate_ShouldMutatePlanetResourcesAndLastResourceUpdateUtc()
    {
        // Arrange
        var t0 = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var t1 = t0.AddSeconds(1800); // 0.5 hours
        var planet = new Planet
        {
            Metal = 100.0,
            Crystal = 100.0,
            Deuterium = 50.0,
            LastResourceUpdateUtc = t0
        };

        // Act
        _sut.ApplyLazyUpdate(planet, t1);

        // Assert (Base production for 0.5 hr: +15 Metal, +7.5 Crystal, +0 Deut)
        Assert.Equal(115.0, planet.Metal, precision: 6);
        Assert.Equal(107.5, planet.Crystal, precision: 6);
        Assert.Equal(50.0, planet.Deuterium, precision: 6);
        Assert.Equal(t1, planet.LastResourceUpdateUtc);
    }
}

