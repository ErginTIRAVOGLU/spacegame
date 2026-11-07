namespace OGame.Domain.Services;

public record PlanetCharacteristicRoll(
    int Slot,
    int MaxFields,
    int DiameterKm,
    int TempMin,
    int TempMax,
    double SolarSatelliteEnergyPerUnit);

public static class ColonizationFormulas
{
    public const int MinDestroyedPlanetPlaceholderHours = 24;
    public const int MaxDestroyedPlanetPlaceholderHours = 48;
    public const int DefaultDestroyedPlanetPlaceholderHours = 36;

    /// <summary>
    /// Astrophysics MaxPlanets Formula:
    /// MaxPlanets = 1 + ceil(AstrophysicsLevel / 2.0)
    /// - Level 0: 1 Planet (Home only)
    /// - Level 1: 2 Planets (Home + 1 Colony)
    /// - Level 3: 3 Planets
    /// - Level 5: 4 Planets
    /// </summary>
    public static int CalculateMaxPlanets(int astrophysicsLevel)
    {
        return 1 + CalculateMaxColonies(astrophysicsLevel);
    }

    /// <summary>
    /// Slot position locks by Astrophysics level:
    /// - Positions 4 to 12: Available from Level 1
    /// - Positions 3 and 13: Requires Level 4+
    /// - Positions 2 and 14: Requires Level 6+
    /// - Positions 1 and 15: Requires Level 8+
    /// </summary>
    public static int GetRequiredAstrophysicsLevelForSlot(int slot)
    {
        return slot switch
        {
            >= 4 and <= 12 => 1,
            3 or 13 => 4,
            2 or 14 => 6,
            1 or 15 => 8,
            _ => int.MaxValue
        };
    }

    public static bool CanColonizeSlot(int slot, int astrophysicsLevel)
    {
        if (slot < 1 || slot > 15)
        {
            return false;
        }

        int requiredLevel = GetRequiredAstrophysicsLevelForSlot(slot);
        return astrophysicsLevel >= requiredLevel;
    }

    /// <summary>
    /// Mean fields and standard deviation by slot band:
    /// - Slots 1–3: Mean ~160 fields (Small, hot)
    /// - Slots 4–6: Mean ~200 fields
    /// - Slots 7–9: Mean ~240 fields (230–250 range, Optimal home slots)
    /// - Slots 10–12: Mean ~200 fields
    /// - Slots 13–15: Mean ~140 fields (Cold, tiny, high deuterium boost)
    /// </summary>
    public static (int MeanFields, int StdDevFields, int MinFields, int MaxFields) GetSlotFieldDistribution(int slot)
    {
        // Official per-slot field table (Task 15): (Mean, StdDev ~ range/6, Min, Max)
        return slot switch
        {
            1 => (134, 13, 96, 172),
            2 => (140, 12, 104, 176),
            3 => (147, 12, 112, 182),
            4 => (163, 15, 118, 208),
            5 => (182, 17, 133, 232),
            6 => (194, 16, 146, 242),
            7 => (200, 16, 152, 248),
            8 => (204, 16, 156, 252),
            9 => (198, 16, 150, 246),
            10 => (187, 15, 142, 232),
            11 => (173, 12, 136, 210),
            12 => (156, 10, 125, 186),
            13 => (143, 10, 114, 172),
            14 => (134, 11, 100, 168),
            15 => (127, 12, 90, 164),
            _ => (163, 10, 140, 190)
        };
    }

    /// <summary>Homeworld starting field count (fixed). If the homeworld is abandoned the first colony becomes the new homeworld.</summary>
    public const int HomeworldFields = 163;

    public const double DiscovererFieldBonus = 0.10;
    public const double ResearcherAllianceFieldBonus = 0.05;

    /// <summary>
    /// Astrophysics colony limit: MaxColonies = floor((AstrophysicsLevel + 1) / 2).
    /// </summary>
    public static int CalculateMaxColonies(int astrophysicsLevel)
    {
        return astrophysicsLevel <= 0 ? 0 : (astrophysicsLevel + 1) / 2;
    }

    /// <summary>
    /// Applies Discoverer (+10%) and Researcher alliance class (+5%) planet field bonuses at colony setup.
    /// </summary>
    public static int ApplyColonyFieldBonuses(int baseFields, bool isDiscoverer, bool isResearcherAllianceClass)
    {
        double bonus = (isDiscoverer ? DiscovererFieldBonus : 0.0) + (isResearcherAllianceClass ? ResearcherAllianceFieldBonus : 0.0);
        return (int)Math.Floor(baseFields * (1.0 + bonus));
    }

