using OGame.Domain.Combat;
using OGame.Domain.Enums;

namespace OGame.Domain.Services;

public enum HonorRank
{
    BanditKing = -3,
    BanditLord = -2,
    Bandit = -1,
    None = 0,
    StarLord = 1,
    Emperor = 2,
    GrandEmperor = 3
}

public enum FightHonorableStatus
{
    Honorable,
    Dishonorable,
    Neutral
}

public record TacticalRetreatEvaluationResult(
    bool CanRetreat,
    bool Triggered,
    double AttackerTacticalPoints,
    double DefenderTacticalPoints,
    double RequiredRatio,
    double RequiredDeuteriumFuel,
    bool HasEnoughFuel,
    IReadOnlyDictionary<UnitType, int> RetreatingUnits,
    IReadOnlyDictionary<UnitType, int> RemainingUnitsInBattle);

public record ReaperDebrisSkimResult(
    double SkimmedMetal,
    double SkimmedCrystal,
    double RemainingDebrisMetal,
    double RemainingDebrisCrystal,
    int SurvivingReaperCount,
    double AvailableCargoCapacity);

public static class HonorAndRetreatFormulas
{
    public const double StandardPlunderRatio = 0.50;
    public const double HonorablePlunderRatio = 0.75;
    public const double BanditPlunderRatio = 1.00;
    public const double DiscovererInactivePlunderRatio = 0.75;

    public const double StandardTacticalRetreatRatio = 5.0;
    public const double AdmiralTacticalRetreatRatio = 3.0;

    public const double ReaperDebrisSkimPercentage = 0.25;
    public const double ReaperBaseCargoCapacity = 10_000.0;

    public const double AuctioneerBidPointsPerHonorPoint = 100.0;

    /// <summary>
    /// Evaluates the positive or negative Honor Rank of a player based on their Honor Points and Highscore position.
    /// </summary>
    public static HonorRank DetermineHonorRank(long honorPoints, int honorRankPosition, int totalPlayers = 1000)
    {
        if (honorPoints >= 15_000 && honorRankPosition <= 10)
        {
            return HonorRank.GrandEmperor;
        }

        if (honorPoints >= 2_500 && honorRankPosition <= 100)
        {
            return HonorRank.Emperor;
        }

        if (honorPoints >= 500 && honorRankPosition <= 250)
        {
            return HonorRank.StarLord;
        }

        int bottomRankThreshold = Math.Max(1, totalPlayers);
        if (honorPoints <= -15_000 && honorRankPosition >= bottomRankThreshold - 9)
        {
            return HonorRank.BanditKing;
        }

        if (honorPoints <= -2_500 && honorRankPosition >= bottomRankThreshold - 99)
        {
            return HonorRank.BanditLord;
        }

        if (honorPoints <= -500 && honorRankPosition >= bottomRankThreshold - 249)
        {
            return HonorRank.Bandit;
        }

        return HonorRank.None;
    }

    public static bool IsBandit(HonorRank rank) => rank is HonorRank.Bandit or HonorRank.BanditLord or HonorRank.BanditKing;
    public static bool IsStarlordOrHigher(HonorRank rank) => rank is HonorRank.StarLord or HonorRank.Emperor or HonorRank.GrandEmperor;

    /// <summary>
    /// Evaluates whether a 1v1 combat engagement is Honorable, Dishonorable, or Neutral.
    /// </summary>
    public static FightHonorableStatus Evaluate1v1FightHonorableStatus(
        long attackerMilitaryPoints,
        int attackerMilitaryRank,
        long defenderMilitaryPoints,
        int defenderMilitaryRank,
        HonorRank defenderHonorRank,
        bool isSameAlliance,
        bool isFriend,
        bool isDefenderInactive)
    {
        if (isSameAlliance || isFriend || isDefenderInactive)
        {
            return FightHonorableStatus.Neutral;
        }

        // 1v1 Honorable conditions:
        // 1. Attacker military points <= Defender military points
        // 2. Defender military points >= Attacker military points - 10
        // 3. Defender military highscore rank <= Attacker military rank + 100
        // 4. Defender has Bandit rank
        if (attackerMilitaryPoints <= defenderMilitaryPoints ||
            defenderMilitaryPoints >= (attackerMilitaryPoints - 10) ||
            (defenderMilitaryRank - attackerMilitaryRank) <= 100 ||
            IsBandit(defenderHonorRank))
        {
            return FightHonorableStatus.Honorable;
        }

        return FightHonorableStatus.Dishonorable;
    }

