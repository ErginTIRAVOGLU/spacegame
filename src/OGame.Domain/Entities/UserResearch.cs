using OGame.Domain.Enums;

namespace OGame.Domain.Entities;

public class UserResearch
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public ResearchType ResearchType { get; set; }
    public int Level { get; set; }

    public User? User { get; set; }
}

