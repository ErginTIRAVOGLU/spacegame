namespace OGame.Domain.Entities;

public class ChatMessage
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid SenderUserId { get; set; }
    public string SenderUsername { get; set; } = string.Empty;
    public Guid? RecipientUserId { get; set; }
    public string? Channel { get; set; } // "alliance", "global", or null for direct message
    public string MessageText { get; set; } = string.Empty;
    public DateTime SentAtUtc { get; set; } = DateTime.UtcNow;
}

