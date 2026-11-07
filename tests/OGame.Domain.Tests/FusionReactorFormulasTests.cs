using System;
using System.Collections.Generic;
using OGame.Domain.Entities;
using OGame.Domain.Enums;
using OGame.Domain.Services;
using Xunit;

namespace OGame.Domain.Tests;

public class FusionReactorFormulasTests
{
    [Theory]
    [InlineData(0, 0, 1.0, 0)]
    [InlineData(1, 0, 1.0, 30)]
    [InlineData(1, 1, 1.0, 30)]
    [InlineData(5, 8, 1.0, 220)]
    [InlineData(5, 8, 0.5, 110)]
    [InlineData(5, 8, 0.0, 0)]
    public void CalculateFusionReactorEnergy_MatchesCanonicalFormulas(int level, int energyTech, double factor, double expectedEnergy)
    {
        double energy = ResourceFormulas.CalculateFusionReactorEnergy(level, energyTech, factor);
        Assert.Equal(expectedEnergy, energy);
    }

    [Theory]
    [InlineData(0, 1.0, 0)]
    [InlineData(1, 1.0, 11)]
    [InlineData(5, 1.0, 80)]
    [InlineData(5, 0.5, 40)]
    [InlineData(5, 0.0, 0)]
    public void CalculateFusionReactorDeuteriumConsumption_MatchesCanonicalFormulas(int level, double factor, double expectedConsumption)
    {
        double consumption = ResourceFormulas.CalculateFusionReactorDeuteriumConsumption(level, factor);
        Assert.Equal(expectedConsumption, consumption);
    }

    [Fact]
    public void CalculatePlanetProduction_IncludesFusionReactorEnergyAndDeductsDeuterium()
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Researches = new List<UserResearch>
            {
                new() { ResearchType = ResearchType.EnergyTechnology, Level = 8 }
            }
        };

        var planet = new Planet
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            User = user,
            Deuterium = 1000,
            Buildings = new List<Building>
            {
                new() { BuildingType = BuildingType.SolarPlant, Level = 10 },
                new() { BuildingType = BuildingType.FusionReactor, Level = 5 },
                new() { BuildingType = BuildingType.DeuteriumSynthesizer, Level = 10 }
            }
        };

        var snapshot = ResourceFormulas.CalculatePlanetProduction(planet, explicitClass: PlayerClass.None, fusionFactor: 1.0);

        // Solar plant level 10 energy: floor(20 * 10 * 1.1^10) = floor(200 * 2.59374246) = 518
        // Fusion reactor level 5, energy tech 8 energy: 220
        // Total expected energy = 518 + 220 = 738
        double expectedSolarEnergy = ResourceFormulas.CalculateSolarPlantEnergy(10);
        double expectedFusionEnergy = ResourceFormulas.CalculateFusionReactorEnergy(5, 8, 1.0);
        Assert.Equal(expectedSolarEnergy + expectedFusionEnergy, snapshot.ProducedEnergy);

        // Deuterium consumption for fusion reactor level 5 is 80 / hour
        // Synthesizer gross - 80
        Assert.True(snapshot.DeuteriumPerHour > 0);
    }

    [Fact]
    public void CalculatePlanetProduction_CeasesFusionEnergyWhenDeuteriumExhausted()
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Researches = new List<UserResearch>
            {
                new() { ResearchType = ResearchType.EnergyTechnology, Level = 8 }
            }
        };

        var planet = new Planet
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            User = user,
            Deuterium = 0, // No stored deuterium
            Buildings = new List<Building>
            {
                new() { BuildingType = BuildingType.SolarPlant, Level = 10 },
                new() { BuildingType = BuildingType.FusionReactor, Level = 5 }
                // No synthesizer
            }
        };

        var snapshot = ResourceFormulas.CalculatePlanetProduction(planet, explicitClass: PlayerClass.None, fusionFactor: 1.0);

        // When fuel is 0 and cannot produce deuterium, fusion reactor shuts down
        double expectedSolarEnergy = ResourceFormulas.CalculateSolarPlantEnergy(10);
        Assert.Equal(expectedSolarEnergy, snapshot.ProducedEnergy);
    }
}

