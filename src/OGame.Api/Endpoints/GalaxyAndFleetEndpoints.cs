using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using OGame.Api.Hubs;
using OGame.Application.Common.Interfaces;
using OGame.Application.Interfaces;
using OGame.Domain.Entities;
using OGame.Domain.Enums;
using OGame.Domain.Services;

namespace OGame.Api.Endpoints;

public record QuickSpyRequest(
    Guid? UserId,
    Guid OriginPlanetId,
    int TargetGalaxy,
    int TargetSystem,
    int TargetSlot,
    int ProbeCount = 1);

public record GalaxyDebrisDto(double Metal, double Crystal);

public record GalaxySlotDto(
    int Slot,
    Guid? PlanetId,
    string? PlanetName,
    Guid? PlayerId,
    string? PlayerName,
    long? PlayerPoints,
    string? AllianceTag,
    bool HasMoon,
    Guid? MoonId,
    int? MoonDiameter,
    GalaxyDebrisDto? DebrisField,
    string? Activity,
    string? MoonActivity,
    IReadOnlyList<string> PlayerStatusFlags,
    bool IsDestroyedPlanet = false);

public record GalaxySystemViewDto(
    int Galaxy,
    int System,
    IReadOnlyList<GalaxySlotDto> Slots);

public static class GalaxyAndFleetEndpoints
{
    public static IEndpointRouteBuilder MapGalaxyAndFleetEndpoints(this IEndpointRouteBuilder app)
    {
        var galaxyGroup = app.MapGroup("/api/galaxy")
            .WithTags("Galaxy");

        galaxyGroup.MapGet("/{galaxy:int}/{system:int}", async (
            int galaxy,
            int system,
            Guid? viewerUserId,
            IApplicationDbContext dbContext,
            IActivityService activityService,
            CancellationToken cancellationToken) =>
        {
            var now = DateTimeOffset.UtcNow;

            var bodiesInSystem = await dbContext.Planets
                .AsNoTracking()
                .Include(p => p.User)
                .Where(p => p.Galaxy == galaxy && p.System == system)
                .ToListAsync(cancellationToken);

            var debrisInSystem = await dbContext.DebrisFields
                .AsNoTracking()
                .Where(d => d.Galaxy == galaxy && d.System == system)
                .ToListAsync(cancellationToken);

            long viewerPoints = 0;
            long viewerMilitaryPoints = 0;
            int viewerMilitaryRank = 1;
            if (viewerUserId.HasValue)
            {
                var viewer = await dbContext.Users
                    .AsNoTracking()
                    .FirstOrDefaultAsync(u => u.Id == viewerUserId.Value, cancellationToken);

                viewerPoints = viewer?.TotalPoints ?? 0;
                viewerMilitaryPoints = viewer?.MilitaryPoints ?? 0;
                viewerMilitaryRank = viewer?.MilitaryRank ?? 1;
            }

            var slots = new List<GalaxySlotDto>(15);

            for (int slot = 1; slot <= 15; slot++)
            {
                var planet = bodiesInSystem.FirstOrDefault(p =>
                    p.Slot == slot &&
                    !p.IsMoon &&
                    (!p.IsDestroyedPlanet || !p.DestroyedPlanetExpiresAtUtc.HasValue || p.DestroyedPlanetExpiresAtUtc.Value > now.UtcDateTime));
                var moon = bodiesInSystem.FirstOrDefault(p => p.Slot == slot && p.IsMoon && !p.IsDestroyedPlanet);
                var debris = debrisInSystem.FirstOrDefault(d => d.Slot == slot && (d.Metal > 0 || d.Crystal > 0));

                if (planet is null)
                {
                    slots.Add(new GalaxySlotDto(
                        Slot: slot,
                        PlanetId: null,
                        PlanetName: null,
                        PlayerId: null,
                        PlayerName: null,
                        PlayerPoints: null,
                        AllianceTag: null,
                        HasMoon: false,
                        MoonId: null,
                        MoonDiameter: null,
                        DebrisField: debris is not null ? new GalaxyDebrisDto(debris.Metal, debris.Crystal) : null,
                        Activity: null,
                        MoonActivity: null,
                        PlayerStatusFlags: [],
                        IsDestroyedPlanet: false));
                    continue;
                }

                if (planet.IsDestroyedPlanet)
                {
                    slots.Add(new GalaxySlotDto(
                        Slot: slot,
                        PlanetId: planet.Id,
                        PlanetName: "Destroyed Planet",
                        PlayerId: null,
                        PlayerName: null,
                        PlayerPoints: null,
                        AllianceTag: null,
                        HasMoon: false,
                        MoonId: null,
                        MoonDiameter: null,
                        DebrisField: debris is not null ? new GalaxyDebrisDto(debris.Metal, debris.Crystal) : null,
                        Activity: null,
                        MoonActivity: null,
                        PlayerStatusFlags: [],
                        IsDestroyedPlanet: true));
                    continue;
                }

                bool isSelf = viewerUserId.HasValue && planet.UserId == viewerUserId.Value;

                string? planetActivity = await activityService.GetActivityDisplayAsync(
                    galaxy,
                    system,
                    slot,
                    CoordinateType.Planet,
                    isSelf,
                    now,
                    cancellationToken);

                string? moonActivity = moon is not null
                    ? await activityService.GetActivityDisplayAsync(
                        galaxy,
                        system,
                        slot,
                        CoordinateType.Moon,
                        isSelf,
                        now,
                        cancellationToken)
                    : null;

                var flags = BuildPlayerStatusFlags(planet.User, viewerPoints, viewerMilitaryPoints, viewerMilitaryRank, isSelf, now.UtcDateTime);

                slots.Add(new GalaxySlotDto(
                    Slot: slot,
                    PlanetId: planet.Id,
                    PlanetName: planet.Name,
                    PlayerId: planet.UserId,
                    PlayerName: planet.User?.Username,
                    PlayerPoints: planet.User?.TotalPoints,
                    AllianceTag: planet.User?.AllianceTag,
                    HasMoon: moon is not null,
                    MoonId: moon?.Id,
                    MoonDiameter: moon?.Diameter,
                    DebrisField: debris is not null ? new GalaxyDebrisDto(debris.Metal, debris.Crystal) : null,
                    Activity: planetActivity,
                    MoonActivity: moonActivity,
                    PlayerStatusFlags: flags));
            }

            return Results.Ok(new GalaxySystemViewDto(galaxy, system, slots));
        })
        .WithName("GetGalaxySystemView");

        var fleetGroup = app.MapGroup("/api/fleets")
            .WithTags("Fleets");

        fleetGroup.MapGet("/active", async (
            Guid? userId,
            IApplicationDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var user = userId.HasValue
                ? await dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId.Value, cancellationToken)
                : await dbContext.Users.FirstOrDefaultAsync(cancellationToken);

            if (user is null)
            {
                return Results.Ok(new
                {
                    ActiveFleets = 0,
                    ActiveExpeditions = 0,
                    Missions = Array.Empty<object>()
                });
            }

            var missions = await dbContext.FleetMissions
                .AsNoTracking()
                .Include(m => m.Ships)
                .Where(m =>
                    m.UserId == user.Id &&
                    m.Status != FleetMissionStatus.Completed &&
                    m.Status != FleetMissionStatus.Destroyed)
                .OrderBy(m => m.ArrivalUtc)
                .ToListAsync(cancellationToken);

            var activeFleets = missions.Count;
            var activeExpeditions = missions.Count(m => m.MissionType == FleetMissionType.Expedition);

            var computerTech = await dbContext.UserResearches
                .Where(r => r.UserId == user.Id && r.ResearchType == ResearchType.ComputerTechnology)
                .Select(r => r.Level)
                .FirstOrDefaultAsync(cancellationToken);

            var astroTech = await dbContext.UserResearches
                .Where(r => r.UserId == user.Id && r.ResearchType == ResearchType.Astrophysics)
                .Select(r => r.Level)
                .FirstOrDefaultAsync(cancellationToken);

            int maxFleets = 1 + computerTech + (user.PlayerClass == PlayerClass.General ? PlayerClassFormulas.GeneralExtraFleetSlots : 0);
            int maxExpeditions = ExpeditionFormulas.CalculateMaxConcurrentExpeditions(astroTech, user.PlayerClass);

            return Results.Ok(new
            {
                ActiveFleets = activeFleets,
                ActiveExpeditions = activeExpeditions,
                MaxFleets = maxFleets,
                MaxExpeditions = maxExpeditions,
                Missions = missions.Select(m => new
                {
                    m.Id,
                    m.OriginPlanetId,
                    OriginCoordinates = $"[{m.OriginGalaxy}:{m.OriginSystem}:{m.OriginSlot}]",
                    TargetCoordinates = $"[{m.TargetGalaxy}:{m.TargetSystem}:{m.TargetSlot}]",
                    MissionType = (int)m.MissionType,
                    MissionTypeName = m.MissionType.ToString(),
                    Status = (int)m.Status,
                    StatusName = m.Status.ToString(),
                    m.FuelConsumed,
                    DepartureUtc = DateTime.SpecifyKind(m.DepartureUtc, DateTimeKind.Utc).ToString("O"),
                    ArrivalUtc = DateTime.SpecifyKind(m.ArrivalUtc, DateTimeKind.Utc).ToString("O"),
                    ReturnUtc = m.ReturnUtc.HasValue ? DateTime.SpecifyKind(m.ReturnUtc.Value, DateTimeKind.Utc).ToString("O") : null,
                    HoldUntilUtc = m.HoldUntilUtc.HasValue ? DateTime.SpecifyKind(m.HoldUntilUtc.Value, DateTimeKind.Utc).ToString("O") : null,
                    MetalCargo = m.MetalCargo,
                    CrystalCargo = m.CrystalCargo,
                    DeuteriumCargo = m.DeuteriumCargo,
                    Ships = m.Ships.Select(s => new { UnitType = (int)s.UnitType, s.Count }),
                    IsReturning = m.Status == FleetMissionStatus.Returning || m.Status == FleetMissionStatus.Recalled
                })
            });
        })
        .WithName("GetActiveFleets");

