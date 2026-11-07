using OGame.Domain.Enums;

namespace OGame.Domain.Entities;

public class Building
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid PlanetId { get; set; }
    public BuildingType BuildingType { get; set; }
    public int Level { get; set; }

    public Planet? Planet { get; set; }
}