    /// <summary>
    /// Evaluates whether an ACS combat engagement is Honorable.
    /// </summary>
    public static FightHonorableStatus EvaluateAcsFightHonorableStatus(
        long totalAttackerMilitaryPoints,
        long totalDefenderMilitaryPoints,
        bool defenderSideContainsBandit,
        bool isAllInactiveOrAlly)
    {
        if (isAllInactiveOrAlly)
        {
            return FightHonorableStatus.Neutral;
        }

        if (defenderSideContainsBandit || totalDefenderMilitaryPoints >= (totalAttackerMilitaryPoints * 0.50))
        {
            return FightHonorableStatus.Honorable;
        }

        return FightHonorableStatus.Dishonorable;
    }

    /// <summary>
    /// Calculates the raw Honor Points from destroyed military units value:
    /// HP = floor((DestroyedMilitaryUnitsValue)^0.9 / 1000)
    /// </summary>
    public static long CalculateHonorPointsFromDestroyedValue(double destroyedMilitaryUnitsValue)
    {
        if (destroyedMilitaryUnitsValue <= 0.0)
        {
            return 0;
        }

        double rawHp = Math.Pow(destroyedMilitaryUnitsValue, 0.9) / 1000.0;
        return (long)Math.Floor(rawHp);
    }

    /// <summary>
    /// Calculates the structural resource value of destroyed military units.
    /// Excludes civilian ships (Cargos, Colony, Recycler, Probe, Satellite, Crawler)
    /// and excludes repaired defenses (70% base, 85% with Engineer).
    /// </summary>
    public static double CalculateDestroyedMilitaryUnitsValue(
        IReadOnlyDictionary<UnitType, int> destroyedUnits,
        IReadOnlyDictionary<UnitType, int>? repairedDefenses = null)
    {
        ArgumentNullException.ThrowIfNull(destroyedUnits);

        double totalValue = 0.0;

        foreach (var (unitType, destroyedCount) in destroyedUnits)
        {
            if (destroyedCount <= 0) continue;

            if (IsCivilianUnit(unitType))
            {
                continue;
            }

            int permanentlyDestroyed = destroyedCount;
            if (repairedDefenses is not null && repairedDefenses.TryGetValue(unitType, out int repaired))
            {
                permanentlyDestroyed = Math.Max(0, destroyedCount - repaired);
            }

            if (permanentlyDestroyed <= 0) continue;

            var stats = CombatCatalog.GetStats(unitType);
            double unitCost = stats.MetalCost + stats.CrystalCost + stats.DeuteriumCost;
            totalValue += permanentlyDestroyed * unitCost;
        }

        return totalValue;
    }

    public static bool IsCivilianUnit(UnitType unitType) =>
        unitType is UnitType.SmallCargo or
                    UnitType.LargeCargo or
                    UnitType.ColonyShip or
                    UnitType.Recycler or
                    UnitType.EspionageProbe or
                    UnitType.SolarSatellite or
                    UnitType.Crawler;

    /// <summary>
    /// Evaluates if a player had at least 1% participation of total battle ships to earn or lose Honor Points.
    /// </summary>
    public static bool HasMinimumShipParticipation(int playerShipCount, int totalBattleShipCount)
    {
        if (totalBattleShipCount <= 0 || playerShipCount <= 0)
        {
            return false;
        }

        return (double)playerShipCount / totalBattleShipCount >= 0.01;
    }

