using OGame.Domain.Entities;
using OGame.Domain.Enums;

namespace OGame.Domain.Services;

public static class MoonAndPhalanxFormulas
{
    public const double PhalanxScanDeuteriumCost = 5_000.0;
    public const int JumpGateCooldownMinutes = 60;
    public const int MoonInitialBaseFields = 1;
    public const int MoonBaseFieldsGrantedPerLevel = 3;

    /// <summary>
    /// MoonChance = min(maxChance, floor(DebrisTotal / 100,000)) %
    /// Standard universe max chance is 20%. With Kaelesh Supra Refractor building, up to 30%.
    /// </summary>
    public static int CalculateMoonChancePercent(
        double debrisMetal,
        double debrisCrystal,
        int maxChance = 20)
    {
        double debrisTotal = Math.Max(0.0, debrisMetal) + Math.Max(0.0, debrisCrystal);
        int chance = (int)Math.Floor(debrisTotal / 100_000.0);
        int cap = Math.Clamp(maxChance, 20, 30);
        return Math.Clamp(chance, 0, cap);
    }

    /// <summary>
    /// Moon diameter calculation (Task 16):
    /// - 20% Moon Size Guarantee: At 20% chance (2,000,000+ debris), diameter is strictly >= 8,366 km
    ///   (up to 8,947 km base limit, or 9,400 km with Kaelesh Supra Refractor).
    /// - Below 20%: diameter randomly generated between 4,500 km and 8,947 km.
    /// </summary>
    public static int CalculateMoonDiameterKm(
        double debrisTotal,
        double rngFactor = 0.5,
        bool hasSupraRefractor = false)
    {
        int maxChance = hasSupraRefractor ? 30 : 20;
        int chance = Math.Clamp((int)Math.Floor(Math.Max(0.0, debrisTotal) / 100_000.0), 1, maxChance);
        double clampedRng = Math.Clamp(rngFactor, 0.0, 1.0);
        int maxDiameter = hasSupraRefractor ? 9400 : 8947;

        if (chance >= 20)
        {
            // 20% Moon Size Guarantee: strictly >= 8,366 km
            const int minGuarantee = 8366;
            int diameter = minGuarantee + (int)Math.Floor(clampedRng * (maxDiameter - minGuarantee + 1));
            return Math.Clamp(diameter, minGuarantee, maxDiameter);
        }
        else
        {
            // Below 20%: randomly generated between 4,500 km and 8,947 km
            const int minDiameter = 4500;
            int diameter = minDiameter + (int)Math.Floor(clampedRng * (maxDiameter - minDiameter + 1));
            return Math.Clamp(diameter, minDiameter, maxDiameter);
        }
    }

    /// <summary>
    /// Moon Base fields (Task 16):
    /// Newly formed moon starts with 1 base field.
    /// LunarBase grants +3 building fields per level (net gain +2 usable fields per level).
    /// </summary>
    public static int CalculateMoonMaxFields(int moonBaseLevel = 0)
    {
        return MoonInitialBaseFields + Math.Max(0, moonBaseLevel) * MoonBaseFieldsGrantedPerLevel;
    }

    public static int CalculateMoonMaxFields(int diameterKm, int moonBaseLevel)
    {
        return CalculateMoonMaxFields(moonBaseLevel);
    }

    /// <summary>
    /// Sensor Phalanx Scan Range:
    /// Range (Systems) = (PhalanxLevel^2 - 1) * (1 + DiscovererBonus + KaeleshBonus).
    /// Level <= 1 has 0 range.
    /// </summary>
    public static int CalculatePhalanxScanRangeSystems(
        int phalanxLevel,
        double discovererBonus = 0.0,
        double kaeleshBonus = 0.0)
    {
        if (phalanxLevel <= 1)
        {
            return 0;
        }

        double baseRange = (phalanxLevel * phalanxLevel) - 1;
        double bonus = Math.Max(0.0, discovererBonus) + Math.Max(0.0, kaeleshBonus);
        return (int)Math.Floor(baseRange * (1.0 + bonus));
    }

    public static bool IsTargetWithinPhalanxRange(
        int moonGalaxy,
        int moonSystem,
        int phalanxLevel,
        int targetGalaxy,
        int targetSystem,
        double discovererBonus = 0.0,
        double kaeleshBonus = 0.0)
    {
        if (moonGalaxy != targetGalaxy || phalanxLevel <= 1)
        {
            return false;
        }

        int range = CalculatePhalanxScanRangeSystems(phalanxLevel, discovererBonus, kaeleshBonus);
        return Math.Abs(moonSystem - targetSystem) <= range;
    }

