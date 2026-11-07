namespace OGame.Domain.Services;

public record OfficerBonuses(
    bool HasCommander,
    bool HasAdmiral,
    bool HasEngineer,
    bool HasGeologist,
    bool HasTechnocrat,
    bool HasFullCommandStaff,
    double MineProductionMultiplier,
    double EnergyProductionMultiplier,
    double ResearchDurationMultiplier,
    double DefenseRepairRatio,
    int ExtraFleetSlots,
    int ExtraExpeditionSlots,
    int ExtraEspionageTechLevels);

public static class OfficerFormulas
{
    // Canonical 1 Week (7 Days) and 3 Months (90 Days / 2160 Hours) Costs
    public const int CommanderWeeklyCost = 10_000;
    public const int CommanderThreeMonthsCost = 100_000;

    public const int AdmiralWeeklyCost = 5_000;
    public const int AdmiralThreeMonthsCost = 50_000;

    public const int EngineerWeeklyCost = 5_000;
    public const int EngineerThreeMonthsCost = 50_000;

    public const int GeologistWeeklyCost = 12_500;
    public const int GeologistThreeMonthsCost = 125_000;

    public const int TechnocratWeeklyCost = 10_000;
    public const int TechnocratThreeMonthsCost = 100_000;

    public const int WeeklyCommandStaffCost = 42_500;
    public const int ThreeMonthsCommandStaffCost = 425_000;

    // Backward compatibility aliases
    public const int WeeklyOfficerCost = 10_000;
    public const int MonthlyOfficerCost = 100_000;
    public const int MonthlyCommandStaffCost = 425_000;

    public static (int Weekly, int ThreeMonths) GetCanonicalCost(string officerKey) =>
        officerKey.ToLowerInvariant() switch
        {
            "commander" => (CommanderWeeklyCost, CommanderThreeMonthsCost),
            "admiral" => (AdmiralWeeklyCost, AdmiralThreeMonthsCost),
            "engineer" => (EngineerWeeklyCost, EngineerThreeMonthsCost),
            "geologist" => (GeologistWeeklyCost, GeologistThreeMonthsCost),
            "technocrat" => (TechnocratWeeklyCost, TechnocratThreeMonthsCost),
            "command_staff" => (WeeklyCommandStaffCost, ThreeMonthsCommandStaffCost),
            _ => (WeeklyOfficerCost, MonthlyOfficerCost)
        };

    public static OfficerBonuses EvaluateBonuses(
        bool hasCommander,
        bool hasAdmiral,
        bool hasEngineer,
        bool hasGeologist,
        bool hasTechnocrat)
    {
        bool hasFullStaff = hasCommander && hasAdmiral && hasEngineer && hasGeologist && hasTechnocrat;

        // Base multipliers
        // Jeolog: +10% Mine. Full staff: +2% extra.
        double mineBonus = 1.0;
        if (hasGeologist) mineBonus += 0.10;
        if (hasFullStaff) mineBonus += 0.02;

        // Mühendis: +10% Energy. Full staff: +2% extra.
        double energyBonus = 1.0;
        if (hasEngineer) energyBonus += 0.10;
        if (hasFullStaff) energyBonus += 0.02;

        // Teknokrat: -25% research duration.
        double researchMultiplier = hasTechnocrat ? 0.75 : 1.0;

        // Mühendis: Defense repair loss halved -> 70% + 15% = 85% repair ratio.
        double defenseRepairRatio = hasEngineer ? 0.85 : 0.70;

        // Amiral: +2 fleet slots, +1 expedition slot. Full staff: +1 fleet slot extra.
        int extraFleets = (hasAdmiral ? 2 : 0) + (hasFullStaff ? 1 : 0);
        int extraExpeditions = hasAdmiral ? 1 : 0;

        // Teknokrat: +2 espionage tech. Full staff: +1 espionage tech.
        int extraEspionage = (hasTechnocrat ? 2 : 0) + (hasFullStaff ? 1 : 0);

        return new OfficerBonuses(
            HasCommander: hasCommander,
            HasAdmiral: hasAdmiral,
            HasEngineer: hasEngineer,
            HasGeologist: hasGeologist,
            HasTechnocrat: hasTechnocrat,
            HasFullCommandStaff: hasFullStaff,
            MineProductionMultiplier: mineBonus,
            EnergyProductionMultiplier: energyBonus,
            ResearchDurationMultiplier: researchMultiplier,
            DefenseRepairRatio: defenseRepairRatio,
            ExtraFleetSlots: extraFleets,
            ExtraExpeditionSlots: extraExpeditions,
            ExtraEspionageTechLevels: extraEspionage);
    }
}