    /// <summary>
    /// Resolves the Honor Points delta for both sides of combat.
    /// In Honorable battles, both sides gain positive HP for destroying military units.
    /// In Dishonorable battles, attacker loses HP for defender's destroyed units, defender gains HP.
    /// In Neutral battles, no HP is awarded or deducted.
    /// </summary>
    public static (long AttackerHpDelta, long DefenderHpDelta) CalculateHonorPointsDelta(
        FightHonorableStatus status,
        double attackerDestroyedMilitaryValue,
        double defenderDestroyedMilitaryValue,
        bool attackerQualifiedForHp = true,
        bool defenderQualifiedForHp = true)
    {
        if (status == FightHonorableStatus.Neutral)
        {
            return (0, 0);
        }

        long hpForDefenderCasualties = CalculateHonorPointsFromDestroyedValue(defenderDestroyedMilitaryValue);
        long hpForAttackerCasualties = CalculateHonorPointsFromDestroyedValue(attackerDestroyedMilitaryValue);

        long attackerDelta = 0;
        long defenderDelta = 0;

        if (status == FightHonorableStatus.Honorable)
        {
            if (attackerQualifiedForHp)
            {
                attackerDelta = hpForDefenderCasualties;
            }

            if (defenderQualifiedForHp)
            {
                defenderDelta = hpForAttackerCasualties;
            }
        }
        else // Dishonorable
        {
            if (attackerQualifiedForHp)
            {
                attackerDelta = -hpForDefenderCasualties; // Attacker loses HP for attacking dishonorably
            }

            if (defenderQualifiedForHp)
            {
                defenderDelta = hpForAttackerCasualties; // Defender gains HP for defending themselves
            }
        }

        return (attackerDelta, defenderDelta);
    }

    /// <summary>
    /// Determines the dynamic plunder percentage based on target Honor Rank, fight honorable status, and player class.
    /// </summary>
    public static double DeterminePlunderRatio(
        FightHonorableStatus status,
        HonorRank defenderHonorRank,
        bool isDefenderInactive,
        PlayerClass attackerClass)
    {
        if (IsBandit(defenderHonorRank))
        {
            return BanditPlunderRatio; // 100% against Bandits
        }

        if (status == FightHonorableStatus.Honorable)
        {
            return HonorablePlunderRatio; // 75% for Honorable targets
        }

        if (isDefenderInactive && attackerClass == PlayerClass.Discoverer)
        {
            return DiscovererInactivePlunderRatio; // 75% for Discoverer on inactives
        }

        return StandardPlunderRatio; // 50% for standard neutral or dishonorable
    }

    /// <summary>
    /// Calculates tactical fleet power points for Tactical Retreat calculation:
    /// Warships = 100% cost, Civilian ships = 25% cost, Defenses/Probes/Satellites = 0%.
    /// </summary>
    public static double CalculateFleetTacticalPoints(IReadOnlyDictionary<UnitType, int> units)
    {
        ArgumentNullException.ThrowIfNull(units);

        double totalPoints = 0.0;

        foreach (var (unitType, count) in units)
        {
            if (count <= 0) continue;

            if (unitType is UnitType.EspionageProbe or UnitType.SolarSatellite or UnitType.Crawler)
            {
                continue; // 0%
            }

            var stats = CombatCatalog.GetStats(unitType);
            if (stats.IsDefense)
            {
                continue; // 0% for planetary defense
            }

            double unitCost = stats.MetalCost + stats.CrystalCost + stats.DeuteriumCost;

            if (unitType is UnitType.SmallCargo or UnitType.LargeCargo or UnitType.ColonyShip or UnitType.Recycler)
            {
                totalPoints += count * unitCost * 0.25; // 25% for civilian ships
            }
            else
            {
                totalPoints += count * unitCost * 1.00; // 100% for warships
            }
        }

        return totalPoints;
    }

    /// <summary>
    /// Determines whether units can escape via Tactical Retreat.
    /// Deathstars, Solar Satellites, Espionage Probes, and Defenses cannot retreat.
    /// </summary>
    public static bool CanUnitTacticallyRetreat(UnitType unitType)
    {
        if (unitType is UnitType.Deathstar or UnitType.SolarSatellite or UnitType.EspionageProbe)
        {
            return false;
        }

        var stats = CombatCatalog.GetStats(unitType);
        return !stats.IsDefense;
    }

    /// <summary>
    /// Splits a fleet into retreatable units and units that must remain in battle.
    /// </summary>
    public static (Dictionary<UnitType, int> Retreatable, Dictionary<UnitType, int> NonRetreatable) SplitRetreatableUnits(
        IReadOnlyDictionary<UnitType, int> units)
    {
        ArgumentNullException.ThrowIfNull(units);

        var retreatable = new Dictionary<UnitType, int>();
        var nonRetreatable = new Dictionary<UnitType, int>();

        foreach (var (unitType, count) in units)
        {
            if (count <= 0) continue;

            if (CanUnitTacticallyRetreat(unitType))
            {
                retreatable[unitType] = count;
            }
            else
            {
                nonRetreatable[unitType] = count;
            }
        }

        return (retreatable, nonRetreatable);
    }

