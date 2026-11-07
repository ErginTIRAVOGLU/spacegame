using OGame.Domain.Combat;
using OGame.Domain.Enums;

namespace OGame.Domain.Services;

public record CombatParticipantProfile(
    string PlayerName,
    string? AllianceTag,
    string Coordinates,
    CombatTechLevels TechLevels,
    IReadOnlyDictionary<UnitType, int>? InitialUnits,
    IReadOnlyDictionary<UnitType, int>? RemainingUnits,
    IReadOnlyDictionary<UnitType, int>? DestroyedUnits,
    bool FleetNumbersHidden = false);

public record CombatRoundDetailedStats(
    int RoundNumber,
    int AttackerShotsFired,
    int DefenderShotsFired,
    double AttackerDamageDealt,
    double DefenderDamageDealt,
    double AttackerShieldAbsorbed,
    double DefenderShieldAbsorbed,
    IReadOnlyDictionary<UnitType, int>? AttackerUnitsRemaining,
    IReadOnlyDictionary<UnitType, int>? DefenderUnitsRemaining);

public record CombatWreckageSummary(
    double DebrisMetal,
    double DebrisCrystal,
    int MoonChancePercent,
    bool MoonCreated,
    IReadOnlyDictionary<UnitType, int> RepairedDefenses,
    double ReaperSkimmedMetal = 0.0,
    double ReaperSkimmedCrystal = 0.0);

public record CombatPlunderSummary(
    double MetalPlundered,
    double CrystalPlundered,
    double DeuteriumPlundered);

public record PublicCombatReportPayload(
    Guid ReportId,
    DateTime OccurredAtUtc,
    string BattleCoordinates,
    CombatWinner Winner,
    CombatParticipantProfile Attacker,
    CombatParticipantProfile Defender,
    IReadOnlyList<CombatRoundDetailedStats> Rounds,
    CombatWreckageSummary Wreckage,
    CombatPlunderSummary Plunder,
    bool IsAnonymizedIdentities = false,
    bool IsAnonymizedFleetNumbers = false,
    FightHonorableStatus FightStatus = FightHonorableStatus.Neutral,
    long AttackerHonorPointsDelta = 0,
    long DefenderHonorPointsDelta = 0);

public static class CombatReportFormulas
{
    public const int ReadMessageRetentionDays = 7;

    /// <summary>
    /// Cutoff UTC timestamp for deleting read messages older than 7 days.
    /// </summary>
    public static DateTime GetReadMessagePurgeCutoffUtc(DateTime utcNow) =>
        utcNow.AddDays(-ReadMessageRetentionDays);

    /// <summary>
    /// Determines whether a message should be purged by the 7-day read message retention policy.
    /// </summary>
    public static bool IsMessageEligibleForAutoPurge(bool isRead, DateTime createdAtUtc, DateTime utcNow)
    {
        if (!isRead)
        {
            return false;
        }

        return createdAtUtc < GetReadMessagePurgeCutoffUtc(utcNow);
    }

