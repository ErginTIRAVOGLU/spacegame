using OGame.Domain.Enums;

namespace OGame.Domain.Combat;

public record CombatTechLevels(
    int WeaponsLevel = 0,
    int ShieldingLevel = 0,
    int ArmourLevel = 0);

public record CombatFleetInput(
    IReadOnlyDictionary<UnitType, int> Units,
    CombatTechLevels? TechLevels = null);

public record DebrisFieldResources(
    double Metal,
    double Crystal);

public record CombatRoundSummary(
    int RoundNumber,
    int AttackerShotsFired,
    int DefenderShotsFired,
    double AttackerDamageDealt,
    double DefenderDamageDealt,
    double AttackerShieldAbsorbed,
    double DefenderShieldAbsorbed,
    IReadOnlyDictionary<UnitType, int> AttackerUnitsRemaining,
    IReadOnlyDictionary<UnitType, int> DefenderUnitsRemaining);

public record CombatResult(
    CombatWinner Winner,
    IReadOnlyList<CombatRoundSummary> Rounds,
    IReadOnlyDictionary<UnitType, int> AttackerRemainingUnits,
    IReadOnlyDictionary<UnitType, int> DefenderRemainingUnits,
    IReadOnlyDictionary<UnitType, int> AttackerDestroyedUnits,
    IReadOnlyDictionary<UnitType, int> DefenderDestroyedUnits,
    DebrisFieldResources DebrisField,
    IReadOnlyDictionary<UnitType, int>? DefenderRepairedDefenses = null);
