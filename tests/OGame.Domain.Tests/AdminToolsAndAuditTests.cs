using OGame.Domain.Enums;
using OGame.Domain.Services;

namespace OGame.Domain.Tests;

public class AdminToolsAndAuditTests
{
    [Theory]
    [InlineData(UserRole.Player, false)]
    [InlineData(UserRole.GameMaster, true)]
    [InlineData(UserRole.Admin, true)]
    public void HasAdminPrivileges_ShouldAllowOnlyGameMasterAndAdminRoles(
        UserRole role,
        bool expectedAllowed)
    {
        Assert.Equal(expectedAllowed, AdminToolsFormulas.HasAdminPrivileges(role));
    }

    [Fact]
    public void CalculateForceReturnArrivalUtc_ShouldScheduleFiveSecondReturnOrInstantTeleport()
    {
        var now = new DateTime(2026, 10, 28, 12, 0, 0, DateTimeKind.Utc);

        var instant = AdminToolsFormulas.CalculateForceReturnArrivalUtc(now, instantTeleport: true);
        var delayed5s = AdminToolsFormulas.CalculateForceReturnArrivalUtc(now, instantTeleport: false);

        Assert.Equal(now, instant);
        Assert.Equal(now.AddSeconds(5), delayed5s);
    }

    [Fact]
    public void CalculateQueueClearRefund_ShouldRefundBuildingUpgradeAndRemainingShipyardUnitsOnly()
    {
        // MetalMine TargetLevel 2 -> floor(60 * 1.5) = 90 Metal, floor(15 * 1.5) = 22 Crystal
        var buildingQueue = new[]
        {
            (BuildingType.MetalMine, 2)
        };

        // LightFighter batch: TotalCount = 10, CompletedCount = 4 -> 6 remaining units
        // LightFighter cost: 3000 Metal, 1000 Crystal -> 6 * 3000 = 18,000 Metal, 6 * 1000 = 6,000 Crystal
        var shipyardQueue = new[]
        {
            (UnitType.LightFighter, 10, 4)
        };

        var refund = AdminToolsFormulas.CalculateQueueClearRefund(buildingQueue, shipyardQueue);

        Assert.Equal(18_090.0, refund.Metal);
        Assert.Equal(6_022.0, refund.Crystal);
        Assert.Equal(0.0, refund.Deuterium);
    }

    [Theory]
    [InlineData(FleetMissionType.Attack, true)]
    [InlineData(FleetMissionType.AcsAttack, true)]
    [InlineData(FleetMissionType.MoonDestruction, true)]
    [InlineData(FleetMissionType.Transport, false)]
    [InlineData(FleetMissionType.Deploy, false)]
    [InlineData(FleetMissionType.Colonize, false)]
    public void IsHostileAttackMission_ShouldIdentifyMissionsCancelledOnPlayerBan(
        FleetMissionType missionType,
        bool expectedHostile)
    {
        Assert.Equal(expectedHostile, AdminToolsFormulas.IsHostileAttackMission(missionType));
    }
}

