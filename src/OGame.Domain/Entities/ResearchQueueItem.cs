using OGame.Domain.Enums;

namespace OGame.Domain.Entities;

public class ResearchQueueItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public Guid OriginPlanetId { get; set; }
    public ResearchType ResearchType { get; set; }
    public int TargetLevel { get; set; }
    public DateTime StartTimeUtc { get; set; }
    public DateTime EndTimeUtc { get; set; }
    public string HangfireJobId { get; set; } = string.Empty;

    public User? User { get; set; }
    public Planet? OriginPlanet { get; set; }
}

