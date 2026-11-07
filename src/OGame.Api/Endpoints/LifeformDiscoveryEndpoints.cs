using System.Collections.Concurrent;
using Microsoft.EntityFrameworkCore;
using OGame.Application.Common.Interfaces;
using OGame.Application.Interfaces;
using OGame.Domain.Entities;
using OGame.Domain.Enums;
using OGame.Domain.Services;

namespace OGame.Api.Endpoints;

public record DispatchLifeformDiscoveryRequest(int Galaxy, int System, int Slot);

public class LifeformDiscoveryMissionState
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string MissionType { get; set; } = LifeformDiscoveryFormulas.MissionType;
    public Guid OriginPlanetId { get; set; }
    public int TargetGalaxy { get; set; }
    public int TargetSystem { get; set; }
    public int TargetSlot { get; set; }
    public DateTime StartTimeUtc { get; set; }
    public DateTime ArrivalUtc { get; set; }
    public bool IsCompleted { get; set; }
    public string? OutcomeType { get; set; }
    public string? DiscoveredSpecies { get; set; }
    public int Experience { get; set; }
    public int Artefacts { get; set; }
    public string? Narrative { get; set; }
}

public class UserLifeformDiscoveryState
{
    public object SyncRoot { get; } = new();
    public List<string> UnlockedSpecies { get; } = new(LifeformDiscoveryFormulas.InitialUnlockedSpecies);
    public List<LifeformDiscoveryMissionState> Missions { get; } = new();
    public Dictionary<string, DateTime> ScoutedCoordinates { get; } = new();
    public int StoredFlights { get; set; } = LifeformsSpeciesFormulas.ExplorationDailyAllotment;
    public DateTime LastRefillUtc { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// User-level in-memory state for the progressive lifeform unlock chain and Galaxy-view Mor DNA missions (Task 05BP).
/// Missions are resolved lazily (on read) using UTC timestamps, consistent with the lifeform building/tech queues.
/// </summary>
public static class LifeformDiscoveryStore
{
    private static readonly ConcurrentDictionary<Guid, UserLifeformDiscoveryState> Users = new();

    private static readonly System.Text.Json.JsonSerializerOptions JsonOpts = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public static UserLifeformDiscoveryState Get(Guid userId) => Users.GetOrAdd(userId, _ => new UserLifeformDiscoveryState());

    public static void DeserializeDiscoveryState(UserLifeformDiscovery entity, UserLifeformDiscoveryState st)
    {
        lock (st.SyncRoot)
        {
            st.UnlockedSpecies.Clear();
            if (!string.IsNullOrWhiteSpace(entity.UnlockedSpeciesJson))
            {
                try
                {
                    var list = System.Text.Json.JsonSerializer.Deserialize<List<string>>(entity.UnlockedSpeciesJson, JsonOpts);
                    if (list != null) st.UnlockedSpecies.AddRange(list);
                }
                catch { }
            }
            if (!st.UnlockedSpecies.Contains("humans", StringComparer.OrdinalIgnoreCase))
            {
                st.UnlockedSpecies.Add("humans");
            }

            st.ScoutedCoordinates.Clear();
            if (!string.IsNullOrWhiteSpace(entity.ScoutedCoordinatesJson))
            {
                try
                {
                    var dict = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, DateTime>>(entity.ScoutedCoordinatesJson, JsonOpts);
                    if (dict != null)
                    {
                        foreach (var kvp in dict) st.ScoutedCoordinates[kvp.Key] = kvp.Value;
                    }
                }
                catch { }
            }

            st.Missions.Clear();
            if (!string.IsNullOrWhiteSpace(entity.MissionsJson))
            {
                try
                {
                    var ms = System.Text.Json.JsonSerializer.Deserialize<List<LifeformDiscoveryMissionState>>(entity.MissionsJson, JsonOpts);
                    if (ms != null) st.Missions.AddRange(ms);
                }
                catch { }
            }

            st.StoredFlights = entity.StoredFlights;
            st.LastRefillUtc = entity.LastRefillUtc;
        }
    }

    public static void SyncDiscoveryEntity(UserLifeformDiscovery entity, UserLifeformDiscoveryState st)
    {
        lock (st.SyncRoot)
        {
            entity.UnlockedSpeciesJson = System.Text.Json.JsonSerializer.Serialize(st.UnlockedSpecies, JsonOpts);
            entity.ScoutedCoordinatesJson = System.Text.Json.JsonSerializer.Serialize(st.ScoutedCoordinates, JsonOpts);
            entity.MissionsJson = System.Text.Json.JsonSerializer.Serialize(st.Missions, JsonOpts);
            entity.StoredFlights = st.StoredFlights;
            entity.LastRefillUtc = st.LastRefillUtc;
            entity.UpdatedAtUtc = DateTime.UtcNow;
        }
    }

    public static async Task<UserLifeformDiscoveryState> GetOrLoadAsync(Guid userId, IApplicationDbContext dbContext, CancellationToken ct = default)
    {
        if (!Users.TryGetValue(userId, out var st))
        {
            st = new UserLifeformDiscoveryState();
            var entity = await dbContext.UserLifeformDiscoveries
                .FirstOrDefaultAsync(u => u.UserId == userId, ct);

            if (entity is not null)
            {
                DeserializeDiscoveryState(entity, st);
            }
            else
            {
                entity = new UserLifeformDiscovery { UserId = userId };
                SyncDiscoveryEntity(entity, st);
                dbContext.UserLifeformDiscoveries.Add(entity);
                try { await dbContext.SaveChangesAsync(ct); } catch { }
            }

            Users[userId] = st;
        }

        return st;
    }

    public static async Task SaveAsync(Guid userId, UserLifeformDiscoveryState st, IApplicationDbContext dbContext, CancellationToken ct = default)
    {
        Users[userId] = st;
        var entity = await dbContext.UserLifeformDiscoveries
            .FirstOrDefaultAsync(u => u.UserId == userId, ct);

        if (entity is null)
        {
            entity = new UserLifeformDiscovery { UserId = userId };
            SyncDiscoveryEntity(entity, st);
            dbContext.UserLifeformDiscoveries.Add(entity);
        }
        else
        {
            SyncDiscoveryEntity(entity, st);
        }

        await dbContext.SaveChangesAsync(ct);
    }

    public static List<string> GetUnlockedSpecies(Guid userId) => Get(userId).UnlockedSpecies;

    public static bool IsSpeciesUnlocked(Guid userId, string speciesId)
    {
        var norm = PlanetLifeformMemoryState.NormalizeSpeciesId(speciesId);
        var st = Get(userId);
        lock (st.SyncRoot)
        {
            return st.UnlockedSpecies.Any(s => s.Equals(norm, StringComparison.OrdinalIgnoreCase));
        }
    }

    public static string CoordinateKey(int g, int s, int p) => $"{g}:{s}:{p}";

    public static int GetAvailableFlights(UserLifeformDiscoveryState st, DateTime nowUtc)
    {
        int flights = LifeformDiscoveryFormulas.CalculateAvailableFlights(st.StoredFlights, st.LastRefillUtc, nowUtc, out var newRefill);
        st.StoredFlights = flights;
        st.LastRefillUtc = newRefill;
        return flights;
    }

    public static int CountActiveMissions(Guid userId, DateTime nowUtc)
    {
        var st = Get(userId);
        lock (st.SyncRoot)
        {
            return st.Missions.Count(m => !m.IsCompleted && m.ArrivalUtc > nowUtc);
        }
    }

    /// <summary>
    /// Resolves all arrived Mor DNA missions for the user: unlocks species (empire-wide), awards XP/artefacts to the origin planet.
    /// </summary>
    public static void ResolveArrivedMissions(Guid userId, DateTime nowUtc)
    {
        var st = Get(userId);
        lock (st.SyncRoot)
        {
            foreach (var mission in st.Missions.Where(m => !m.IsCompleted && m.ArrivalUtc <= nowUtc))
            {
                PlanetEndpoints.PlanetLifeformsStore.TryGetValue(mission.OriginPlanetId, out var originState);
                int currentArtefacts = originState?.ArtifactCount ?? 0;

                var rng = new Random(HashCode.Combine(mission.Id, mission.ArrivalUtc.Ticks));
                var outcome = LifeformDiscoveryFormulas.ResolveOutcome(st.UnlockedSpecies, rng, currentArtefacts);

                switch (outcome.Type)
                {
                    case LifeformDiscoveryOutcomeType.NewSpeciesDiscovered when outcome.SpeciesId is not null:
                        if (!st.UnlockedSpecies.Contains(outcome.SpeciesId, StringComparer.OrdinalIgnoreCase))
                        {
                            st.UnlockedSpecies.Add(outcome.SpeciesId);
                        }
                        break;
                    case LifeformDiscoveryOutcomeType.ExperienceGained when originState is not null:
                        originState.CurrentXp = Math.Min(originState.MaxXp, originState.CurrentXp + outcome.Experience);
                        break;
                    case LifeformDiscoveryOutcomeType.ArtefactsFound when originState is not null:
                        originState.ArtifactCount = LifeformDiscoveryFormulas.ApplyArtefactAward(originState.ArtifactCount, outcome.Artefacts);
                        break;
                }

                mission.IsCompleted = true;
                mission.OutcomeType = outcome.Type.ToString();
                mission.DiscoveredSpecies = outcome.SpeciesId;
                mission.Experience = outcome.Experience;
                mission.Artefacts = outcome.Artefacts;
                mission.Narrative = outcome.Narrative;
            }

            // Keep only the latest 20 completed reports
            var completed = st.Missions.Where(m => m.IsCompleted).OrderByDescending(m => m.ArrivalUtc).Skip(20).ToList();
            foreach (var old in completed) st.Missions.Remove(old);
        }
    }

    public static object BuildStatusDto(Guid userId, DateTime nowUtc)
    {
        ResolveArrivedMissions(userId, nowUtc);
        var st = Get(userId);
        lock (st.SyncRoot)
        {
            return new
            {
                UnlockedSpecies = st.UnlockedSpecies.ToList(),
                AvailableFlights = GetAvailableFlights(st, nowUtc),
                Missions = st.Missions
                    .OrderByDescending(m => m.StartTimeUtc)
                    .Select(m => new
                    {
                        m.Id,
                        m.MissionType,
                        m.OriginPlanetId,
                        TargetCoordinates = $"[{m.TargetGalaxy}:{m.TargetSystem}:{m.TargetSlot}]",
                        m.TargetGalaxy,
                        m.TargetSystem,
                        m.TargetSlot,
                        StartTimeUtc = m.StartTimeUtc.ToString("O"),
                        ArrivalUtc = m.ArrivalUtc.ToString("O"),
                        m.IsCompleted,
                        m.OutcomeType,
                        m.DiscoveredSpecies,
                        m.Experience,
                        m.Artefacts,
                        m.Narrative
                    })
                    .ToList(),
                ScoutedCoordinates = st.ScoutedCoordinates
                    .Where(kv => LifeformDiscoveryFormulas.IsCoordinateOnCooldown(kv.Value, nowUtc))
                    .ToDictionary(kv => kv.Key, kv => kv.Value.ToString("O"))
            };
        }
    }
}

public static class LifeformDiscoveryEndpoints
{
    public static IEndpointRouteBuilder MapLifeformDiscoveryEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/lifeforms").WithTags("Lifeforms");

        // GET /api/lifeforms/planet/{id}/discovery — Mor DNA status (unlocked species, missions, cooldowns, flights)
        group.MapGet("/planet/{id}/discovery", async (
            string id,
            IApplicationDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var planet = await ResolvePlanetAsync(id, dbContext, cancellationToken);
            if (planet is null) return Results.NotFound(new { Message = $"Planet {id} not found." });
            var userState = await LifeformDiscoveryStore.GetOrLoadAsync(planet.UserId, dbContext, cancellationToken);
            LifeformDiscoveryStore.ResolveArrivedMissions(planet.UserId, DateTime.UtcNow);
            await LifeformDiscoveryStore.SaveAsync(planet.UserId, userState, dbContext, cancellationToken);
            return Results.Ok(LifeformDiscoveryStore.BuildStatusDto(planet.UserId, DateTime.UtcNow));
        })
        .WithName("GetLifeformDiscoveryStatus");

        // POST /api/lifeforms/planet/{id}/discovery/dispatch — Galaxy-view Mor DNA lifeform exploration (LIFEFORM_DISCOVERY)
        group.MapPost("/planet/{id}/discovery/dispatch", async (
            string id,
            DispatchLifeformDiscoveryRequest request,
            IApplicationDbContext dbContext,
            IResourceCalculationService resourceService,
            IDistributedLockService lockService,
            CancellationToken cancellationToken) =>
        {
            var planet = await ResolvePlanetAsync(id, dbContext, cancellationToken);
            if (planet is null) return Results.NotFound(new { Message = $"Planet {id} not found." });

            await using var lockHandle = await lockService.AcquireLockAsync($"lock:planet:{planet.Id}", cancellationToken: cancellationToken);

            var now = DateTime.UtcNow;
            resourceService.ApplyLazyUpdate(planet, now);

            var state = await PlanetEndpoints.GetOrLoadPlanetLifeformStateAsync(planet, dbContext, cancellationToken);

            // Intergalactic Envoys = Humans tech slot 1 (highest level across the user's planets, empire-wide research)
            var userPlanetIds = await dbContext.Planets
                .Where(p => p.UserId == planet.UserId)
                .Select(p => p.Id)
                .ToListAsync(cancellationToken);
            int envoysLevel = userPlanetIds
                .Select(pid => PlanetEndpoints.PlanetLifeformsStore.TryGetValue(pid, out var s)
                    ? s.SpeciesTechLevels.GetValueOrDefault("humans")?.GetValueOrDefault(LifeformDiscoveryFormulas.IntergalacticEnvoysSlot, 0)
                      ?? (PlanetLifeformMemoryState.NormalizeSpeciesId(s.ActiveSpecies) == "humans"
                          ? s.TechLevels.GetValueOrDefault(LifeformDiscoveryFormulas.IntergalacticEnvoysSlot, 0) : 0)
                    : 0)
                .DefaultIfEmpty(0)
                .Max();
            // Active humans state keeps live levels in TechLevels; prefer the larger value
            if (PlanetLifeformMemoryState.NormalizeSpeciesId(state.ActiveSpecies) == "humans")
            {
                envoysLevel = Math.Max(envoysLevel, state.TechLevels.GetValueOrDefault(LifeformDiscoveryFormulas.IntergalacticEnvoysSlot, 0));
            }

            // Fleet slots: regular fleet missions + in-flight Mor DNA missions share the same slot pool
            int activeFleetMissions = await dbContext.FleetMissions
                .CountAsync(m => m.UserId == planet.UserId &&
                                 m.Status != FleetMissionStatus.Completed &&
                                 m.Status != FleetMissionStatus.Destroyed, cancellationToken);
            int computerTech = await dbContext.UserResearches
                .Where(r => r.UserId == planet.UserId && r.ResearchType == ResearchType.ComputerTechnology)
                .Select(r => r.Level)
                .FirstOrDefaultAsync(cancellationToken);
            var playerClass = await dbContext.Users
                .Where(u => u.Id == planet.UserId)
                .Select(u => u.PlayerClass)
                .FirstOrDefaultAsync(cancellationToken);
            int maxFleets = 1 + computerTech + (playerClass == PlayerClass.General ? PlayerClassFormulas.GeneralExtraFleetSlots : 0);
            int activeFleets = activeFleetMissions + LifeformDiscoveryStore.CountActiveMissions(planet.UserId, now);

            var userState = await LifeformDiscoveryStore.GetOrLoadAsync(planet.UserId, dbContext, cancellationToken);
            string coordKey = LifeformDiscoveryStore.CoordinateKey(request.Galaxy, request.System, request.Slot);

            LifeformDiscoveryMissionState mission;
            lock (userState.SyncRoot)
            {
                int flights = LifeformDiscoveryStore.GetAvailableFlights(userState, now);
                DateTime? lastScouted = userState.ScoutedCoordinates.TryGetValue(coordKey, out var ls) ? ls : null;

                var validation = LifeformDiscoveryFormulas.ValidateDispatch(
                    envoysLevel, request.Slot, activeFleets, maxFleets, flights,
                    planet.Metal, planet.Crystal, planet.Deuterium, lastScouted, now);

                if (!validation.CanDispatch)
                {
                    return Results.BadRequest(new { Message = validation.Reason });
                }

                var cost = LifeformsSpeciesFormulas.ExplorationFlightCost;
                planet.Metal -= cost.Metal;
                planet.Crystal -= cost.Crystal;
                planet.Deuterium -= cost.Deuterium;

                int flightSec = LifeformDiscoveryFormulas.CalculateFlightSeconds(planet.Galaxy, planet.System, request.Galaxy, request.System);
                mission = new LifeformDiscoveryMissionState
                {
                    OriginPlanetId = planet.Id,
                    TargetGalaxy = request.Galaxy,
                    TargetSystem = request.System,
                    TargetSlot = request.Slot,
                    StartTimeUtc = now,
                    ArrivalUtc = now.AddSeconds(flightSec)
                };
                userState.Missions.Add(mission);
                userState.ScoutedCoordinates[coordKey] = now;
                userState.StoredFlights = flights - 1;
            }

            // Directive 6 / Quest 5: "Bir keşif filosu gönder" — only completed by Mor DNA (LIFEFORM_DISCOVERY) dispatch
            var d6 = await dbContext.UserTutorialProgresses
                .FirstOrDefaultAsync(p => p.UserId == planet.UserId && p.DirectiveId == 6, cancellationToken);
            if (d6 is not null && d6.CurrentQuestStep == 5)
            {
                d6.SubStepBitmask = DirectiveLifeformsFormulas.ProcessEvent(5, d6.SubStepBitmask, "mission_dispatched:LIFEFORM_DISCOVERY");
                d6.UpdatedAtUtc = now;
            }

            await dbContext.SaveChangesAsync(cancellationToken);
            await LifeformDiscoveryStore.SaveAsync(planet.UserId, userState, dbContext, cancellationToken);

            return Results.Ok(new
            {
                Success = true,
                MissionId = mission.Id,
                mission.MissionType,
                ArrivalUtc = mission.ArrivalUtc.ToString("O"),
                Status = LifeformDiscoveryStore.BuildStatusDto(planet.UserId, now)
            });
        })
        .WithName("DispatchLifeformDiscovery");

        return app;
    }

    private static async Task<Planet?> ResolvePlanetAsync(string id, IApplicationDbContext dbContext, CancellationToken ct)
    {
        if (Guid.TryParse(id, out var guid))
        {
            return await dbContext.Planets.FirstOrDefaultAsync(p => p.Id == guid, ct);
        }

        return await dbContext.Planets
            .Where(p => p.IsCapital)
            .FirstOrDefaultAsync(ct);
    }
}

