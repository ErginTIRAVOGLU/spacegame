using OGame.Domain.Entities;
using OGame.Domain.Enums;

namespace OGame.Application.Common.Interfaces;

public record PhalanxFleetMovementDto(
    Guid FleetMissionId,
    FleetMissionType MissionType,
    FleetMissionStatus Status,
    string OriginCoordinates,
    CoordinateType OriginType,
    string TargetCoordinates,
    CoordinateType TargetType,
    DateTime DepartureUtc,
    DateTime ArrivalUtc,
    DateTime? ReturnUtc,
    IReadOnlyDictionary<UnitType, int> Ships);

public record MoonDestructionResult(
    bool MoonDestroyed,
    bool DeathstarsDestroyed,
    double DestructionChancePercent,
    double RipLossChancePercent,
    int SurvivingDeathstars);

public interface IMoonAndPhalanxService
{
    Task<Planet?> TryFormMoonFromDebrisAsync(
        Planet parentPlanet,
        double debrisMetal,
        double debrisCrystal,
        int? seed = null,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<PhalanxFleetMovementDto>> ScanWithSensorPhalanxAsync(
        Guid scannerUserId,
        Guid originMoonId,
        int targetGalaxy,
        int targetSystem,
        int targetSlot,
        CancellationToken cancellationToken = default);

    Task TransferFleetViaJumpGateAsync(
        Guid userId,
        Guid originMoonId,
        Guid destinationMoonId,
        IReadOnlyDictionary<UnitType, int> ships,
        CancellationToken cancellationToken = default);

    Task<MoonDestructionResult> ExecuteMoonDestructionAsync(
        Planet targetMoon,
        int deathstarCount,
        int? seed = null,
        CancellationToken cancellationToken = default);
}