    /// <summary>
    /// Evaluates if Tactical Retreat triggers for the defender.
    /// Requirements:
    /// - Defender under noob protection (&lt; 500,000 total points)
    /// - Savaş Onurlu bir savaş olmamalı
    /// - Savunan oyuncu Haydut olmamalı
    /// - Attacker tactical points &gt;= 5:1 (or 3:1 with Admiral and setting enabled)
    /// - Planet has 1.5x neighbor slot flight Deuterium
    /// </summary>
    public static TacticalRetreatEvaluationResult EvaluateTacticalRetreat(
        long defenderTotalPoints,
        FightHonorableStatus status,
        HonorRank defenderHonorRank,
        IReadOnlyDictionary<UnitType, int> attackerUnits,
        IReadOnlyDictionary<UnitType, int> defenderUnits,
        double availablePlanetDeuterium,
        bool hasAdmiralOfficer = false,
        bool fleetRetreatRatio3To1Enabled = false,
        bool isAcsDefendFleet = false)
    {
        ArgumentNullException.ThrowIfNull(attackerUnits);
        ArgumentNullException.ThrowIfNull(defenderUnits);

        var (retreatable, nonRetreatable) = SplitRetreatableUnits(defenderUnits);

        // ACS defending fleets in orbit never tactically retreat
        if (isAcsDefendFleet || retreatable.Values.Sum() <= 0)
        {
            return new TacticalRetreatEvaluationResult(
                CanRetreat: false,
                Triggered: false,
                AttackerTacticalPoints: 0,
                DefenderTacticalPoints: 0,
                RequiredRatio: StandardTacticalRetreatRatio,
                RequiredDeuteriumFuel: 0,
                HasEnoughFuel: false,
                RetreatingUnits: new Dictionary<UnitType, int>(),
                RemainingUnitsInBattle: new Dictionary<UnitType, int>(defenderUnits));
        }

        // Eligibility check
        bool isUnderNoobProtection = defenderTotalPoints < 500_000;
        bool isNotHonorable = status != FightHonorableStatus.Honorable;
        bool isNotBandit = !IsBandit(defenderHonorRank);

        bool canRetreat = isUnderNoobProtection && isNotHonorable && isNotBandit;

        double attackerTactical = CalculateFleetTacticalPoints(attackerUnits);
        double defenderTactical = CalculateFleetTacticalPoints(defenderUnits);

        double requiredRatio = (hasAdmiralOfficer && fleetRetreatRatio3To1Enabled)
            ? AdmiralTacticalRetreatRatio
            : StandardTacticalRetreatRatio;

        bool ratioMet = defenderTactical > 0 && (attackerTactical / defenderTactical) >= requiredRatio;

        // Deuterium calculation: 1.5x fuel for neighboring slot (distance = 1005)
        double requiredDeut = CalculateRetreatDeuteriumFuel(retreatable);
        bool hasEnoughFuel = availablePlanetDeuterium >= requiredDeut;

        bool triggered = canRetreat && ratioMet && hasEnoughFuel;

        return new TacticalRetreatEvaluationResult(
            CanRetreat: canRetreat,
            Triggered: triggered,
            AttackerTacticalPoints: attackerTactical,
            DefenderTacticalPoints: defenderTactical,
            RequiredRatio: requiredRatio,
            RequiredDeuteriumFuel: requiredDeut,
            HasEnoughFuel: hasEnoughFuel,
            RetreatingUnits: triggered ? retreatable : new Dictionary<UnitType, int>(),
            RemainingUnitsInBattle: triggered ? nonRetreatable : new Dictionary<UnitType, int>(defenderUnits));
    }