    /// <summary>
    /// Builds a structured Combat Report (CR) payload from combat simulation outputs and participant metadata.
    /// </summary>
    public static PublicCombatReportPayload BuildCombatReportPayload(
        Guid reportId,
        DateTime occurredAtUtc,
        string battleCoordinates,
        string attackerName,
        string? attackerAllianceTag,
        string attackerCoordinates,
        CombatTechLevels attackerTech,
        IReadOnlyDictionary<UnitType, int> attackerInitialUnits,
        string defenderName,
        string? defenderAllianceTag,
        string defenderCoordinates,
        CombatTechLevels defenderTech,
        IReadOnlyDictionary<UnitType, int> defenderInitialUnits,
        CombatResult combatResult,
        CombatPlunderSummary plunder,
        bool moonCreated = false,
        double reaperSkimmedMetal = 0.0,
        double reaperSkimmedCrystal = 0.0,
        FightHonorableStatus fightStatus = FightHonorableStatus.Neutral,
        long attackerHpDelta = 0,
        long defenderHpDelta = 0)
    {
        ArgumentNullException.ThrowIfNull(combatResult);

        int moonChance = MoonAndPhalanxFormulas.CalculateMoonChancePercent(
            combatResult.DebrisField.Metal,
            combatResult.DebrisField.Crystal);

        var attackerProfile = new CombatParticipantProfile(
            PlayerName: string.IsNullOrWhiteSpace(attackerName) ? "Unknown Attacker" : attackerName,
            AllianceTag: attackerAllianceTag,
            Coordinates: attackerCoordinates,
            TechLevels: attackerTech ?? new CombatTechLevels(),
            InitialUnits: new Dictionary<UnitType, int>(attackerInitialUnits ?? new Dictionary<UnitType, int>()),
            RemainingUnits: new Dictionary<UnitType, int>(combatResult.AttackerRemainingUnits),
            DestroyedUnits: new Dictionary<UnitType, int>(combatResult.AttackerDestroyedUnits),
            FleetNumbersHidden: false);

        var defenderProfile = new CombatParticipantProfile(
            PlayerName: string.IsNullOrWhiteSpace(defenderName) ? "Unknown Defender" : defenderName,
            AllianceTag: defenderAllianceTag,
            Coordinates: defenderCoordinates,
            TechLevels: defenderTech ?? new CombatTechLevels(),
            InitialUnits: new Dictionary<UnitType, int>(defenderInitialUnits ?? new Dictionary<UnitType, int>()),
            RemainingUnits: new Dictionary<UnitType, int>(combatResult.DefenderRemainingUnits),
            DestroyedUnits: new Dictionary<UnitType, int>(combatResult.DefenderDestroyedUnits),
            FleetNumbersHidden: false);

        var rounds = combatResult.Rounds
            .Select(r => new CombatRoundDetailedStats(
                RoundNumber: r.RoundNumber,
                AttackerShotsFired: r.AttackerShotsFired,
                DefenderShotsFired: r.DefenderShotsFired,
                AttackerDamageDealt: r.AttackerDamageDealt,
                DefenderDamageDealt: r.DefenderDamageDealt,
                AttackerShieldAbsorbed: r.AttackerShieldAbsorbed,
                DefenderShieldAbsorbed: r.DefenderShieldAbsorbed,
                AttackerUnitsRemaining: new Dictionary<UnitType, int>(r.AttackerUnitsRemaining),
                DefenderUnitsRemaining: new Dictionary<UnitType, int>(r.DefenderUnitsRemaining)))
            .ToList();

        var wreckage = new CombatWreckageSummary(
            DebrisMetal: combatResult.DebrisField.Metal,
            DebrisCrystal: combatResult.DebrisField.Crystal,
            MoonChancePercent: moonChance,
            MoonCreated: moonCreated,
            RepairedDefenses: combatResult.DefenderRepairedDefenses is not null
                ? new Dictionary<UnitType, int>(combatResult.DefenderRepairedDefenses)
                : new Dictionary<UnitType, int>(),
            ReaperSkimmedMetal: reaperSkimmedMetal,
            ReaperSkimmedCrystal: reaperSkimmedCrystal);

        return new PublicCombatReportPayload(
            ReportId: reportId,
            OccurredAtUtc: occurredAtUtc,
            BattleCoordinates: battleCoordinates,
            Winner: combatResult.Winner,
            Attacker: attackerProfile,
            Defender: defenderProfile,
            Rounds: rounds,
            Wreckage: wreckage,
            Plunder: plunder ?? new CombatPlunderSummary(0, 0, 0),
            IsAnonymizedIdentities: false,
            IsAnonymizedFleetNumbers: false,
            FightStatus: fightStatus,
            AttackerHonorPointsDelta: attackerHpDelta,
            DefenderHonorPointsDelta: defenderHpDelta);
    }

    /// <summary>
    /// Produces a clean, shareable Combat Report payload that optionally hides player identities/coordinates
    /// and/or exact fleet numbers.
    /// </summary>
    public static PublicCombatReportPayload AnonymizeCombatReport(
        PublicCombatReportPayload report,
        bool hidePlayerIdentities = true,
        bool hideExactFleetNumbers = false)
    {
        ArgumentNullException.ThrowIfNull(report);

        var attacker = report.Attacker;
        var defender = report.Defender;
        string battleCoords = report.BattleCoordinates;

        if (hidePlayerIdentities)
        {
            battleCoords = "[X:XXX:XX]";
            attacker = attacker with
            {
                PlayerName = "Commander Alpha [REDACTED]",
                AllianceTag = null,
                Coordinates = "[X:XXX:XX]"
            };
            defender = defender with
            {
                PlayerName = "Commander Omega [REDACTED]",
                AllianceTag = null,
                Coordinates = "[X:XXX:XX]"
            };
        }

        var rounds = report.Rounds;

        if (hideExactFleetNumbers)
        {
            attacker = attacker with
            {
                InitialUnits = null,
                RemainingUnits = null,
                DestroyedUnits = null,
                FleetNumbersHidden = true
            };
            defender = defender with
            {
                InitialUnits = null,
                RemainingUnits = null,
                DestroyedUnits = null,
                FleetNumbersHidden = true
            };

            rounds = report.Rounds
                .Select(r => r with
                {
                    AttackerUnitsRemaining = null,
                    DefenderUnitsRemaining = null
                })
                .ToList();
        }

        return report with
        {
            BattleCoordinates = battleCoords,
            Attacker = attacker,
            Defender = defender,
            Rounds = rounds,
            IsAnonymizedIdentities = hidePlayerIdentities,
            IsAnonymizedFleetNumbers = hideExactFleetNumbers
        };
    }
}

