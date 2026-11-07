using OGame.Domain.Enums;

namespace OGame.Domain.Entities;

public class Alliance
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Tag { get; set; } = string.Empty;
    public Guid FounderUserId { get; set; }
    public string Description { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public ICollection<AllianceMember> Members { get; set; } = new List<AllianceMember>();
}

public class AllianceMember
{
    public Guid UserId { get; set; }
    public Guid AllianceId { get; set; }
    public AllianceRole Role { get; set; } = AllianceRole.Member;
    public DateTime JoinedAtUtc { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
    public Alliance? Alliance { get; set; }
}

