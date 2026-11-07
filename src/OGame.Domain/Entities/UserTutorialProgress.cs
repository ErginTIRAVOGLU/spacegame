namespace OGame.Domain.Entities;

public class UserTutorialProgress
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public int DirectiveId { get; set; } = 1;
    public int CurrentQuestStep { get; set; } = 1;
    public int SubStepBitmask { get; set; } = 0;
    public bool IsRewardClaimed { get; set; } = false;
    public bool IsDirectiveRewardClaimed { get; set; } = false;
    public DateTime? CompletedAtUtc { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    public User? User { get; set; }
}

