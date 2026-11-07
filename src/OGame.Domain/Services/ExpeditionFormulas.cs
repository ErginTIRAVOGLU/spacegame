using OGame.Domain.Combat;
using OGame.Domain.Enums;

namespace OGame.Domain.Services;

public enum ExpeditionDepletionLevel
{
    Undepleted = 0,
    SlightlyDepleted = 1,
    CompletelyDepleted = 2
}

public static class ExpeditionFormulas
{
    public const int ExpeditionSlotNumber = 16;
    public const double HoursPerDepletionDecay = 2.4;

    /// <summary>
    /// Max concurrent expeditions formula:
    /// MaxExpeditions = floor(sqrt(AstrophysicsLevel)) + AdmiralBonus[1] + DiscovererClassBonus[2] + BuffSlots
    /// </summary>
    public static int CalculateMaxConcurrentExpeditions(
        int astrophysicsLevel,
        PlayerClass playerClass = PlayerClass.None,
        bool hasAdmiral = false,
        int extraBuffSlots = 0)
    {
        int admiralBonus = hasAdmiral ? 1 : 0;
        int discovererBonus = playerClass == PlayerClass.Discoverer ? 2 : 0;
        int baseExpeditions = astrophysicsLevel > 0 ? (int)Math.Floor(Math.Sqrt(astrophysicsLevel)) : 0;

        return baseExpeditions + admiralBonus + discovererBonus + Math.Max(0, extraBuffSlots);
    }

    /// <summary>
    /// Computes the expedition point value of a single ship:
    /// ExpeditionPoints = ((MetalCost + CrystalCost) * 5) / 1000
    /// Deathstar, Colony Ship, and Recycler give 0 points and cannot participate.
    /// </summary>
    public static int GetShipExpeditionPoints(UnitType unitType)
    {
        return unitType switch
        {
            UnitType.EspionageProbe => 5,
            UnitType.LightFighter => 20,
            UnitType.SmallCargo => 20,
            UnitType.HeavyFighter => 50,
            UnitType.LargeCargo => 60,
            UnitType.Cruiser => 135,
            UnitType.Battleship => 300,
            UnitType.Battlecruiser => 350,
            UnitType.Bomber => 375,
            UnitType.Destroyer => 550,
            UnitType.Pathfinder => 115,
            UnitType.Reaper => 700,
            UnitType.Deathstar => 0,
            UnitType.ColonyShip => 0,
            UnitType.Recycler => 0,
            _ => 0
        };
    }

    /// <summary>
    /// Checks whether a ship is allowed to participate in expedition missions.
    /// </summary>
    public static bool CanShipParticipateInExpedition(UnitType unitType) =>
        unitType is not UnitType.Deathstar and not UnitType.ColonyShip and not UnitType.Recycler;

    /// <summary>
    /// Sums the expedition points of all valid participating ships in a fleet.
    /// </summary>
    public static double CalculateFleetExpeditionPoints(IReadOnlyDictionary<UnitType, int> ships)
    {
        ArgumentNullException.ThrowIfNull(ships);

        double totalPoints = 0.0;
        foreach (var (shipType, count) in ships)
        {
            if (count <= 0 || !CanShipParticipateInExpedition(shipType)) continue;
            totalPoints += count * GetShipExpeditionPoints(shipType);
        }

        return totalPoints;
    }

    /// <summary>
    /// Pathfinder (Rehber) Multiplier:
    /// If the expedition fleet contains at least 1 Pathfinder ship, resources and ships found are multiplied by 2.0x!
    /// </summary>
    public static double GetPathfinderMultiplier(IReadOnlyDictionary<UnitType, int> ships)
    {
        ArgumentNullException.ThrowIfNull(ships);
        return ships.TryGetValue(UnitType.Pathfinder, out int count) && count > 0 ? 2.0 : 1.0;
    }

    /// <summary>
    /// Calculates the BaseCap for resource findings scaled by #1 player total score and fleet expedition points.
    /// </summary>
    public static double CalculateBaseCapByTopPlayerScore(long topPlayerScore, double fleetExpeditionPoints)
    {
        double topCap = topPlayerScore switch
        {
            < 10_000 => 12_000.0,
            < 100_000 => 24_000.0,
            < 1_000_000 => 60_000.0,
            < 5_000_000 => 120_000.0,
            < 25_000_000 => 300_000.0,
            < 100_000_000 => 600_000.0,
            _ => 1_200_000.0
        };

        // Fleet cap = FleetPoints * 20
        double fleetCap = Math.Max(12_000.0, fleetExpeditionPoints * 20.0);
        return Math.Min(topCap, fleetCap);
    }

    /// <summary>
    /// Evaluates the system depletion level and returns the associated status message for Espionage Probe logs.
    /// </summary>
    public static (ExpeditionDepletionLevel Level, string Message) GetDepletionLevel(int effectiveCount)
    {
        if (effectiveCount <= 10)
        {
            return (ExpeditionDepletionLevel.Undepleted, "Bölge henüz tükenmemiş");
        }

        if (effectiveCount <= 25)
        {
            return (ExpeditionDepletionLevel.SlightlyDepleted, "Bölge biraz tükenmiş");
        }

        return (ExpeditionDepletionLevel.CompletelyDepleted, "Bölge tamamen tükenmiş");
    }

