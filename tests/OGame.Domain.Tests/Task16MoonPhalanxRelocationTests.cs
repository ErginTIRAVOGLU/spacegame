using OGame.Domain.Entities;
using OGame.Domain.Enums;
using OGame.Domain.Services;
using Xunit;

namespace OGame.Domain.Tests;

public class Task16MoonPhalanxRelocationTests
{
    [Theory]
    [InlineData(0, 0, 0)]
    [InlineData(50_000, 49_999, 0)]
    [InlineData(100_000, 0, 1)]
    [InlineData(1_000_000, 500_000, 15)]
    [InlineData(2_000_000, 0, 20)]
    [InlineData(5_000_000, 0, 20)]
    public void MoonChance_StandardUniverse_CapsAt20Percent(double metal, double crystal, int expectedChance)
    {
        int chance = MoonAndPhalanxFormulas.CalculateMoonChancePercent(metal, crystal);
        Assert.Equal(expectedChance, chance);
    }

    [Fact]
    public void MoonChance_WithKaeleshSupraRefractor_CanReach30Percent()
    {
        int chance = MoonAndPhalanxFormulas.CalculateMoonChancePercent(3_000_000, 0, maxChance: 30);
        Assert.Equal(30, chance);
    }

    [Theory]
    [InlineData(0.0)]
    [InlineData(0.5)]
    [InlineData(1.0)]
    public void MoonSizeGuarantee_At20PercentChance_IsStrictlyAtLeast8366Km(double rng)
    {
        // 2,000,000 debris corresponds to 20% moon chance
        int diameter = MoonAndPhalanxFormulas.CalculateMoonDiameterKm(2_000_000, rngFactor: rng);
        Assert.InRange(diameter, 8366, 8947);
        Assert.True(diameter >= 8366, $"Diameter {diameter} must be >= 8366 km at 20% chance guarantee.");
    }

    [Fact]
    public void MoonSize_Below20PercentChance_RandomBetween4500And8947Km()
    {
        int minDia = MoonAndPhalanxFormulas.CalculateMoonDiameterKm(500_000, rngFactor: 0.0);
        int maxDia = MoonAndPhalanxFormulas.CalculateMoonDiameterKm(500_000, rngFactor: 1.0);

        Assert.Equal(4500, minDia);
        Assert.Equal(8947, maxDia);
    }

    [Fact]
    public void LunarBase_FieldMathematics_StartsAt1AndGrants3FieldsPerLevel()
    {
        Assert.Equal(1, MoonAndPhalanxFormulas.MoonInitialBaseFields);
        Assert.Equal(3, MoonAndPhalanxFormulas.MoonBaseFieldsGrantedPerLevel);

        // L0: 1 field
        Assert.Equal(1, MoonAndPhalanxFormulas.CalculateMoonMaxFields(moonBaseLevel: 0));
        // L1: 1 + 3 = 4 fields (consumes 1, net +2 usable)
        Assert.Equal(4, MoonAndPhalanxFormulas.CalculateMoonMaxFields(moonBaseLevel: 1));
        // L2: 1 + 6 = 7 fields
        Assert.Equal(7, MoonAndPhalanxFormulas.CalculateMoonMaxFields(moonBaseLevel: 2));
        // L3: 1 + 9 = 10 fields
        Assert.Equal(10, MoonAndPhalanxFormulas.CalculateMoonMaxFields(moonBaseLevel: 3));
    }

    [Theory]
    [InlineData(1, 0)]
    [InlineData(2, 3)]
    [InlineData(3, 8)]
    [InlineData(4, 15)]
    [InlineData(5, 24)]
    public void SensorPhalanx_RangeFormula_MatchesLevelSquaredMinusOne(int level, int expectedBase)
    {
        Assert.Equal(expectedBase, MoonAndPhalanxFormulas.CalculatePhalanxScanRangeSystems(level));
    }

    [Fact]
    public void SensorPhalanx_WithDiscovererBonus_IncreasesRange()
    {
        // Level 3 base range = 8. With +20% Discoverer bonus: floor(8 * 1.2) = 9
        int boostedRange = MoonAndPhalanxFormulas.CalculatePhalanxScanRangeSystems(3, discovererBonus: 0.20);
        Assert.Equal(9, boostedRange);
    }

