namespace OGame.Domain.Entities;

public class AdminLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid AdminUserId { get; set; }
    public string Action { get; set; } = string.Empty;
    public Guid? TargetUserId { get; set; }
    public string DetailsJson { get; set; } = "{}";
    public DateTime TimestampUtc { get; set; } = DateTime.UtcNow;
}

