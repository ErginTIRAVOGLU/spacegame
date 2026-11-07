using OGame.Domain.Entities;
using OGame.Domain.Enums;
using OGame.Domain.Services;

namespace OGame.Application.Common.Interfaces;

public record ForceReturnFleetResult(
    Guid FleetMissionId,
    FleetMissionStatus NewStatus,
    bool InstantTeleported,
    DateTime ReturnArrivalUtc,
    string? ReturnHangfireJobId);

public record ClearPlanetQueuesResult(
    Guid PlanetId,
    int CancelledBuildingQueueCount,
    int CancelledShipyardBatchCount,
    double RefundedMetal,
    double RefundedCrystal,
    double RefundedDeuterium);

public record AdminPlanetEconomySummaryDto(
    Guid PlanetId,
    string Name,
    string Coordinates,
    bool IsMoon,
    double Metal,
    double Crystal,
    double Deuterium,
    double MetalPerHour,
    double CrystalPerHour,
    double DeuteriumPerHour,
    IReadOnlyDictionary<UnitType, int> StationedUnits);

public record AdminUserInspectionDto(
    Guid UserId,
    string Username,
    string Email,
    UserRole Role,
    bool IsBanned,
    bool IsVacationMode,
    long TotalPoints,
    int TotalShipsAndDefensesCount,
    int ActiveFleetMissionsCount,
    double TotalMetalPerHour,
    double TotalCrystalPerHour,
    double TotalDeuteriumPerHour,
    IReadOnlyList<AdminPlanetEconomySummaryDto> Planets);

public record BanUserResult(
    Guid TargetUserId,
    bool IsBanned,
    string Reason,
    int CancelledAttackMissionsCount,
    int RevokedRefreshTokensCount,
    DateTime BannedAtUtc);

public interface IAdminToolsService
{
    Task<ForceReturnFleetResult> ForceReturnFleetAsync(
        Guid adminUserId,
        Guid fleetMissionId,
        bool instantTeleport = false,
        CancellationToken cancellationToken = default);

    Task<ClearPlanetQueuesResult> ClearPlanetQueuesAsync(
        Guid adminUserId,
        Guid planetId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AdminUserInspectionDto>> SearchUsersAndEconomyAsync(
        string? query,
        CancellationToken cancellationToken = default);

    Task<BanUserResult> BanUserAsync(
        Guid adminUserId,
        Guid targetUserId,
        string reason,
        CancellationToken cancellationToken = default);

    Task<UniverseConfig> UpdateUniverseSpeedAsync(
        Guid adminUserId,
        UniverseConfig newConfig,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AdminLog>> GetAuditLogsAsync(
        int topCount = 100,
        CancellationToken cancellationToken = default);
}