    [Fact]
    public void SensorPhalanx_ScanCost_Is5000Deuterium()
    {
        Assert.Equal(5000.0, MoonAndPhalanxFormulas.PhalanxScanDeuteriumCost);
    }

    [Fact]
    public void PhalanxVisibility_MoonFleets_AreAlwaysInvisible()
    {
        // Fleets from or to a Moon are never visible on Phalanx
        Assert.False(MoonAndPhalanxFormulas.IsFleetMovementVisibleToPhalanx(
            scannedGalaxy: 1, scannedSystem: 100, scannedSlot: 8,
            originGalaxy: 1, originSystem: 100, originSlot: 8, originType: CoordinateType.Moon,
            targetGalaxy: 1, targetSystem: 105, targetSlot: 4, targetType: CoordinateType.Planet,
            missionType: FleetMissionType.Attack, status: FleetMissionStatus.Outbound));

        Assert.False(MoonAndPhalanxFormulas.IsFleetMovementVisibleToPhalanx(
            scannedGalaxy: 1, scannedSystem: 105, scannedSlot: 4,
            originGalaxy: 1, originSystem: 100, originSlot: 8, originType: CoordinateType.Planet,
            targetGalaxy: 1, targetSystem: 105, targetSlot: 4, targetType: CoordinateType.Moon,
            missionType: FleetMissionType.Attack, status: FleetMissionStatus.Outbound));
    }

    [Fact]
    public void PhalanxVisibility_ScanningOriginPlanet_DeployIsHidden_AttackAndReturnsVisible()
    {
        // 1. Deploy (Konuşlanma): outbound and recalled are hidden when origin is scanned
        Assert.False(MoonAndPhalanxFormulas.IsFleetMovementVisibleToPhalanx(
            scannedGalaxy: 1, scannedSystem: 100, scannedSlot: 8,
            originGalaxy: 1, originSystem: 100, originSlot: 8, originType: CoordinateType.Planet,
            targetGalaxy: 1, targetSystem: 105, targetSlot: 4, targetType: CoordinateType.Planet,
            missionType: FleetMissionType.Deploy, status: FleetMissionStatus.Outbound));

        Assert.False(MoonAndPhalanxFormulas.IsFleetMovementVisibleToPhalanx(
            scannedGalaxy: 1, scannedSystem: 100, scannedSlot: 8,
            originGalaxy: 1, originSystem: 100, originSlot: 8, originType: CoordinateType.Planet,
            targetGalaxy: 1, targetSystem: 105, targetSlot: 4, targetType: CoordinateType.Planet,
            missionType: FleetMissionType.Deploy, status: FleetMissionStatus.Recalled));

        // 2. Outgoing Attack: visible on origin
        Assert.True(MoonAndPhalanxFormulas.IsFleetMovementVisibleToPhalanx(
            scannedGalaxy: 1, scannedSystem: 100, scannedSlot: 8,
            originGalaxy: 1, originSystem: 100, originSlot: 8, originType: CoordinateType.Planet,
            targetGalaxy: 1, targetSystem: 105, targetSlot: 4, targetType: CoordinateType.Planet,
            missionType: FleetMissionType.Attack, status: FleetMissionStatus.Outbound));

        // 3. Recalled Attack return: visible on origin
        Assert.True(MoonAndPhalanxFormulas.IsFleetMovementVisibleToPhalanx(
            scannedGalaxy: 1, scannedSystem: 100, scannedSlot: 8,
            originGalaxy: 1, originSystem: 100, originSlot: 8, originType: CoordinateType.Planet,
            targetGalaxy: 1, targetSystem: 105, targetSlot: 4, targetType: CoordinateType.Planet,
            missionType: FleetMissionType.Attack, status: FleetMissionStatus.Recalled));
    }

