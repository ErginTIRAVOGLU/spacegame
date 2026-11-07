using OGame.Domain.Entities;
using OGame.Domain.Enums;

namespace OGame.Application.Common.Interfaces;

public record MissileLaunchCommand(
    Guid AttackerUserId,
    Guid OriginPlanetId,
    int TargetGalaxy,
    int TargetSystem,
    int TargetSlot,
    int MissileCount,
    UnitType? PrimaryTargetDefenseType = null);

public interface IMissileService
{
    Task<MissileLaunch> LaunchInterplanetaryMissilesAsync(
        MissileLaunchCommand command,
        CancellationToken cancellationToken = default);

    Task ResolveMissileImpactAsync(
        Guid missileLaunchId,
        CancellationToken cancellationToken = default);
}
