using OGame.Domain.Entities;
using OGame.Domain.Enums;

namespace OGame.Application.Common.Interfaces;

public record FleetDispatchCommand(
    Guid UserId,
    Guid OriginPlanetId,
    int TargetGalaxy,
    int TargetSystem,
    int TargetSlot,
    CoordinateType TargetType,
    FleetMissionType MissionType,
    IReadOnlyDictionary<UnitType, int> Ships,
    double SpeedFactor = 1.0,
    double MetalCargo = 0,
    double CrystalCargo = 0,
    double DeuteriumCargo = 0,
    int HoldHours = 0,
    Guid? AcsAttackGroupId = null);

public record FleetMissionArrivalContext(
    Guid FleetMissionId,
    Guid OriginPlanetId,
    int OriginGalaxy,
    int OriginSystem,
    int OriginSlot,
    CoordinateType OriginType,
    Guid? TargetPlanetId,
    int TargetGalaxy,
    int TargetSystem,
    int TargetSlot,
    CoordinateType TargetType,
    FleetMissionType MissionType,
    DateTimeOffset? ReturnArrivalUtc);

public record FleetMissionArrivalResolution(
    Guid FleetMissionId,
    FleetMissionType MissionType,
    bool RequiresReturnTrip,
    DateTimeOffset? ReturnTimeUtc);

public interface IFleetMissionService
{
    Task<FleetMission> DispatchFleetAsync(
        FleetDispatchCommand command,
        CancellationToken cancellationToken = default);

    Task<FleetMissionArrivalContext?> GetMissionArrivalContextAsync(
        Guid fleetMissionId,
        CancellationToken cancellationToken = default);

    Task<FleetMissionArrivalResolution> EvaluateMissionArrivalAsync(
        Guid fleetMissionId,
        CancellationToken cancellationToken = default);

    Task CompleteFleetReturnAsync(
        Guid fleetMissionId,
        CancellationToken cancellationToken = default);

    Task<FleetMission> RecallFleetAsync(
        Guid fleetMissionId,
        Guid? userId = null,
        CancellationToken cancellationToken = default);
}