    /// <summary>
    /// Sensor Phalanx Fleet Visibility Matrix (Task 16):
    /// - Fleets originating from or targeting a Moon are INVISIBLE.
    /// - Origin scanned: Outbound Deploy and Recalled Deploy are INVISIBLE. All other missions and their returns are VISIBLE.
    /// - Target scanned: Incoming Deploy (arrival time) and incoming Attack/ACS/Transport/Espionage/Hold are VISIBLE.
    /// </summary>
    public static bool IsFleetMovementVisibleToPhalanx(
        int scannedGalaxy,
        int scannedSystem,
        int scannedSlot,
        int originGalaxy,
        int originSystem,
        int originSlot,
        CoordinateType originType,
        int targetGalaxy,
        int targetSystem,
        int targetSlot,
        CoordinateType targetType,
        FleetMissionType missionType,
        FleetMissionStatus status)
    {
        // Rule 1: Moon Invisibility - all fleets originating from or targeting a Moon are hidden
        if (originType == CoordinateType.Moon || targetType == CoordinateType.Moon)
        {
            return false;
        }

        bool isOriginScanned = originGalaxy == scannedGalaxy &&
                               originSystem == scannedSystem &&
                               originSlot == scannedSlot &&
                               originType == CoordinateType.Planet;

        bool isTargetScanned = targetGalaxy == scannedGalaxy &&
                               targetSystem == scannedSystem &&
                               targetSlot == scannedSlot &&
                               targetType == CoordinateType.Planet;

        // Origin Scanned
        if (isOriginScanned)
        {
            // Deploy (Konuşlanma): outbound and recalled deploy are completely hidden on origin!
            if (missionType == FleetMissionType.Deploy)
            {
                return false;
            }

            // All other mission types:
            // Outbound / Holding: visible (with arrival time)
            // Returning / Recalled: visible (with return time to origin)
            return status is FleetMissionStatus.Outbound
                   or FleetMissionStatus.Holding
                   or FleetMissionStatus.Returning
                   or FleetMissionStatus.Recalled;
        }

        // Target Scanned
        if (isTargetScanned)
        {
            // Only inbound fleets approaching this target are visible
            if (status == FleetMissionStatus.Outbound)
            {
                // Incoming Deploy is visible with arrival time!
                // Incoming Attack, ACS, Transport, Espionage, Hold are visible!
                return missionType is FleetMissionType.Deploy
                       or FleetMissionType.Attack
                       or FleetMissionType.AcsAttack
                       or FleetMissionType.Transport
                       or FleetMissionType.Espionage
                       or FleetMissionType.AcsDefend;
            }

            // Once holding or returning/recalled, the fleet is no longer heading towards target
            return false;
        }

        return false;
    }

    /// <summary>
    /// Legacy 3-arg overload for backward compatibility.
    /// </summary>
    public static bool IsFleetVisibleToPhalanx(
        CoordinateType originType,
        CoordinateType targetType,
        FleetMissionType missionType)
    {
        if (originType == CoordinateType.Moon || targetType == CoordinateType.Moon)
        {
            return false;
        }

        return true;
    }

    /// <summary>
    /// Moon Destruction Probability (Task 16):
    /// P_destroy = (1 - sqrt((1 - sqrt(D) / 2500)^N_RIP)) * 100%
    /// </summary>
    public static double CalculateMoonDestructionChancePercent(int moonDiameterKm, int deathstarCount)
    {
        if (deathstarCount <= 0 || moonDiameterKm <= 0)
        {
            return 0.0;
        }

        double sqrtD = Math.Sqrt(moonDiameterKm);
        double baseTerm = Math.Clamp(1.0 - (sqrtD / 2500.0), 0.0, 1.0);
        double powerTerm = Math.Pow(baseTerm, deathstarCount);
        double chance = (1.0 - Math.Sqrt(powerTerm)) * 100.0;
        return Math.Clamp(chance, 0.0, 100.0);
    }

    /// <summary>
    /// Deathstar Survival Probability (Task 16):
    /// P_survival = (1 - sqrt((sqrt(D) / 2500)^N_RIP)) * 100%
    /// </summary>
    public static double CalculateRipSurvivalChancePercent(int moonDiameterKm, int deathstarCount)
    {
        if (deathstarCount <= 0 || moonDiameterKm <= 0)
        {
            return 0.0;
        }

        double sqrtD = Math.Sqrt(moonDiameterKm);
        double baseTerm = Math.Clamp(sqrtD / 2500.0, 0.0, 1.0);
        double powerTerm = Math.Pow(baseTerm, deathstarCount);
        double chance = (1.0 - Math.Sqrt(powerTerm)) * 100.0;
        return Math.Clamp(chance, 0.0, 100.0);
    }

    /// <summary>
    /// Deathstar Loss Probability:
    /// P_loss = 100% - P_survival
    /// </summary>
    public static double CalculateRipLossChancePercent(int moonDiameterKm, int deathstarCount = 1)
    {
        return Math.Clamp(100.0 - CalculateRipSurvivalChancePercent(moonDiameterKm, deathstarCount), 0.0, 100.0);
    }

    public static string BuildJumpGateCooldownKey(Guid moonId) =>
        $"jumpgate:cooldown:{moonId}";
}
