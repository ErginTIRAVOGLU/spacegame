namespace OGame.Domain.Entities;

public class EspionageReport
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TargetPlanetId { get; set; }
    public Guid ScannerUserId { get; set; }
    public int TierLevel { get; set; }
    public string DataJson { get; set; } = "{}";
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public Planet? TargetPlanet { get; set; }
    public User? ScannerUser { get; set; }
}

