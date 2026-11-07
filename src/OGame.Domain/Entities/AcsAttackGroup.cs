using OGame.Domain.Enums;

namespace OGame.Domain.Entities;

public class AcsAttackGroup
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = "ACS Strike Group";
    public Guid InitiatorUserId { get; set; }
    public Guid InitiatorFleetMissionId { get; set; }
    public Guid? TargetPlanetId { get; set; }
    public int TargetGalaxy { get; set; }
    public int TargetSystem { get; set; }
    public int TargetSlot { get; set; }
    public CoordinateType TargetType { get; set; } = CoordinateType.Planet;
    public DateTime SynchronizedArrivalUtc { get; set; }
    public bool IsResolved { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public ICollection<AcsGroupInvitation> Invitations { get; set; } = new List<AcsGroupInvitation>();
    public ICollection<FleetMission> Fleets { get; set; } = new List<FleetMission>();
}

public class AcsGroupInvitation
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid AcsAttackGroupId { get; set; }
    public Guid InvitedUserId { get; set; }
    public DateTime InvitedAtUtc { get; set; } = DateTime.UtcNow;

    public AcsAttackGroup? AcsAttackGroup { get; set; }
}