    /// <summary>
    /// Calculates the 1.5x Deuterium escape cost for neighbor slot flight (distance = 1005).
    /// </summary>
    public static double CalculateRetreatDeuteriumFuel(IReadOnlyDictionary<UnitType, int> ships)
    {
        double totalFuel = 0.0;
        const int neighborDistance = 1005;

        foreach (var (shipType, count) in ships)
        {
            if (count <= 0) continue;

            try
            {
                var flightStats = FleetNavigationFormulas.GetShipFlightStats(shipType);
                // Fuel formula for standard 100% speed to neighbor slot:
                // fuel = 1 + round(count * baseFuel * (1 + distance / 35000))
                double shipFuel = 1.0 + Math.Round(count * flightStats.FuelUsage * (1.0 + (neighborDistance / 35_000.0)) * 0.1);
                totalFuel += shipFuel;
            }
            catch
            {
                // Defenses or non-mobile units skip fuel
            }
        }

        return Math.Ceiling(totalFuel * 1.5);
    }

    /// <summary>
    /// Calculates the 25% debris field auto-skimming for surviving Reaper (Azrail) ships.
    /// </summary>
    public static ReaperDebrisSkimResult CalculateReaperDebrisSkim(
        int survivingReaperCount,
        double newlyCreatedDebrisMetal,
        double newlyCreatedDebrisCrystal,
        double existingReaperCargoLoad = 0.0)
    {
        if (survivingReaperCount <= 0 || (newlyCreatedDebrisMetal <= 0 && newlyCreatedDebrisCrystal <= 0))
        {
            return new ReaperDebrisSkimResult(
                SkimmedMetal: 0,
                SkimmedCrystal: 0,
                RemainingDebrisMetal: newlyCreatedDebrisMetal,
                RemainingDebrisCrystal: newlyCreatedDebrisCrystal,
                SurvivingReaperCount: survivingReaperCount,
                AvailableCargoCapacity: 0);
        }

        double totalReaperCapacity = survivingReaperCount * ReaperBaseCargoCapacity;
        double availableCapacity = Math.Max(0.0, totalReaperCapacity - existingReaperCargoLoad);

        if (availableCapacity <= 0.0)
        {
            return new ReaperDebrisSkimResult(
                SkimmedMetal: 0,
                SkimmedCrystal: 0,
                RemainingDebrisMetal: newlyCreatedDebrisMetal,
                RemainingDebrisCrystal: newlyCreatedDebrisCrystal,
                SurvivingReaperCount: survivingReaperCount,
                AvailableCargoCapacity: 0);
        }

        double targetMetal = newlyCreatedDebrisMetal * ReaperDebrisSkimPercentage;
        double targetCrystal = newlyCreatedDebrisCrystal * ReaperDebrisSkimPercentage;
        double targetTotal = targetMetal + targetCrystal;

        double skimmedMetal;
        double skimmedCrystal;

        if (targetTotal <= availableCapacity)
        {
            skimmedMetal = targetMetal;
            skimmedCrystal = targetCrystal;
        }
        else
        {
            // Scale proportionally to fit within available Reaper cargo capacity
            double ratio = availableCapacity / targetTotal;
            skimmedMetal = targetMetal * ratio;
            skimmedCrystal = targetCrystal * ratio;
        }

        return new ReaperDebrisSkimResult(
            SkimmedMetal: Math.Floor(skimmedMetal),
            SkimmedCrystal: Math.Floor(skimmedCrystal),
            RemainingDebrisMetal: Math.Max(0.0, newlyCreatedDebrisMetal - Math.Floor(skimmedMetal)),
            RemainingDebrisCrystal: Math.Max(0.0, newlyCreatedDebrisCrystal - Math.Floor(skimmedCrystal)),
            SurvivingReaperCount: survivingReaperCount,
            AvailableCargoCapacity: availableCapacity);
    }

    /// <summary>
    /// Calculates the total auctioneer bid value when bidding with Metal, Crystal, Deuterium, and Honor Points:
    /// TotalBid = (Metal * 1.0) + (Crystal * 1.5) + (Deut * 3.0) + (max(0, HonorPoints) * 100.0)
    /// </summary>
    public static double CalculateAuctionBidValue(double metal, double crystal, double deuterium, long honorPoints = 0)
    {
        double resourceValue = (Math.Max(0, metal) * 1.0) +
                               (Math.Max(0, crystal) * 1.5) +
                               (Math.Max(0, deuterium) * 3.0);

        double honorValue = Math.Max(0, honorPoints) * AuctioneerBidPointsPerHonorPoint;

        return Math.Floor(resourceValue + honorValue);
    }
}

