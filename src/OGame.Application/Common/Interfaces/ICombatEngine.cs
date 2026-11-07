using OGame.Domain.Combat;
using OGame.Domain.Enums;

namespace OGame.Application.Common.Interfaces;

public interface ICombatEngine
{
    CombatResult SimulateCombat(
        CombatFleetInput attacker,
        CombatFleetInput defender,
        int? seed = null,
        int maxRounds = 6,
        double debrisRatio = 0.30,
        bool defenseToDebris = false,
        bool defenderHasEngineerOfficer = false);

    IReadOnlyDictionary<UnitType, int> CalculateDefenseRebuild(
        IReadOnlyDictionary<UnitType, int> destroyedUnits,
        bool hasEngineerOfficer = false,
        int? seed = null);
}
