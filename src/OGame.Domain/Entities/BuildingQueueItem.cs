using OGame.Domain.Enums;

namespace OGame.Domain.Entities;

public class BuildingQueueItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid PlanetId { get; set; }
    public BuildingType BuildingType { get; set; }
    public int TargetLevel { get; set; }
    public DateTime StartTimeUtc { get; set; }
    public DateTime EndTimeUtc { get; set; }
    public string HangfireJobId { get; set; } = string.Empty;

    public Planet? Planet { get; set; }
}

