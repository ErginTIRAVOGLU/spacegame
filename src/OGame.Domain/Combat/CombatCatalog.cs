using OGame.Domain.Enums;

namespace OGame.Domain.Combat;

public record UnitCombatStats(
    UnitType UnitType,
    double MetalCost,
    double CrystalCost,
    double DeuteriumCost,
    double StructuralIntegrity,
    double Shield,
    double WeaponPower,
    bool IsDefense)
{
    /// <summary>
    /// Base Hull points in OGame = StructuralIntegrity / 10.
    /// </summary>
    public double BaseHull => StructuralIntegrity / 10.0;
}

public static class CombatCatalog
{
    private static readonly Dictionary<UnitType, UnitCombatStats> StatsByUnit = new()
    {
        // Ships
        [UnitType.SmallCargo] = Create(UnitType.SmallCargo, 2000, 2000, 0, shield: 10, weapon: 5, isDefense: false),
        [UnitType.LargeCargo] = Create(UnitType.LargeCargo, 6000, 6000, 0, shield: 25, weapon: 5, isDefense: false),
        [UnitType.LightFighter] = Create(UnitType.LightFighter, 3000, 1000, 0, shield: 10, weapon: 50, isDefense: false),
        [UnitType.HeavyFighter] = Create(UnitType.HeavyFighter, 6000, 4000, 0, shield: 25, weapon: 150, isDefense: false),
        [UnitType.Cruiser] = Create(UnitType.Cruiser, 20_000, 7000, 2000, shield: 50, weapon: 400, isDefense: false),
        [UnitType.Battleship] = Create(UnitType.Battleship, 45_000, 15_000, 0, shield: 200, weapon: 1000, isDefense: false),
        [UnitType.ColonyShip] = Create(UnitType.ColonyShip, 10_000, 20_000, 10_000, shield: 100, weapon: 50, isDefense: false),
        [UnitType.Recycler] = Create(UnitType.Recycler, 10_000, 6000, 2000, shield: 10, weapon: 1, isDefense: false),
        [UnitType.EspionageProbe] = Create(UnitType.EspionageProbe, 0, 1000, 0, shield: 0.01, weapon: 0.01, isDefense: false),
        [UnitType.Bomber] = Create(UnitType.Bomber, 50_000, 25_000, 15_000, shield: 500, weapon: 1000, isDefense: false),
        [UnitType.SolarSatellite] = Create(UnitType.SolarSatellite, 0, 2000, 500, shield: 1, weapon: 1, isDefense: false),
        [UnitType.Destroyer] = Create(UnitType.Destroyer, 60_000, 50_000, 15_000, shield: 500, weapon: 2000, isDefense: false),
        [UnitType.Deathstar] = Create(UnitType.Deathstar, 5_000_000, 4_000_000, 1_000_000, shield: 50_000, weapon: 200_000, isDefense: false),
        [UnitType.Battlecruiser] = Create(UnitType.Battlecruiser, 30_000, 40_000, 15_000, shield: 400, weapon: 700, isDefense: false),
        [UnitType.Reaper] = Create(UnitType.Reaper, 85_000, 55_000, 20_000, shield: 700, weapon: 2800, isDefense: false),
        [UnitType.Pathfinder] = Create(UnitType.Pathfinder, 8000, 15_000, 8000, shield: 100, weapon: 200, isDefense: false),

        // Defenses
        [UnitType.RocketLauncher] = Create(UnitType.RocketLauncher, 2000, 0, 0, shield: 20, weapon: 80, isDefense: true),
        [UnitType.LightLaser] = Create(UnitType.LightLaser, 1500, 500, 0, shield: 25, weapon: 100, isDefense: true),
        [UnitType.HeavyLaser] = Create(UnitType.HeavyLaser, 6000, 2000, 0, shield: 100, weapon: 250, isDefense: true),
        [UnitType.GaussCannon] = Create(UnitType.GaussCannon, 20_000, 15_000, 2000, shield: 200, weapon: 1100, isDefense: true),
        [UnitType.IonCannon] = Create(UnitType.IonCannon, 2000, 6000, 0, shield: 500, weapon: 150, isDefense: true),
        [UnitType.PlasmaTurret] = Create(UnitType.PlasmaTurret, 50_000, 50_000, 30_000, shield: 300, weapon: 3000, isDefense: true),
        [UnitType.SmallShieldDome] = Create(UnitType.SmallShieldDome, 10_000, 10_000, 0, shield: 2000, weapon: 1, isDefense: true),
        [UnitType.LargeShieldDome] = Create(UnitType.LargeShieldDome, 50_000, 50_000, 0, shield: 10_000, weapon: 1, isDefense: true)
    };

