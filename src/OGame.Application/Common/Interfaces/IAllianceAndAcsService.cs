using OGame.Domain.Entities;
using OGame.Domain.Enums;

namespace OGame.Application.Common.Interfaces;

public interface IAllianceAndAcsService
{
    Task<Alliance> CreateAllianceAsync(
        Guid founderUserId,
        string name,
        string tag,
        string description,
        CancellationToken cancellationToken = default);

    Task<AllianceMember> JoinAllianceAsync(
        Guid userId,
        Guid allianceId,
        AllianceRole role = AllianceRole.Member,
        CancellationToken cancellationToken = default);

    Task<AcsAttackGroup> ConvertMissionToAcsGroupAsync(
        Guid initiatorUserId,
        Guid fleetMissionId,
        string groupName,
        IReadOnlyList<Guid> invitedUserIds,
        CancellationToken cancellationToken = default);

    Task<FleetMission> JoinAcsAttackGroupAsync(
        Guid acsGroupId,
        FleetDispatchCommand command,
        CancellationToken cancellationToken = default);
}