    /// <summary>
    /// Computes the decayed depletion count based on 1 reduction every 2.4 hours (10 reductions per 24 hours).
    /// </summary>
    public static int CalculateDecayedDepletion(int currentCount, DateTime lastUpdatedUtc, DateTime nowUtc)
    {
        if (currentCount <= 0) return 0;
        double elapsedHours = Math.Max(0.0, (nowUtc - lastUpdatedUtc).TotalHours);
        int decay = (int)Math.Floor((elapsedHours + 1e-7) / HoursPerDepletionDecay);
        return Math.Max(0, currentCount - decay);
    }

    /// <summary>
    /// Resolves the expedition event outcome from the 10 exact event weights, applying depletion shifts:
    /// - 1. FindResources (32.5%)
    /// - 2. FindShips (22.0%)
    /// - 3. NothingHappens (18.6% base, increased when depleted)
    /// - 4. FindDarkMatter (9.0%)
    /// - 5. Delay (7.0%)
    /// - 6. Pirates (5.8%)
    /// - 7. Aliens (2.6%)
    /// - 8. EarlyReturn (2.0%)
    /// - 9. FindMerchant (0.7%)
    /// - 10. TotalBlackHoleLoss (0.33%)
    /// </summary>
    public static ExpeditionOutcomeType ResolveOutcomeByPercentile(
        double percentileRoll,
        ExpeditionDepletionLevel depletion = ExpeditionDepletionLevel.Undepleted,
        double psionicNetworkReduction = 0.0,
        bool allowLifeformDiscovery = false)
    {
        double resWeight = 32.5;
        double shipsWeight = 22.0;
        double nothingWeight = 18.6;
        double dmWeight = 9.0;
        double delayWeight = 7.0;
        double piratesWeight = 5.8;
        double aliensWeight = 2.6;
        double earlyReturnWeight = 2.0;
        double merchantWeight = 0.7;
        double blackHoleWeight = Math.Max(0.05, 0.33 * (1.0 - Math.Clamp(psionicNetworkReduction, 0.0, 0.80)));

        // Shift favorable weight to NothingHappens when depleted:
        // 11-25 visits (SlightlyDepleted): 15% shift
        // 25+ visits (CompletelyDepleted): 40% shift
        double shiftRatio = depletion switch
        {
            ExpeditionDepletionLevel.SlightlyDepleted => 0.15,
            ExpeditionDepletionLevel.CompletelyDepleted => 0.40,
            _ => 0.0
        };

        if (shiftRatio > 0.0)
        {
            double favorableTotal = resWeight + shipsWeight + dmWeight;
            double shiftedAmount = favorableTotal * shiftRatio;

            resWeight *= (1.0 - shiftRatio);
            shipsWeight *= (1.0 - shiftRatio);
            dmWeight *= (1.0 - shiftRatio);
            nothingWeight += shiftedAmount;
        }

        double lifeformWeight = allowLifeformDiscovery ? 8.63 : 0.0;
        if (allowLifeformDiscovery && nothingWeight > lifeformWeight)
        {
            nothingWeight -= lifeformWeight;
        }

        double totalWeight = resWeight + shipsWeight + nothingWeight + dmWeight + delayWeight +
                             piratesWeight + aliensWeight + earlyReturnWeight + merchantWeight +
                             blackHoleWeight + lifeformWeight;

        double roll = Math.Clamp(percentileRoll, 0.0, 100.0);
        double target = (roll / 100.0) * totalWeight;

        double cumulative = 0.0;

        cumulative += resWeight;
        if (target <= cumulative) return ExpeditionOutcomeType.FindResources;

        cumulative += shipsWeight;
        if (target <= cumulative) return ExpeditionOutcomeType.FindShips;

        cumulative += nothingWeight;
        if (target <= cumulative) return ExpeditionOutcomeType.NothingHappens;

        cumulative += dmWeight;
        if (target <= cumulative) return ExpeditionOutcomeType.FindDarkMatter;

        cumulative += delayWeight;
        if (target <= cumulative) return ExpeditionOutcomeType.Delay;

        cumulative += piratesWeight;
        if (target <= cumulative) return ExpeditionOutcomeType.Pirates;

        cumulative += aliensWeight;
        if (target <= cumulative) return ExpeditionOutcomeType.Aliens;

        cumulative += earlyReturnWeight;
        if (target <= cumulative) return ExpeditionOutcomeType.EarlyReturn;

        cumulative += merchantWeight;
        if (target <= cumulative) return ExpeditionOutcomeType.FindMerchant;

        if (allowLifeformDiscovery)
        {
            cumulative += lifeformWeight;
            if (target <= cumulative) return ExpeditionOutcomeType.FindLifeform;
        }

        return ExpeditionOutcomeType.TotalBlackHoleLoss;
    }

