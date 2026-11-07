using OGame.Domain.Enums;

namespace OGame.Domain.Entities;

public class MissileLaunch
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid AttackerUserId { get; set; }
    public Guid OriginPlanetId { get; set; }
    public Guid TargetPlanetId { get; set; }
    public int OriginGalaxy { get; set; }
    public int OriginSystem { get; set; }
    public int OriginSlot { get; set; }
    public int TargetGalaxy { get; set; }
    public int TargetSystem { get; set; }
    public int TargetSlot { get; set; }
    public int MissileCount { get; set; }
    public UnitType? PrimaryTargetDefenseType { get; set; }
    public DateTime LaunchedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime ImpactTimeUtc { get; set; }
    public bool IsResolved { get; set; }
    public string? HangfireJobId { get; set; }
}

