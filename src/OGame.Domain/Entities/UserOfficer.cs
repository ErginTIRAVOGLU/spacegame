using OGame.Domain.Enums;

namespace OGame.Domain.Entities;

public enum OfficerType
{
    Commander = 1,
    FleetAdmiral = 2,
    Engineer = 3,
    Geologist = 4,
    Technocrat = 5
}

public class UserOfficer
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public OfficerType Type { get; set; }
    public DateTime ExpiresAtUtc { get; set; }
    public DateTime HiredAtUtc { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
}

