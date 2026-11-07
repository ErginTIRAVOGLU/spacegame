namespace OGame.Domain.Entities;

public class HighscoreSnapshot
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string? AllianceTag { get; set; }
    public long Points { get; set; }
    public long EconomyPoints { get; set; }
    public long ResearchPoints { get; set; }
    public long MilitaryPoints { get; set; }
    public int Rank { get; set; }
    public int? PreviousRank { get; set; }
    public int RankDelta { get; set; }
    public DateTime CalculatedAtUtc { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
}

