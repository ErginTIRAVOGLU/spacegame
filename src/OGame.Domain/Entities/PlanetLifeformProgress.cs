namespace OGame.Domain.Entities;

public class PlanetLifeformProgress
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid PlanetId { get; set; }
    public string ActiveSpecies { get; set; } = "humans";
    public bool IsActive { get; set; } = true;
    public int SpeciesLevel { get; set; } = 1;
    public int CurrentXp { get; set; } = 150;
    public int MaxXp { get; set; } = 1000;
    public int TechBonusPercent { get; set; } = 0;
    public int ArtifactCount { get; set; } = 420;
    public int MaxArtifacts { get; set; } = 3600;

    public string BuildingLevelsJson { get; set; } = "{}";
    public string TechLevelsJson { get; set; } = "{}";
    public string SpeciesBuildingLevelsJson { get; set; } = "{}";
    public string SpeciesTechLevelsJson { get; set; } = "{}";
    public string SlotSpeciesJson { get; set; } = "{}";
    public string? ActiveQueueJson { get; set; }
    public string? ActiveTechQueueJson { get; set; }
    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    public Planet? Planet { get; set; }
}

