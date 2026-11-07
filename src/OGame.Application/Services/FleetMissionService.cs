using Microsoft.EntityFrameworkCore;
using OGame.Application.Common.Interfaces;
using OGame.Application.Interfaces;
using OGame.Domain.Combat;
using OGame.Domain.Entities;
using OGame.Domain.Enums;
using OGame.Domain.Services;

namespace OGame.Application.Services;

public class FleetMissionService(
    IApplicationDbContext dbContext,
    IResourceCalculationService resourceService,
    IShipyardService shipyardService,
    ICombatEngine combatEngine,
    IEspionageService espionageService,
    IMoonAndPhalanxService moonAndPhalanxService,
    IExpeditionEngine expeditionEngine,
    IInboxAndCombatReportService inboxService,
    IUniverseConfigService universeConfigService,
    IActivityService activityService,
    IJobScheduler jobScheduler,
    IDistributedLockService lockService) : IFleetMissionService
{
    public async Task<FleetMission> DispatchFleetAsync(
        FleetDispatchCommand command,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(command);

        if (command.Ships is null || command.Ships.Count == 0 || command.Ships.Values.All(c => c <= 0))
        {
            throw new InvalidOperationException("Cannot dispatch a fleet without any ships.");
        }

        var now = DateTime.UtcNow;

        // Ensure any completed shipyard units on the origin planet are credited before acquiring the dispatch lock
        await shipyardService.EvaluatePlanetShipyardQueueAsync(command.OriginPlanetId, now, cancellationToken);

        string lockKey = $"lock:planet:{command.OriginPlanetId}";
        await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

        var originPlanet = await dbContext.Planets
            .Include(p => p.User)
            .Include(p => p.Units)
            .FirstOrDefaultAsync(p => p.Id == command.OriginPlanetId && p.UserId == command.UserId, cancellationToken)
            ?? throw new InvalidOperationException($"Origin planet {command.OriginPlanetId} not found for user {command.UserId}.");

        if (originPlanet.User?.IsBanned == true)
        {
            throw new InvalidOperationException("Cannot dispatch fleets while account is banned.");
        }

        if (originPlanet.User?.IsVacationMode == true || originPlanet.IsProductionFrozen)
        {
            throw new InvalidOperationException("Cannot dispatch fleets while in Vacation Mode.");
        }

        resourceService.ApplyLazyUpdate(originPlanet, now);

        // Verify ship availability
        foreach (var (unitType, requestedCount) in command.Ships)
        {
            if (requestedCount <= 0) continue;

            var stationed = originPlanet.Units.FirstOrDefault(u => u.UnitType == unitType);
            if (stationed is null || stationed.Count < requestedCount)
            {
                throw new InvalidOperationException($"Insufficient ships of type {unitType} on origin planet.");
            }
        }

        var universeConfig = await universeConfigService.GetConfigAsync(cancellationToken);
        double fleetSpeedMultiplier = Math.Max(0.1, universeConfig.FleetSpeedMultiplier);
        double deutFactor = Math.Max(0.0, universeConfig.DeutConsumptionFactor);

        int distance = FleetNavigationFormulas.CalculateSpatialDistance(
            originPlanet.Galaxy, originPlanet.System, originPlanet.Slot,
            command.TargetGalaxy, command.TargetSystem, command.TargetSlot);

        double slowestSpeed = FleetNavigationFormulas.GetSlowestShipSpeed(
            command.Ships,
            originPlanet.User?.PlayerClass ?? PlayerClass.None);
        double baseDurationSeconds = FleetNavigationFormulas.CalculateFlightDurationSeconds(
            distance,
            slowestSpeed,
            command.SpeedFactor);
        double durationSeconds = Math.Max(1.0, Math.Round(baseDurationSeconds / fleetSpeedMultiplier));

        double fuelRequired = Math.Ceiling(FleetNavigationFormulas.CalculateFuelConsumption(command.Ships, distance) * deutFactor);
        int holdHours = 0;

        if (command.MissionType == FleetMissionType.AcsDefend)
        {
            if (command.HoldHours < AcsFormulas.MinHoldHours || command.HoldHours > AcsFormulas.MaxHoldHours)
            {
                throw new InvalidOperationException(
                    $"ACS Defend missions must hold in orbit between {AcsFormulas.MinHoldHours} and {AcsFormulas.MaxHoldHours} hours.");
            }

            holdHours = command.HoldHours;
            fuelRequired += AcsFormulas.CalculateHoldingDeuteriumConsumption(command.Ships, holdHours);
        }
        else if (command.MissionType == FleetMissionType.Expedition)
        {
            if (command.TargetSlot != ExpeditionFormulas.ExpeditionSlotNumber)
            {
                throw new InvalidOperationException("Expedition missions must target coordinate slot 16.");
            }

            int astroLevel = await dbContext.UserResearches
                .AsNoTracking()
                .Where(r => r.UserId == command.UserId && r.ResearchType == ResearchType.Astrophysics)
                .Select(r => r.Level)
                .FirstOrDefaultAsync(cancellationToken);

            int maxExpeditions = ExpeditionFormulas.CalculateMaxConcurrentExpeditions(astroLevel);
            if (maxExpeditions <= 0)
            {
                throw new InvalidOperationException("Astrophysics Level 1+ is required to dispatch expeditions.");
            }

            int activeExpeditions = await dbContext.FleetMissions
                .CountAsync(m =>
                    m.UserId == command.UserId &&
                    m.MissionType == FleetMissionType.Expedition &&
                    m.Status != FleetMissionStatus.Completed &&
                    m.Status != FleetMissionStatus.Destroyed &&
                    m.Status != FleetMissionStatus.Recalled,
                    cancellationToken);

            if (activeExpeditions >= maxExpeditions)
            {
                throw new InvalidOperationException(
                    $"Maximum concurrent expeditions ({maxExpeditions}) reached for Astrophysics Level {astroLevel}.");
            }

            holdHours = Math.Clamp(command.HoldHours <= 0 ? 1 : command.HoldHours, 1, Math.Max(1, astroLevel));
            fuelRequired += AcsFormulas.CalculateHoldingDeuteriumConsumption(command.Ships, holdHours);
        }
        else if (command.MissionType == FleetMissionType.Colonize)
        {
            if (command.TargetSlot < 1 || command.TargetSlot > 15)
            {
                throw new InvalidOperationException("Colonize missions must target an orbital slot between 1 and 15.");
            }

            if (!command.Ships.TryGetValue(UnitType.ColonyShip, out int colonyShipCount) || colonyShipCount <= 0)
            {
                throw new InvalidOperationException("Colonize missions require at least 1 Colony Ship.");
            }
        }

        double totalCargoCapacity = FleetNavigationFormulas.CalculateTotalCargoCapacity(command.Ships);
        double requestedCargo = Math.Max(0, command.MetalCargo) +
                                Math.Max(0, command.CrystalCargo) +
                                Math.Max(0, command.DeuteriumCargo);

        // Probe flight to target coordinates: Espionage missions can carry resource cargo when cargo ships are included (hybrid fleet)
        if (command.MissionType == FleetMissionType.Espionage)
        {
            bool hasOnlyProbes = command.Ships.All(s => s.Key == UnitType.EspionageProbe || s.Value == 0);
            if (hasOnlyProbes && requestedCargo > 0)
            {
                throw new InvalidOperationException("Espionage probes cannot carry resource cargo alone.");
            }
        }

        if (requestedCargo > totalCargoCapacity)
        {
            throw new InvalidOperationException(
                $"Cargo ({requestedCargo}) exceeds total fleet cargo capacity ({totalCargoCapacity}).");
        }

        if (originPlanet.Metal < command.MetalCargo ||
            originPlanet.Crystal < command.CrystalCargo ||
            originPlanet.Deuterium < (command.DeuteriumCargo + fuelRequired))
        {
            throw new InvalidOperationException("Insufficient resources or Deuterium fuel on origin planet.");
        }

        // Deduct cargo and fuel
        originPlanet.Metal -= command.MetalCargo;
        originPlanet.Crystal -= command.CrystalCargo;
        originPlanet.Deuterium -= (command.DeuteriumCargo + fuelRequired);

        // Deduct dispatched ships from stationed units
        foreach (var (unitType, requestedCount) in command.Ships)
        {
            if (requestedCount <= 0) continue;
            var stationed = originPlanet.Units.First(u => u.UnitType == unitType);
            stationed.Count -= requestedCount;
        }

        var targetPlanet = await dbContext.Planets
            .AsNoTracking()
            .Include(p => p.User)
            .FirstOrDefaultAsync(p =>
                p.Galaxy == command.TargetGalaxy &&
                p.System == command.TargetSystem &&
                p.Slot == command.TargetSlot &&
                p.IsMoon == (command.TargetType == CoordinateType.Moon),
                cancellationToken);

        if (targetPlanet is not null &&
            (targetPlanet.User?.IsVacationMode == true || targetPlanet.IsProductionFrozen) &&
            (command.MissionType == FleetMissionType.Attack ||
             command.MissionType == FleetMissionType.AcsAttack ||
             command.MissionType == FleetMissionType.AcsDefend ||
             command.MissionType == FleetMissionType.Espionage ||
             command.MissionType == FleetMissionType.MoonDestruction))
        {
            throw new InvalidOperationException("Target player is in Vacation Mode and cannot be targeted by attacks, espionage, or ACS missions.");
        }

        // Enforce Noob Protection & Bashing Rule on hostile/espionage missions
        if (targetPlanet is not null &&
            targetPlanet.UserId != command.UserId &&
            (command.MissionType == FleetMissionType.Attack ||
             command.MissionType == FleetMissionType.AcsAttack ||
             command.MissionType == FleetMissionType.Espionage ||
             command.MissionType == FleetMissionType.MoonDestruction))
        {
            if (originPlanet.User is not null &&
                targetPlanet.User is not null &&
                MissileAndUniverseFormulas.IsBlockedByNoobProtection(
                    originPlanet.User.TotalPoints,
                    targetPlanet.User.TotalPoints,
                    targetPlanet.User.LastLoginUtc,
                    now))
            {
                throw new InvalidOperationException("Target player is protected by Noob Protection (< 500,000 points and > 5x point difference).");
            }

            if (command.MissionType == FleetMissionType.Attack ||
                command.MissionType == FleetMissionType.AcsAttack ||
                command.MissionType == FleetMissionType.MoonDestruction)
            {
                var rollingWindowStartUtc = now.AddHours(-24);
                int attacksInLast24Hours = await dbContext.FleetMissions
                    .CountAsync(m =>
                        m.UserId == command.UserId &&
                        m.TargetGalaxy == command.TargetGalaxy &&
                        m.TargetSystem == command.TargetSystem &&
                        m.TargetSlot == command.TargetSlot &&
                        m.TargetType == command.TargetType &&
                        (m.MissionType == FleetMissionType.Attack ||
                         m.MissionType == FleetMissionType.AcsAttack ||
                         m.MissionType == FleetMissionType.MoonDestruction) &&
                        m.Status != FleetMissionStatus.Recalled &&
                        m.DepartureUtc >= rollingWindowStartUtc,
                        cancellationToken);

                if (MissileAndUniverseFormulas.IsBlockedByBashingRule(attacksInLast24Hours))
                {
                    throw new InvalidOperationException(
                        $"Bashing Rule violation: Maximum of {MissileAndUniverseFormulas.MaxAttacksPerPlanetPer24Hours} attacks per 24-hour rolling window against this coordinate reached.");
                }
            }
        }

        var arrivalUtc = now.AddSeconds(durationSeconds);
        DateTime? holdUntilUtc = holdHours > 0 ? arrivalUtc.AddHours(holdHours) : null;
        var returnUtc = (holdUntilUtc ?? arrivalUtc).AddSeconds(durationSeconds);

        var originType = originPlanet.IsMoon ? CoordinateType.Moon : CoordinateType.Planet;

        var mission = new FleetMission
        {
            Id = Guid.NewGuid(),
            UserId = command.UserId,
            OriginPlanetId = originPlanet.Id,
            OriginGalaxy = originPlanet.Galaxy,
            OriginSystem = originPlanet.System,
            OriginSlot = originPlanet.Slot,
            OriginType = originType,
            TargetPlanetId = targetPlanet?.Id,
            TargetGalaxy = command.TargetGalaxy,
            TargetSystem = command.TargetSystem,
            TargetSlot = command.TargetSlot,
            TargetType = command.TargetType,
            MissionType = command.MissionType,
            Status = FleetMissionStatus.Outbound,
            SpeedFactor = command.SpeedFactor,
            AcsAttackGroupId = command.AcsAttackGroupId,
            HoldHours = holdHours,
            HoldUntilUtc = holdUntilUtc,
            MetalCargo = command.MetalCargo,
            CrystalCargo = command.CrystalCargo,
            DeuteriumCargo = command.DeuteriumCargo,
            FuelConsumed = fuelRequired,
            DepartureUtc = now,
            ArrivalUtc = arrivalUtc,
            ReturnUtc = returnUtc,
            Ships = command.Ships
                .Where(kv => kv.Value > 0)
                .Select(kv => new FleetMissionShip
                {
                    Id = Guid.NewGuid(),
                    UnitType = kv.Key,
                    Count = kv.Value
                })
                .ToList()
        };

        string jobId = jobScheduler.ScheduleFleetArrival(
            mission.Id,
            new DateTimeOffset(mission.ArrivalUtc, TimeSpan.Zero));

        mission.HangfireArrivalJobId = jobId;

        dbContext.FleetMissions.Add(mission);
        await dbContext.SaveChangesAsync(cancellationToken);

        // Update activity on origin planet: galaxy:activity:{originCoords}
        await activityService.RecordActivityAsync(
            originPlanet.Galaxy,
            originPlanet.System,
            originPlanet.Slot,
            originType,
            new DateTimeOffset(now, TimeSpan.Zero),
            cancellationToken);

        return mission;
    }

    public async Task<FleetMissionArrivalContext?> GetMissionArrivalContextAsync(
        Guid fleetMissionId,
        CancellationToken cancellationToken = default)
    {
        var mission = await dbContext.FleetMissions
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.Id == fleetMissionId, cancellationToken);

        if (mission is null)
        {
            return null;
        }

        return new FleetMissionArrivalContext(
            FleetMissionId: mission.Id,
            OriginPlanetId: mission.OriginPlanetId,
            OriginGalaxy: mission.OriginGalaxy,
            OriginSystem: mission.OriginSystem,
            OriginSlot: mission.OriginSlot,
            OriginType: mission.OriginType,
            TargetPlanetId: mission.TargetPlanetId,
            TargetGalaxy: mission.TargetGalaxy,
            TargetSystem: mission.TargetSystem,
            TargetSlot: mission.TargetSlot,
            TargetType: mission.TargetType,
            MissionType: mission.MissionType,
            ReturnArrivalUtc: mission.ReturnUtc.HasValue
                ? new DateTimeOffset(mission.ReturnUtc.Value, TimeSpan.Zero)
                : null);
    }

    public async Task<FleetMissionArrivalResolution> EvaluateMissionArrivalAsync(
        Guid fleetMissionId,
        CancellationToken cancellationToken = default)
    {
        var mission = await dbContext.FleetMissions
            .Include(m => m.Ships)
            .FirstOrDefaultAsync(m => m.Id == fleetMissionId, cancellationToken);

        if (mission is null || mission.Status != FleetMissionStatus.Outbound)
        {
            return new FleetMissionArrivalResolution(
                FleetMissionId: fleetMissionId,
                MissionType: mission?.MissionType ?? FleetMissionType.Transport,
                RequiresReturnTrip: false,
                ReturnTimeUtc: null);
        }

        var now = DateTime.UtcNow;
        var flightDuration = Math.Max(1.0, (mission.ArrivalUtc - mission.DepartureUtc).TotalSeconds);
        var returnUtc = now.AddSeconds(flightDuration);

        // Update activity on target coordinate: galaxy:activity:{targetCoords}
        await activityService.RecordActivityAsync(
            mission.TargetGalaxy,
            mission.TargetSystem,
            mission.TargetSlot,
            mission.TargetType,
            new DateTimeOffset(now, TimeSpan.Zero),
            cancellationToken);

        bool requiresReturn = true;

        switch (mission.MissionType)
        {
            case FleetMissionType.Transport:
                await ResolveTransportAsync(mission, now, cancellationToken);
                break;

            case FleetMissionType.Deploy:
                requiresReturn = !(await ResolveDeployAsync(mission, now, cancellationToken));
                break;

            case FleetMissionType.AcsDefend:
                mission.Status = FleetMissionStatus.Holding;
                var holdEndUtc = now.AddHours(Math.Clamp(mission.HoldHours, AcsFormulas.MinHoldHours, AcsFormulas.MaxHoldHours));
                mission.HoldUntilUtc = holdEndUtc;
                returnUtc = holdEndUtc.AddSeconds(flightDuration);
                mission.ReturnUtc = returnUtc;
                await dbContext.SaveChangesAsync(cancellationToken);

                return new FleetMissionArrivalResolution(
                    FleetMissionId: mission.Id,
                    MissionType: mission.MissionType,
                    RequiresReturnTrip: true,
                    ReturnTimeUtc: new DateTimeOffset(returnUtc, TimeSpan.Zero));

            case FleetMissionType.Attack:
            case FleetMissionType.AcsAttack:
                requiresReturn = await ResolveAttackAsync(mission, now, cancellationToken);
                break;

            case FleetMissionType.Espionage:
                requiresReturn = await ResolveEspionageAsync(mission, cancellationToken);
                break;

            case FleetMissionType.Recycle:
                await ResolveRecycleAsync(mission, now, cancellationToken);
                break;

            case FleetMissionType.Colonize:
                requiresReturn = await ResolveColonizeAsync(mission, now, cancellationToken);
                break;

            case FleetMissionType.MoonDestruction:
                requiresReturn = await ResolveMoonDestructionAsync(mission, now, cancellationToken);
                break;

            case FleetMissionType.Expedition:
                var expResolution = await ResolveExpeditionMissionAsync(mission, now, flightDuration, cancellationToken);
                requiresReturn = expResolution.RequiresReturn;
                returnUtc = expResolution.ReturnUtc;
                break;
        }

        if (requiresReturn && mission.Ships.Any(s => s.Count > 0))
        {
            mission.Status = FleetMissionStatus.Returning;
            mission.ReturnUtc = returnUtc;
            await dbContext.SaveChangesAsync(cancellationToken);

            return new FleetMissionArrivalResolution(
                FleetMissionId: mission.Id,
                MissionType: mission.MissionType,
                RequiresReturnTrip: true,
                ReturnTimeUtc: new DateTimeOffset(returnUtc, TimeSpan.Zero));
        }

        mission.Status = mission.Ships.Any(s => s.Count > 0)
            ? FleetMissionStatus.Completed
            : FleetMissionStatus.Destroyed;

        await dbContext.SaveChangesAsync(cancellationToken);

        return new FleetMissionArrivalResolution(
            FleetMissionId: mission.Id,
            MissionType: mission.MissionType,
            RequiresReturnTrip: false,
            ReturnTimeUtc: null);
    }

    public async Task CompleteFleetReturnAsync(
        Guid fleetMissionId,
        CancellationToken cancellationToken = default)
    {
        var mission = await dbContext.FleetMissions
            .Include(m => m.Ships)
            .FirstOrDefaultAsync(m => m.Id == fleetMissionId, cancellationToken);

        if (mission is null || mission.Status == FleetMissionStatus.Completed)
        {
            return;
        }

        var originPlanet = await dbContext.Planets
            .Include(p => p.Units)
            .FirstOrDefaultAsync(p => p.Id == mission.OriginPlanetId, cancellationToken);

        var now = DateTime.UtcNow;

        if (originPlanet is not null)
        {
            resourceService.ApplyLazyUpdate(originPlanet, now);

            originPlanet.Metal += mission.MetalCargo;
            originPlanet.Crystal += mission.CrystalCargo;
            originPlanet.Deuterium += mission.DeuteriumCargo;

            foreach (var ship in mission.Ships)
            {
                if (ship.Count <= 0) continue;

                var stationed = originPlanet.Units.FirstOrDefault(u => u.UnitType == ship.UnitType);
                if (stationed is null)
                {
                    stationed = new PlanetUnit
                    {
                        Id = Guid.NewGuid(),
                        PlanetId = originPlanet.Id,
                        UnitType = ship.UnitType,
                        Count = ship.Count
                    };
                    originPlanet.Units.Add(stationed);
                    dbContext.PlanetUnits.Add(stationed);
                }
                else
                {
                    stationed.Count += ship.Count;
                }
            }
        }

        mission.MetalCargo = 0;
        mission.CrystalCargo = 0;
        mission.DeuteriumCargo = 0;
        mission.Status = FleetMissionStatus.Completed;

        await dbContext.SaveChangesAsync(cancellationToken);

        // Update origin activity
        await activityService.RecordActivityAsync(
            mission.OriginGalaxy,
            mission.OriginSystem,
            mission.OriginSlot,
            mission.OriginType,
            new DateTimeOffset(now, TimeSpan.Zero),
            cancellationToken);
    }

    public async Task<FleetMission> RecallFleetAsync(
        Guid fleetMissionId,
        Guid? userId = null,
        CancellationToken cancellationToken = default)
    {
        var mission = await dbContext.FleetMissions
            .Include(m => m.Ships)
            .FirstOrDefaultAsync(m => m.Id == fleetMissionId, cancellationToken)
            ?? throw new InvalidOperationException($"Fleet mission {fleetMissionId} not found.");

        if (userId.HasValue && mission.UserId != userId.Value)
        {
            throw new InvalidOperationException("You do not have permission to recall this fleet mission.");
        }

        if (mission.Status != FleetMissionStatus.Outbound && mission.Status != FleetMissionStatus.Holding)
        {
            throw new InvalidOperationException($"Fleet mission cannot be recalled from status {mission.Status}.");
        }

        // Cancel the arrival Hangfire job if present
        if (!string.IsNullOrEmpty(mission.HangfireArrivalJobId))
        {
            jobScheduler.CancelScheduledJob(mission.HangfireArrivalJobId);
            mission.HangfireArrivalJobId = string.Empty;
        }

        var now = DateTime.UtcNow;
        // Calculate elapsed flight time from departure to recall
        var elapsed = now > mission.DepartureUtc ? now - mission.DepartureUtc : TimeSpan.Zero;
        var returnTime = now.Add(elapsed);

        mission.Status = FleetMissionStatus.Recalled;
        mission.ReturnUtc = returnTime;

        string returnJobId = jobScheduler.ScheduleFleetReturn(mission.Id, new DateTimeOffset(returnTime, TimeSpan.Zero));
        mission.HangfireReturnJobId = returnJobId;

        await dbContext.SaveChangesAsync(cancellationToken);

        return mission;
    }

    private async Task ResolveTransportAsync(FleetMission mission, DateTime now, CancellationToken cancellationToken)
    {
        if (!mission.TargetPlanetId.HasValue)
        {
            return;
        }

        var targetPlanet = await dbContext.Planets
            .FirstOrDefaultAsync(p => p.Id == mission.TargetPlanetId.Value, cancellationToken);

        if (targetPlanet is null)
        {
            return;
        }

        resourceService.ApplyLazyUpdate(targetPlanet, now);
        targetPlanet.Metal += mission.MetalCargo;
        targetPlanet.Crystal += mission.CrystalCargo;
        targetPlanet.Deuterium += mission.DeuteriumCargo;

        mission.MetalCargo = 0;
        mission.CrystalCargo = 0;
        mission.DeuteriumCargo = 0;
    }

    private async Task<bool> ResolveDeployAsync(FleetMission mission, DateTime now, CancellationToken cancellationToken)
    {
        if (!mission.TargetPlanetId.HasValue)
        {
            return false;
        }

        var targetPlanet = await dbContext.Planets
            .Include(p => p.Units)
            .FirstOrDefaultAsync(p => p.Id == mission.TargetPlanetId.Value, cancellationToken);

        if (targetPlanet is null)
        {
            return false;
        }

        resourceService.ApplyLazyUpdate(targetPlanet, now);
        targetPlanet.Metal += mission.MetalCargo;
        targetPlanet.Crystal += mission.CrystalCargo;
        targetPlanet.Deuterium += mission.DeuteriumCargo;

        foreach (var ship in mission.Ships)
        {
            if (ship.Count <= 0) continue;
            var stationed = targetPlanet.Units.FirstOrDefault(u => u.UnitType == ship.UnitType);
            if (stationed is null)
            {
                stationed = new PlanetUnit
                {
                    Id = Guid.NewGuid(),
                    PlanetId = targetPlanet.Id,
                    UnitType = ship.UnitType,
                    Count = ship.Count
                };
                targetPlanet.Units.Add(stationed);
                dbContext.PlanetUnits.Add(stationed);
            }
            else
            {
                stationed.Count += ship.Count;
            }
        }

        mission.MetalCargo = 0;
        mission.CrystalCargo = 0;
        mission.DeuteriumCargo = 0;
        return true;
    }

    private async Task<bool> ResolveAttackAsync(FleetMission mission, DateTime now, CancellationToken cancellationToken)
    {
        if (!mission.TargetPlanetId.HasValue)
        {
            return true;
        }

        // If part of an ACS Attack Group that was already resolved by an earlier sibling job in the same second, just return surviving status
        AcsAttackGroup? acsGroup = null;
        List<FleetMission> attackingFleets = [mission];

        if (mission.AcsAttackGroupId.HasValue)
        {
            acsGroup = await dbContext.AcsAttackGroups
                .FirstOrDefaultAsync(g => g.Id == mission.AcsAttackGroupId.Value, cancellationToken);

            if (acsGroup is { IsResolved: true })
            {
                return mission.Ships.Any(s => s.Count > 0);
            }

            attackingFleets = await dbContext.FleetMissions
                .Include(m => m.Ships)
                .Where(m => m.AcsAttackGroupId == mission.AcsAttackGroupId.Value && m.Status == FleetMissionStatus.Outbound)
                .ToListAsync(cancellationToken);

            if (attackingFleets.Count == 0)
            {
                attackingFleets = [mission];
            }
        }

        var targetPlanet = await dbContext.Planets
            .Include(p => p.Units)
            .FirstOrDefaultAsync(p => p.Id == mission.TargetPlanetId.Value, cancellationToken);

        if (targetPlanet is null)
        {
            return true;
        }

        resourceService.ApplyLazyUpdate(targetPlanet, now);

        // Gather all friendly holding fleets (ACS Defend) currently in orbit of the target planet
        var holdingDefenderFleets = await dbContext.FleetMissions
            .Include(m => m.Ships)
            .Where(m =>
                m.TargetPlanetId == targetPlanet.Id &&
                m.MissionType == FleetMissionType.AcsDefend &&
                m.Status == FleetMissionStatus.Holding &&
                (!m.HoldUntilUtc.HasValue || m.HoldUntilUtc.Value >= now))
            .ToListAsync(cancellationToken);

        // Build unified attacking force
        var attackerParticipantInitial = attackingFleets
            .Select(f => (IReadOnlyDictionary<UnitType, int>)f.Ships.Where(s => s.Count > 0).ToDictionary(s => s.UnitType, s => s.Count))
            .ToList();

        var unifiedAttackerUnits = new Dictionary<UnitType, int>();
        foreach (var dict in attackerParticipantInitial)
        {
            foreach (var (uType, cnt) in dict)
            {
                unifiedAttackerUnits[uType] = (unifiedAttackerUnits.TryGetValue(uType, out int existing) ? existing : 0) + cnt;
            }
        }

        // Build unified defending force (planet units + holding ACS Defend fleets)
        var planetInitialUnits = targetPlanet.Units
            .Where(u => u.Count > 0)
            .ToDictionary(u => u.UnitType, u => u.Count);

        var defenderParticipantInitial = new List<IReadOnlyDictionary<UnitType, int>> { planetInitialUnits };
        defenderParticipantInitial.AddRange(
            holdingDefenderFleets.Select(f => (IReadOnlyDictionary<UnitType, int>)f.Ships.Where(s => s.Count > 0).ToDictionary(s => s.UnitType, s => s.Count)));

        var unifiedDefenderUnits = new Dictionary<UnitType, int>();
        foreach (var dict in defenderParticipantInitial)
        {
            foreach (var (uType, cnt) in dict)
            {
                unifiedDefenderUnits[uType] = (unifiedDefenderUnits.TryGetValue(uType, out int existing) ? existing : 0) + cnt;
            }
        }

        var attackerUser = await dbContext.Users
            .FirstOrDefaultAsync(u => u.Id == mission.UserId, cancellationToken);

        var defenderUser = await dbContext.Users
            .Include(u => u.Officers)
            .FirstOrDefaultAsync(u => u.Id == targetPlanet.UserId, cancellationToken);

        bool isSameAlliance = !string.IsNullOrWhiteSpace(attackerUser?.AllianceTag) &&
                              attackerUser.AllianceTag == defenderUser?.AllianceTag;
        bool isDefenderInactive = defenderUser != null && (now - defenderUser.LastLoginUtc).TotalDays >= 7;

        var defenderHonorRank = HonorAndRetreatFormulas.DetermineHonorRank(
            defenderUser?.HonorPoints ?? 0,
            defenderUser?.HonorRank ?? 500);

        FightHonorableStatus fightStatus;
        if (mission.AcsAttackGroupId.HasValue)
        {
            long totalAttackerMil = attackerUser?.MilitaryPoints ?? 0;
            long totalDefenderMil = defenderUser?.MilitaryPoints ?? 0;
            bool defenderHasBandit = HonorAndRetreatFormulas.IsBandit(defenderHonorRank);
            fightStatus = HonorAndRetreatFormulas.EvaluateAcsFightHonorableStatus(
                totalAttackerMil,
                totalDefenderMil,
                defenderHasBandit,
                isDefenderInactive || isSameAlliance);
        }
        else
        {
            fightStatus = HonorAndRetreatFormulas.Evaluate1v1FightHonorableStatus(
                attackerUser?.MilitaryPoints ?? 0,
                attackerUser?.MilitaryRank ?? 1,
                defenderUser?.MilitaryPoints ?? 0,
                defenderUser?.MilitaryRank ?? 1,
                defenderHonorRank,
                isSameAlliance,
                isFriend: false,
                isDefenderInactive: isDefenderInactive);
        }

        // Tactical Retreat Evaluation
        bool hasAdmiral = defenderUser?.Officers.Any(o => o.Type == OfficerType.FleetAdmiral && o.ExpiresAtUtc > now) ?? false;
        var retreatEval = HonorAndRetreatFormulas.EvaluateTacticalRetreat(
            defenderTotalPoints: defenderUser?.TotalPoints ?? 0,
            status: fightStatus,
            defenderHonorRank: defenderHonorRank,
            attackerUnits: unifiedAttackerUnits,
            defenderUnits: planetInitialUnits,
            availablePlanetDeuterium: targetPlanet.Deuterium,
            hasAdmiralOfficer: hasAdmiral,
            fleetRetreatRatio3To1Enabled: false,
            isAcsDefendFleet: false);

        if (retreatEval.Triggered)
        {
            targetPlanet.Deuterium = Math.Max(0, targetPlanet.Deuterium - retreatEval.RequiredDeuteriumFuel);

            defenderParticipantInitial[0] = retreatEval.RemainingUnitsInBattle;
            unifiedDefenderUnits.Clear();
            foreach (var dict in defenderParticipantInitial)
            {
                foreach (var (uType, cnt) in dict)
                {
                    unifiedDefenderUnits[uType] = (unifiedDefenderUnits.TryGetValue(uType, out int existing) ? existing : 0) + cnt;
                }
            }
        }

        var attackerResearches = await dbContext.UserResearches
            .AsNoTracking()
            .Where(r => r.UserId == mission.UserId)
            .ToListAsync(cancellationToken);

        var defenderResearches = await dbContext.UserResearches
            .AsNoTracking()
            .Where(r => r.UserId == targetPlanet.UserId)
            .ToListAsync(cancellationToken);

        var attackerTech = new CombatTechLevels(
            WeaponsLevel: attackerResearches.FirstOrDefault(r => r.ResearchType == ResearchType.WeaponsTechnology)?.Level ?? 0,
            ShieldingLevel: attackerResearches.FirstOrDefault(r => r.ResearchType == ResearchType.ShieldingTechnology)?.Level ?? 0,
            ArmourLevel: attackerResearches.FirstOrDefault(r => r.ResearchType == ResearchType.ArmourTechnology)?.Level ?? 0);

        var defenderTech = new CombatTechLevels(
            WeaponsLevel: defenderResearches.FirstOrDefault(r => r.ResearchType == ResearchType.WeaponsTechnology)?.Level ?? 0,
            ShieldingLevel: defenderResearches.FirstOrDefault(r => r.ResearchType == ResearchType.ShieldingTechnology)?.Level ?? 0,
            ArmourLevel: defenderResearches.FirstOrDefault(r => r.ResearchType == ResearchType.ArmourTechnology)?.Level ?? 0);

        var attackerInput = new CombatFleetInput(unifiedAttackerUnits, attackerTech);
        var defenderInput = new CombatFleetInput(unifiedDefenderUnits, defenderTech);

        var combatResult = combatEngine.SimulateCombat(attackerInput, defenderInput);

        // Proportionally distribute surviving attacker ships across all participating attacking fleets
        var distributedAttackers = AcsFormulas.DistributeSurvivingUnitsProportionally(
            attackerParticipantInitial,
            combatResult.AttackerRemainingUnits);

        for (int i = 0; i < attackingFleets.Count; i++)
        {
            var fleet = attackingFleets[i];
            var survivingForFleet = distributedAttackers[i];
            foreach (var ship in fleet.Ships)
            {
                ship.Count = survivingForFleet.TryGetValue(ship.UnitType, out int rem) ? rem : 0;
            }

            if (fleet.Id != mission.Id)
            {
                var siblingDuration = Math.Max(1.0, (fleet.ArrivalUtc - fleet.DepartureUtc).TotalSeconds);
                if (fleet.Ships.Any(s => s.Count > 0))
                {
                    fleet.Status = FleetMissionStatus.Returning;
                    fleet.ReturnUtc = now.AddSeconds(siblingDuration);
                }
                else
                {
                    fleet.Status = FleetMissionStatus.Destroyed;
                }
            }
        }

        if (acsGroup is not null)
        {
            acsGroup.IsResolved = true;
        }

        // Proportionally distribute surviving defender units across planet and holding ACS Defend fleets
        var distributedDefenders = AcsFormulas.DistributeSurvivingUnitsProportionally(
            defenderParticipantInitial,
            combatResult.DefenderRemainingUnits);

        var repairedDefenses = combatResult.DefenderRepairedDefenses ?? new Dictionary<UnitType, int>();
        var planetSurviving = distributedDefenders[0];
        foreach (var unit in targetPlanet.Units)
        {
            int retreatedCount = retreatEval.RetreatingUnits.TryGetValue(unit.UnitType, out int ret) ? ret : 0;
            int surviving = planetSurviving.TryGetValue(unit.UnitType, out int rem) ? rem : 0;
            int repaired = repairedDefenses.TryGetValue(unit.UnitType, out int rep) ? rep : 0;
            unit.Count = retreatedCount + surviving + repaired;
        }

        // Wreck Field (Task 15): destroyed defending ships feed a 72h wreck field repairable via the Space Dock
        var destroyedPlanetShips = SpaceDockFormulas.CalculateDestroyedShips(planetInitialUnits, planetSurviving);
        if (SpaceDockFormulas.ShouldCreateWreckField(planetInitialUnits, destroyedPlanetShips))
        {
            WreckFieldStore.CreateOrMerge(targetPlanet.Id, destroyedPlanetShips, now);
        }

        for (int i = 0; i < holdingDefenderFleets.Count; i++)
        {
            var holdFleet = holdingDefenderFleets[i];
            var holdSurviving = distributedDefenders[i + 1];
            foreach (var ship in holdFleet.Ships)
            {
                ship.Count = holdSurviving.TryGetValue(ship.UnitType, out int rem) ? rem : 0;
            }

            if (!holdFleet.Ships.Any(s => s.Count > 0))
            {
                holdFleet.Status = FleetMissionStatus.Destroyed;
            }
        }

        bool moonFormed = false;
        double reaperSkimmedMetal = 0.0;
        double reaperSkimmedCrystal = 0.0;

        // Spawn/update Debris Field
        if (combatResult.DebrisField.Metal > 0 || combatResult.DebrisField.Crystal > 0)
        {
            double newDebrisMetal = combatResult.DebrisField.Metal;
            double newDebrisCrystal = combatResult.DebrisField.Crystal;

            // Azrail (Reaper) Debris Skimming: Surviving Reapers automatically skim 25% of the newly created debris
            int survivingReapers = combatResult.AttackerRemainingUnits.TryGetValue(UnitType.Reaper, out int reapCnt) ? reapCnt : 0;
            if (survivingReapers > 0)
            {
                var existingCargo = mission.MetalCargo + mission.CrystalCargo + mission.DeuteriumCargo;
                var skimResult = HonorAndRetreatFormulas.CalculateReaperDebrisSkim(
                    survivingReaperCount: survivingReapers,
                    newlyCreatedDebrisMetal: newDebrisMetal,
                    newlyCreatedDebrisCrystal: newDebrisCrystal,
                    existingReaperCargoLoad: existingCargo);

                if (skimResult.SkimmedMetal > 0 || skimResult.SkimmedCrystal > 0)
                {
                    reaperSkimmedMetal = skimResult.SkimmedMetal;
                    reaperSkimmedCrystal = skimResult.SkimmedCrystal;

                    mission.MetalCargo += reaperSkimmedMetal;
                    mission.CrystalCargo += reaperSkimmedCrystal;

                    newDebrisMetal = skimResult.RemainingDebrisMetal;
                    newDebrisCrystal = skimResult.RemainingDebrisCrystal;
                }
            }

            var debris = await dbContext.DebrisFields
                .FirstOrDefaultAsync(d =>
                    d.Galaxy == targetPlanet.Galaxy &&
                    d.System == targetPlanet.System &&
                    d.Slot == targetPlanet.Slot,
                    cancellationToken);

            if (debris is null)
            {
                debris = new DebrisField
                {
                    Id = Guid.NewGuid(),
                    Galaxy = targetPlanet.Galaxy,
                    System = targetPlanet.System,
                    Slot = targetPlanet.Slot,
                    Metal = newDebrisMetal,
                    Crystal = newDebrisCrystal,
                    UpdatedAtUtc = now
                };
                dbContext.DebrisFields.Add(debris);
            }
            else
            {
                debris.Metal += newDebrisMetal;
                debris.Crystal += newDebrisCrystal;
                debris.UpdatedAtUtc = now;
            }

            // Trigger Moon Formation check at battle conclusion if debris field exists
            var moonResult = await moonAndPhalanxService.TryFormMoonFromDebrisAsync(
                targetPlanet,
                combatResult.DebrisField.Metal,
                combatResult.DebrisField.Crystal,
                seed: null,
                cancellationToken);
            moonFormed = moonResult is not null;
        }

        double lootMetal = 0.0;
        double lootCrystal = 0.0;
        double lootDeut = 0.0;

        // Plunder defender resources if Attacker won (Dynamic Plunder: 50% neutral/dishonorable, 75% honorable or discoverer-inactive, 100% bandit)
        if (combatResult.Winner == CombatWinner.Attacker)
        {
            var remainingShips = mission.Ships
                .Where(s => s.Count > 0)
                .ToDictionary(s => s.UnitType, s => s.Count);

            double totalCapacity = FleetNavigationFormulas.CalculateTotalCargoCapacity(remainingShips);
            double availableCapacity = Math.Max(0, totalCapacity - (mission.MetalCargo + mission.CrystalCargo + mission.DeuteriumCargo));

            double plunderRatio = HonorAndRetreatFormulas.DeterminePlunderRatio(
                fightStatus,
                defenderHonorRank,
                isDefenderInactive,
                attackerUser?.PlayerClass ?? PlayerClass.None);

            lootMetal = Math.Min(targetPlanet.Metal * plunderRatio, availableCapacity / 3.0);
            availableCapacity -= lootMetal;
            lootCrystal = Math.Min(targetPlanet.Crystal * plunderRatio, availableCapacity / 2.0);
            availableCapacity -= lootCrystal;
            lootDeut = Math.Min(targetPlanet.Deuterium * plunderRatio, availableCapacity);

            targetPlanet.Metal -= lootMetal;
            targetPlanet.Crystal -= lootCrystal;
            targetPlanet.Deuterium -= lootDeut;

            mission.MetalCargo += lootMetal;
            mission.CrystalCargo += lootCrystal;
            mission.DeuteriumCargo += lootDeut;
        }

        // Honor Points Evaluation
        double attackerMilValue = HonorAndRetreatFormulas.CalculateDestroyedMilitaryUnitsValue(
            combatResult.AttackerDestroyedUnits);
        double defenderMilValue = HonorAndRetreatFormulas.CalculateDestroyedMilitaryUnitsValue(
            combatResult.DefenderDestroyedUnits,
            combatResult.DefenderRepairedDefenses);

        int totalBattleShips = unifiedAttackerUnits.Values.Sum() + unifiedDefenderUnits.Values.Sum();
        bool attackerQual = HonorAndRetreatFormulas.HasMinimumShipParticipation(unifiedAttackerUnits.Values.Sum(), totalBattleShips);
        bool defenderQual = HonorAndRetreatFormulas.HasMinimumShipParticipation(planetInitialUnits.Values.Sum(), totalBattleShips);

        var (attackerHpDelta, defenderHpDelta) = HonorAndRetreatFormulas.CalculateHonorPointsDelta(
            fightStatus,
            attackerMilValue,
            defenderMilValue,
            attackerQual,
            defenderQual);

        if (attackerUser is not null && attackerHpDelta != 0)
        {
            attackerUser.HonorPoints += attackerHpDelta;
        }

        if (defenderUser is not null && defenderHpDelta != 0)
        {
            defenderUser.HonorPoints += defenderHpDelta;
        }

        string battleCoords = $"[{targetPlanet.Galaxy}:{targetPlanet.System}:{targetPlanet.Slot}]";
        string attackerCoords = $"[{mission.OriginGalaxy}:{mission.OriginSystem}:{mission.OriginSlot}]";

        var crPayload = CombatReportFormulas.BuildCombatReportPayload(
            reportId: Guid.NewGuid(),
            occurredAtUtc: now,
            battleCoordinates: battleCoords,
            attackerName: attackerUser?.Username ?? "Attacker",
            attackerAllianceTag: attackerUser?.AllianceTag,
            attackerCoordinates: attackerCoords,
            attackerTech: attackerTech,
            attackerInitialUnits: unifiedAttackerUnits,
            defenderName: defenderUser?.Username ?? "Defender",
            defenderAllianceTag: defenderUser?.AllianceTag,
            defenderCoordinates: battleCoords,
            defenderTech: defenderTech,
            defenderInitialUnits: unifiedDefenderUnits,
            combatResult: combatResult,
            plunder: new CombatPlunderSummary(lootMetal, lootCrystal, lootDeut),
            moonCreated: moonFormed,
            reaperSkimmedMetal: reaperSkimmedMetal,
            reaperSkimmedCrystal: reaperSkimmedCrystal,
            fightStatus: fightStatus,
            attackerHpDelta: attackerHpDelta,
            defenderHpDelta: defenderHpDelta);

        await inboxService.CreateAndArchiveCombatReportAsync(
            crPayload,
            mission.UserId,
            targetPlanet.UserId,
            targetPlanet.Id,
            cancellationToken);

        return mission.Ships.Any(s => s.Count > 0);
    }

    private async Task<bool> ResolveEspionageAsync(FleetMission mission, CancellationToken cancellationToken)
    {
        if (!mission.TargetPlanetId.HasValue)
        {
            return true;
        }

        var probeShip = mission.Ships.FirstOrDefault(s => s.UnitType == UnitType.EspionageProbe);
        int probeCount = probeShip?.Count ?? 0;
        if (probeCount <= 0)
        {
            return mission.Ships.Any(s => s.Count > 0);
        }

        var result = await espionageService.ExecuteEspionageScanAsync(
            mission.UserId,
            mission.TargetPlanetId.Value,
            probeCount,
            seed: null,
            cancellationToken);

        if (probeShip is not null)
        {
            probeShip.Count = result.SurvivingProbes;
        }

        return mission.Ships.Any(s => s.Count > 0);
    }

    private async Task ResolveRecycleAsync(FleetMission mission, DateTime now, CancellationToken cancellationToken)
    {
        var debris = await dbContext.DebrisFields
            .FirstOrDefaultAsync(d =>
                d.Galaxy == mission.TargetGalaxy &&
                d.System == mission.TargetSystem &&
                d.Slot == mission.TargetSlot,
                cancellationToken);

        if (debris is null || (debris.Metal <= 0 && debris.Crystal <= 0))
        {
            return;
        }

        int recyclerCount = mission.Ships.FirstOrDefault(s => s.UnitType == UnitType.Recycler)?.Count ?? 0;
        int reaperCount = mission.Ships.FirstOrDefault(s => s.UnitType == UnitType.Reaper)?.Count ?? 0;
        double recyclerCapacity = (recyclerCount * FleetNavigationFormulas.GetShipFlightStats(UnitType.Recycler).CargoCapacity) +
                                  (reaperCount * FleetNavigationFormulas.GetShipFlightStats(UnitType.Reaper).CargoCapacity);
        double availableCapacity = Math.Max(0, recyclerCapacity - (mission.MetalCargo + mission.CrystalCargo + mission.DeuteriumCargo));

        double collectedMetal = Math.Min(debris.Metal, availableCapacity);
        availableCapacity -= collectedMetal;
        double collectedCrystal = Math.Min(debris.Crystal, availableCapacity);

        debris.Metal -= collectedMetal;
        debris.Crystal -= collectedCrystal;
        debris.UpdatedAtUtc = now;

        mission.MetalCargo += collectedMetal;
        mission.CrystalCargo += collectedCrystal;
    }

    private async Task<bool> ResolveColonizeAsync(FleetMission mission, DateTime now, CancellationToken cancellationToken)
    {
        var colonyShip = mission.Ships.FirstOrDefault(s => s.UnitType == UnitType.ColonyShip && s.Count > 0);
        if (colonyShip is null)
        {
            return mission.Ships.Any(s => s.Count > 0);
        }

        // Purge any expired DestroyedPlanet placeholder at the target coordinate before checking occupancy
        var expiredPlaceholders = await dbContext.Planets
            .Where(p =>
                p.Galaxy == mission.TargetGalaxy &&
                p.System == mission.TargetSystem &&
                p.Slot == mission.TargetSlot &&
                !p.IsMoon &&
                p.IsDestroyedPlanet &&
                p.DestroyedPlanetExpiresAtUtc.HasValue &&
                p.DestroyedPlanetExpiresAtUtc.Value <= now)
            .ToListAsync(cancellationToken);

        if (expiredPlaceholders.Count > 0)
        {
            dbContext.Planets.RemoveRange(expiredPlaceholders);
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        string coords = $"[{mission.TargetGalaxy}:{mission.TargetSystem}:{mission.TargetSlot}]";

        bool occupied = await dbContext.Planets
            .AnyAsync(p =>
                p.Galaxy == mission.TargetGalaxy &&
                p.System == mission.TargetSystem &&
                p.Slot == mission.TargetSlot &&
                !p.IsMoon,
                cancellationToken);

        if (occupied)
        {
            await inboxService.SendMessageAsync(
                mission.UserId,
                senderUserId: null,
                folder: MessageFolder.PlayerMessages,
                subject: $"Colonization Failed at {coords}",
                contentJson: $$"""{"coordinates":"{{coords}}","reason":"Target orbital slot is already occupied. The fleet is returning to origin."}""",
                cancellationToken);
            return true;
        }

        int astroLevel = await dbContext.UserResearches
            .AsNoTracking()
            .Where(r => r.UserId == mission.UserId && r.ResearchType == ResearchType.Astrophysics)
            .Select(r => r.Level)
            .FirstOrDefaultAsync(cancellationToken);

        if (!ColonizationFormulas.CanColonizeSlot(mission.TargetSlot, astroLevel))
        {
            int requiredAstro = ColonizationFormulas.GetRequiredAstrophysicsLevelForSlot(mission.TargetSlot);
            await inboxService.SendMessageAsync(
                mission.UserId,
                senderUserId: null,
                folder: MessageFolder.PlayerMessages,
                subject: $"Colonization Failed at {coords}",
                contentJson: $$"""{"coordinates":"{{coords}}","reason":"Orbital position {{mission.TargetSlot}} requires Astrophysics Level {{requiredAstro}} (current: {{astroLevel}}). The Colony Ship is returning."}""",
                cancellationToken);
            return true;
        }

        int maxPlanets = ColonizationFormulas.CalculateMaxPlanets(astroLevel);
        int currentPlanetCount = await dbContext.Planets
            .CountAsync(p =>
                p.UserId == mission.UserId &&
                !p.IsMoon &&
                !p.IsDestroyedPlanet,
                cancellationToken);

        if (currentPlanetCount >= maxPlanets)
        {
            await inboxService.SendMessageAsync(
                mission.UserId,
                senderUserId: null,
                folder: MessageFolder.PlayerMessages,
                subject: $"Colonization Failed at {coords}",
                contentJson: $$"""{"coordinates":"{{coords}}","reason":"Maximum colony limit ({{maxPlanets}}) reached for Astrophysics Level {{astroLevel}}. The Colony Ship is returning."}""",
                cancellationToken);
            return true;
        }

        // Consume (destroy) 1 Colony Ship
        colonyShip.Count -= 1;

        var colonyOwnerClass = await dbContext.Users
            .AsNoTracking()
            .Where(u => u.Id == mission.UserId)
            .Select(u => u.PlayerClass)
            .FirstOrDefaultAsync(cancellationToken);

        var roll = ColonizationFormulas.RollPlanetCharacteristics(
            mission.TargetSlot,
            isDiscoverer: colonyOwnerClass == PlayerClass.Discoverer);

        var newColony = new Planet
        {
            Id = Guid.NewGuid(),
            UserId = mission.UserId,
            Name = "Colony",
            Galaxy = mission.TargetGalaxy,
            System = mission.TargetSystem,
            Slot = mission.TargetSlot,
            IsMoon = false,
            IsCapital = false,
            IsDestroyedPlanet = false,
            Metal = 500 + mission.MetalCargo,
            Crystal = 500 + mission.CrystalCargo,
            Deuterium = mission.DeuteriumCargo,
            LastResourceUpdateUtc = now,
            TempMin = roll.TempMin,
            TempMax = roll.TempMax,
            Diameter = roll.DiameterKm,
            FieldsUsed = 0,
            MaxFields = roll.MaxFields
        };

        mission.MetalCargo = 0;
        mission.CrystalCargo = 0;
        mission.DeuteriumCargo = 0;

        dbContext.Planets.Add(newColony);

        await inboxService.SendMessageAsync(
            mission.UserId,
            senderUserId: null,
            folder: MessageFolder.PlayerMessages,
            subject: $"New Colony Established at {coords}",
            contentJson: $$"""{"planetId":"{{newColony.Id}}","coordinates":"{{coords}}","maxFields":{{newColony.MaxFields}},"diameterKm":{{newColony.Diameter}},"tempMin":{{newColony.TempMin}},"tempMax":{{newColony.TempMax}}}""",
            cancellationToken);

        return mission.Ships.Any(s => s.Count > 0);
    }

    private async Task<bool> ResolveMoonDestructionAsync(FleetMission mission, DateTime now, CancellationToken cancellationToken)
    {
        bool survivedCombat = await ResolveAttackAsync(mission, now, cancellationToken);
        if (!survivedCombat || !mission.TargetPlanetId.HasValue)
        {
            return survivedCombat;
        }

        var targetMoon = await dbContext.Planets
            .FirstOrDefaultAsync(p => p.Id == mission.TargetPlanetId.Value && p.IsMoon, cancellationToken);

        var ripShip = mission.Ships.FirstOrDefault(s => s.UnitType == UnitType.Deathstar);
        int ripCount = ripShip?.Count ?? 0;

        if (targetMoon is null || ripCount <= 0)
        {
            return mission.Ships.Any(s => s.Count > 0);
        }

        var destructionResult = await moonAndPhalanxService.ExecuteMoonDestructionAsync(
            targetMoon,
            ripCount,
            seed: null,
            cancellationToken);

        if (destructionResult.DeathstarsDestroyed)
        {
            foreach (var ship in mission.Ships)
            {
                ship.Count = 0;
            }
        }

        return mission.Ships.Any(s => s.Count > 0);
    }

    private async Task<(bool RequiresReturn, DateTime ReturnUtc)> ResolveExpeditionMissionAsync(
        FleetMission mission,
        DateTime now,
        double baseFlightDurationSeconds,
        CancellationToken cancellationToken)
    {
        var result = await expeditionEngine.ResolveExpeditionAsync(
            mission,
            seed: null,
            universeAgeMultiplier: 1.0,
            cancellationToken);

        mission.MetalCargo += result.AddedMetal;
        mission.CrystalCargo += result.AddedCrystal;
        mission.DeuteriumCargo += result.AddedDeuterium;

        if (result.AddedDarkMatter > 0)
        {
            var user = await dbContext.Users
                .FirstOrDefaultAsync(u => u.Id == mission.UserId, cancellationToken);
            if (user is not null)
            {
                user.DarkMatter += result.AddedDarkMatter;
            }
        }

        // Update surviving & newly discovered ships on the mission
        foreach (var existingShip in mission.Ships.ToList())
        {
            existingShip.Count = result.SurvivingShips.TryGetValue(existingShip.UnitType, out int rem) ? rem : 0;
        }

        foreach (var (unitType, count) in result.SurvivingShips)
        {
            if (count <= 0) continue;
            var existing = mission.Ships.FirstOrDefault(s => s.UnitType == unitType);
            if (existing is null)
            {
                var newShip = new FleetMissionShip
                {
                    Id = Guid.NewGuid(),
                    FleetMissionId = mission.Id,
                    UnitType = unitType,
                    Count = count
                };
                mission.Ships.Add(newShip);
                dbContext.FleetMissionShips.Add(newShip);
            }
        }

        double holdSeconds = Math.Max(0, mission.HoldHours) * 3600.0;
        double adjustedReturnFlightSeconds = Math.Max(1.0, baseFlightDurationSeconds * result.ReturnDurationMultiplier);
        var returnUtc = now.AddSeconds(holdSeconds + adjustedReturnFlightSeconds);

        bool hasSurvivors = mission.Ships.Any(s => s.Count > 0);
        return (hasSurvivors, returnUtc);
    }
}

