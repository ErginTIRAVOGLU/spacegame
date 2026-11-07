using OGame.Domain.Enums;

namespace OGame.Domain.Entities;

public class FleetMission
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public Guid OriginPlanetId { get; set; }
    public int OriginGalaxy { get; set; }
    public int OriginSystem { get; set; }
    public int OriginSlot { get; set; }
    public CoordinateType OriginType { get; set; } = CoordinateType.Planet;

    public Guid? TargetPlanetId { get; set; }
    public int TargetGalaxy { get; set; }
    public int TargetSystem { get; set; }
    public int TargetSlot { get; set; }
    public CoordinateType TargetType { get; set; } = CoordinateType.Planet;

    public FleetMissionType MissionType { get; set; }
    public FleetMissionStatus Status { get; set; } = FleetMissionStatus.Outbound;
    public double SpeedFactor { get; set; } = 1.0;

    public Guid? AcsAttackGroupId { get; set; }
    public int HoldHours { get; set; }
    public DateTime? HoldUntilUtc { get; set; }

    public double MetalCargo { get; set; }
    public double CrystalCargo { get; set; }
    public double DeuteriumCargo { get; set; }
    public double FuelConsumed { get; set; }

    public DateTime DepartureUtc { get; set; }
    public DateTime ArrivalUtc { get; set; }
    public DateTime? ReturnUtc { get; set; }

    public string HangfireArrivalJobId { get; set; } = string.Empty;
    public string? HangfireReturnJobId { get; set; }

    public AcsAttackGroup? AcsAttackGroup { get; set; }
    public ICollection<FleetMissionShip> Ships { get; set; } = new List<FleetMissionShip>();
}

public class FleetMissionShip
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid FleetMissionId { get; set; }
    public UnitType UnitType { get; set; }
    public int Count { get; set; }

    public FleetMission? FleetMission { get; set; }
}