    [Fact]
    public void PhalanxVisibility_ScanningTargetPlanet_IncomingDeployAndAttackAreVisible()
    {
        // Incoming Deploy to target planet is VISIBLE with arrival time
        Assert.True(MoonAndPhalanxFormulas.IsFleetMovementVisibleToPhalanx(
            scannedGalaxy: 1, scannedSystem: 105, scannedSlot: 4,
            originGalaxy: 1, originSystem: 100, originSlot: 8, originType: CoordinateType.Planet,
            targetGalaxy: 1, targetSystem: 105, targetSlot: 4, targetType: CoordinateType.Planet,
            missionType: FleetMissionType.Deploy, status: FleetMissionStatus.Outbound));

        // Incoming Attack to target planet is VISIBLE
        Assert.True(MoonAndPhalanxFormulas.IsFleetMovementVisibleToPhalanx(
            scannedGalaxy: 1, scannedSystem: 105, scannedSlot: 4,
            originGalaxy: 1, originSystem: 100, originSlot: 8, originType: CoordinateType.Planet,
            targetGalaxy: 1, targetSystem: 105, targetSlot: 4, targetType: CoordinateType.Planet,
            missionType: FleetMissionType.Attack, status: FleetMissionStatus.Outbound));

        // Recalled attack heading back to origin is NOT arriving at target, so invisible on target scan
        Assert.False(MoonAndPhalanxFormulas.IsFleetMovementVisibleToPhalanx(
            scannedGalaxy: 1, scannedSystem: 105, scannedSlot: 4,
            originGalaxy: 1, originSystem: 100, originSlot: 8, originType: CoordinateType.Planet,
            targetGalaxy: 1, targetSystem: 105, targetSlot: 4, targetType: CoordinateType.Planet,
            missionType: FleetMissionType.Attack, status: FleetMissionStatus.Recalled));
    }

    [Theory]
    [InlineData(1, 15, true)]  // Slot 1 can move to any slot (1..15)
    [InlineData(3, 8, true)]   // Slot 3 can move to slot 8
    [InlineData(14, 2, true)]  // Slot 14 can move to slot 2
    [InlineData(8, 6, true)]   // Slot 8 can move to slot 6 (both in 4..12)
    [InlineData(8, 15, false)] // Slot 8 CANNOT move to slot 15
    [InlineData(4, 1, false)]  // Slot 4 CANNOT move to slot 1
    [InlineData(12, 13, false)]// Slot 12 CANNOT move to slot 13
    public void Relocation_SlotRestrictions_EnforcedCorrectly(int fromSlot, int toSlot, bool expected)
    {
        Assert.Equal(expected, ColonizationFormulas.CanRelocateToSlot(fromSlot, toSlot));
    }

    [Fact]
    public void MoonDestruction_Formulas_FollowExactEquations()
    {
        // Moon diameter = 8100 km (sqrt = 90), Deathstars = 1
        // P_destroy = (1 - sqrt((1 - 90/2500)^1)) * 100%
        // base = 1 - 0.036 = 0.964 -> sqrt(0.964) = 0.981835 -> 1 - 0.981835 = 0.018165 (1.8165%)
        double pDestroy1 = MoonAndPhalanxFormulas.CalculateMoonDestructionChancePercent(8100, 1);
        Assert.InRange(pDestroy1, 1.8, 1.83);

        // More RIPs -> higher destruction chance
        double pDestroy50 = MoonAndPhalanxFormulas.CalculateMoonDestructionChancePercent(8100, 50);
        Assert.True(pDestroy50 > pDestroy1);

        // Survival chance:
        // P_survival = (1 - sqrt((90/2500)^1)) * 100%
        // sqrt(0.036) = 0.1897366 -> 1 - 0.1897366 = 0.810263 (81.0263%)
        double pSurv1 = MoonAndPhalanxFormulas.CalculateRipSurvivalChancePercent(8100, 1);
        Assert.InRange(pSurv1, 81.0, 81.1);

        double pLoss1 = MoonAndPhalanxFormulas.CalculateRipLossChancePercent(8100, 1);
        Assert.Equal(100.0, pSurv1 + pLoss1, precision: 4);
    }
}
