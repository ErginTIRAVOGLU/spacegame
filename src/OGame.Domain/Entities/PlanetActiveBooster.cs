namespace OGame.Domain.Entities;

public class PlanetActiveBooster
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid PlanetId { get; set; }
    public string ResourceType { get; set; } = "Metal"; // "Metal", "Crystal", "Deuterium"
    public double Multiplier { get; set; } = 0.10; // 0.10 = +10%
    public DateTime ExpiresAtUtc { get; set; }
    public string ItemKey { get; set; } = string.Empty;
    public string Tier { get; set; } = "Bronze";
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public Planet? Planet { get; set; }
}

