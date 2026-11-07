using OGame.Domain.Enums;

namespace OGame.Domain.Entities;

public class Message
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid RecipientUserId { get; set; }
    public Guid? SenderUserId { get; set; }
    public MessageFolder Folder { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string ContentJson { get; set; } = "{}";
    public bool IsRead { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public User? RecipientUser { get; set; }
    public User? SenderUser { get; set; }
}

