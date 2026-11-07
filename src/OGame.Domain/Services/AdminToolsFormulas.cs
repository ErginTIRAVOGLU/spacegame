using OGame.Domain.Enums;

namespace OGame.Domain.Services;

public static class AdminToolsFormulas
{
    public const int ForceReturnDelaySeconds = 5;
    public const string RequireAdminPolicyName = "RequireAdmin";

    public static bool HasAdminPrivileges(UserRole role) =>
        role == UserRole.Admin || role == UserRole.GameMaster;

    public static DateTime CalculateForceReturnArrivalUtc(DateTime utcNow, bool instantTeleport = false) =>
        instantTeleport ? utcNow : utcNow.AddSeconds(ForceReturnDelaySeconds);

    /// <summary>
    /// Computes the total Metal, Crystal, and Deuterium refund when clearing a planet's building and shipyard queues.
    /// For shipyard batches, only uncompleted units (TotalCount - CompletedCount) are refunded.
    /// </summary>
    public static ResourceCost CalculateQueueClearRefund(
        IEnumerable<(BuildingType BuildingType, int TargetLevel)> buildingQueueItems,
        IEnumerable<(UnitType UnitType, int TotalCount, int CompletedCount)> shipyardQueueItems)
    {
        double refundMetal = 0.0;
        double refundCrystal = 0.0;
        double refundDeut = 0.0;

        if (buildingQueueItems is not null)
        {
            foreach (var (buildingType, targetLevel) in buildingQueueItems)
            {
                if (targetLevel <= 0) continue;
                var cost = ConstructionFormulas.GetBuildingUpgradeCost(buildingType, targetLevel);
                refundMetal += cost.Metal;
                refundCrystal += cost.Crystal;
                refundDeut += cost.Deuterium;
            }
        }

        if (shipyardQueueItems is not null)
        {
            foreach (var (unitType, totalCount, completedCount) in shipyardQueueItems)
            {
                int remainingUnits = Math.Max(0, totalCount - Math.Max(0, completedCount));
                if (remainingUnits <= 0) continue;

                var unitCost = ConstructionFormulas.GetUnitCost(unitType);
                refundMetal += unitCost.Metal * remainingUnits;
                refundCrystal += unitCost.Crystal * remainingUnits;
                refundDeut += unitCost.Deuterium * remainingUnits;
            }
        }

        return new ResourceCost(refundMetal, refundCrystal, refundDeut);
    }

    public static bool IsHostileAttackMission(FleetMissionType missionType) =>
        missionType == FleetMissionType.Attack ||
        missionType == FleetMissionType.AcsAttack ||
        missionType == FleetMissionType.MoonDestruction;
}

