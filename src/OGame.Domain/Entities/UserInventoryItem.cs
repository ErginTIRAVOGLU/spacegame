namespace OGame.Domain.Entities;

public class UserInventoryItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string ItemKey { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty; // "construction", "field", "lifeform"
    public string Tier { get; set; } = string.Empty; // "Bronze", "Silver", "Gold", "Platinum"
    public double EffectValue { get; set; } // duration in seconds (speedups) or field count (expanders)
    public int Quantity { get; set; } = 1;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
}

