using OGame.Domain.Enums;

namespace OGame.Domain.Entities;

public class CombatReport
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid AttackerUserId { get; set; }
    public Guid DefenderUserId { get; set; }
    public Guid? TargetPlanetId { get; set; }
    public string AttackerName { get; set; } = string.Empty;
    public string DefenderName { get; set; } = string.Empty;
    public string Coordinates { get; set; } = "[1:1:1]";
    public CombatWinner Winner { get; set; }
    public string DataJson { get; set; } = "{}";
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}

