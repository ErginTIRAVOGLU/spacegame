using Microsoft.EntityFrameworkCore;
using OGame.Application.Common.Interfaces;
using OGame.Application.Interfaces;
using OGame.Domain.Entities;
using OGame.Domain.Enums;
using OGame.Domain.Services;

namespace OGame.Application.Services;

public class AllianceAndAcsService(
    IApplicationDbContext dbContext,
    IFleetMissionService fleetMissionService,
    IJobScheduler jobScheduler,
    IDistributedLockService lockService) : IAllianceAndAcsService
{
    public async Task<Alliance> CreateAllianceAsync(
        Guid founderUserId,
        string name,
        string tag,
        string description,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        ArgumentException.ThrowIfNullOrWhiteSpace(tag);

        var founder = await dbContext.Users
            .FirstOrDefaultAsync(u => u.Id == founderUserId, cancellationToken)
            ?? throw new InvalidOperationException($"User {founderUserId} not found.");

        bool alreadyInAlliance = await dbContext.AllianceMembers
            .AnyAsync(m => m.UserId == founderUserId, cancellationToken);

        if (alreadyInAlliance)
        {
            throw new InvalidOperationException("User is already a member of an alliance.");
        }

        var now = DateTime.UtcNow;
        var alliance = new Alliance
        {
            Id = Guid.NewGuid(),
            Name = name.Trim(),
            Tag = tag.Trim().ToUpperInvariant(),
            FounderUserId = founderUserId,
            Description = description ?? string.Empty,
            CreatedAtUtc = now
        };

        var founderMembership = new AllianceMember
        {
            UserId = founderUserId,
            AllianceId = alliance.Id,
            Role = AllianceRole.Founder,
            JoinedAtUtc = now
        };

        founder.AllianceTag = alliance.Tag;

        dbContext.Alliances.Add(alliance);
        dbContext.AllianceMembers.Add(founderMembership);
        await dbContext.SaveChangesAsync(cancellationToken);

        return alliance;
    }

    public async Task<AllianceMember> JoinAllianceAsync(
        Guid userId,
        Guid allianceId,
        AllianceRole role = AllianceRole.Member,
        CancellationToken cancellationToken = default)
    {
        var user = await dbContext.Users
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken)
            ?? throw new InvalidOperationException($"User {userId} not found.");

        var alliance = await dbContext.Alliances
            .FirstOrDefaultAsync(a => a.Id == allianceId, cancellationToken)
            ?? throw new InvalidOperationException($"Alliance {allianceId} not found.");

        bool alreadyMember = await dbContext.AllianceMembers
            .AnyAsync(m => m.UserId == userId, cancellationToken);

        if (alreadyMember)
        {
            throw new InvalidOperationException("User is already in an alliance.");
        }

        var member = new AllianceMember
        {
            UserId = userId,
            AllianceId = allianceId,
            Role = role,
            JoinedAtUtc = DateTime.UtcNow
        };

        user.AllianceTag = alliance.Tag;
        dbContext.AllianceMembers.Add(member);
        await dbContext.SaveChangesAsync(cancellationToken);

        return member;
    }

    public async Task<AcsAttackGroup> ConvertMissionToAcsGroupAsync(
        Guid initiatorUserId,
        Guid fleetMissionId,
        string groupName,
        IReadOnlyList<Guid> invitedUserIds,
        CancellationToken cancellationToken = default)
    {
        var distinctInvites = (invitedUserIds ?? [])
            .Where(id => id != initiatorUserId)
            .Distinct()
            .ToList();

        if (distinctInvites.Count > AcsFormulas.MaxInvitedBuddies)
        {
            throw new InvalidOperationException(
                $"Host can invite at most {AcsFormulas.MaxInvitedBuddies} other alliance members/buddies.");
        }

        string fleetLockKey = $"lock:fleet:{fleetMissionId}";
        await using var fleetLock = await lockService.AcquireLockAsync(fleetLockKey, cancellationToken: cancellationToken);

        var mission = await dbContext.FleetMissions
            .FirstOrDefaultAsync(m => m.Id == fleetMissionId && m.UserId == initiatorUserId, cancellationToken)
            ?? throw new InvalidOperationException($"Fleet mission {fleetMissionId} not found for initiator {initiatorUserId}.");

        if (mission.Status != FleetMissionStatus.Outbound ||
            (mission.MissionType != FleetMissionType.Attack && mission.MissionType != FleetMissionType.AcsAttack))
        {
            throw new InvalidOperationException("Only an active outbound Attack fleet can be converted into an ACS Attack Group.");
        }

        if (mission.AcsAttackGroupId.HasValue)
        {
            throw new InvalidOperationException("This fleet is already linked to an ACS Attack Group.");
        }

        if (mission.TargetPlanetId.HasValue)
        {
            bool targetInVacation = await dbContext.Planets
                .AsNoTracking()
                .AnyAsync(p => p.Id == mission.TargetPlanetId.Value && (p.IsProductionFrozen || (p.User != null && p.User.IsVacationMode)), cancellationToken);

            if (targetInVacation)
            {
                throw new InvalidOperationException("Cannot initiate an ACS Attack Group against a player in Vacation Mode.");
            }
        }

        var now = DateTime.UtcNow;
        var group = new AcsAttackGroup
        {
            Id = Guid.NewGuid(),
            Name = string.IsNullOrWhiteSpace(groupName) ? "ACS Strike Group" : groupName.Trim(),
            InitiatorUserId = initiatorUserId,
            InitiatorFleetMissionId = mission.Id,
            TargetPlanetId = mission.TargetPlanetId,
            TargetGalaxy = mission.TargetGalaxy,
            TargetSystem = mission.TargetSystem,
            TargetSlot = mission.TargetSlot,
            TargetType = mission.TargetType,
            SynchronizedArrivalUtc = mission.ArrivalUtc,
            CreatedAtUtc = now,
            Invitations = distinctInvites.Select(id => new AcsGroupInvitation
            {
                Id = Guid.NewGuid(),
                InvitedUserId = id,
                InvitedAtUtc = now
            }).ToList()
        };

        mission.MissionType = FleetMissionType.AcsAttack;
        mission.AcsAttackGroupId = group.Id;

        dbContext.AcsAttackGroups.Add(group);
        await dbContext.SaveChangesAsync(cancellationToken);

        return group;
    }

    public async Task<FleetMission> JoinAcsAttackGroupAsync(
        Guid acsGroupId,
        FleetDispatchCommand command,
        CancellationToken cancellationToken = default)
    {
        // Use Redis distributed lock: acs:{groupId} when joining or recalculating group arrival timestamps
        string acsLockKey = AcsFormulas.BuildAcsLockKey(acsGroupId);
        await using var acsLock = await lockService.AcquireLockAsync(acsLockKey, cancellationToken: cancellationToken);

        var group = await dbContext.AcsAttackGroups
            .Include(g => g.Invitations)
            .Include(g => g.Fleets)
            .FirstOrDefaultAsync(g => g.Id == acsGroupId, cancellationToken)
            ?? throw new InvalidOperationException($"ACS Attack Group {acsGroupId} not found.");

        if (group.IsResolved)
        {
            throw new InvalidOperationException("This ACS Attack Group has already completed its strike.");
        }

        bool isInvitedOrHost = group.InitiatorUserId == command.UserId ||
                               group.Invitations.Any(i => i.InvitedUserId == command.UserId);

        if (!isInvitedOrHost)
        {
            throw new InvalidOperationException("Player is not invited to this ACS Attack Group.");
        }

        var distinctParticipantIds = group.Fleets
            .Select(f => f.UserId)
            .Append(command.UserId)
            .Distinct()
            .Count();

        if (distinctParticipantIds > AcsFormulas.MaxTotalParticipants)
        {
            throw new InvalidOperationException("ACS Attack Group cannot exceed 5 total participating players.");
        }

        var originPlanet = await dbContext.Planets
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == command.OriginPlanetId && p.UserId == command.UserId, cancellationToken)
            ?? throw new InvalidOperationException("Origin planet not found.");

        int distance = FleetNavigationFormulas.CalculateSpatialDistance(
            originPlanet.Galaxy, originPlanet.System, originPlanet.Slot,
            group.TargetGalaxy, group.TargetSystem, group.TargetSlot);

        double slowestSpeed = FleetNavigationFormulas.GetSlowestShipSpeed(command.Ships);
        double durationSeconds = FleetNavigationFormulas.CalculateFlightDurationSeconds(
            distance,
            slowestSpeed,
            command.SpeedFactor);

        var now = DateTime.UtcNow;
        var naturalArrivalUtc = now.AddSeconds(durationSeconds);

        var syncCheck = AcsFormulas.EvaluateJoinTimeSync(
            group.SynchronizedArrivalUtc,
            naturalArrivalUtc,
            now);

        if (!syncCheck.IsAllowed)
        {
            throw new InvalidOperationException(syncCheck.RejectionReason ?? "Joining fleet rejected by ACS time sync rule.");
        }

        // Dispatch the joining fleet linked to the ACS group
        var linkedCommand = command with
        {
            TargetGalaxy = group.TargetGalaxy,
            TargetSystem = group.TargetSystem,
            TargetSlot = group.TargetSlot,
            TargetType = group.TargetType,
            MissionType = FleetMissionType.AcsAttack,
            AcsAttackGroupId = group.Id
        };

        var joinedMission = await fleetMissionService.DispatchFleetAsync(linkedCommand, cancellationToken);

        // Synchronize arrival time across ALL joined fleets in the group
        var newSynchronizedArrivalUtc = syncCheck.SynchronizedArrivalUtc;
        group.SynchronizedArrivalUtc = newSynchronizedArrivalUtc;

        var allGroupFleets = await dbContext.FleetMissions
            .Where(f => f.AcsAttackGroupId == group.Id && f.Status == FleetMissionStatus.Outbound)
            .ToListAsync(cancellationToken);

        var newArrivalOffset = new DateTimeOffset(newSynchronizedArrivalUtc, TimeSpan.Zero);

        foreach (var fleet in allGroupFleets)
        {
            double individualFlightSeconds = Math.Max(1.0, (fleet.ArrivalUtc - fleet.DepartureUtc).TotalSeconds);
            fleet.ArrivalUtc = newSynchronizedArrivalUtc;
            fleet.ReturnUtc = newSynchronizedArrivalUtc.AddSeconds(individualFlightSeconds);

            if (!string.IsNullOrWhiteSpace(fleet.HangfireArrivalJobId))
            {
                jobScheduler.RescheduleJob(fleet.HangfireArrivalJobId, newArrivalOffset);
            }
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return joinedMission;
    }
}

