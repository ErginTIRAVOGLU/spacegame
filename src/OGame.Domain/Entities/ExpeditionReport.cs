using OGame.Domain.Enums;

namespace OGame.Domain.Entities;

public class ExpeditionReport
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public Guid FleetMissionId { get; set; }
    public string Coordinates { get; set; } = "[1:1:16]";
    public ExpeditionOutcomeType OutcomeType { get; set; }
    public string NarrativeText { get; set; } = string.Empty;
    public string LootJson { get; set; } = "{}";
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
}