    /// <summary>
    /// Terraformer fields granted when constructing the given level: +5 (odd levels +6).
    /// The building itself still occupies 1 field, so the net gain is +4 (+5 on odd levels).
    /// </summary>
    public static int GetTerraformerFieldsGranted(int level)
    {
        if (level <= 0) return 0;
        return level % 2 == 1 ? 6 : 5;
    }

    /// <summary>Moving a planet (relocation) is only allowed within slots 4–12 for these slots, others anywhere 1–15.</summary>
    public static bool CanRelocateToSlot(int currentSlot, int targetSlot)
    {
        if (targetSlot < 1 || targetSlot > 15 || currentSlot < 1 || currentSlot > 15) return false;
        bool currentRestricted = currentSlot is >= 4 and <= 12;
        return !currentRestricted || targetSlot is >= 4 and <= 12;
    }

    /// <summary>Slot production multipliers: (Metal, Crystal). Slot 15 grants the highest Deuterium via temperature.</summary>
    public static (double Metal, double Crystal) GetSlotProductionMultipliers(int slot)
    {
        return slot switch
        {
            1 => (1.0, 1.40),
            2 => (1.0, 1.30),
            3 => (1.0, 1.20),
            6 => (1.17, 1.0),
            7 => (1.23, 1.0),
            8 => (1.35, 1.0),
            9 => (1.23, 1.0),
            10 => (1.17, 1.0),
            _ => (1.0, 1.0)
        };
    }

    /// <summary>
    /// Temperature bounds (TempMin, TempMax) by slot number:
    /// - Slot 1: 220°C to 260°C
    /// - Slot 7–9: 30°C to 70°C
    /// - Slot 15: -130°C to -90°C
    /// </summary>
    public static (int TempMin, int TempMax) GetSlotTemperatureBand(int slot)
    {
        return slot switch
        {
            1 => (220, 260),
            2 => (170, 210),
            3 => (120, 160),
            4 => (70, 110),
            5 => (60, 100),
            6 => (50, 90),
            7 => (40, 80),
            8 => (30, 70),
            9 => (20, 60),
            10 => (10, 50),
            11 => (0, 40),
            12 => (-10, 30),
            13 => (-50, -10),
            14 => (-90, -50),
            15 => (-130, -90),
            _ => (10, 50)
        };
    }

    /// <summary>
    /// Solar Satellite Energy Efficiency Formula:
    /// EnergyPerSatellite = max(1, floor((TempMax + 140) / 6))
    /// </summary>
    public static double CalculateSolarSatelliteEnergyPerUnit(double tempMax)
    {
        return Math.Max(1.0, Math.Floor((tempMax + 140.0) / 6.0));
    }

    /// <summary>
    /// Rolls a new colony's fields, diameter, and temperature using a Box-Muller Gaussian roll for fields
    /// and slot-specific temperature characteristics.
    /// </summary>
    public static PlanetCharacteristicRoll RollPlanetCharacteristics(
        int slot,
        int? seed = null,
        bool isDiscoverer = false,
        bool isResearcherAllianceClass = false)
    {
        int clampedSlot = Math.Clamp(slot, 1, 15);
        var rng = seed.HasValue ? new Random(seed.Value) : new Random();

        var (meanFields, stdDevFields, minFields, maxFields) = GetSlotFieldDistribution(clampedSlot);

        // Box-Muller transform for Gaussian distribution around MeanFields
        double u1 = 1.0 - rng.NextDouble();
        double u2 = 1.0 - rng.NextDouble();
        double randStdNormal = Math.Sqrt(-2.0 * Math.Log(u1)) * Math.Sin(2.0 * Math.PI * u2);
        int rolledFields = (int)Math.Round(meanFields + stdDevFields * randStdNormal);
        int finalFields = Math.Clamp(rolledFields, minFields, maxFields);
        finalFields = ApplyColonyFieldBonuses(finalFields, isDiscoverer, isResearcherAllianceClass);

        int diameterKm = (int)Math.Round(Math.Sqrt(finalFields) * 1000.0);

        var (tempMin, tempMax) = GetSlotTemperatureBand(clampedSlot);
        double satEnergy = CalculateSolarSatelliteEnergyPerUnit(tempMax);

        return new PlanetCharacteristicRoll(
            Slot: clampedSlot,
            MaxFields: finalFields,
            DiameterKm: diameterKm,
            TempMin: tempMin,
            TempMax: tempMax,
            SolarSatelliteEnergyPerUnit: satEnergy);
    }

    public static DateTime CalculateDestroyedPlanetExpiryUtc(DateTime utcNow, int durationHours = DefaultDestroyedPlanetPlaceholderHours)
    {
        int clampedHours = Math.Clamp(durationHours, MinDestroyedPlanetPlaceholderHours, MaxDestroyedPlanetPlaceholderHours);
        return utcNow.AddHours(clampedHours);
    }
}

