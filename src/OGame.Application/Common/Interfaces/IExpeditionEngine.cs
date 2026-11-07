using OGame.Domain.Entities;
using OGame.Domain.Enums;

namespace OGame.Application.Common.Interfaces;

public record ExpeditionResolutionResult(
    ExpeditionOutcomeType OutcomeType,
    string NarrativeText,
    double AddedMetal,
    double AddedCrystal,
    double AddedDeuterium,
    int AddedDarkMatter,
    IReadOnlyDictionary<UnitType, int> AddedShips,
    IReadOnlyDictionary<UnitType, int> SurvivingShips,
    double ReturnDurationMultiplier,
    ExpeditionReport Report,
    string? DiscoveredLifeform = null);

public interface IExpeditionEngine
{
    Task<ExpeditionResolutionResult> ResolveExpeditionAsync(
        FleetMission mission,
        int? seed = null,
        double universeAgeMultiplier = 1.0,
        CancellationToken cancellationToken = default);
}

