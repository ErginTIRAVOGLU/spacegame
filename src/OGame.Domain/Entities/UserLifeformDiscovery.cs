namespace OGame.Domain.Entities;

public class UserLifeformDiscovery
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string UnlockedSpeciesJson { get; set; } = "[\"humans\"]";
    public string ScoutedCoordinatesJson { get; set; } = "{}";
    public string MissionsJson { get; set; } = "[]";
    public int StoredFlights { get; set; } = 16;
    public DateTime LastRefillUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
}