        fleetGroup.MapPost("/quick-spy", async (
            QuickSpyRequest request,
            IFleetMissionService fleetMissionService,
            IApplicationDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var userId = request.UserId;
            if (!userId.HasValue)
            {
                var originPlanet = await dbContext.Planets.FirstOrDefaultAsync(p => p.Id == request.OriginPlanetId, cancellationToken);
                userId = originPlanet?.UserId;
            }

            if (!userId.HasValue)
            {
                return Results.BadRequest(new { Message = "Kullanıcı oturumu doğrulanamadı." });
            }

            var probeCount = Math.Max(1, request.ProbeCount);
            var command = new FleetDispatchCommand(
                UserId: userId.Value,
                OriginPlanetId: request.OriginPlanetId,
                TargetGalaxy: request.TargetGalaxy,
                TargetSystem: request.TargetSystem,
                TargetSlot: request.TargetSlot,
                TargetType: CoordinateType.Planet,
                MissionType: FleetMissionType.Espionage,
                Ships: new Dictionary<UnitType, int> { [UnitType.EspionageProbe] = probeCount },
                SpeedFactor: 1.0);

            try
            {
                var mission = await fleetMissionService.DispatchFleetAsync(command, cancellationToken);

                // Check Directive 3 Quest 7 progress (Espionage performed)
                var d3Progress = await dbContext.UserTutorialProgresses
                    .FirstOrDefaultAsync(p => p.UserId == userId.Value && p.DirectiveId == 3, cancellationToken);
                if (d3Progress != null && d3Progress.CurrentQuestStep == 7)
                {
                    d3Progress.SubStepBitmask = DirectiveKnowledgePowerFormulas.ProcessEvent(7, d3Progress.SubStepBitmask, "espionage_performed");
                    d3Progress.UpdatedAtUtc = DateTime.UtcNow;
                    await dbContext.SaveChangesAsync(cancellationToken);
                }

                return Results.Ok(new
                {
                    mission.Id,
                    mission.ArrivalUtc,
                    ProbeCount = probeCount,
                    Message = $"[{request.TargetGalaxy}:{request.TargetSystem}:{request.TargetSlot}] koordinatına {probeCount} casus sondası başarıyla sevk edildi."
                });
            }
            catch (Exception ex)
            {
                return Results.BadRequest(new { Message = ex.Message });
            }
        })
        .WithName("QuickSpy");