    /// <summary>
    /// Calculates Metal, Crystal, or Deuterium found from resource events:
    /// MetalFound = U[0.1, 1.0] * BaseCap * EcoSpeed * k_class * k_pathfinder * (1 + TechBonus)
    /// Crystal = MetalFound * 2/3
    /// Deuterium = MetalFound * 1/3
    /// </summary>
    public static (double Metal, double Crystal, double Deuterium) CalculateFoundResources(
        int resourceTypeChoice, // 0 = Metal, 1 = Crystal, 2 = Deuterium
        double roll01,
        double baseCap,
        double ecoSpeed = 1.0,
        double classMultiplier = 1.0,
        double pathfinderMultiplier = 1.0,
        double techBonus = 0.0)
    {
        double clampedRoll = Math.Clamp(roll01, 0.1, 1.0);
        double effectiveMultiplier = Math.Max(1.0, ecoSpeed) *
                                     Math.Max(1.0, classMultiplier) *
                                     Math.Max(1.0, pathfinderMultiplier) *
                                     (1.0 + Math.Max(0.0, techBonus));

        double baseMetalFound = Math.Floor(clampedRoll * baseCap * effectiveMultiplier);

        return resourceTypeChoice switch
        {
            1 => (0.0, Math.Floor(baseMetalFound * (2.0 / 3.0)), 0.0), // Crystal
            2 => (0.0, 0.0, Math.Floor(baseMetalFound * (1.0 / 3.0))), // Deuterium
            _ => (baseMetalFound, 0.0, 0.0)                            // Metal
        };
    }

    /// <summary>
    /// Awards 300 to 1,800 Dark Matter based on packet tier (Small: 300-400, Medium: 500-700, Large: 1,000-1,800),
    /// enhanced by Kaelesh Gravitation Sensors.
    /// </summary>
    public static int CalculateFoundDarkMatter(
        double rngFactor,
        double gravitationSensorsBonus = 0.0,
        double packetRoll = 0.0)
    {
        double factor = Math.Clamp(rngFactor, 0.0, 1.0);
        double baseDm = packetRoll switch
        {
            < 0.60 => 300.0 + factor * 100.0,   // Small: 300 - 400
            < 0.90 => 500.0 + factor * 200.0,   // Medium: 500 - 700
            _ => 1000.0 + factor * 800.0        // Large: 1,000 - 1,800
        };

        double total = baseDm * (1.0 + Math.Max(0.0, gravitationSensorsBonus));
        return (int)Math.Round(total);
    }

    /// <summary>
    /// Generates hostile Pirate or Alien fleet with specified tech scaling:
    /// Pirates: Tech = max(0, PlayerTech - 3), Fleet = 30% - 80%
    /// Aliens: Tech = PlayerTech + 3, Fleet = 40% - 120%
    /// </summary>
    public static (Dictionary<UnitType, int> NpcFleet, CombatTechLevels NpcTech) GeneratePiratesOrAliensFleet(
        IReadOnlyDictionary<UnitType, int> playerShips,
        bool isAlien,
        CombatTechLevels playerTech,
        double rngFleetScale)
    {
        ArgumentNullException.ThrowIfNull(playerShips);

        double scale = isAlien
            ? 0.40 + Math.Clamp(rngFleetScale, 0.0, 1.0) * 0.80 // 40% - 120%
            : 0.30 + Math.Clamp(rngFleetScale, 0.0, 1.0) * 0.50; // 30% - 80%

        int techOffset = isAlien ? 3 : -3;
        var pTech = playerTech ?? new CombatTechLevels();
        var npcTech = new CombatTechLevels(
            WeaponsLevel: Math.Max(0, pTech.WeaponsLevel + techOffset),
            ShieldingLevel: Math.Max(0, pTech.ShieldingLevel + techOffset),
            ArmourLevel: Math.Max(0, pTech.ArmourLevel + techOffset));

        var npcFleet = new Dictionary<UnitType, int>();
        foreach (var (shipType, count) in playerShips)
        {
            if (count <= 0 || !CanShipParticipateInExpedition(shipType)) continue;
            int scaled = Math.Max(1, (int)Math.Round(count * scale));
            npcFleet[shipType] = scaled;
        }

        if (npcFleet.Count == 0)
        {
            npcFleet[UnitType.LightFighter] = isAlien ? 5 : 3;
        }

        return (npcFleet, npcTech);
    }

    /// <summary>
    /// Legacy helper for scaling NPC fleet by ExpeditionNpcStrength.
    /// </summary>
    public static Dictionary<UnitType, int> GenerateNpcFleet(
        IReadOnlyDictionary<UnitType, int> expeditionShips,
        ExpeditionNpcStrength strength)
    {
        ArgumentNullException.ThrowIfNull(expeditionShips);
        double multiplier = strength switch
        {
            ExpeditionNpcStrength.Weaker => 0.30,
            ExpeditionNpcStrength.Normal => 0.50,
            ExpeditionNpcStrength.Stronger => 0.80,
            _ => 0.50
        };

        var fleet = new Dictionary<UnitType, int>();
        foreach (var (ship, count) in expeditionShips)
        {
            if (count <= 0) continue;
            fleet[ship] = Math.Max(1, (int)Math.Round(count * multiplier));
        }
        return fleet;
    }
}