    /// <summary>
    /// Rapidfire Table: Map of (AttackerUnit, DefenderUnit) -> RapidfireCount
    /// </summary>
    public static IReadOnlyDictionary<(UnitType AttackerUnit, UnitType DefenderUnit), int> RapidfireTable { get; } =
        new Dictionary<(UnitType, UnitType), int>
        {
            // Almost all combat ships have RF 5 against Espionage Probe & Solar Satellite
            [(UnitType.SmallCargo, UnitType.EspionageProbe)] = 5,
            [(UnitType.SmallCargo, UnitType.SolarSatellite)] = 5,
            [(UnitType.LargeCargo, UnitType.EspionageProbe)] = 5,
            [(UnitType.LargeCargo, UnitType.SolarSatellite)] = 5,
            [(UnitType.LightFighter, UnitType.EspionageProbe)] = 5,
            [(UnitType.LightFighter, UnitType.SolarSatellite)] = 5,
            [(UnitType.HeavyFighter, UnitType.EspionageProbe)] = 5,
            [(UnitType.HeavyFighter, UnitType.SolarSatellite)] = 5,
            [(UnitType.HeavyFighter, UnitType.SmallCargo)] = 3,
            [(UnitType.Cruiser, UnitType.EspionageProbe)] = 5,
            [(UnitType.Cruiser, UnitType.SolarSatellite)] = 5,
            [(UnitType.Cruiser, UnitType.LightFighter)] = 6,
            [(UnitType.Cruiser, UnitType.RocketLauncher)] = 10,
            [(UnitType.Battleship, UnitType.EspionageProbe)] = 5,
            [(UnitType.Battleship, UnitType.SolarSatellite)] = 5,
            [(UnitType.ColonyShip, UnitType.EspionageProbe)] = 5,
            [(UnitType.ColonyShip, UnitType.SolarSatellite)] = 5,
            [(UnitType.Recycler, UnitType.EspionageProbe)] = 5,
            [(UnitType.Recycler, UnitType.SolarSatellite)] = 5,
            [(UnitType.Bomber, UnitType.EspionageProbe)] = 5,
            [(UnitType.Bomber, UnitType.SolarSatellite)] = 5,
            [(UnitType.Bomber, UnitType.RocketLauncher)] = 20,
            [(UnitType.Bomber, UnitType.LightLaser)] = 20,
            [(UnitType.Bomber, UnitType.HeavyLaser)] = 10,
            [(UnitType.Bomber, UnitType.IonCannon)] = 10,
            [(UnitType.Destroyer, UnitType.EspionageProbe)] = 5,
            [(UnitType.Destroyer, UnitType.SolarSatellite)] = 5,
            [(UnitType.Destroyer, UnitType.LightLaser)] = 10,
            [(UnitType.Destroyer, UnitType.Battlecruiser)] = 2,
            [(UnitType.Battlecruiser, UnitType.EspionageProbe)] = 5,
            [(UnitType.Battlecruiser, UnitType.SolarSatellite)] = 5,
            [(UnitType.Battlecruiser, UnitType.SmallCargo)] = 3,
            [(UnitType.Battlecruiser, UnitType.LargeCargo)] = 3,
            [(UnitType.Battlecruiser, UnitType.HeavyFighter)] = 4,
            [(UnitType.Battlecruiser, UnitType.Cruiser)] = 4,
            [(UnitType.Battlecruiser, UnitType.Battleship)] = 7,
            [(UnitType.Deathstar, UnitType.EspionageProbe)] = 1250,
            [(UnitType.Deathstar, UnitType.SolarSatellite)] = 1250,
            [(UnitType.Deathstar, UnitType.SmallCargo)] = 250,
            [(UnitType.Deathstar, UnitType.LargeCargo)] = 250,
            [(UnitType.Deathstar, UnitType.LightFighter)] = 200,
            [(UnitType.Deathstar, UnitType.HeavyFighter)] = 100,
            [(UnitType.Deathstar, UnitType.Cruiser)] = 33,
            [(UnitType.Deathstar, UnitType.Battleship)] = 30,
            [(UnitType.Deathstar, UnitType.ColonyShip)] = 250,
            [(UnitType.Deathstar, UnitType.Recycler)] = 250,
            [(UnitType.Deathstar, UnitType.Bomber)] = 25,
            [(UnitType.Deathstar, UnitType.Destroyer)] = 5,
            [(UnitType.Deathstar, UnitType.Battlecruiser)] = 15,
            [(UnitType.Deathstar, UnitType.RocketLauncher)] = 200,
            [(UnitType.Deathstar, UnitType.LightLaser)] = 200,
            [(UnitType.Deathstar, UnitType.HeavyLaser)] = 100,
            [(UnitType.Deathstar, UnitType.GaussCannon)] = 50,
            [(UnitType.Deathstar, UnitType.IonCannon)] = 100,
            [(UnitType.Deathstar, UnitType.Reaper)] = 10,
            [(UnitType.Deathstar, UnitType.Pathfinder)] = 30,
            [(UnitType.Reaper, UnitType.EspionageProbe)] = 5,
            [(UnitType.Reaper, UnitType.SolarSatellite)] = 5,
            [(UnitType.Reaper, UnitType.Battleship)] = 7,
            [(UnitType.Reaper, UnitType.Bomber)] = 4,
            [(UnitType.Reaper, UnitType.Destroyer)] = 3,
            [(UnitType.Pathfinder, UnitType.EspionageProbe)] = 5,
            [(UnitType.Pathfinder, UnitType.SolarSatellite)] = 5,
            [(UnitType.Pathfinder, UnitType.LightFighter)] = 3,
            [(UnitType.Pathfinder, UnitType.HeavyFighter)] = 2,
            [(UnitType.Pathfinder, UnitType.Cruiser)] = 2
        };

    public static UnitCombatStats GetStats(UnitType unitType)
    {
        if (StatsByUnit.TryGetValue(unitType, out var stats))
        {
            return stats;
        }

        throw new ArgumentOutOfRangeException(nameof(unitType), $"Combat stats not defined for unit type {unitType}.");
    }

    public static int GetRapidfireCount(UnitType attacker, UnitType defender)
    {
        return RapidfireTable.TryGetValue((attacker, defender), out int rf) ? rf : 0;
    }

    private static UnitCombatStats Create(
        UnitType unitType,
        double metal,
        double crystal,
        double deuterium,
        double shield,
        double weapon,
        bool isDefense)
    {
        return new UnitCombatStats(
            UnitType: unitType,
            MetalCost: metal,
            CrystalCost: crystal,
            DeuteriumCost: deuterium,
            StructuralIntegrity: metal + crystal,
            Shield: shield,
            WeaponPower: weapon,
            IsDefense: isDefense);
    }
}

