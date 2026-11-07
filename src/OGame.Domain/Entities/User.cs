using OGame.Domain.Enums;

namespace OGame.Domain.Entities;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Player;
    public bool IsBanned { get; set; }
    public DateTime? BannedAtUtc { get; set; }
    public string? BanReason { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime LastLoginUtc { get; set; } = DateTime.UtcNow;
    public bool IsVacationMode { get; set; }
    public DateTime? VacationUntilUtc { get; set; }
    public string? AllianceTag { get; set; }
    public long TotalPoints { get; set; }
    public int DarkMatter { get; set; }
    public PlayerClass PlayerClass { get; set; } = PlayerClass.None;
    public long HonorPoints { get; set; }
    public long MilitaryPoints { get; set; }
    public int MilitaryRank { get; set; }
    public int HonorRank { get; set; }

    public ICollection<Planet> Planets { get; set; } = new List<Planet>();
    public ICollection<UserResearch> Researches { get; set; } = new List<UserResearch>();
    public ICollection<ResearchQueueItem> ResearchQueue { get; set; } = new List<ResearchQueueItem>();
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public ICollection<UserInventoryItem> InventoryItems { get; set; } = new List<UserInventoryItem>();
    public ICollection<UserActiveBuff> ActiveBuffs { get; set; } = new List<UserActiveBuff>();
    public ICollection<UserOfficer> Officers { get; set; } = new List<UserOfficer>();
}