        fleetGroup.MapPost("/dispatch", async (
            FleetDispatchCommand command,
            IFleetMissionService fleetMissionService,
            IApplicationDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var mission = await fleetMissionService.DispatchFleetAsync(command, cancellationToken);

                // Check Directive 3 progress (Quest 7 espionage or Quest 8 fleet save to slot 16)
                var d3Progress = await dbContext.UserTutorialProgresses
                    .FirstOrDefaultAsync(p => p.UserId == command.UserId && p.DirectiveId == 3, cancellationToken);
                if (d3Progress != null)
                {
                    bool updated = false;
                    if (d3Progress.CurrentQuestStep == 7 && command.MissionType == FleetMissionType.Espionage)
                    {
                        d3Progress.SubStepBitmask = DirectiveKnowledgePowerFormulas.ProcessEvent(7, d3Progress.SubStepBitmask, "espionage_performed");
                        updated = true;
                    }
                    else if (d3Progress.CurrentQuestStep == 8 && command.TargetSlot == 16 && (command.MetalCargo + command.CrystalCargo + command.DeuteriumCargo) > 0)
                    {
                        d3Progress.SubStepBitmask = DirectiveKnowledgePowerFormulas.ProcessEvent(8, d3Progress.SubStepBitmask, "fleet_dispatched_slot16");
                        updated = true;
                    }

                    if (updated)
                    {
                        d3Progress.UpdatedAtUtc = DateTime.UtcNow;
                        await dbContext.SaveChangesAsync(cancellationToken);
                    }
                }

                // Check Directive 4 progress (Quest 6 colonization or Quest 10 expedition to slot 16)
                var d4Progress = await dbContext.UserTutorialProgresses
                    .FirstOrDefaultAsync(p => p.UserId == command.UserId && p.DirectiveId == 4, cancellationToken);
                if (d4Progress != null)
                {
                    bool updated = false;
                    if (d4Progress.CurrentQuestStep == 6 && command.MissionType == FleetMissionType.Colonize)
                    {
                        d4Progress.SubStepBitmask = DirectiveDeepSpaceFormulas.ProcessEvent(6, d4Progress.SubStepBitmask, "planet_colonized");
                        updated = true;
                    }
                    else if (d4Progress.CurrentQuestStep == 10 && command.MissionType == FleetMissionType.Expedition && command.TargetSlot == 16)
                    {
                        d4Progress.SubStepBitmask = DirectiveDeepSpaceFormulas.ProcessEvent(10, d4Progress.SubStepBitmask, "expedition_dispatched");
                        updated = true;
                    }

                    if (updated)
                    {
                        d4Progress.UpdatedAtUtc = DateTime.UtcNow;
                        await dbContext.SaveChangesAsync(cancellationToken);
                    }
                }

                // Check Directive 6 progress (Quest 5 lifeform discovery mission)
                var d6Progress = await dbContext.UserTutorialProgresses
                    .FirstOrDefaultAsync(p => p.UserId == command.UserId && p.DirectiveId == 6, cancellationToken);
                if (d6Progress != null && d6Progress.CurrentQuestStep == 5)
                {
                    d6Progress.SubStepBitmask = DirectiveLifeformsFormulas.ProcessEvent(5, d6Progress.SubStepBitmask, "lifeform_discovery_dispatched");
                    d6Progress.UpdatedAtUtc = DateTime.UtcNow;
                    await dbContext.SaveChangesAsync(cancellationToken);
                }

                return Results.Ok(new
                {
                    mission.Id,
                    mission.UserId,
                    mission.OriginPlanetId,
                    OriginCoordinates = $"[{mission.OriginGalaxy}:{mission.OriginSystem}:{mission.OriginSlot}]",
                    mission.TargetPlanetId,
                    TargetCoordinates = $"[{mission.TargetGalaxy}:{mission.TargetSystem}:{mission.TargetSlot}]",
                    mission.MissionType,
                    mission.Status,
                    mission.FuelConsumed,
                    mission.DepartureUtc,
                    mission.ArrivalUtc,
                    mission.ReturnUtc,
                    mission.HangfireArrivalJobId,
                    Ships = mission.Ships.Select(s => new { s.UnitType, s.Count })
                });
            }
            catch (Exception ex) when (ex is InvalidOperationException or OGame.Domain.Common.ConcurrencyLockException)
            {
                return Results.BadRequest(new { Message = ex.Message });
            }
        })
        .WithName("DispatchFleet");

        fleetGroup.MapPost("/missions/{missionId:guid}/recall", async (
            Guid missionId,
            Guid? userId,
            IFleetMissionService fleetMissionService,
            IApplicationDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var mission = await fleetMissionService.RecallFleetAsync(missionId, userId, cancellationToken);

                // Check Directive 3 Quest 9 progress (Recall fleet)
                var d3Progress = await dbContext.UserTutorialProgresses
                    .FirstOrDefaultAsync(p => p.UserId == mission.UserId && p.DirectiveId == 3, cancellationToken);
                if (d3Progress != null && d3Progress.CurrentQuestStep == 9)
                {
                    d3Progress.SubStepBitmask = DirectiveKnowledgePowerFormulas.ProcessEvent(9, d3Progress.SubStepBitmask, "fleet_recalled");
                    d3Progress.UpdatedAtUtc = DateTime.UtcNow;
                    await dbContext.SaveChangesAsync(cancellationToken);
                }

                return Results.Ok(new
                {
                    mission.Id,
                    mission.Status,
                    mission.ReturnUtc,
                    Message = "Filo başarıyla geri çağrıldı ve üsse dönüş rotasına geçti."
                });
            }
            catch (Exception ex)
            {
                return Results.BadRequest(new { Message = ex.Message });
            }
        })
        .WithName("RecallFleetMission");

        fleetGroup.MapPost("/simulate-hostile-attack", async (
            IApplicationDbContext dbContext,
            IHubContext<FleetMovementHub> hubContext,
            CancellationToken cancellationToken) =>
        {
            var commander = await dbContext.Users.FirstOrDefaultAsync(u => u.Username == "Commander_Prime" || u.Username == "Commander", cancellationToken)
                ?? await dbContext.Users.FirstOrDefaultAsync(cancellationToken);
            if (commander is null) return Results.NotFound(new { Message = "User not found." });

            var capitalPlanet = await dbContext.Planets.FirstOrDefaultAsync(p => p.UserId == commander.Id && p.IsCapital, cancellationToken)
                ?? await dbContext.Planets.FirstOrDefaultAsync(p => p.UserId == commander.Id, cancellationToken);
            if (capitalPlanet is null) return Results.NotFound(new { Message = "Planet not found." });

            var existingHostiles = await dbContext.FleetMissions
                .Include(m => m.Ships)
                .Where(m => m.UserId != commander.Id && m.TargetPlanetId == capitalPlanet.Id && m.MissionType == FleetMissionType.Attack)
                .ToListAsync(cancellationToken);

            if (existingHostiles.Count > 0)
            {
                dbContext.FleetMissions.RemoveRange(existingHostiles);
            }

            var enemyUser = await dbContext.Users.FirstOrDefaultAsync(u => u.Username == "Attacker_Viper", cancellationToken);
            if (enemyUser is null)
            {
                enemyUser = new OGame.Domain.Entities.User
                {
                    Id = Guid.NewGuid(),
                    Username = "Attacker_Viper",
                    Email = "attacker@ogame.local",
                    PasswordHash = "simulated",
                    CreatedAtUtc = DateTime.UtcNow,
                    LastLoginUtc = DateTime.UtcNow
                };
                dbContext.Users.Add(enemyUser);
            }

            var now = DateTime.UtcNow;
            var arrivalTime = now.AddMinutes(4).AddSeconds(32);

            var mission = new FleetMission
            {
                Id = Guid.NewGuid(),
                UserId = enemyUser.Id,
                OriginPlanetId = Guid.NewGuid(),
                OriginGalaxy = 1,
                OriginSystem = 462,
                OriginSlot = 10,
                OriginType = CoordinateType.Planet,
                TargetPlanetId = capitalPlanet.Id,
                TargetGalaxy = capitalPlanet.Galaxy,
                TargetSystem = capitalPlanet.System,
                TargetSlot = capitalPlanet.Slot,
                TargetType = CoordinateType.Planet,
                MissionType = FleetMissionType.Attack,
                Status = FleetMissionStatus.Outbound,
                DepartureUtc = now,
                ArrivalUtc = arrivalTime,
                ReturnUtc = arrivalTime.AddMinutes(5),
                Ships = new List<FleetMissionShip>
                {
                    new() { UnitType = UnitType.SmallCargo, Count = 4 },
                    new() { UnitType = UnitType.LightFighter, Count = 2 }
                }
            };

            dbContext.FleetMissions.Add(mission);
            await dbContext.SaveChangesAsync(cancellationToken);

            await hubContext.Clients.All.SendAsync("OnHostileFleetDetected", new
            {
                MissionId = mission.Id,
                TargetPlanetId = capitalPlanet.Id,
                ArrivalUtc = arrivalTime.ToString("O"),
                ShipCount = 6
            }, cancellationToken);

            return Results.Ok(new
            {
                Success = true,
                Message = "Düşman saldırı filosu simüle edildi.",
                MissionId = mission.Id,
                ArrivalUtc = arrivalTime.ToString("O"),
                TotalShips = 6
            });
        })
        .WithName("SimulateHostileAttack");

        fleetGroup.MapPost("/clear-hostile-attacks", async (
            IApplicationDbContext dbContext,
            IHubContext<FleetMovementHub> hubContext,
            CancellationToken cancellationToken) =>
        {
            var hostiles = await dbContext.FleetMissions
                .Include(m => m.Ships)
                .Where(m => m.MissionType == FleetMissionType.Attack && m.Status == FleetMissionStatus.Outbound)
                .ToListAsync(cancellationToken);

            if (hostiles.Count > 0)
            {
                dbContext.FleetMissions.RemoveRange(hostiles);
                await dbContext.SaveChangesAsync(cancellationToken);
            }

            await hubContext.Clients.All.SendAsync("OnFleetArrived", new { Cleared = true }, cancellationToken);

            return Results.Ok(new { Success = true, Message = "Tüm düşman saldırı filoları temizlendi." });
        })
        .WithName("ClearHostileAttacks");

        return app;
    }

    private static List<string> BuildPlayerStatusFlags(
        OGame.Domain.Entities.User? owner,
        long viewerPoints,
        long viewerMilitaryPoints,
        int viewerMilitaryRank,
        bool isSelf,
        DateTime utcNow)
    {
        var flags = new List<string>();
        if (owner is null)
        {
            return flags;
        }

        if (owner.IsVacationMode)
        {
            flags.Add("(v)");
        }

        var inactiveDays = (utcNow - owner.LastLoginUtc).TotalDays;
        if (inactiveDays >= 28)
        {
            flags.Add("(iI)");
        }
        else if (inactiveDays >= 7)
        {
            flags.Add("(i)");
        }

        var ownerHonorRank = HonorAndRetreatFormulas.DetermineHonorRank(owner.HonorPoints, owner.HonorRank);
        if (HonorAndRetreatFormulas.IsBandit(ownerHonorRank))
        {
            flags.Add("(b)"); // Bandit
        }
        else if (HonorAndRetreatFormulas.IsStarlordOrHigher(ownerHonorRank))
        {
            flags.Add("(e)"); // Emperor / Star Lord
        }

        if (!isSelf && inactiveDays < 7 && viewerPoints > 0)
        {
            bool isHonorable = (viewerMilitaryPoints <= owner.MilitaryPoints) ||
                               (owner.MilitaryPoints >= viewerMilitaryPoints - 10) ||
                               (owner.MilitaryRank - viewerMilitaryRank <= 100) ||
                               HonorAndRetreatFormulas.IsBandit(ownerHonorRank);

            if (isHonorable)
            {
                flags.Add("(hp)"); // Honorable target (yellow)
            }
        }

        if (!isSelf && inactiveDays < 30 && viewerPoints > 0)
        {
            if (owner.TotalPoints < 500_000 && viewerPoints > owner.TotalPoints * 5)
            {
                flags.Add("(n)"); // Noob protection
            }
            else if (viewerPoints < 500_000 && owner.TotalPoints > viewerPoints * 5)
            {
                flags.Add("(s)"); // Strong player protection
            }
        }

        return flags;
    }
}

