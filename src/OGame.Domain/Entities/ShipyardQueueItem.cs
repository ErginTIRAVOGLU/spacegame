using OGame.Domain.Enums;

namespace OGame.Domain.Entities;

public class ShipyardQueueItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid PlanetId { get; set; }
    public UnitType UnitType { get; set; }
    public int TotalCount { get; set; }
    public int CompletedCount { get; set; }
    public double UnitDurationSeconds { get; set; }
    public DateTime BatchStartTimeUtc { get; set; }
    public DateTime NextUnitFinishUtc { get; set; }
    public string HangfireBatchJobId { get; set; } = string.Empty;

    public Planet? Planet { get; set; }
}

