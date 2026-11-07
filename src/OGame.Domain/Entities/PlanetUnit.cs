using OGame.Domain.Enums;

namespace OGame.Domain.Entities;

public class PlanetUnit
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid PlanetId { get; set; }
    public UnitType UnitType { get; set; }
    public int Count { get; set; }

    public Planet? Planet { get; set; }
}

