using OGame.Application.Services;
using OGame.Domain.Entities;
using OGame.Domain.Enums;
using OGame.Domain.Services;

namespace OGame.Domain.Tests;

public class HighscoreAndVacationModeTests
{
    [Theory]
    [InlineData(0, 0, 0, 0)]
    [InlineData(500, 499, 0, 0)]
    [InlineData(500, 500, 0, 1)]
    [InlineData(10_000, 5_500, 2_499, 17)]
    [InlineData(5_000_000, 4_000_000, 1_000_000, 10_000)]
    public void CalculatePoints_ShouldFollowOnePointPerThousandResourcesFloorFormula(
        double metalSpent,
        double crystalSpent,
        double deuteriumSpent,
        long expectedPoints)
    {
        long points = HighscoreAndVacationFormulas.CalculatePoints(metalSpent, crystalSpent, deuteriumSpent);
        Assert.Equal(expectedPoints, points);
    }

    [Fact]
    public void CalculateCumulativeBuildingSpentCost_ShouldSumAllUpgradeLevelsFromOneToCurrent()
    {
        // MetalMine L1: 60M, 15C
        // MetalMine L2: floor(60*1.5)=90M, floor(15*1.5)=22C
        // MetalMine L3: floor(60*2.25)=135M, floor(15*2.25)=33C
        // Total L1..L3: Metal = 60+90+135 = 285, Crystal = 15+22+33 = 70
        var cost = HighscoreAndVacationFormulas.CalculateCumulativeBuildingSpentCost(BuildingType.MetalMine, 3);

        Assert.Equal(285.0, cost.Metal);
        Assert.Equal(70.0, cost.Crystal);
        Assert.Equal(0.0, cost.Deuterium);
    }

    [Fact]
    public void CalculateCumulativeResearchSpentCost_ShouldSumAllResearchLevelsFromOneToCurrent()
    {
        // LaserTechnology L1: 200M, 100C
        // LaserTechnology L2: 400M, 200C
        // Total L1..L2: 600M, 300C
        var cost = HighscoreAndVacationFormulas.CalculateCumulativeResearchSpentCost(ResearchType.LaserTechnology, 2);

        Assert.Equal(600.0, cost.Metal);
        Assert.Equal(300.0, cost.Crystal);
        Assert.Equal(0.0, cost.Deuterium);
    }

    [Fact]
    public void CalculatePlayerPointBreakdown_ShouldAggregateBuildingsResearchesAndUnits()
    {
        // RoboticsFactory L1 (400M, 120C, 200D = 720) + L2 (800M, 240C, 400D = 1440) => 2160 spent (2 economy pts)
        var buildings = new[]
        {
            (BuildingType.RoboticsFactory, 2)
        };

        // ImpulseDrive L1 (2000M, 4000C, 600D = 6600 spent => 6 research pts)
        var researches = new[]
        {
            (ResearchType.ImpulseDrive, 1)
        };

        // 2 Cruisers (2 * (20,000M + 7,000C + 2,000D) = 58,000 spent => 58 military pts)
        // + 1 RocketLauncher (2,000M = 2,000 spent => +2 military pts) => 60,000 spent (60 military pts)
        var units = new Dictionary<UnitType, int>
        {
            [UnitType.Cruiser] = 2,
            [UnitType.RocketLauncher] = 1
        };

        // Total spent = 2,160 + 6,600 + 60,000 = 68,760 => floor(68,760 / 1000) = 68 TotalPoints
        var breakdown = HighscoreAndVacationFormulas.CalculatePlayerPointBreakdown(buildings, researches, units);

        Assert.Equal(2, breakdown.EconomyPoints);
        Assert.Equal(6, breakdown.ResearchPoints);
        Assert.Equal(60, breakdown.MilitaryPoints);
        Assert.Equal(68, breakdown.TotalPoints);
        Assert.Equal(68_760.0, breakdown.TotalMetalSpent + breakdown.TotalCrystalSpent + breakdown.TotalDeuteriumSpent);
    }

    [Theory]
    [InlineData(1, null, 0)]
    [InlineData(2, 5, 3)]
    [InlineData(5, 2, -3)]
    [InlineData(4, 4, 0)]
    public void CalculateRankDelta_ShouldComputePreviousMinusCurrentRank(
        int currentRank,
        int? previousRank,
        int expectedDelta)
    {
        int delta = HighscoreAndVacationFormulas.CalculateRankDelta(currentRank, previousRank);
        Assert.Equal(expectedDelta, delta);
    }

    [Fact]
    public void VacationModeDuration_ShouldEnforceFortyEightHourLock()
    {
        var activatedAt = new DateTime(2026, 10, 28, 12, 0, 0, DateTimeKind.Utc);
        var vacationUntil = HighscoreAndVacationFormulas.CalculateVacationUntilUtc(activatedAt);

        Assert.Equal(activatedAt.AddHours(48), vacationUntil);
        Assert.False(HighscoreAndVacationFormulas.CanDisableVacationMode(vacationUntil, activatedAt.AddHours(47).AddMinutes(59)));
        Assert.True(HighscoreAndVacationFormulas.CanDisableVacationMode(vacationUntil, activatedAt.AddHours(48)));
        Assert.True(HighscoreAndVacationFormulas.CanDisableVacationMode(vacationUntil, activatedAt.AddHours(72)));
    }

    [Fact]
    public void VacationMode_ShouldForceAllPlanetResourceGenerationRatesToZero()
    {
        var now = new DateTime(2026, 10, 28, 12, 0, 0, DateTimeKind.Utc);
        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = "VacationCommander",
            IsVacationMode = true,
            VacationUntilUtc = now.AddHours(48)
        };

        var planet = new Planet
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            User = user,
            Metal = 10_000,
            Crystal = 5_000,
            Deuterium = 2_000,
            LastResourceUpdateUtc = now,
            IsProductionFrozen = true,
            Buildings =
            [
                new Building { BuildingType = BuildingType.MetalMine, Level = 20 },
                new Building { BuildingType = BuildingType.CrystalMine, Level = 18 },
                new Building { BuildingType = BuildingType.DeuteriumSynthesizer, Level = 15 },
                new Building { BuildingType = BuildingType.SolarPlant, Level = 22 }
            ]
        };

        var production = ResourceFormulas.CalculatePlanetProduction(planet);

        Assert.Equal(0.0, production.MetalPerHour);
        Assert.Equal(0.0, production.CrystalPerHour);
        Assert.Equal(0.0, production.DeuteriumPerHour);

        var resourceService = new ResourceService();
        var stateAfter24Hours = resourceService.GetCurrentResources(planet, now.AddHours(24));

        Assert.Equal(10_000.0, stateAfter24Hours.Metal);
        Assert.Equal(5_000.0, stateAfter24Hours.Crystal);
        Assert.Equal(2_000.0, stateAfter24Hours.Deuterium);
    }
}

