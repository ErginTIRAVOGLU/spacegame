namespace OGame.Domain.Entities;

public class Planet
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Name { get; set; } = "Homeworld";
    public int Galaxy { get; set; }
    public int System { get; set; }
    public int Slot { get; set; }
    public bool IsMoon { get; set; }
    public Guid? ParentPlanetId { get; set; }
    public double Metal { get; set; } = 500;
    public double Crystal { get; set; } = 500;
    public double Deuterium { get; set; } = 0;
    public DateTime LastResourceUpdateUtc { get; set; } = DateTime.UtcNow;
    public int TempMin { get; set; }
    public int TempMax { get; set; }
    public int Diameter { get; set; } = 12800;
    public int FieldsUsed { get; set; } = 0;
    public int MaxFields { get; set; } = 163;
    public bool IsProductionFrozen { get; set; }
    public bool IsCapital { get; set; }
    public bool IsDestroyedPlanet { get; set; }
    public DateTime? DestroyedAtUtc { get; set; }
    public DateTime? DestroyedPlanetExpiresAtUtc { get; set; }

    public User? User { get; set; }
    public ICollection<Building> Buildings { get; set; } = new List<Building>();
    public ICollection<BuildingQueueItem> BuildingQueue { get; set; } = new List<BuildingQueueItem>();
    public ICollection<ShipyardQueueItem> ShipyardQueue { get; set; } = new List<ShipyardQueueItem>();
    public ICollection<PlanetUnit> Units { get; set; } = new List<PlanetUnit>();
    public ICollection<PlanetActiveBooster> ActiveBoosters { get; set; } = new List<PlanetActiveBooster>();
}
