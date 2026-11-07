namespace OGame.Domain.Entities;

public class UserActiveBuff
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string BuffType { get; set; } = string.Empty; // "ExpeditionSlots", "ExpeditionTurbo", "ExpeditionResource", "ScrapMerchantOffer"
    public double Value { get; set; }
    public DateTime ExpiresAtUtc { get; set; }
    public string ItemKey { get; set; } = string.Empty;
    public string Tier { get; set; } = "Bronze";
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
}

