using OGame.Domain.Entities;
using OGame.Domain.Enums;

namespace OGame.Application.Common.Interfaces;

public record EspionageResourcesSnapshot(
    double Metal,
    double Crystal,
    double Deuterium,
    double Energy);

public record EspionageReportPayload(
    Guid TargetPlanetId,
    string TargetPlanetName,
    string Coordinates,
    int TierLevel,
    double EffectiveProbes,
    double DetectionChancePercent,
    bool CounterEspionageTriggered,
    EspionageResourcesSnapshot? Resources,
    IReadOnlyDictionary<UnitType, int>? StationedFleets,
    IReadOnlyDictionary<UnitType, int>? PlanetaryDefenses,
    IReadOnlyDictionary<BuildingType, int>? PlanetaryBuildings,
    IReadOnlyDictionary<ResearchType, int>? ResearchedTechnologies);

public record EspionageExecutionResult(
    EspionageReport Report,
    int SurvivingProbes,
    bool CounterEspionageTriggered);

public interface IEspionageService
{
    Task<EspionageExecutionResult> ExecuteEspionageScanAsync(
        Guid scannerUserId,
        Guid targetPlanetId,
        int probeCount,
        int? seed = null,
        CancellationToken cancellationToken = default);
}

