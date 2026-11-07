namespace OGame.Domain.Entities;

public class UniverseSettingsRecord
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public double EconomySpeedMultiplier { get; set; } = 1.0;
    public double FleetSpeedMultiplier { get; set; } = 1.0;
    public double ResearchSpeedMultiplier { get; set; } = 1.0;
    public double DebrisRatio { get; set; } = 0.30;
    public bool DefenseToDebris { get; set; }
    public double DeutConsumptionFactor { get; set; } = 1.0;
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
    public Guid? UpdatedByAdminUserId { get; set; }
}

