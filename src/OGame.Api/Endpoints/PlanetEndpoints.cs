using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using OGame.Api.Hubs;
using OGame.Application.Common.Interfaces;
using OGame.Application.Interfaces;
using OGame.Domain.Entities;
using OGame.Domain.Enums;
using OGame.Domain.Services;

namespace OGame.Api.Endpoints;

public record DarkMatterSpeedupRequest(Guid? QueueItemId = null);
public record EnqueueBuildingRequest(BuildingType BuildingType);
public record EnqueueResearchRequest(Guid UserId, Guid OriginPlanetId, ResearchType ResearchType);
public record EnqueueShipyardBatchRequest(UnitType UnitType, int Count);
public record AbandonPlanetRequest(Guid UserId, string Password);
public record RenamePlanetRequest(string NewName);
public record PlanetResourceSettingsDto(
    int MetalMinePercent = 100,
    int CrystalMinePercent = 100,
    int DeuteriumSynthesizerPercent = 100,
    int SolarPlantPercent = 100,
    int FusionReactorPercent = 100,
    int SolarSatellitePercent = 100,
    int CrawlerPercent = 100);

public record EnqueueLifeformBuildingRequest(
    string BuildingKey,
    string BuildingName,
    double MetalCost,
    double CrystalCost,
    double DeuteriumCost,
    int DurationSeconds);

public record EnqueueLifeformTechRequest(
    int Slot,
    string? TechName,
    double MetalCost,
    double CrystalCost,
    double DeuteriumCost,
    int DurationSeconds);

public record SelectSpeciesRequest(string SpeciesId);
public record SelectSlotTechRequest(int Slot, string SpeciesId);

public record ActiveLifeformQueueDto(
    string BuildingKey,
    string BuildingName,
    int TargetLevel,
    string StartTimeUtc,
    string EndTimeUtc,
    double RefundMetal,
    double RefundCrystal,
    double RefundDeuterium);

public record ActiveLifeformTechQueueDto(
    int Slot,
    string TechName,
    int TargetLevel,
    string StartTimeUtc,
    string EndTimeUtc,
    double RefundMetal,
    double RefundCrystal,
    double RefundDeuterium);

public class PlanetLifeformMemoryState
{
    public string ActiveSpecies { get; set; } = "humans";
    public bool IsActive { get; set; } = true;
    public int SpeciesLevel { get; set; } = 0;
    public int CurrentXp { get; set; } = 0;
    public int MaxXp { get; set; } = 900;
    public int TechBonusPercent { get; set; } = 0;
    public int ArtifactCount { get; set; } = 420;
    public int MaxArtifacts { get; set; } = 3600;
    public Dictionary<string, int> BuildingLevels { get; set; } = new()
    {
        ["residentialSector"] = 2,
        ["biosphereFarm"] = 2,
        ["researchCentre"] = 1,
        ["academyOfSciences"] = 0,
        ["neuroCalibrationCentre"] = 0,
        ["highEnergySmelting"] = 0,
        ["foodSilo"] = 0,
        ["fusionPoweredProduction"] = 0,
        ["skyscraper"] = 0,
        ["biotechLab"] = 0,
        ["metropolis"] = 0,
        ["planetaryShield"] = 0
    };
    public Dictionary<int, int> TechLevels { get; set; } = new();
    public Dictionary<string, Dictionary<string, int>> SpeciesBuildingLevels { get; set; } = new(StringComparer.OrdinalIgnoreCase)
    {
        ["humans"] = new Dictionary<string, int>
        {
            ["residentialSector"] = 2,
            ["biosphereFarm"] = 2,
            ["researchCentre"] = 1,
            ["academyOfSciences"] = 0,
            ["neuroCalibrationCentre"] = 0,
            ["highEnergySmelting"] = 0,
            ["foodSilo"] = 0,
            ["fusionPoweredProduction"] = 0,
            ["skyscraper"] = 0,
            ["biotechLab"] = 0,
            ["metropolis"] = 0,
            ["planetaryShield"] = 0
        },
        ["rocktal"] = new Dictionary<string, int>
        {
            ["meditationEnclave"] = 0,
            ["crystalFarm"] = 0,
            ["runeTechnologicalInstitute"] = 0,
            ["runicAuditorium"] = 0,
            ["meltChamber"] = 0,
            ["magmaForge"] = 0,
            ["ionicCrystalChamber"] = 0,
            ["mineralConverter"] = 0,
            ["megalithStructures"] = 0,
            ["magmaPowerReactor"] = 0,
            ["geothermalCentre"] = 0,
            ["titaniumBulwark"] = 0
        },
        ["mechas"] = new Dictionary<string, int>
        {
            ["productionLine"] = 0,
            ["bioConverter"] = 0,
            ["coreMatrix"] = 0,
            ["algorithmHub"] = 0,
            ["quantumChamber"] = 0,
            ["nanoAssemblyLine"] = 0,
            ["backupPowerCell"] = 0,
            ["advancedRecycler"] = 0,
            ["factoryCity"] = 0,
            ["superconductingDistributor"] = 0,
            ["automatedShipyardNetwork"] = 0,
            ["magneticDefenseDome"] = 0
        },
        ["kaelesh"] = new Dictionary<string, int>
        {
            ["sanctuary"] = 0,
            ["luminescentGarden"] = 0,
            ["cosmicResonator"] = 0,
            ["highTemple"] = 0,
            ["divinationChamber"] = 0,
            ["interdimensionalMine"] = 0,
            ["psionicEnergyCrystal"] = 0,
            ["terraformingLab"] = 0,
            ["floatingCities"] = 0,
            ["vortexReactor"] = 0,
            ["spatiotemporalCrystal"] = 0,
            ["auricProtectionNetwork"] = 0
        }
    };
    public Dictionary<string, Dictionary<int, int>> SpeciesTechLevels { get; set; } = new(StringComparer.OrdinalIgnoreCase)
    {
        ["humans"] = new Dictionary<int, int>(),
        ["rocktal"] = new Dictionary<int, int>(),
        ["mechas"] = new Dictionary<int, int>(),
        ["kaelesh"] = new Dictionary<int, int>()
    };
    public Dictionary<int, string> SlotSpecies { get; set; } = new()
    {
        [1] = "humans", [2] = "humans", [3] = "humans", [4] = "humans", [5] = "humans", [6] = "humans",
        [7] = "humans", [8] = "humans", [9] = "humans", [10] = "humans", [11] = "humans", [12] = "humans",
        [13] = "humans", [14] = "humans", [15] = "humans", [16] = "humans", [17] = "humans", [18] = "humans"
    };
    // Task 05BP: Only Humans are unlocked at game start. This list instance is shared per user
    // (see LifeformDiscoveryStore) so a discovery on one planet unlocks the species empire-wide.
    public List<string> UnlockedSpecies { get; set; } = new() { "humans" };
    public Guid OwnerUserId { get; set; }
    public ActiveLifeformQueueDto? ActiveQueue { get; set; }
    public ActiveLifeformTechQueueDto? ActiveTechQueue { get; set; }

    public void SwitchSpecies(string newSpeciesId)
    {
        string normNew = NormalizeSpeciesId(newSpeciesId);
        string normCurrent = NormalizeSpeciesId(ActiveSpecies);

        // Save current building and tech levels into species stores only if previously had an assigned species
        if (!string.IsNullOrWhiteSpace(ActiveSpecies) && !ActiveSpecies.Equals("none", StringComparison.OrdinalIgnoreCase))
        {
            SpeciesBuildingLevels[normCurrent] = new Dictionary<string, int>(BuildingLevels);
            SpeciesTechLevels[normCurrent] = new Dictionary<int, int>(TechLevels);
        }

        // Switch active species
        ActiveSpecies = normNew;
        IsActive = true;

        // Restore target species building levels
        if (!SpeciesBuildingLevels.TryGetValue(normNew, out var targetBuildings))
        {
            targetBuildings = new Dictionary<string, int>();
            SpeciesBuildingLevels[normNew] = targetBuildings;
        }
        BuildingLevels = new Dictionary<string, int>(targetBuildings);

        // Restore target species tech levels
        if (!SpeciesTechLevels.TryGetValue(normNew, out var targetTechs))
        {
            targetTechs = new Dictionary<int, int>();
            SpeciesTechLevels[normNew] = targetTechs;
        }
        TechLevels = new Dictionary<int, int>(targetTechs);
    }

    public static string NormalizeSpeciesId(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return "humans";
        string s = raw.Trim().ToLowerInvariant();
        if (s.Contains("rock")) return "rocktal";
        if (s.Contains("mech") || s.Contains("meka")) return "mechas";
        if (s.Contains("kaelesh")) return "kaelesh";
        return "humans";
    }
}

public static class PlanetEndpoints
{
    internal static readonly System.Collections.Concurrent.ConcurrentDictionary<Guid, PlanetResourceSettingsDto> PlanetSettingsStore = new();
    internal static readonly System.Collections.Concurrent.ConcurrentDictionary<Guid, PlanetLifeformMemoryState> PlanetLifeformsStore = new();

    private static readonly System.Text.Json.JsonSerializerOptions LifeformJsonOpts = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public static PlanetLifeformMemoryState DeserializeLifeformState(PlanetLifeformProgress p, Planet planet)
    {
        var state = new PlanetLifeformMemoryState
        {
            ActiveSpecies = p.ActiveSpecies,
            IsActive = p.IsActive,
            SpeciesLevel = p.SpeciesLevel,
            CurrentXp = p.CurrentXp,
            MaxXp = p.MaxXp,
            TechBonusPercent = p.TechBonusPercent,
            ArtifactCount = p.ArtifactCount,
            MaxArtifacts = p.MaxArtifacts,
            OwnerUserId = planet.UserId,
            UnlockedSpecies = LifeformDiscoveryStore.GetUnlockedSpecies(planet.UserId)
        };

        if (!string.IsNullOrWhiteSpace(p.BuildingLevelsJson))
        {
            try { state.BuildingLevels = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, int>>(p.BuildingLevelsJson, LifeformJsonOpts) ?? new(); } catch { }
        }
        if (!string.IsNullOrWhiteSpace(p.TechLevelsJson))
        {
            try { state.TechLevels = System.Text.Json.JsonSerializer.Deserialize<Dictionary<int, int>>(p.TechLevelsJson, LifeformJsonOpts) ?? new(); } catch { }
        }
        if (!string.IsNullOrWhiteSpace(p.SpeciesBuildingLevelsJson))
        {
            try { state.SpeciesBuildingLevels = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, Dictionary<string, int>>>(p.SpeciesBuildingLevelsJson, LifeformJsonOpts) ?? new(StringComparer.OrdinalIgnoreCase); } catch { }
        }
        if (!string.IsNullOrWhiteSpace(p.SpeciesTechLevelsJson))
        {
            try { state.SpeciesTechLevels = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, Dictionary<int, int>>>(p.SpeciesTechLevelsJson, LifeformJsonOpts) ?? new(StringComparer.OrdinalIgnoreCase); } catch { }
        }
        if (!string.IsNullOrWhiteSpace(p.SlotSpeciesJson))
        {
            try { state.SlotSpecies = System.Text.Json.JsonSerializer.Deserialize<Dictionary<int, string>>(p.SlotSpeciesJson, LifeformJsonOpts) ?? new(); } catch { }
        }
        if (!string.IsNullOrWhiteSpace(p.ActiveQueueJson))
        {
            try { state.ActiveQueue = System.Text.Json.JsonSerializer.Deserialize<ActiveLifeformQueueDto>(p.ActiveQueueJson, LifeformJsonOpts); } catch { }
        }
        if (!string.IsNullOrWhiteSpace(p.ActiveTechQueueJson))
        {
            try { state.ActiveTechQueue = System.Text.Json.JsonSerializer.Deserialize<ActiveLifeformTechQueueDto>(p.ActiveTechQueueJson, LifeformJsonOpts); } catch { }
        }

        return state;
    }

    public static void SyncLifeformEntity(PlanetLifeformProgress p, PlanetLifeformMemoryState state)
    {
        p.ActiveSpecies = state.ActiveSpecies;
        p.IsActive = state.IsActive;
        p.SpeciesLevel = state.SpeciesLevel;
        p.CurrentXp = state.CurrentXp;
        p.MaxXp = state.MaxXp;
        p.TechBonusPercent = state.TechBonusPercent;
        p.ArtifactCount = state.ArtifactCount;
        p.MaxArtifacts = state.MaxArtifacts;
        p.BuildingLevelsJson = System.Text.Json.JsonSerializer.Serialize(state.BuildingLevels, LifeformJsonOpts);
        p.TechLevelsJson = System.Text.Json.JsonSerializer.Serialize(state.TechLevels, LifeformJsonOpts);
        p.SpeciesBuildingLevelsJson = System.Text.Json.JsonSerializer.Serialize(state.SpeciesBuildingLevels, LifeformJsonOpts);
        p.SpeciesTechLevelsJson = System.Text.Json.JsonSerializer.Serialize(state.SpeciesTechLevels, LifeformJsonOpts);
        p.SlotSpeciesJson = System.Text.Json.JsonSerializer.Serialize(state.SlotSpecies, LifeformJsonOpts);
        p.ActiveQueueJson = state.ActiveQueue is not null ? System.Text.Json.JsonSerializer.Serialize(state.ActiveQueue, LifeformJsonOpts) : null;
        p.ActiveTechQueueJson = state.ActiveTechQueue is not null ? System.Text.Json.JsonSerializer.Serialize(state.ActiveTechQueue, LifeformJsonOpts) : null;
        p.UpdatedAtUtc = DateTime.UtcNow;
    }

    public static async Task<PlanetLifeformMemoryState> GetOrLoadPlanetLifeformStateAsync(
        Planet planet,
        IApplicationDbContext dbContext,
        CancellationToken ct = default)
    {
        if (!PlanetLifeformsStore.TryGetValue(planet.Id, out var state))
        {
            var entity = await dbContext.PlanetLifeforms
                .FirstOrDefaultAsync(x => x.PlanetId == planet.Id, ct);

            if (entity is not null)
            {
                state = DeserializeLifeformState(entity, planet);
            }
            else
            {
                state = CreatePlanetLifeformState(planet);
                entity = new PlanetLifeformProgress { PlanetId = planet.Id };
                SyncLifeformEntity(entity, state);
                dbContext.PlanetLifeforms.Add(entity);
                try
                {
                    await dbContext.SaveChangesAsync(ct);
                }
                catch
                {
                    // Ignore concurrent creation
                }
            }

            PlanetLifeformsStore[planet.Id] = state;
        }

        var now = DateTime.UtcNow;
        if (EvaluateLifeformQueueCompletion(state, now.AddSeconds(1)))
        {
            await SavePlanetLifeformStateAsync(planet.Id, state, dbContext, ct);
        }

        return state;
    }

    public static async Task SavePlanetLifeformStateAsync(
        Guid planetId,
        PlanetLifeformMemoryState state,
        IApplicationDbContext dbContext,
        CancellationToken ct = default)
    {
        PlanetLifeformsStore[planetId] = state;
        var entity = await dbContext.PlanetLifeforms
            .FirstOrDefaultAsync(x => x.PlanetId == planetId, ct);

        if (entity is null)
        {
            entity = new PlanetLifeformProgress { PlanetId = planetId };
            SyncLifeformEntity(entity, state);
            dbContext.PlanetLifeforms.Add(entity);
        }
        else
        {
            SyncLifeformEntity(entity, state);
        }

        await dbContext.SaveChangesAsync(ct);
    }

    public static PlanetLifeformMemoryState CreatePlanetLifeformState(Planet planet)
    {
        var state = CreatePlanetLifeformState(planet.IsCapital);
        state.OwnerUserId = planet.UserId;
        // Share the user-level unlocked species list across all planets of the same empire
        state.UnlockedSpecies = LifeformDiscoveryStore.GetUnlockedSpecies(planet.UserId);
        return state;
    }

    public static PlanetLifeformMemoryState CreatePlanetLifeformState(bool isCapital)
    {
        if (isCapital)
        {
            return new PlanetLifeformMemoryState();
        }

        return new PlanetLifeformMemoryState
        {
            ActiveSpecies = "none",
            IsActive = false,
            SpeciesLevel = 0,
            CurrentXp = 0,
            MaxXp = 900,
            TechBonusPercent = 0,
            ArtifactCount = 0,
            MaxArtifacts = 3600,
            BuildingLevels = new Dictionary<string, int>(),
            TechLevels = new Dictionary<int, int>(),
            SpeciesBuildingLevels = new Dictionary<string, Dictionary<string, int>>(StringComparer.OrdinalIgnoreCase)
            {
                ["humans"] = new(),
                ["rocktal"] = new(),
                ["mechas"] = new(),
                ["kaelesh"] = new()
            },
            SpeciesTechLevels = new Dictionary<string, Dictionary<int, int>>(StringComparer.OrdinalIgnoreCase)
            {
                ["humans"] = new(),
                ["rocktal"] = new(),
                ["mechas"] = new(),
                ["kaelesh"] = new()
            },
            SlotSpecies = new Dictionary<int, string>(),
            UnlockedSpecies = new List<string> { "humans" }
        };
    }

    public static IEndpointRouteBuilder MapPlanetEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/planets")
            .WithTags("Planets");

        group.MapGet("/{planetId:guid}/resources", async (
            Guid planetId,
            IApplicationDbContext dbContext,
            IResourceCalculationService resourceService,
            CancellationToken cancellationToken) =>
        {
            var planet = await dbContext.Planets
                .AsNoTracking()
                .Include(p => p.User)
                    .ThenInclude(u => u!.Researches)
                .Include(p => p.Buildings)
                .FirstOrDefaultAsync(p => p.Id == planetId, cancellationToken);

            if (planet is null)
            {
                return Results.NotFound(new { Message = $"Planet {planetId} not found." });
            }

            double fusionFactor = 1.0;
            if (PlanetSettingsStore.TryGetValue(planet.Id, out var pSettings))
            {
                fusionFactor = pSettings.FusionReactorPercent / 100.0;
            }

            var state = resourceService.GetCurrentResources(planet, DateTime.UtcNow, fusionFactor);
            return Results.Ok(state);
        })
        .WithName("GetPlanetResources");

        group.MapGet("/{planetId:guid}", async (
            Guid planetId,
            IApplicationDbContext dbContext,
            IResourceCalculationService resourceService,
            IShipyardService shipyardService,
            IActivityService activityService,
            CancellationToken cancellationToken) =>
        {
            var planet = await dbContext.Planets
                .AsNoTracking()
                .Include(p => p.User)
                    .ThenInclude(u => u!.Researches)
                .Include(p => p.Buildings)
                .Include(p => p.BuildingQueue)
                .FirstOrDefaultAsync(p => p.Id == planetId, cancellationToken);

            if (planet is null)
            {
                return Results.NotFound(new { Message = $"Planet {planetId} not found." });
            }

            var now = DateTime.UtcNow;
            await activityService.RecordActivityAsync(
                planet.Galaxy,
                planet.System,
                planet.Slot,
                planet.IsMoon ? CoordinateType.Moon : CoordinateType.Planet,
                new DateTimeOffset(now, TimeSpan.Zero),
                cancellationToken);

            double fusionFactor = 1.0;
            if (PlanetSettingsStore.TryGetValue(planet.Id, out var pSettings))
            {
                fusionFactor = pSettings.FusionReactorPercent / 100.0;
            }

            var resources = resourceService.GetCurrentResources(planet, now, fusionFactor);
            var shipyardState = await shipyardService.EvaluatePlanetShipyardQueueAsync(planetId, now, cancellationToken);

            return Results.Ok(new
            {
                planet.Id,
                planet.UserId,
                planet.Name,
                planet.Galaxy,
                planet.System,
                planet.Slot,
                planet.TempMin,
                planet.TempMax,
                planet.Diameter,
                planet.FieldsUsed,
                planet.MaxFields,
                planet.LastResourceUpdateUtc,
                Resources = resources,
                Buildings = planet.Buildings.Select(b => new
                {
                    b.Id,
                    b.BuildingType,
                    b.Level
                }),
                BuildingQueue = planet.BuildingQueue.Select(q => new
                {
                    q.Id,
                    q.BuildingType,
                    q.TargetLevel,
                    q.StartTimeUtc,
                    q.EndTimeUtc,
                    q.HangfireJobId
                }),
                ShipyardQueue = shipyardState.ActiveQueueItems.Select(q => new
                {
                    q.Id,
                    q.UnitType,
                    q.TotalCount,
                    q.CompletedCount,
                    q.UnitDurationSeconds,
                    q.BatchStartTimeUtc,
                    q.NextUnitFinishUtc,
                    q.HangfireBatchJobId
                }),
                Units = shipyardState.StationedUnits.Select(u => new
                {
                    u.Id,
                    u.UnitType,
                    u.Count
                })
            });
        })
        .WithName("GetPlanetById");

        group.MapPost("/{planetId:guid}/buildings/upgrade", async (
            Guid planetId,
            EnqueueBuildingRequest request,
            IBuildingService buildingService,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var item = await buildingService.EnqueueBuildingUpgradeAsync(planetId, request.BuildingType, cancellationToken);
                return Results.Ok(new
                {
                    item.Id,
                    item.PlanetId,
                    item.BuildingType,
                    item.TargetLevel,
                    item.StartTimeUtc,
                    item.EndTimeUtc,
                    item.HangfireJobId
                });
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { Message = ex.Message });
            }
        })
        .WithName("EnqueueBuildingUpgrade");

        group.MapPost("/{planetId:guid}/buildings/demolish", async (
            Guid planetId,
            EnqueueBuildingRequest request,
            IBuildingService buildingService,
            IApplicationDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var item = await buildingService.EnqueueBuildingDemolishAsync(planetId, request.BuildingType, cancellationToken);

                // Check Directive 3 Quest 3 progress (Demolish a building)
                var planet = await dbContext.Planets.AsNoTracking().FirstOrDefaultAsync(p => p.Id == planetId, cancellationToken);
                if (planet != null)
                {
                    var d3Progress = await dbContext.UserTutorialProgresses
                        .FirstOrDefaultAsync(p => p.UserId == planet.UserId && p.DirectiveId == 3, cancellationToken);
                    if (d3Progress != null && d3Progress.CurrentQuestStep == 3)
                    {
                        d3Progress.SubStepBitmask = DirectiveKnowledgePowerFormulas.ProcessEvent(3, d3Progress.SubStepBitmask, "building_demolished");
                        d3Progress.UpdatedAtUtc = DateTime.UtcNow;
                        await dbContext.SaveChangesAsync(cancellationToken);
                    }
                }

                return Results.Ok(new
                {
                    item.Id,
                    item.PlanetId,
                    item.BuildingType,
                    item.TargetLevel,
                    item.StartTimeUtc,
                    item.EndTimeUtc,
                    item.HangfireJobId,
                    IsDemolition = true
                });
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { Message = ex.Message });
            }
        })
        .WithName("EnqueueBuildingDemolish");

        group.MapPost("/{planetId:guid}/shipyard/enqueue", async (
            Guid planetId,
            EnqueueShipyardBatchRequest request,
            IShipyardService shipyardService,
            IApplicationDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var batch = await shipyardService.EnqueueUnitBatchAsync(
                    planetId,
                    request.UnitType,
                    request.Count,
                    cancellationToken);

                // Directive 4 Quest 5 hook (Colony ship produced)
                if (request.UnitType == UnitType.ColonyShip)
                {
                    var p = await dbContext.Planets.AsNoTracking().FirstOrDefaultAsync(pl => pl.Id == planetId, cancellationToken);
                    if (p != null)
                    {
                        var d4Progress = await dbContext.UserTutorialProgresses
                            .FirstOrDefaultAsync(prog => prog.UserId == p.UserId && prog.DirectiveId == 4, cancellationToken);
                        if (d4Progress != null && d4Progress.CurrentQuestStep == 5)
                        {
                            d4Progress.SubStepBitmask = DirectiveDeepSpaceFormulas.ProcessEvent(5, d4Progress.SubStepBitmask, "colony_ship_produced");
                            d4Progress.UpdatedAtUtc = DateTime.UtcNow;
                            await dbContext.SaveChangesAsync(cancellationToken);
                        }
                    }
                }

                // Directive 5 hooks (Rocket Launcher, Light Laser, Heavy Laser, Heavy Fighter)
                var d5Event = request.UnitType switch
                {
                    UnitType.RocketLauncher => "rocket_launcher_produced",
                    UnitType.LightLaser => "light_laser_produced",
                    UnitType.HeavyLaser => "heavy_laser_produced",
                    UnitType.HeavyFighter => "heavy_fighter_produced",
                    _ => null
                };

                if (d5Event != null)
                {
                    var p = await dbContext.Planets.AsNoTracking().FirstOrDefaultAsync(pl => pl.Id == planetId, cancellationToken);
                    if (p != null)
                    {
                        var d5Progress = await dbContext.UserTutorialProgresses
                            .FirstOrDefaultAsync(prog => prog.UserId == p.UserId && prog.DirectiveId == 5, cancellationToken);
                        if (d5Progress != null)
                        {
                            int updatedMask = DirectiveSecureBordersFormulas.ProcessEvent(d5Progress.CurrentQuestStep, d5Progress.SubStepBitmask, d5Event);
                            if (updatedMask != d5Progress.SubStepBitmask)
                            {
                                d5Progress.SubStepBitmask = updatedMask;
                                d5Progress.UpdatedAtUtc = DateTime.UtcNow;
                                await dbContext.SaveChangesAsync(cancellationToken);
                            }
                        }
                    }
                }

                // Directive 7 hook (Recycler produced)
                if (request.UnitType == UnitType.Recycler)
                {
                    var p = await dbContext.Planets.AsNoTracking().FirstOrDefaultAsync(pl => pl.Id == planetId, cancellationToken);
                    if (p != null)
                    {
                        var d7Progress = await dbContext.UserTutorialProgresses
                            .FirstOrDefaultAsync(prog => prog.UserId == p.UserId && prog.DirectiveId == 7, cancellationToken);
                        if (d7Progress != null && d7Progress.CurrentQuestStep == 1)
                        {
                            int updatedMask = DirectiveMoreTipsFormulas.ProcessEvent(1, d7Progress.SubStepBitmask, "recycler_produced");
                            if (updatedMask != d7Progress.SubStepBitmask)
                            {
                                d7Progress.SubStepBitmask = updatedMask;
                                d7Progress.UpdatedAtUtc = DateTime.UtcNow;
                                await dbContext.SaveChangesAsync(cancellationToken);
                            }
                        }
                    }
                }

                return Results.Ok(new
                {
                    batch.Id,
                    batch.PlanetId,
                    batch.UnitType,
                    batch.TotalCount,
                    batch.CompletedCount,
                    batch.UnitDurationSeconds,
                    batch.BatchStartTimeUtc,
                    batch.NextUnitFinishUtc,
                    batch.HangfireBatchJobId
                });
            }
            catch (Exception ex) when (ex is InvalidOperationException or ArgumentOutOfRangeException)
            {
                return Results.BadRequest(new { Message = ex.Message });
            }
        })
        .WithName("EnqueueShipyardBatch");

        group.MapPost("/{planetId:guid}/shipyard/build", async (
            Guid planetId,
            EnqueueShipyardBatchRequest request,
            IShipyardService shipyardService,
            IApplicationDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var batch = await shipyardService.EnqueueUnitBatchAsync(
                    planetId,
                    request.UnitType,
                    request.Count,
                    cancellationToken);

                // Directive 4 Quest 5 hook (Colony ship produced)
                if (request.UnitType == UnitType.ColonyShip)
                {
                    var p = await dbContext.Planets.AsNoTracking().FirstOrDefaultAsync(pl => pl.Id == planetId, cancellationToken);
                    if (p != null)
                    {
                        var d4Progress = await dbContext.UserTutorialProgresses
                            .FirstOrDefaultAsync(prog => prog.UserId == p.UserId && prog.DirectiveId == 4, cancellationToken);
                        if (d4Progress != null && d4Progress.CurrentQuestStep == 5)
                        {
                            d4Progress.SubStepBitmask = DirectiveDeepSpaceFormulas.ProcessEvent(5, d4Progress.SubStepBitmask, "colony_ship_produced");
                            d4Progress.UpdatedAtUtc = DateTime.UtcNow;
                            await dbContext.SaveChangesAsync(cancellationToken);
                        }
                    }
                }

                // Directive 5 hooks (Rocket Launcher, Light Laser, Heavy Laser, Heavy Fighter)
                var d5Event = request.UnitType switch
                {
                    UnitType.RocketLauncher => "rocket_launcher_produced",
                    UnitType.LightLaser => "light_laser_produced",
                    UnitType.HeavyLaser => "heavy_laser_produced",
                    UnitType.HeavyFighter => "heavy_fighter_produced",
                    _ => null
                };

                if (d5Event != null)
                {
                    var p = await dbContext.Planets.AsNoTracking().FirstOrDefaultAsync(pl => pl.Id == planetId, cancellationToken);
                    if (p != null)
                    {
                        var d5Progress = await dbContext.UserTutorialProgresses
                            .FirstOrDefaultAsync(prog => prog.UserId == p.UserId && prog.DirectiveId == 5, cancellationToken);
                        if (d5Progress != null)
                        {
                            int updatedMask = DirectiveSecureBordersFormulas.ProcessEvent(d5Progress.CurrentQuestStep, d5Progress.SubStepBitmask, d5Event);
                            if (updatedMask != d5Progress.SubStepBitmask)
                            {
                                d5Progress.SubStepBitmask = updatedMask;
                                d5Progress.UpdatedAtUtc = DateTime.UtcNow;
                                await dbContext.SaveChangesAsync(cancellationToken);
                            }
                        }
                    }
                }

                // Directive 7 hook (Recycler produced)
                if (request.UnitType == UnitType.Recycler)
                {
                    var p = await dbContext.Planets.AsNoTracking().FirstOrDefaultAsync(pl => pl.Id == planetId, cancellationToken);
                    if (p != null)
                    {
                        var d7Progress = await dbContext.UserTutorialProgresses
                            .FirstOrDefaultAsync(prog => prog.UserId == p.UserId && prog.DirectiveId == 7, cancellationToken);
                        if (d7Progress != null && d7Progress.CurrentQuestStep == 1)
                        {
                            int updatedMask = DirectiveMoreTipsFormulas.ProcessEvent(1, d7Progress.SubStepBitmask, "recycler_produced");
                            if (updatedMask != d7Progress.SubStepBitmask)
                            {
                                d7Progress.SubStepBitmask = updatedMask;
                                d7Progress.UpdatedAtUtc = DateTime.UtcNow;
                                await dbContext.SaveChangesAsync(cancellationToken);
                            }
                        }
                    }
                }

                return Results.Ok(new
                {
                    batch.Id,
                    batch.PlanetId,
                    batch.UnitType,
                    batch.TotalCount,
                    batch.CompletedCount,
                    batch.UnitDurationSeconds,
                    batch.BatchStartTimeUtc,
                    batch.NextUnitFinishUtc,
                    batch.HangfireBatchJobId
                });
            }
            catch (Exception ex) when (ex is InvalidOperationException or ArgumentOutOfRangeException)
            {
                return Results.BadRequest(new { Message = ex.Message });
            }
        })
        .WithName("BuildShipyardBatch");

        group.MapPost("/{planetId}/shipyard/instant-complete", async (
            string planetId,
            DarkMatterSpeedupRequest? request,
            IApplicationDbContext dbContext,
            IDarkMatterService darkMatterService,
            IJobScheduler jobScheduler,
            IDistributedLockService lockService,
            IHubContext<GameHub> hubContext,
            CancellationToken cancellationToken) =>
        {
            var planet = await ResolvePlanetAsync(planetId, dbContext, cancellationToken);
            if (planet is null)
            {
                return Results.NotFound(new { Message = $"Planet {planetId} not found." });
            }

            string lockKey = $"lock:planet:{planet.Id}";
            await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

            var queueQuery = dbContext.ShipyardQueueItems.Where(q => q.PlanetId == planet.Id);
            if (request?.QueueItemId.HasValue == true)
            {
                queueQuery = queueQuery.Where(q => q.Id == request.QueueItemId.Value);
            }
            var batch = await queueQuery.OrderBy(q => q.BatchStartTimeUtc).FirstOrDefaultAsync(cancellationToken);

            if (batch is null)
            {
                return Results.NotFound(new { Message = "Bu gezegende aktif bir tersane üretimi bulunamadı." });
            }

            var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Id == planet.UserId, cancellationToken);
            if (user is null)
            {
                return Results.NotFound(new { Message = "Oyuncu bulunamadı." });
            }

            var now = DateTime.UtcNow;
            int remainingUnits = Math.Max(0, batch.TotalCount - batch.CompletedCount);
            double remainingSeconds = Math.Max(0, remainingUnits * batch.UnitDurationSeconds);
            int cost = darkMatterService.CalculateInstantCompletionCost(1, remainingSeconds);

            if (user.DarkMatter < cost)
            {
                return Results.BadRequest(new
                {
                    Message = $"Yetersiz Karanlık Madde. Gereken: {cost:N0} KM, Mevcut: {user.DarkMatter:N0} KM.",
                    Required = cost,
                    Available = user.DarkMatter
                });
            }

            user.DarkMatter -= cost;

            if (!string.IsNullOrEmpty(batch.HangfireBatchJobId))
            {
                jobScheduler.CancelScheduledJob(batch.HangfireBatchJobId);
            }

            var planetUnit = await dbContext.PlanetUnits
                .FirstOrDefaultAsync(u => u.PlanetId == planet.Id && u.UnitType == batch.UnitType, cancellationToken);
            if (planetUnit is null)
            {
                dbContext.PlanetUnits.Add(new PlanetUnit
                {
                    Id = Guid.NewGuid(),
                    PlanetId = planet.Id,
                    UnitType = batch.UnitType,
                    Count = remainingUnits
                });
            }
            else
            {
                planetUnit.Count += remainingUnits;
            }

            dbContext.ShipyardQueueItems.Remove(batch);

            // Re-chain any remaining batches on this planet starting from now
            var remainingBatches = await dbContext.ShipyardQueueItems
                .Where(q => q.PlanetId == planet.Id && q.Id != batch.Id)
                .OrderBy(q => q.BatchStartTimeUtc)
                .ToListAsync(cancellationToken);

            DateTime currentChainTime = now;
            foreach (var nextBatch in remainingBatches)
            {
                if (!string.IsNullOrEmpty(nextBatch.HangfireBatchJobId))
                {
                    jobScheduler.CancelScheduledJob(nextBatch.HangfireBatchJobId);
                }
                nextBatch.BatchStartTimeUtc = currentChainTime;
                nextBatch.NextUnitFinishUtc = currentChainTime.AddSeconds(nextBatch.UnitDurationSeconds);
                var nextBatchEnd = currentChainTime.AddSeconds((nextBatch.TotalCount - nextBatch.CompletedCount) * nextBatch.UnitDurationSeconds);
                nextBatch.HangfireBatchJobId = jobScheduler.ScheduleShipyardBatchCompletion(
                    planet.Id,
                    nextBatch.Id,
                    new DateTimeOffset(nextBatchEnd, TimeSpan.Zero));
                currentChainTime = nextBatchEnd;
            }

            await dbContext.SaveChangesAsync(cancellationToken);

            await hubContext.Clients.User(user.Id.ToString()).SendAsync("QueueCompleted", new
            {
                Type = "Shipyard",
                PlanetId = planet.Id,
                batch.UnitType,
                CompletedCount = remainingUnits
            }, cancellationToken);

            return Results.Ok(new
            {
                Completed = true,
                Cost = cost,
                RemainingDarkMatter = user.DarkMatter,
                batch.UnitType,
                UnitsAdded = remainingUnits
            });
        })
        .WithName("InstantCompleteShipyardBatch");

        group.MapPost("/{planetId}/shipyard/halve-duration", async (
            string planetId,
            DarkMatterSpeedupRequest? request,
            IApplicationDbContext dbContext,
            IDarkMatterService darkMatterService,
            IJobScheduler jobScheduler,
            IDistributedLockService lockService,
            IHubContext<GameHub> hubContext,
            CancellationToken cancellationToken) =>
        {
            var planet = await ResolvePlanetAsync(planetId, dbContext, cancellationToken);
            if (planet is null)
            {
                return Results.NotFound(new { Message = $"Planet {planetId} not found." });
            }

            string lockKey = $"lock:planet:{planet.Id}";
            await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

            var queueQuery = dbContext.ShipyardQueueItems.Where(q => q.PlanetId == planet.Id);
            if (request?.QueueItemId.HasValue == true)
            {
                queueQuery = queueQuery.Where(q => q.Id == request.QueueItemId.Value);
            }
            var batch = await queueQuery.OrderBy(q => q.BatchStartTimeUtc).FirstOrDefaultAsync(cancellationToken);

            if (batch is null)
            {
                return Results.NotFound(new { Message = "Bu gezegende aktif bir tersane üretimi bulunamadı." });
            }

            var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Id == planet.UserId, cancellationToken);
            if (user is null)
            {
                return Results.NotFound(new { Message = "Oyuncu bulunamadı." });
            }

            var now = DateTime.UtcNow;
            int remainingUnits = Math.Max(0, batch.TotalCount - batch.CompletedCount);
            double remainingSeconds = Math.Max(0, remainingUnits * batch.UnitDurationSeconds);
            double totalDurationSeconds = Math.Max(1.0, batch.TotalCount * batch.UnitDurationSeconds);
            int cost = darkMatterService.CalculateHalveDurationCost(1, remainingSeconds, totalDurationSeconds);

            if (user.DarkMatter < cost)
            {
                return Results.BadRequest(new
                {
                    Message = $"Yetersiz Karanlık Madde. Gereken: {cost:N0} KM, Mevcut: {user.DarkMatter:N0} KM.",
                    Required = cost,
                    Available = user.DarkMatter
                });
            }

            user.DarkMatter -= cost;

            double halvedDurationSeconds = Math.Max(1.0, batch.UnitDurationSeconds / 2.0);
            batch.UnitDurationSeconds = halvedDurationSeconds;
            batch.BatchStartTimeUtc = now.AddSeconds(-(batch.CompletedCount * halvedDurationSeconds));
            batch.NextUnitFinishUtc = now.AddSeconds(halvedDurationSeconds);
            var newBatchEnd = now.AddSeconds(remainingUnits * halvedDurationSeconds);

            if (!string.IsNullOrEmpty(batch.HangfireBatchJobId))
            {
                jobScheduler.CancelScheduledJob(batch.HangfireBatchJobId);
            }
            batch.HangfireBatchJobId = jobScheduler.ScheduleShipyardBatchCompletion(
                planet.Id,
                batch.Id,
                new DateTimeOffset(newBatchEnd, TimeSpan.Zero));

            // Adjust any subsequent queued batches
            var chainedBatches = await dbContext.ShipyardQueueItems
                .Where(q => q.PlanetId == planet.Id && q.Id != batch.Id && q.BatchStartTimeUtc > batch.BatchStartTimeUtc)
                .OrderBy(q => q.BatchStartTimeUtc)
                .ToListAsync(cancellationToken);
            DateTime currentChain = newBatchEnd;
            foreach (var chained in chainedBatches)
            {
                if (!string.IsNullOrEmpty(chained.HangfireBatchJobId))
                {
                    jobScheduler.CancelScheduledJob(chained.HangfireBatchJobId);
                }
                chained.BatchStartTimeUtc = currentChain;
                chained.NextUnitFinishUtc = currentChain.AddSeconds(chained.UnitDurationSeconds);
                var chainedEnd = currentChain.AddSeconds((chained.TotalCount - chained.CompletedCount) * chained.UnitDurationSeconds);
                chained.HangfireBatchJobId = jobScheduler.ScheduleShipyardBatchCompletion(
                    planet.Id,
                    chained.Id,
                    new DateTimeOffset(chainedEnd, TimeSpan.Zero));
                currentChain = chainedEnd;
            }

            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Ok(new
            {
                Completed = false,
                Cost = cost,
                RemainingDarkMatter = user.DarkMatter,
                batch.UnitType,
                NewUnitDurationSeconds = batch.UnitDurationSeconds,
                NewNextUnitFinishUtc = DateTime.SpecifyKind(batch.NextUnitFinishUtc, DateTimeKind.Utc).ToString("O")
            });
        })
        .WithName("HalveShipyardBatchDuration");

        group.MapPatch("/{planetId:guid}/rename", async (
            Guid planetId,
            RenamePlanetRequest request,
            IApplicationDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            if (string.IsNullOrWhiteSpace(request.NewName))
            {
                return Results.BadRequest(new { Message = "Planet name cannot be empty." });
            }

            var planet = await dbContext.Planets
                .FirstOrDefaultAsync(p => p.Id == planetId, cancellationToken);

            if (planet is null)
            {
                return Results.NotFound(new { Message = $"Planet {planetId} not found." });
            }

            planet.Name = request.NewName.Trim()[..Math.Min(32, request.NewName.Trim().Length)];

            var d2Progress = await dbContext.UserTutorialProgresses
                .FirstOrDefaultAsync(p => p.UserId == planet.UserId && p.DirectiveId == 2, cancellationToken);
            if (d2Progress != null && d2Progress.CurrentQuestStep == 9)
            {
                d2Progress.SubStepBitmask |= 1;
            }

            // Directive 4 Quest 7 hook (Rename non-capital colony)
            if (!planet.IsCapital && !planet.IsMoon)
            {
                var d4Progress = await dbContext.UserTutorialProgresses
                    .FirstOrDefaultAsync(p => p.UserId == planet.UserId && p.DirectiveId == 4, cancellationToken);
                if (d4Progress != null && d4Progress.CurrentQuestStep == 7)
                {
                    d4Progress.SubStepBitmask = DirectiveDeepSpaceFormulas.ProcessEvent(7, d4Progress.SubStepBitmask, "colony_renamed");
                    d4Progress.UpdatedAtUtc = DateTime.UtcNow;
                }
            }

            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Ok(new { planet.Id, planet.Name });
        })
        .WithName("RenamePlanet");

        group.MapDelete("/{planetId:guid}/buildings/queue", async (
            Guid planetId,
            IApplicationDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var queueItem = await dbContext.BuildingQueueItems
                .FirstOrDefaultAsync(q => q.PlanetId == planetId, cancellationToken);

            if (queueItem is null)
            {
                return Results.NotFound(new { Message = "No active building construction found." });
            }

            var planet = await dbContext.Planets
                .Include(p => p.Buildings)
                .FirstOrDefaultAsync(p => p.Id == planetId, cancellationToken);

            if (planet is not null)
            {
                var currentBuilding = planet.Buildings.FirstOrDefault(b => b.BuildingType == queueItem.BuildingType);
                bool isDemolition = currentBuilding != null && queueItem.TargetLevel < currentBuilding.Level;

                if (isDemolition)
                {
                    int ionTechLevel = await dbContext.UserResearches
                        .AsNoTracking()
                        .Where(r => r.UserId == planet.UserId && r.ResearchType == ResearchType.IonTechnology)
                        .Select(r => r.Level)
                        .FirstOrDefaultAsync(cancellationToken);

                    var demoCost = OGame.Domain.Services.ConstructionFormulas.CalculateDemolitionCost(
                        queueItem.BuildingType,
                        currentBuilding!.Level,
                        ionTechLevel);

                    planet.Metal += demoCost.Metal;
                    planet.Crystal += demoCost.Crystal;
                    planet.Deuterium += demoCost.Deuterium;
                }
                else
                {
                    var cost = OGame.Domain.Services.ConstructionFormulas.GetBuildingUpgradeCost(
                        queueItem.BuildingType,
                        queueItem.TargetLevel);
                    planet.Metal += cost.Metal;
                    planet.Crystal += cost.Crystal;
                    planet.Deuterium += cost.Deuterium;
                }
            }

            dbContext.BuildingQueueItems.Remove(queueItem);
            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Ok(new { CancelledQueueId = queueItem.Id });
        })
        .WithName("CancelBuildingUpgrade");

        group.MapPost("/{planetId}/buildings/instant-complete", async (
            string planetId,
            DarkMatterSpeedupRequest? request,
            IApplicationDbContext dbContext,
            IBuildingService buildingService,
            IDarkMatterService darkMatterService,
            IJobScheduler jobScheduler,
            IDistributedLockService lockService,
            IHubContext<GameHub> hubContext,
            CancellationToken cancellationToken) =>
        {
            var planet = await ResolvePlanetAsync(planetId, dbContext, cancellationToken);
            if (planet is null)
            {
                return Results.NotFound(new { Message = $"Planet {planetId} not found." });
            }

            string lockKey = $"lock:planet:{planet.Id}";
            await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

            var queueQuery = dbContext.BuildingQueueItems.Where(q => q.PlanetId == planet.Id);
            if (request?.QueueItemId.HasValue == true)
            {
                queueQuery = queueQuery.Where(q => q.Id == request.QueueItemId.Value);
            }
            var queueItem = await queueQuery.OrderBy(q => q.StartTimeUtc).FirstOrDefaultAsync(cancellationToken);

            if (queueItem is null)
            {
                return Results.NotFound(new { Message = "Bu gezegende aktif bir bina inşası bulunamadı." });
            }

            var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Id == planet.UserId, cancellationToken);
            if (user is null)
            {
                return Results.NotFound(new { Message = "Oyuncu bulunamadı." });
            }

            var now = DateTime.UtcNow;
            double remainingSeconds = Math.Max(0, (queueItem.EndTimeUtc - now).TotalSeconds);
            int cost = darkMatterService.CalculateInstantCompletionCost(queueItem.TargetLevel, remainingSeconds);

            if (user.DarkMatter < cost)
            {
                return Results.BadRequest(new
                {
                    Message = $"Yetersiz Karanlık Madde. Gereken: {cost:N0} KM, Mevcut: {user.DarkMatter:N0} KM.",
                    Required = cost,
                    Available = user.DarkMatter
                });
            }

            user.DarkMatter -= cost;

            if (!string.IsNullOrEmpty(queueItem.HangfireJobId))
            {
                jobScheduler.CancelScheduledJob(queueItem.HangfireJobId);
            }

            var result = await buildingService.CompleteBuildingUpgradeAsync(planet.Id, queueItem.Id, cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);

            await hubContext.Clients.User(user.Id.ToString()).SendAsync("QueueCompleted", new
            {
                Type = "Building",
                PlanetId = planet.Id,
                queueItem.BuildingType,
                NewLevel = result?.NewLevel ?? queueItem.TargetLevel
            }, cancellationToken);

            return Results.Ok(new
            {
                Completed = true,
                Cost = cost,
                RemainingDarkMatter = user.DarkMatter,
                NewLevel = result?.NewLevel ?? queueItem.TargetLevel,
                queueItem.BuildingType
            });
        })
        .WithName("InstantCompleteBuildingUpgrade");

        group.MapPost("/{planetId}/buildings/halve-duration", async (
            string planetId,
            DarkMatterSpeedupRequest? request,
            IApplicationDbContext dbContext,
            IBuildingService buildingService,
            IDarkMatterService darkMatterService,
            IJobScheduler jobScheduler,
            IDistributedLockService lockService,
            IHubContext<GameHub> hubContext,
            CancellationToken cancellationToken) =>
        {
            var planet = await ResolvePlanetAsync(planetId, dbContext, cancellationToken);
            if (planet is null)
            {
                return Results.NotFound(new { Message = $"Planet {planetId} not found." });
            }

            string lockKey = $"lock:planet:{planet.Id}";
            await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

            var queueQuery = dbContext.BuildingQueueItems.Where(q => q.PlanetId == planet.Id);
            if (request?.QueueItemId.HasValue == true)
            {
                queueQuery = queueQuery.Where(q => q.Id == request.QueueItemId.Value);
            }
            var queueItem = await queueQuery.OrderBy(q => q.StartTimeUtc).FirstOrDefaultAsync(cancellationToken);

            if (queueItem is null)
            {
                return Results.NotFound(new { Message = "Bu gezegende aktif bir bina inşası bulunamadı." });
            }

            var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Id == planet.UserId, cancellationToken);
            if (user is null)
            {
                return Results.NotFound(new { Message = "Oyuncu bulunamadı." });
            }

            var now = DateTime.UtcNow;
            double totalDurationSeconds = Math.Max(1.0, (queueItem.EndTimeUtc - queueItem.StartTimeUtc).TotalSeconds);
            double remainingSeconds = Math.Max(0, (queueItem.EndTimeUtc - now).TotalSeconds);
            int cost = darkMatterService.CalculateHalveDurationCost(queueItem.TargetLevel, remainingSeconds, totalDurationSeconds);

            if (user.DarkMatter < cost)
            {
                return Results.BadRequest(new
                {
                    Message = $"Yetersiz Karanlık Madde. Gereken: {cost:N0} KM, Mevcut: {user.DarkMatter:N0} KM.",
                    Required = cost,
                    Available = user.DarkMatter
                });
            }

            user.DarkMatter -= cost;

            var newEndUtc = now.AddSeconds(remainingSeconds / 2.0);
            if (newEndUtc <= now.AddSeconds(2))
            {
                if (!string.IsNullOrEmpty(queueItem.HangfireJobId))
                {
                    jobScheduler.CancelScheduledJob(queueItem.HangfireJobId);
                }

                var result = await buildingService.CompleteBuildingUpgradeAsync(planet.Id, queueItem.Id, cancellationToken);
                await dbContext.SaveChangesAsync(cancellationToken);

                await hubContext.Clients.User(user.Id.ToString()).SendAsync("QueueCompleted", new
                {
                    Type = "Building",
                    PlanetId = planet.Id,
                    queueItem.BuildingType,
                    NewLevel = result?.NewLevel ?? queueItem.TargetLevel
                }, cancellationToken);

                return Results.Ok(new
                {
                    Completed = true,
                    Cost = cost,
                    RemainingDarkMatter = user.DarkMatter,
                    NewLevel = result?.NewLevel ?? queueItem.TargetLevel
                });
            }

            if (!string.IsNullOrEmpty(queueItem.HangfireJobId))
            {
                jobScheduler.CancelScheduledJob(queueItem.HangfireJobId);
            }

            queueItem.HangfireJobId = jobScheduler.ScheduleBuildingCompletion(
                planet.Id,
                queueItem.Id,
                new DateTimeOffset(newEndUtc, TimeSpan.Zero));
            queueItem.StartTimeUtc = newEndUtc.AddSeconds(-totalDurationSeconds);
            queueItem.EndTimeUtc = newEndUtc;
            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Ok(new
            {
                Completed = false,
                Cost = cost,
                RemainingDarkMatter = user.DarkMatter,
                NewEndTimeUtc = DateTime.SpecifyKind(newEndUtc, DateTimeKind.Utc).ToString("O")
            });
        })
        .WithName("HalveBuildingUpgradeDuration");

        group.MapPost("/{planetId}/buildings/queue/speedup", async (
            string planetId,
            DarkMatterSpeedupRequest? request,
            IApplicationDbContext dbContext,
            IBuildingService buildingService,
            IDarkMatterService darkMatterService,
            IJobScheduler jobScheduler,
            IDistributedLockService lockService,
            IHubContext<GameHub> hubContext,
            CancellationToken cancellationToken) =>
        {
            var planet = await ResolvePlanetAsync(planetId, dbContext, cancellationToken);
            if (planet is null)
            {
                return Results.NotFound(new { Message = $"Planet {planetId} not found." });
            }

            string lockKey = $"lock:planet:{planet.Id}";
            await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

            var queueQuery = dbContext.BuildingQueueItems.Where(q => q.PlanetId == planet.Id);
            if (request?.QueueItemId.HasValue == true)
            {
                queueQuery = queueQuery.Where(q => q.Id == request.QueueItemId.Value);
            }
            var queueItem = await queueQuery.OrderBy(q => q.StartTimeUtc).FirstOrDefaultAsync(cancellationToken);

            if (queueItem is null)
            {
                return Results.NotFound(new { Message = "No active building construction found." });
            }

            var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Id == planet.UserId, cancellationToken);
            if (user is null)
            {
                return Results.NotFound(new { Message = "Oyuncu bulunamadı." });
            }

            var now = DateTime.UtcNow;
            double totalDurationSeconds = Math.Max(1.0, (queueItem.EndTimeUtc - queueItem.StartTimeUtc).TotalSeconds);
            double remainingSeconds = Math.Max(0, (queueItem.EndTimeUtc - now).TotalSeconds);
            int cost = darkMatterService.CalculateHalveDurationCost(queueItem.TargetLevel, remainingSeconds, totalDurationSeconds);

            if (user.DarkMatter < cost)
            {
                return Results.BadRequest(new
                {
                    Message = $"Yetersiz Karanlık Madde. Gereken: {cost:N0} KM, Mevcut: {user.DarkMatter:N0} KM.",
                    Required = cost,
                    Available = user.DarkMatter
                });
            }

            user.DarkMatter -= cost;

            var halvedEndUtc = now.AddSeconds(remainingSeconds / 2.0);
            if (halvedEndUtc <= now.AddSeconds(2))
            {
                if (!string.IsNullOrEmpty(queueItem.HangfireJobId))
                {
                    jobScheduler.CancelScheduledJob(queueItem.HangfireJobId);
                }

                await buildingService.CompleteBuildingUpgradeAsync(planet.Id, queueItem.Id, cancellationToken);
                await dbContext.SaveChangesAsync(cancellationToken);

                return Results.Ok(new { Completed = true, Cost = cost, RemainingDarkMatter = user.DarkMatter });
            }

            if (!string.IsNullOrEmpty(queueItem.HangfireJobId))
            {
                jobScheduler.CancelScheduledJob(queueItem.HangfireJobId);
            }

            queueItem.HangfireJobId = jobScheduler.ScheduleBuildingCompletion(
                planet.Id,
                queueItem.Id,
                new DateTimeOffset(halvedEndUtc, TimeSpan.Zero));
            queueItem.StartTimeUtc = halvedEndUtc.AddSeconds(-totalDurationSeconds);
            queueItem.EndTimeUtc = halvedEndUtc;
            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Ok(new
            {
                Completed = false,
                Cost = cost,
                RemainingDarkMatter = user.DarkMatter,
                EndTimeUtc = DateTime.SpecifyKind(queueItem.EndTimeUtc, DateTimeKind.Utc).ToString("O")
            });
        })
        .WithName("SpeedupBuildingUpgrade");

        group.MapGet("/{planetId:guid}/resource-settings", async (
            Guid planetId,
            IApplicationDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var exists = await dbContext.Planets
                .AsNoTracking()
                .AnyAsync(p => p.Id == planetId, cancellationToken);

            if (!exists)
            {
                return Results.NotFound(new { Message = $"Planet {planetId} not found." });
            }

            var settings = PlanetSettingsStore.GetOrAdd(planetId, _ => new PlanetResourceSettingsDto());
            return Results.Ok(settings);
        })
        .WithName("GetPlanetResourceSettings");

        group.MapPut("/{planetId:guid}/resource-settings", async (
            Guid planetId,
            PlanetResourceSettingsDto request,
            IApplicationDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var playerClass = await ResolvePlanetOwnerClassAsync(planetId, dbContext, cancellationToken);
            var normalized = NormalizeResourceSettings(request, playerClass);
            PlanetSettingsStore[planetId] = normalized;
            return Results.Ok(normalized);
        })
        .WithName("UpdatePlanetResourceSettingsPut");

        group.MapPost("/{planetId:guid}/resource-settings", async (
            Guid planetId,
            PlanetResourceSettingsDto request,
            IApplicationDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var playerClass = await ResolvePlanetOwnerClassAsync(planetId, dbContext, cancellationToken);
            var normalized = NormalizeResourceSettings(request, playerClass);
            PlanetSettingsStore[planetId] = normalized;
            return Results.Ok(normalized);
        })
        .WithName("UpdatePlanetResourceSettingsPost");

        group.MapGet("/{planetId}/lifeforms", async (
            string planetId,
            IApplicationDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var planet = await ResolvePlanetAsync(planetId, dbContext, cancellationToken);
            if (planet is null)
            {
                return Results.NotFound(new { Message = $"Planet {planetId} not found." });
            }

            var actualId = planet.Id;
            var state = await GetOrLoadPlanetLifeformStateAsync(planet, dbContext, cancellationToken);

            return Results.Ok(BuildLifeformResponseDto(actualId, state));
        })
        .WithName("GetPlanetLifeforms");

        group.MapPost("/{planetId}/lifeforms/buildings/cancel", async (
            string planetId,
            IApplicationDbContext dbContext,
            IDistributedLockService lockService,
            CancellationToken cancellationToken) =>
        {
            var planet = await ResolvePlanetAsync(planetId, dbContext, cancellationToken);
            if (planet is null) return Results.NotFound();

            var actualId = planet.Id;
            string lockKey = $"lock:planet:{actualId}";
            await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

            var state = await GetOrLoadPlanetLifeformStateAsync(planet, dbContext, cancellationToken);
            if (state.ActiveQueue is not null)
            {
                planet.Metal += state.ActiveQueue.RefundMetal;
                planet.Crystal += state.ActiveQueue.RefundCrystal;
                planet.Deuterium += state.ActiveQueue.RefundDeuterium;
                state.ActiveQueue = null;
                await dbContext.SaveChangesAsync(cancellationToken);
                await SavePlanetLifeformStateAsync(actualId, state, dbContext, cancellationToken);
            }

            return Results.Ok(BuildLifeformResponseDto(actualId, state));
        })
        .WithName("CancelLifeformBuilding");

        group.MapPost("/{planetId}/lifeforms/buildings/instant-complete", async (
            string planetId,
            IApplicationDbContext dbContext,
            IDistributedLockService lockService,
            CancellationToken cancellationToken) =>
        {
            var planet = await ResolvePlanetAsync(planetId, dbContext, cancellationToken);
            if (planet is null) return Results.NotFound();

            var actualId = planet.Id;
            string lockKey = $"lock:planet:{actualId}";
            await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

            var state = await GetOrLoadPlanetLifeformStateAsync(planet, dbContext, cancellationToken);
            if (state.ActiveQueue is null) return Results.BadRequest(new { Message = "Aktif canlı türü bina kuyruğu bulunamadı." });

            var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Id == planet.UserId, cancellationToken);
            if (user is null) return Results.NotFound();

            DateTime.TryParse(state.ActiveQueue.EndTimeUtc, null, System.Globalization.DateTimeStyles.RoundtripKind, out var endUtc);
            var now = DateTime.UtcNow;
            int remainingSeconds = Math.Max(0, (int)(endUtc - now).TotalSeconds);
            int cost = DarkMatterFormulas.CalculateInstantCompletionCost(state.ActiveQueue.TargetLevel, remainingSeconds);

            if (user.DarkMatter < cost)
            {
                return Results.BadRequest(new { Message = $"Yetersiz Karanlık Madde. Gereken: {cost}, Mevcut: {user.DarkMatter}" });
            }

            user.DarkMatter -= cost;
            state.BuildingLevels[state.ActiveQueue.BuildingKey] = state.ActiveQueue.TargetLevel;
            string curSp = PlanetLifeformMemoryState.NormalizeSpeciesId(state.ActiveSpecies);
            if (state.SpeciesBuildingLevels.TryGetValue(curSp, out var spBuildings))
            {
                spBuildings[state.ActiveQueue.BuildingKey] = state.ActiveQueue.TargetLevel;
            }
            state.ActiveQueue = null;
            state.CurrentXp = Math.Min(state.MaxXp, state.CurrentXp + 45);
            await dbContext.SaveChangesAsync(cancellationToken);
            await SavePlanetLifeformStateAsync(actualId, state, dbContext, cancellationToken);

            return Results.Ok(new { Success = true, Message = "Canlı türü binası anında tamamlandı.", DarkMatter = user.DarkMatter });
        })
        .WithName("InstantCompleteLifeformBuilding");

        group.MapPost("/{planetId}/lifeforms/buildings/halve-duration", async (
            string planetId,
            IApplicationDbContext dbContext,
            IDistributedLockService lockService,
            CancellationToken cancellationToken) =>
        {
            var planet = await ResolvePlanetAsync(planetId, dbContext, cancellationToken);
            if (planet is null) return Results.NotFound();

            var actualId = planet.Id;
            string lockKey = $"lock:planet:{actualId}";
            await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

            var state = await GetOrLoadPlanetLifeformStateAsync(planet, dbContext, cancellationToken);
            if (state.ActiveQueue is null) return Results.BadRequest(new { Message = "Aktif canlı türü bina kuyruğu bulunamadı." });

            var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Id == planet.UserId, cancellationToken);
            if (user is null) return Results.NotFound();

            DateTime.TryParse(state.ActiveQueue.EndTimeUtc, null, System.Globalization.DateTimeStyles.RoundtripKind, out var endUtc);
            DateTime.TryParse(state.ActiveQueue.StartTimeUtc, null, System.Globalization.DateTimeStyles.RoundtripKind, out var startUtc);
            var now = DateTime.UtcNow;
            int remainingSeconds = Math.Max(0, (int)(endUtc - now).TotalSeconds);
            int totalDurationSeconds = Math.Max(1, (int)(endUtc - startUtc).TotalSeconds);
            int cost = DarkMatterFormulas.CalculateHalveDurationCost(state.ActiveQueue.TargetLevel, remainingSeconds, totalDurationSeconds);

            if (user.DarkMatter < cost)
            {
                return Results.BadRequest(new { Message = $"Yetersiz Karanlık Madde. Gereken: {cost}, Mevcut: {user.DarkMatter}" });
            }

            user.DarkMatter -= cost;
            int newRemainingSeconds = remainingSeconds / 2;
            var newEndUtc = now.AddSeconds(newRemainingSeconds);
            var adjustedStartUtc = newEndUtc.AddSeconds(-totalDurationSeconds);

            state.ActiveQueue = state.ActiveQueue with
            {
                StartTimeUtc = adjustedStartUtc.ToString("O"),
                EndTimeUtc = newEndUtc.ToString("O")
            };

            await dbContext.SaveChangesAsync(cancellationToken);
            await SavePlanetLifeformStateAsync(actualId, state, dbContext, cancellationToken);

            return Results.Ok(new
            {
                Success = true,
                Message = "Süre yarıya indirildi.",
                DarkMatter = user.DarkMatter,
                EndTimeUtc = newEndUtc.ToString("O")
            });
        })
        .WithName("HalveLifeformBuildingDuration");

        group.MapPost("/{planetId}/lifeforms/buildings/upgrade", async (
            string planetId,
            EnqueueLifeformBuildingRequest request,
            IApplicationDbContext dbContext,
            IResourceCalculationService resourceService,
            IDistributedLockService lockService,
            CancellationToken cancellationToken) =>
        {
            var planet = await ResolvePlanetAsync(planetId, dbContext, cancellationToken);
            if (planet is null)
            {
                return Results.NotFound(new { Message = $"Planet {planetId} not found." });
            }

            var actualId = planet.Id;
            string lockKey = $"lock:planet:{actualId}";
            await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

            var now = DateTime.UtcNow;
            resourceService.ApplyLazyUpdate(planet, now);

            var state = await GetOrLoadPlanetLifeformStateAsync(planet, dbContext, cancellationToken);

            if (state.ActiveQueue is not null)
            {
                return Results.BadRequest(new { Message = "Bu gezegende zaten aktif bir canlı türü bina inşası var." });
            }

            double metalCost = Math.Max(0, request.MetalCost);
            double crystalCost = Math.Max(0, request.CrystalCost);
            double deutCost = Math.Max(0, request.DeuteriumCost);

            if (planet.Metal < metalCost || planet.Crystal < crystalCost || planet.Deuterium < deutCost)
            {
                return Results.BadRequest(new { Message = "Yetersiz hammadde." });
            }

            planet.Metal -= metalCost;
            planet.Crystal -= crystalCost;
            planet.Deuterium -= deutCost;
            await dbContext.SaveChangesAsync(cancellationToken);

            int currentLvl = state.BuildingLevels.GetValueOrDefault(request.BuildingKey, 0);
            int targetLvl = currentLvl + 1;
            int durationSec = Math.Clamp(request.DurationSeconds <= 0 ? 10 : request.DurationSeconds, 3, 7200);
            var endUtc = now.AddSeconds(durationSec);

            if (string.IsNullOrWhiteSpace(state.ActiveSpecies)) state.ActiveSpecies = "humans";
            state.IsActive = true;
            state.ActiveQueue = new ActiveLifeformQueueDto(
                BuildingKey: request.BuildingKey,
                BuildingName: request.BuildingName,
                TargetLevel: targetLvl,
                StartTimeUtc: now.ToString("O"),
                EndTimeUtc: endUtc.ToString("O"),
                RefundMetal: metalCost,
                RefundCrystal: crystalCost,
                RefundDeuterium: deutCost);

            await SavePlanetLifeformStateAsync(actualId, state, dbContext, cancellationToken);

            return Results.Ok(BuildLifeformResponseDto(actualId, state));
        })
        .WithName("EnqueueLifeformBuildingUpgrade");

        group.MapPost("/{planetId}/lifeforms/buildings/build", async (
            string planetId,
            EnqueueLifeformBuildingRequest request,
            IApplicationDbContext dbContext,
            IResourceCalculationService resourceService,
            IDistributedLockService lockService,
            CancellationToken cancellationToken) =>
        {
            var planet = await ResolvePlanetAsync(planetId, dbContext, cancellationToken);
            if (planet is null)
            {
                return Results.NotFound(new { Message = $"Planet {planetId} not found." });
            }

            var actualId = planet.Id;
            string lockKey = $"lock:planet:{actualId}";
            await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

            var now = DateTime.UtcNow;
            resourceService.ApplyLazyUpdate(planet, now);

            var state = await GetOrLoadPlanetLifeformStateAsync(planet, dbContext, cancellationToken);

            if (state.ActiveQueue is not null)
            {
                return Results.BadRequest(new { Message = "Bu gezegende zaten aktif bir canlı türü bina inşası var." });
            }

            double metalCost = Math.Max(0, request.MetalCost);
            double crystalCost = Math.Max(0, request.CrystalCost);
            double deutCost = Math.Max(0, request.DeuteriumCost);

            if (planet.Metal < metalCost || planet.Crystal < crystalCost || planet.Deuterium < deutCost)
            {
                return Results.BadRequest(new { Message = "Yetersiz hammadde." });
            }

            planet.Metal -= metalCost;
            planet.Crystal -= crystalCost;
            planet.Deuterium -= deutCost;
            await dbContext.SaveChangesAsync(cancellationToken);

            int currentLvl = state.BuildingLevels.GetValueOrDefault(request.BuildingKey, 0);
            int targetLvl = currentLvl + 1;
            int durationSec = Math.Clamp(request.DurationSeconds <= 0 ? 10 : request.DurationSeconds, 3, 7200);
            var endUtc = now.AddSeconds(durationSec);

            if (string.IsNullOrWhiteSpace(state.ActiveSpecies)) state.ActiveSpecies = "humans";
            state.IsActive = true;
            state.ActiveQueue = new ActiveLifeformQueueDto(
                BuildingKey: request.BuildingKey,
                BuildingName: request.BuildingName,
                TargetLevel: targetLvl,
                StartTimeUtc: now.ToString("O"),
                EndTimeUtc: endUtc.ToString("O"),
                RefundMetal: metalCost,
                RefundCrystal: crystalCost,
                RefundDeuterium: deutCost);

            await SavePlanetLifeformStateAsync(actualId, state, dbContext, cancellationToken);

            return Results.Ok(BuildLifeformResponseDto(actualId, state));
        })
        .WithName("BuildLifeformBuilding");

        group.MapPost("/{planetId}/lifeforms/tech/research", async (
            string planetId,
            EnqueueLifeformTechRequest request,
            IApplicationDbContext dbContext,
            IResourceCalculationService resourceService,
            IDistributedLockService lockService,
            CancellationToken cancellationToken) =>
        {
            var planet = await ResolvePlanetAsync(planetId, dbContext, cancellationToken);
            if (planet is null)
            {
                return Results.NotFound(new { Message = $"Planet {planetId} not found." });
            }

            var actualId = planet.Id;
            string lockKey = $"lock:planet:{actualId}";
            await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

            var now = DateTime.UtcNow;
            resourceService.ApplyLazyUpdate(planet, now);

            var state = await GetOrLoadPlanetLifeformStateAsync(planet, dbContext, cancellationToken);

            if (state.ActiveTechQueue is not null)
            {
                return Results.BadRequest(new { Message = "Bu gezegende zaten aktif bir teknoloji araştırması var." });
            }

            string curSp = PlanetLifeformMemoryState.NormalizeSpeciesId(state.ActiveSpecies);
            var spDef = LifeformsSpeciesFormulas.GetSpecies(curSp);
            var b1Key = spDef.Buildings.FirstOrDefault(b => b.Index == 1)?.Key ?? "residentialSector";
            var b9Key = spDef.Buildings.FirstOrDefault(b => b.Index == 9)?.Key ?? "skyscraper";
            var b4Key = spDef.Buildings.FirstOrDefault(b => b.Index == 4)?.Key ?? "academyOfSciences";
            var b5Key = spDef.Buildings.FirstOrDefault(b => b.Index == 5)?.Key ?? "neuroCalibrationCentre";

            int resLvl = state.BuildingLevels.GetValueOrDefault(b1Key, 0);
            int skyLvl = state.BuildingLevels.GetValueOrDefault(b9Key, 0);
            int acadLvl = state.BuildingLevels.GetValueOrDefault(b4Key, 0);
            int neuroLvl = state.BuildingLevels.GetValueOrDefault(b5Key, 0);
            var tiers = LifeformsHumansFormulas.CalculatePopulationTiers(resLvl, skyLvl, acadLvl, neuroLvl);
            long totalPop = (long)tiers.T1 + tiers.T2 + tiers.T3;

            if (!LifeformsSpeciesFormulas.IsTechUnlocked(request.Slot, totalPop))
            {
                return Results.BadRequest(new { Message = $"Bu teknoloji için yeterli nüfus yok. Gerekli yuva: {request.Slot}" });
            }

            double metalCost = Math.Max(0, request.MetalCost);
            double crystalCost = Math.Max(0, request.CrystalCost);
            double deutCost = Math.Max(0, request.DeuteriumCost);

            if (planet.Metal < metalCost || planet.Crystal < crystalCost || planet.Deuterium < deutCost)
            {
                return Results.BadRequest(new { Message = "Yetersiz hammadde." });
            }

            planet.Metal -= metalCost;
            planet.Crystal -= crystalCost;
            planet.Deuterium -= deutCost;
            await dbContext.SaveChangesAsync(cancellationToken);

            int currentLvl = state.TechLevels.GetValueOrDefault(request.Slot, 0);
            int targetLvl = currentLvl + 1;
            int durationSec = Math.Clamp(request.DurationSeconds <= 0 ? 10 : request.DurationSeconds, 3, 7200);
            var endUtc = now.AddSeconds(durationSec);

            string slotSpecies = state.SlotSpecies.GetValueOrDefault(request.Slot, curSp);
            string techName = !string.IsNullOrWhiteSpace(request.TechName)
                ? request.TechName
                : (LifeformsSpeciesFormulas.GetTech(slotSpecies, request.Slot)?.Name ?? $"Teknoloji {request.Slot}");

            state.IsActive = true;
            state.ActiveTechQueue = new ActiveLifeformTechQueueDto(
                Slot: request.Slot,
                TechName: techName,
                TargetLevel: targetLvl,
                StartTimeUtc: now.ToString("O"),
                EndTimeUtc: endUtc.ToString("O"),
                RefundMetal: metalCost,
                RefundCrystal: crystalCost,
                RefundDeuterium: deutCost);

            await SavePlanetLifeformStateAsync(actualId, state, dbContext, cancellationToken);

            return Results.Ok(BuildLifeformResponseDto(actualId, state));
        })
        .WithName("EnqueueLifeformTechResearch");

        group.MapPost("/{planetId}/lifeforms/species/select", async (
            string planetId,
            SelectSpeciesRequest request,
            IApplicationDbContext dbContext,
            IResourceCalculationService resourceService,
            IDistributedLockService lockService,
            CancellationToken cancellationToken) =>
        {
            var planet = await ResolvePlanetAsync(planetId, dbContext, cancellationToken);
            if (planet is null)
            {
                return Results.NotFound(new { Message = $"Planet {planetId} not found." });
            }

            var actualId = planet.Id;
            string lockKey = $"lock:planet:{actualId}";
            await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

            var now = DateTime.UtcNow;
            resourceService.ApplyLazyUpdate(planet, now);

            var state = await GetOrLoadPlanetLifeformStateAsync(planet, dbContext, cancellationToken);

            string targetNorm = PlanetLifeformMemoryState.NormalizeSpeciesId(request.SpeciesId);
            if (!LifeformDiscoveryStore.IsSpeciesUnlocked(planet.UserId, targetNorm))
            {
                return Results.BadRequest(new { Message = "Bu canlı türü henüz keşfedilmedi. Galaksi haritasındaki Mor DNA simgelerinden keşif yaparak türün kilidini açmalısınız." });
            }

            // Refund any active queues on species switch
            if (state.ActiveQueue is not null)
            {
                planet.Metal += state.ActiveQueue.RefundMetal;
                planet.Crystal += state.ActiveQueue.RefundCrystal;
                planet.Deuterium += state.ActiveQueue.RefundDeuterium;
                state.ActiveQueue = null;
            }

            if (state.ActiveTechQueue is not null)
            {
                planet.Metal += state.ActiveTechQueue.RefundMetal;
                planet.Crystal += state.ActiveTechQueue.RefundCrystal;
                planet.Deuterium += state.ActiveTechQueue.RefundDeuterium;
                state.ActiveTechQueue = null;
            }

            state.SwitchSpecies(request.SpeciesId);

            // If this is a colony (non-capital), update Directive 6 Step 7 progress
            if (!planet.IsCapital)
            {
                var d6Prog = await dbContext.UserTutorialProgresses
                    .FirstOrDefaultAsync(p => p.UserId == planet.UserId && p.DirectiveId == 6 && p.CurrentQuestStep == 7, cancellationToken);
                if (d6Prog != null)
                {
                    d6Prog.SubStepBitmask |= 1;
                }
            }

            await dbContext.SaveChangesAsync(cancellationToken);
            await SavePlanetLifeformStateAsync(actualId, state, dbContext, cancellationToken);

            return Results.Ok(BuildLifeformResponseDto(actualId, state));
        })
        .WithName("SelectPlanetSpecies");

        group.MapPost("/{planetId}/lifeforms/tech/slot/select", async (
            string planetId,
            SelectSlotTechRequest request,
            IApplicationDbContext dbContext,
            IDistributedLockService lockService,
            CancellationToken cancellationToken) =>
        {
            var planet = await ResolvePlanetAsync(planetId, dbContext, cancellationToken);
            if (planet is null) return Results.NotFound(new { Message = $"Planet {planetId} not found." });

            var actualId = planet.Id;
            string lockKey = $"lock:planet:{actualId}";
            await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

            if (request.Slot < 1 || request.Slot > 18)
            {
                return Results.BadRequest(new { Message = "Yuva numarası 1 ile 18 arasında olmalıdır." });
            }

            var state = await GetOrLoadPlanetLifeformStateAsync(planet, dbContext, cancellationToken);
            string normSp = PlanetLifeformMemoryState.NormalizeSpeciesId(request.SpeciesId);

            if (state.ArtifactCount >= 100)
            {
                state.ArtifactCount -= 100;
            }

            state.SlotSpecies[request.Slot] = normSp;
            await SavePlanetLifeformStateAsync(actualId, state, dbContext, cancellationToken);

            return Results.Ok(BuildLifeformResponseDto(actualId, state));
        })
        .WithName("SelectSlotTech");

        group.MapPost("/{planetId}/lifeforms/stop", async (
            string planetId,
            IApplicationDbContext dbContext,
            IResourceCalculationService resourceService,
            IDistributedLockService lockService,
            CancellationToken cancellationToken) =>
        {
            var planet = await ResolvePlanetAsync(planetId, dbContext, cancellationToken);
            if (planet is null)
            {
                return Results.NotFound(new { Message = $"Planet {planetId} not found." });
            }

            var actualId = planet.Id;
            string lockKey = $"lock:planet:{actualId}";
            await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

            var now = DateTime.UtcNow;
            resourceService.ApplyLazyUpdate(planet, now);

            var state = await GetOrLoadPlanetLifeformStateAsync(planet, dbContext, cancellationToken);

            if (state.ActiveQueue is not null)
            {
                planet.Metal += state.ActiveQueue.RefundMetal;
                planet.Crystal += state.ActiveQueue.RefundCrystal;
                planet.Deuterium += state.ActiveQueue.RefundDeuterium;
                state.ActiveQueue = null;
            }

            if (state.ActiveTechQueue is not null)
            {
                planet.Metal += state.ActiveTechQueue.RefundMetal;
                planet.Crystal += state.ActiveTechQueue.RefundCrystal;
                planet.Deuterium += state.ActiveTechQueue.RefundDeuterium;
                state.ActiveTechQueue = null;
            }

            state.IsActive = false;
            await dbContext.SaveChangesAsync(cancellationToken);
            await SavePlanetLifeformStateAsync(actualId, state, dbContext, cancellationToken);

            return Results.Ok(BuildLifeformResponseDto(actualId, state));
        })
        .WithName("StopPlanetLifeforms");

        group.MapPost("/{planetId}/lifeforms/activate", async (
            string planetId,
            IApplicationDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var planet = await ResolvePlanetAsync(planetId, dbContext, cancellationToken);
            if (planet is null) return Results.NotFound();

            var actualId = planet.Id;
            var state = await GetOrLoadPlanetLifeformStateAsync(planet, dbContext, cancellationToken);
            state.IsActive = true;
            state.ActiveSpecies = "humans";
            await SavePlanetLifeformStateAsync(actualId, state, dbContext, cancellationToken);

            return Results.Ok(BuildLifeformResponseDto(actualId, state));
        })
        .WithName("ActivatePlanetLifeforms");

        group.MapPost("/{planetId}/lifeforms/reset", async (
            string planetId,
            IApplicationDbContext dbContext,
            IResourceCalculationService resourceService,
            IDistributedLockService lockService,
            CancellationToken cancellationToken) =>
        {
            var planet = await ResolvePlanetAsync(planetId, dbContext, cancellationToken);
            if (planet is null)
            {
                return Results.NotFound(new { Message = $"Planet {planetId} not found." });
            }

            var actualId = planet.Id;
            string lockKey = $"lock:planet:{actualId}";
            await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

            var now = DateTime.UtcNow;
            resourceService.ApplyLazyUpdate(planet, now);

            var state = await GetOrLoadPlanetLifeformStateAsync(planet, dbContext, cancellationToken);

            if (state.ActiveQueue is not null)
            {
                planet.Metal += state.ActiveQueue.RefundMetal;
                planet.Crystal += state.ActiveQueue.RefundCrystal;
                planet.Deuterium += state.ActiveQueue.RefundDeuterium;
                state.ActiveQueue = null;
            }

            if (state.ActiveTechQueue is not null)
            {
                planet.Metal += state.ActiveTechQueue.RefundMetal;
                planet.Crystal += state.ActiveTechQueue.RefundCrystal;
                planet.Deuterium += state.ActiveTechQueue.RefundDeuterium;
                state.ActiveTechQueue = null;
            }

            state.IsActive = false;
            foreach (var key in state.BuildingLevels.Keys.ToList())
            {
                state.BuildingLevels[key] = 0;
            }
            state.TechLevels.Clear();
            await dbContext.SaveChangesAsync(cancellationToken);
            await SavePlanetLifeformStateAsync(actualId, state, dbContext, cancellationToken);

            return Results.Ok(BuildLifeformResponseDto(actualId, state));
        })
        .WithName("ResetPlanetLifeforms");

        group.MapPost("/{planetId:guid}/abandon", async (
            Guid planetId,
            AbandonPlanetRequest request,
            IColonizationAndPlanetService colonizationService,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var result = await colonizationService.AbandonPlanetAsync(
                    planetId,
                    request.UserId,
                    request.Password,
                    cancellationToken);

                return Results.Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { Message = ex.Message });
            }
        })
        .WithName("AbandonPlanet");

        var researchGroup = app.MapGroup("/api/research")
            .WithTags("Research");

        researchGroup.MapPost("/enqueue", async (
            EnqueueResearchRequest request,
            IResearchService researchService,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var item = await researchService.EnqueueResearchAsync(
                    request.UserId,
                    request.OriginPlanetId,
                    request.ResearchType,
                    cancellationToken);

                return Results.Ok(new
                {
                    item.Id,
                    item.UserId,
                    item.OriginPlanetId,
                    item.ResearchType,
                    item.TargetLevel,
                    item.StartTimeUtc,
                    item.EndTimeUtc,
                    item.HangfireJobId
                });
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { Message = ex.Message });
            }
        })
        .WithName("EnqueueResearch");

        researchGroup.MapDelete("/queue", async (
            Guid userId,
            IApplicationDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var queueItem = await dbContext.ResearchQueueItems
                .FirstOrDefaultAsync(q => q.UserId == userId, cancellationToken);

            if (queueItem is null)
            {
                return Results.NotFound(new { Message = "Aktif bir araştırma bulunamadı." });
            }

            var planet = await dbContext.Planets
                .FirstOrDefaultAsync(p => p.Id == queueItem.OriginPlanetId, cancellationToken);

            if (planet is not null)
            {
                var (cost, _) = ConstructionFormulas.GetResearchDefinition(queueItem.ResearchType, queueItem.TargetLevel);
                planet.Metal += cost.Metal;
                planet.Crystal += cost.Crystal;
                planet.Deuterium += cost.Deuterium;
            }

            dbContext.ResearchQueueItems.Remove(queueItem);
            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Ok(new { CancelledResearchId = queueItem.Id });
        })
        .WithName("CancelResearch");

        researchGroup.MapPost("/instant-complete", async (
            Guid userId,
            IApplicationDbContext dbContext,
            IResearchService researchService,
            IDarkMatterService darkMatterService,
            IJobScheduler jobScheduler,
            IDistributedLockService lockService,
            IHubContext<GameHub> hubContext,
            CancellationToken cancellationToken) =>
        {
            string lockKey = $"lock:user:{userId}";
            await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

            var queueItem = await dbContext.ResearchQueueItems
                .FirstOrDefaultAsync(q => q.UserId == userId, cancellationToken);

            if (queueItem is null)
            {
                return Results.NotFound(new { Message = "Aktif bir araştırma bulunamadı." });
            }

            var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
            if (user is null)
            {
                return Results.NotFound(new { Message = "Oyuncu bulunamadı." });
            }

            var now = DateTime.UtcNow;
            double remainingSeconds = Math.Max(0, (queueItem.EndTimeUtc - now).TotalSeconds);
            int cost = darkMatterService.CalculateInstantCompletionCost(queueItem.TargetLevel, remainingSeconds);

            if (user.DarkMatter < cost)
            {
                return Results.BadRequest(new
                {
                    Message = $"Yetersiz Karanlık Madde. Gereken: {cost:N0} KM, Mevcut: {user.DarkMatter:N0} KM.",
                    Required = cost,
                    Available = user.DarkMatter
                });
            }

            user.DarkMatter -= cost;

            if (!string.IsNullOrEmpty(queueItem.HangfireJobId))
            {
                jobScheduler.CancelScheduledJob(queueItem.HangfireJobId);
            }

            var result = await researchService.CompleteResearchAsync(userId, queueItem.Id, cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);

            await hubContext.Clients.User(user.Id.ToString()).SendAsync("QueueCompleted", new
            {
                Type = "Research",
                UserId = user.Id,
                queueItem.ResearchType,
                NewLevel = result?.NewLevel ?? queueItem.TargetLevel
            }, cancellationToken);

            return Results.Ok(new
            {
                Completed = true,
                Cost = cost,
                RemainingDarkMatter = user.DarkMatter,
                NewLevel = result?.NewLevel ?? queueItem.TargetLevel,
                ResearchType = queueItem.ResearchType
            });
        })
        .WithName("InstantCompleteResearch");

        researchGroup.MapPost("/halve-duration", async (
            Guid userId,
            IApplicationDbContext dbContext,
            IResearchService researchService,
            IDarkMatterService darkMatterService,
            IJobScheduler jobScheduler,
            IDistributedLockService lockService,
            IHubContext<GameHub> hubContext,
            CancellationToken cancellationToken) =>
        {
            string lockKey = $"lock:user:{userId}";
            await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

            var queueItem = await dbContext.ResearchQueueItems
                .FirstOrDefaultAsync(q => q.UserId == userId, cancellationToken);

            if (queueItem is null)
            {
                return Results.NotFound(new { Message = "Aktif bir araştırma bulunamadı." });
            }

            var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
            if (user is null)
            {
                return Results.NotFound(new { Message = "Oyuncu bulunamadı." });
            }

            var now = DateTime.UtcNow;
            double totalDurationSeconds = Math.Max(1.0, (queueItem.EndTimeUtc - queueItem.StartTimeUtc).TotalSeconds);
            double remainingSeconds = Math.Max(0, (queueItem.EndTimeUtc - now).TotalSeconds);
            int cost = darkMatterService.CalculateHalveDurationCost(queueItem.TargetLevel, remainingSeconds, totalDurationSeconds);

            if (user.DarkMatter < cost)
            {
                return Results.BadRequest(new
                {
                    Message = $"Yetersiz Karanlık Madde. Gereken: {cost:N0} KM, Mevcut: {user.DarkMatter:N0} KM.",
                    Required = cost,
                    Available = user.DarkMatter
                });
            }

            user.DarkMatter -= cost;

            var newEndUtc = now.AddSeconds(remainingSeconds / 2.0);
            if (newEndUtc <= now.AddSeconds(2))
            {
                if (!string.IsNullOrEmpty(queueItem.HangfireJobId))
                {
                    jobScheduler.CancelScheduledJob(queueItem.HangfireJobId);
                }

                var result = await researchService.CompleteResearchAsync(userId, queueItem.Id, cancellationToken);
                await dbContext.SaveChangesAsync(cancellationToken);

                await hubContext.Clients.User(user.Id.ToString()).SendAsync("QueueCompleted", new
                {
                    Type = "Research",
                    UserId = user.Id,
                    queueItem.ResearchType,
                    NewLevel = result?.NewLevel ?? queueItem.TargetLevel
                }, cancellationToken);

                return Results.Ok(new
                {
                    Completed = true,
                    Cost = cost,
                    RemainingDarkMatter = user.DarkMatter,
                    NewLevel = result?.NewLevel ?? queueItem.TargetLevel
                });
            }

            if (!string.IsNullOrEmpty(queueItem.HangfireJobId))
            {
                jobScheduler.CancelScheduledJob(queueItem.HangfireJobId);
            }

            queueItem.HangfireJobId = jobScheduler.ScheduleResearchCompletion(
                userId,
                queueItem.Id,
                new DateTimeOffset(newEndUtc, TimeSpan.Zero));
            queueItem.StartTimeUtc = newEndUtc.AddSeconds(-totalDurationSeconds);
            queueItem.EndTimeUtc = newEndUtc;
            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Ok(new
            {
                Completed = false,
                Cost = cost,
                RemainingDarkMatter = user.DarkMatter,
                NewEndTimeUtc = DateTime.SpecifyKind(newEndUtc, DateTimeKind.Utc).ToString("O")
            });
        })
        .WithName("HalveResearchDuration");

        researchGroup.MapPost("/speedup", async (
            Guid userId,
            IApplicationDbContext dbContext,
            IResearchService researchService,
            IDarkMatterService darkMatterService,
            IJobScheduler jobScheduler,
            IDistributedLockService lockService,
            CancellationToken cancellationToken) =>
        {
            string lockKey = $"lock:user:{userId}";
            await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

            var queueItem = await dbContext.ResearchQueueItems
                .FirstOrDefaultAsync(q => q.UserId == userId, cancellationToken);

            if (queueItem is null)
            {
                return Results.NotFound(new { Message = "Aktif bir araştırma bulunamadı." });
            }

            var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
            if (user is null)
            {
                return Results.NotFound(new { Message = "Oyuncu bulunamadı." });
            }

            var now = DateTime.UtcNow;
            double totalDurationSeconds = Math.Max(1.0, (queueItem.EndTimeUtc - queueItem.StartTimeUtc).TotalSeconds);
            double remainingSeconds = Math.Max(0, (queueItem.EndTimeUtc - now).TotalSeconds);
            int cost = darkMatterService.CalculateHalveDurationCost(queueItem.TargetLevel, remainingSeconds, totalDurationSeconds);

            if (user.DarkMatter < cost)
            {
                return Results.BadRequest(new
                {
                    Message = $"Yetersiz Karanlık Madde. Gereken: {cost:N0} KM, Mevcut: {user.DarkMatter:N0} KM.",
                    Required = cost,
                    Available = user.DarkMatter
                });
            }

            user.DarkMatter -= cost;

            var halvedEndUtc = now.AddSeconds(remainingSeconds / 2.0);
            if (halvedEndUtc <= now.AddSeconds(2))
            {
                if (!string.IsNullOrEmpty(queueItem.HangfireJobId))
                {
                    jobScheduler.CancelScheduledJob(queueItem.HangfireJobId);
                }

                await researchService.CompleteResearchAsync(userId, queueItem.Id, cancellationToken);
                await dbContext.SaveChangesAsync(cancellationToken);
                return Results.Ok(new { Completed = true, Cost = cost, RemainingDarkMatter = user.DarkMatter });
            }

            if (!string.IsNullOrEmpty(queueItem.HangfireJobId))
            {
                jobScheduler.CancelScheduledJob(queueItem.HangfireJobId);
            }

            queueItem.HangfireJobId = jobScheduler.ScheduleResearchCompletion(
                userId,
                queueItem.Id,
                new DateTimeOffset(halvedEndUtc, TimeSpan.Zero));
            queueItem.StartTimeUtc = halvedEndUtc.AddSeconds(-totalDurationSeconds);
            queueItem.EndTimeUtc = halvedEndUtc;
            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Ok(new
            {
                Completed = false,
                Cost = cost,
                RemainingDarkMatter = user.DarkMatter,
                EndTimeUtc = DateTime.SpecifyKind(queueItem.EndTimeUtc, DateTimeKind.Utc).ToString("O")
            });
        })
        .WithName("SpeedupResearch");

        app.MapPost("/api/researches/start", async (
            EnqueueResearchRequest request,
            IResearchService researchService,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var item = await researchService.EnqueueResearchAsync(
                    request.UserId,
                    request.OriginPlanetId,
                    request.ResearchType,
                    cancellationToken);

                return Results.Ok(new
                {
                    item.Id,
                    item.UserId,
                    item.OriginPlanetId,
                    item.ResearchType,
                    item.TargetLevel,
                    item.StartTimeUtc,
                    item.EndTimeUtc,
                    item.HangfireJobId
                });
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { Message = ex.Message });
            }
        })
        .WithTags("Research")
        .WithName("StartResearchAlias");

        var researchesGroup = app.MapGroup("/api/researches")
            .WithTags("Research");

        researchesGroup.MapPost("/instant-complete", async (
            Guid userId,
            IApplicationDbContext dbContext,
            IResearchService researchService,
            IDarkMatterService darkMatterService,
            IJobScheduler jobScheduler,
            IDistributedLockService lockService,
            IHubContext<GameHub> hubContext,
            CancellationToken cancellationToken) =>
        {
            string lockKey = $"lock:user:{userId}";
            await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

            var queueItem = await dbContext.ResearchQueueItems
                .FirstOrDefaultAsync(q => q.UserId == userId, cancellationToken);

            if (queueItem is null)
            {
                return Results.NotFound(new { Message = "Aktif bir araştırma bulunamadı." });
            }

            var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
            if (user is null)
            {
                return Results.NotFound(new { Message = "Oyuncu bulunamadı." });
            }

            var now = DateTime.UtcNow;
            double remainingSeconds = Math.Max(0, (queueItem.EndTimeUtc - now).TotalSeconds);
            int cost = darkMatterService.CalculateInstantCompletionCost(queueItem.TargetLevel, remainingSeconds);

            if (user.DarkMatter < cost)
            {
                return Results.BadRequest(new
                {
                    Message = $"Yetersiz Karanlık Madde. Gereken: {cost:N0} KM, Mevcut: {user.DarkMatter:N0} KM.",
                    Required = cost,
                    Available = user.DarkMatter
                });
            }

            user.DarkMatter -= cost;

            if (!string.IsNullOrEmpty(queueItem.HangfireJobId))
            {
                jobScheduler.CancelScheduledJob(queueItem.HangfireJobId);
            }

            var result = await researchService.CompleteResearchAsync(userId, queueItem.Id, cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);

            await hubContext.Clients.User(user.Id.ToString()).SendAsync("QueueCompleted", new
            {
                Type = "Research",
                UserId = user.Id,
                queueItem.ResearchType,
                NewLevel = result?.NewLevel ?? queueItem.TargetLevel
            }, cancellationToken);

            return Results.Ok(new
            {
                Completed = true,
                Cost = cost,
                RemainingDarkMatter = user.DarkMatter,
                NewLevel = result?.NewLevel ?? queueItem.TargetLevel,
                ResearchType = queueItem.ResearchType
            });
        })
        .WithName("InstantCompleteResearchPlural");

        researchesGroup.MapPost("/halve-duration", async (
            Guid userId,
            IApplicationDbContext dbContext,
            IResearchService researchService,
            IDarkMatterService darkMatterService,
            IJobScheduler jobScheduler,
            IDistributedLockService lockService,
            IHubContext<GameHub> hubContext,
            CancellationToken cancellationToken) =>
        {
            string lockKey = $"lock:user:{userId}";
            await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

            var queueItem = await dbContext.ResearchQueueItems
                .FirstOrDefaultAsync(q => q.UserId == userId, cancellationToken);

            if (queueItem is null)
            {
                return Results.NotFound(new { Message = "Aktif bir araştırma bulunamadı." });
            }

            var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
            if (user is null)
            {
                return Results.NotFound(new { Message = "Oyuncu bulunamadı." });
            }

            var now = DateTime.UtcNow;
            double totalDurationSeconds = Math.Max(1, (queueItem.EndTimeUtc - queueItem.StartTimeUtc).TotalSeconds);
            double remainingSeconds = Math.Max(0, (queueItem.EndTimeUtc - now).TotalSeconds);
            int cost = darkMatterService.CalculateHalveDurationCost(queueItem.TargetLevel, remainingSeconds, totalDurationSeconds);

            if (user.DarkMatter < cost)
            {
                return Results.BadRequest(new
                {
                    Message = $"Yetersiz Karanlık Madde. Gereken: {cost:N0} KM, Mevcut: {user.DarkMatter:N0} KM.",
                    Required = cost,
                    Available = user.DarkMatter
                });
            }

            user.DarkMatter -= cost;

            double newRemainingSeconds = remainingSeconds / 2.0;
            var newEndUtc = now.AddSeconds(newRemainingSeconds);

            if (newRemainingSeconds <= 1.0)
            {
                if (!string.IsNullOrEmpty(queueItem.HangfireJobId))
                {
                    jobScheduler.CancelScheduledJob(queueItem.HangfireJobId);
                }

                var result = await researchService.CompleteResearchAsync(userId, queueItem.Id, cancellationToken);
                await dbContext.SaveChangesAsync(cancellationToken);

                await hubContext.Clients.User(user.Id.ToString()).SendAsync("QueueCompleted", new
                {
                    Type = "Research",
                    UserId = user.Id,
                    queueItem.ResearchType,
                    NewLevel = result?.NewLevel ?? queueItem.TargetLevel
                }, cancellationToken);

                return Results.Ok(new
                {
                    Completed = true,
                    Cost = cost,
                    RemainingDarkMatter = user.DarkMatter,
                    NewLevel = result?.NewLevel ?? queueItem.TargetLevel
                });
            }

            if (!string.IsNullOrEmpty(queueItem.HangfireJobId))
            {
                jobScheduler.CancelScheduledJob(queueItem.HangfireJobId);
            }

            queueItem.HangfireJobId = jobScheduler.ScheduleResearchCompletion(
                userId,
                queueItem.Id,
                new DateTimeOffset(newEndUtc, TimeSpan.Zero));
            queueItem.StartTimeUtc = newEndUtc.AddSeconds(-totalDurationSeconds);
            queueItem.EndTimeUtc = newEndUtc;
            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Ok(new
            {
                Completed = false,
                Cost = cost,
                RemainingDarkMatter = user.DarkMatter,
                NewEndTimeUtc = DateTime.SpecifyKind(newEndUtc, DateTimeKind.Utc).ToString("O")
            });
        })
        .WithName("HalveResearchDurationPlural");

        researchesGroup.MapPost("/speedup", async (
            Guid userId,
            IApplicationDbContext dbContext,
            IResearchService researchService,
            IDarkMatterService darkMatterService,
            IJobScheduler jobScheduler,
            IDistributedLockService lockService,
            CancellationToken cancellationToken) =>
        {
            string lockKey = $"lock:user:{userId}";
            await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

            var queueItem = await dbContext.ResearchQueueItems
                .FirstOrDefaultAsync(q => q.UserId == userId, cancellationToken);

            if (queueItem is null)
            {
                return Results.NotFound(new { Message = "Aktif bir araştırma bulunamadı." });
            }

            var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
            if (user is null)
            {
                return Results.NotFound(new { Message = "Oyuncu bulunamadı." });
            }

            var now = DateTime.UtcNow;
            double totalDurationSeconds = Math.Max(1, (queueItem.EndTimeUtc - queueItem.StartTimeUtc).TotalSeconds);
            double remainingSeconds = Math.Max(0, (queueItem.EndTimeUtc - now).TotalSeconds);
            int cost = darkMatterService.CalculateHalveDurationCost(queueItem.TargetLevel, remainingSeconds, totalDurationSeconds);

            if (user.DarkMatter < cost)
            {
                return Results.BadRequest(new
                {
                    Message = $"Yetersiz Karanlık Madde. Gereken: {cost:N0} KM, Mevcut: {user.DarkMatter:N0} KM.",
                    Required = cost,
                    Available = user.DarkMatter
                });
            }

            user.DarkMatter -= cost;

            double halvedSeconds = remainingSeconds / 2.0;
            var halvedEndUtc = now.AddSeconds(halvedSeconds);

            if (halvedSeconds <= 1.0)
            {
                if (!string.IsNullOrEmpty(queueItem.HangfireJobId))
                {
                    jobScheduler.CancelScheduledJob(queueItem.HangfireJobId);
                }

                await researchService.CompleteResearchAsync(userId, queueItem.Id, cancellationToken);
                await dbContext.SaveChangesAsync(cancellationToken);
                return Results.Ok(new { Completed = true, Cost = cost, RemainingDarkMatter = user.DarkMatter });
            }

            if (!string.IsNullOrEmpty(queueItem.HangfireJobId))
            {
                jobScheduler.CancelScheduledJob(queueItem.HangfireJobId);
            }

            queueItem.HangfireJobId = jobScheduler.ScheduleResearchCompletion(
                userId,
                queueItem.Id,
                new DateTimeOffset(halvedEndUtc, TimeSpan.Zero));
            queueItem.StartTimeUtc = halvedEndUtc.AddSeconds(-totalDurationSeconds);
            queueItem.EndTimeUtc = halvedEndUtc;
            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Ok(new
            {
                Completed = false,
                Cost = cost,
                RemainingDarkMatter = user.DarkMatter,
                EndTimeUtc = DateTime.SpecifyKind(queueItem.EndTimeUtc, DateTimeKind.Utc).ToString("O")
            });
        })
        .WithName("SpeedupResearchPlural");

        var playerGroup = app.MapGroup("/api/player")
            .WithTags("Player");

        playerGroup.MapGet("/bootstrap", async (
            IApplicationDbContext dbContext,
            IResourceCalculationService resourceService,
            IBuildingService buildingService,
            IShipyardService shipyardService,
            IResearchService researchService,
            CancellationToken cancellationToken) =>
        {
            var now = DateTime.UtcNow;

            var commander = await dbContext.Users
                .FirstOrDefaultAsync(u => u.Email == "commander@nova.ogame" || u.Username == "Commander", cancellationToken)
                ?? await dbContext.Users.OrderBy(u => u.CreatedAtUtc).FirstOrDefaultAsync(cancellationToken);

            if (commander is null)
            {
                commander = new User
                {
                    Id = Guid.NewGuid(),
                    Username = "Commander",
                    Email = "commander@nova.ogame",
                    PasswordHash = "HASHED_DEV_PASSWORD",
                    Role = UserRole.Admin,
                    AllianceTag = "NOVA",
                    TotalPoints = 12500,
                    DarkMatter = 2500,
                    CreatedAtUtc = now,
                    LastLoginUtc = now
                };
                dbContext.Users.Add(commander);

                var homeworld = new Planet
                {
                    Id = Guid.NewGuid(),
                    UserId = commander.Id,
                    Name = "Aethelgard Prime",
                    Galaxy = 1,
                    System = 142,
                    Slot = 8,
                    IsCapital = true,
                    TempMin = 24,
                    TempMax = 64,
                    Diameter = 12800,
                    FieldsUsed = 58,
                    MaxFields = 163,
                    Metal = 48250,
                    Crystal = 29400,
                    Deuterium = 12850,
                    LastResourceUpdateUtc = now
                };

                var colony = new Planet
                {
                    Id = Guid.NewGuid(),
                    UserId = commander.Id,
                    Name = "Cryo Station V",
                    Galaxy = 1,
                    System = 210,
                    Slot = 15,
                    IsCapital = false,
                    TempMin = -125,
                    TempMax = -85,
                    Diameter = 10400,
                    FieldsUsed = 46,
                    MaxFields = 148,
                    Metal = 19500,
                    Crystal = 14200,
                    Deuterium = 38900,
                    LastResourceUpdateUtc = now
                };

                dbContext.Planets.AddRange(homeworld, colony);

                dbContext.Buildings.AddRange(
                    new Building { Id = Guid.NewGuid(), PlanetId = homeworld.Id, BuildingType = BuildingType.MetalMine, Level = 14 },
                    new Building { Id = Guid.NewGuid(), PlanetId = homeworld.Id, BuildingType = BuildingType.CrystalMine, Level = 12 },
                    new Building { Id = Guid.NewGuid(), PlanetId = homeworld.Id, BuildingType = BuildingType.DeuteriumSynthesizer, Level = 9 },
                    new Building { Id = Guid.NewGuid(), PlanetId = homeworld.Id, BuildingType = BuildingType.SolarPlant, Level = 15 },
                    new Building { Id = Guid.NewGuid(), PlanetId = homeworld.Id, BuildingType = BuildingType.RoboticsFactory, Level = 4 },
                    new Building { Id = Guid.NewGuid(), PlanetId = homeworld.Id, BuildingType = BuildingType.Shipyard, Level = 4 },
                    new Building { Id = Guid.NewGuid(), PlanetId = colony.Id, BuildingType = BuildingType.MetalMine, Level = 11 },
                    new Building { Id = Guid.NewGuid(), PlanetId = colony.Id, BuildingType = BuildingType.CrystalMine, Level = 10 },
                    new Building { Id = Guid.NewGuid(), PlanetId = colony.Id, BuildingType = BuildingType.DeuteriumSynthesizer, Level = 12 },
                    new Building { Id = Guid.NewGuid(), PlanetId = colony.Id, BuildingType = BuildingType.SolarPlant, Level = 13 }
                );

                dbContext.PlanetUnits.AddRange(
                    new PlanetUnit { Id = Guid.NewGuid(), PlanetId = homeworld.Id, UnitType = UnitType.SmallCargo, Count = 45 },
                    new PlanetUnit { Id = Guid.NewGuid(), PlanetId = homeworld.Id, UnitType = UnitType.LargeCargo, Count = 18 },
                    new PlanetUnit { Id = Guid.NewGuid(), PlanetId = homeworld.Id, UnitType = UnitType.LightFighter, Count = 120 },
                    new PlanetUnit { Id = Guid.NewGuid(), PlanetId = homeworld.Id, UnitType = UnitType.HeavyFighter, Count = 35 },
                    new PlanetUnit { Id = Guid.NewGuid(), PlanetId = homeworld.Id, UnitType = UnitType.Cruiser, Count = 25 },
                    new PlanetUnit { Id = Guid.NewGuid(), PlanetId = homeworld.Id, UnitType = UnitType.Battleship, Count = 12 },
                    new PlanetUnit { Id = Guid.NewGuid(), PlanetId = homeworld.Id, UnitType = UnitType.Recycler, Count = 10 },
                    new PlanetUnit { Id = Guid.NewGuid(), PlanetId = homeworld.Id, UnitType = UnitType.EspionageProbe, Count = 30 }
                );

                bool hasNeighbor = await dbContext.Planets
                    .AnyAsync(p => p.Galaxy == 1 && p.System == 142 && p.Slot == 4, cancellationToken);

                if (!hasNeighbor)
                {
                    var npc = await dbContext.Users.FirstOrDefaultAsync(u => u.Email == "kaelen@nova.ogame", cancellationToken);
                    if (npc == null)
                    {
                        npc = new User
                        {
                            Id = Guid.NewGuid(),
                            Username = "Kaelen",
                            Email = "kaelen@nova.ogame",
                            PasswordHash = "HASHED_NPC",
                            AllianceTag = "TITAN",
                            TotalPoints = 9800,
                            CreatedAtUtc = now,
                            LastLoginUtc = now.AddMinutes(-18)
                        };
                        dbContext.Users.Add(npc);
                    }
                    var npcPlanet = new Planet
                    {
                        Id = Guid.NewGuid(),
                        UserId = npc.Id,
                        Name = "Valkyrie IV",
                        Galaxy = 1,
                        System = 142,
                        Slot = 4,
                        TempMin = 30,
                        TempMax = 70,
                        Diameter = 13100,
                        FieldsUsed = 34,
                        MaxFields = 163,
                        Metal = 32000,
                        Crystal = 18000,
                        Deuterium = 6500,
                        LastResourceUpdateUtc = now
                    };
                    dbContext.Planets.Add(npcPlanet);
                    var existingDf = await dbContext.DebrisFields.FirstOrDefaultAsync(df => df.Galaxy == 1 && df.System == 142 && df.Slot == 4, cancellationToken);
                    if (existingDf == null)
                    {
                        dbContext.DebrisFields.Add(new DebrisField
                        {
                            Id = Guid.NewGuid(),
                            Galaxy = 1,
                            System = 142,
                            Slot = 4,
                            Metal = 9000,
                            Crystal = 3000,
                            UpdatedAtUtc = now
                        });
                    }
                }

                await dbContext.SaveChangesAsync(cancellationToken);
            }

            // Finalize any expired building queue items on commander's planets (with 1s clock skew tolerance)
            var expiredQueues = await dbContext.BuildingQueueItems
                .Include(q => q.Planet)
                .Where(q => q.Planet != null && q.Planet.UserId == commander.Id && q.EndTimeUtc <= now.AddSeconds(1))
                .ToListAsync(cancellationToken);

            foreach (var expired in expiredQueues)
            {
                await buildingService.CompleteBuildingUpgradeAsync(expired.PlanetId, expired.Id, cancellationToken);
            }

            // Finalize any expired research queue items for commander (with 1s clock skew tolerance)
            var expiredResearches = await dbContext.ResearchQueueItems
                .Where(q => q.UserId == commander.Id && q.EndTimeUtc <= now.AddSeconds(1))
                .ToListAsync(cancellationToken);

            foreach (var expired in expiredResearches)
            {
                await researchService.CompleteResearchAsync(commander.Id, expired.Id, cancellationToken);
            }

            var planets = await dbContext.Planets
                .AsNoTracking()
                .AsSplitQuery()
                .Include(p => p.User)
                    .ThenInclude(u => u!.Researches)
                .Include(p => p.Buildings)
                .Include(p => p.BuildingQueue)
                .Include(p => p.Units)
                .Include(p => p.ShipyardQueue)
                .Where(p => p.UserId == commander.Id && !p.IsDestroyedPlanet)
                .OrderByDescending(p => p.IsCapital)
                .ThenBy(p => p.Name)
                .ToListAsync(cancellationToken);

            var planetDtos = new List<object>(planets.Count);
            var planetIds = planets.Select(p => p.Id).ToHashSet();

            foreach (var p in planets)
            {
                double fusionFactor = 1.0;
                if (PlanetSettingsStore.TryGetValue(p.Id, out var pSettings))
                {
                    fusionFactor = pSettings.FusionReactorPercent / 100.0;
                }
                var resources = resourceService.GetCurrentResources(p, now, fusionFactor);
                string coords = $"[{p.Galaxy}:{p.System}:{p.Slot}]";

                IReadOnlyList<PlanetUnit> stationedUnits = p.Units.ToList();
                IReadOnlyList<ShipyardQueueItem> shipyardQueue = p.ShipyardQueue
                    .OrderBy(q => q.BatchStartTimeUtc)
                    .ToList();

                // Only acquire lock and evaluate shipyard queue in DB if a unit batch actually has due units (with 1s tolerance)
                if (shipyardQueue.Any(q => q.NextUnitFinishUtc <= now.AddSeconds(1)))
                {
                    var shipyardState = await shipyardService.EvaluatePlanetShipyardQueueAsync(p.Id, now.AddSeconds(1), cancellationToken);
                    stationedUnits = shipyardState.StationedUnits;
                    shipyardQueue = shipyardState.ActiveQueueItems;
                }

                var lifeformState = await GetOrLoadPlanetLifeformStateAsync(p, dbContext, cancellationToken);

                var activeQueue = p.BuildingQueue
                    .OrderBy(q => q.EndTimeUtc)
                    .FirstOrDefault();

                planetDtos.Add(new
                {
                    p.Id,
                    p.Name,
                    Coords = coords,
                    p.Galaxy,
                    p.System,
                    p.Slot,
                    p.IsCapital,
                    p.TempMin,
                    p.TempMax,
                    p.Diameter,
                    p.FieldsUsed,
                    p.MaxFields,
                    Metal = Math.Floor(resources.Metal),
                    Crystal = Math.Floor(resources.Crystal),
                    Deuterium = Math.Floor(resources.Deuterium),
                    MetalPerHour = Math.Round(resources.MetalPerHour),
                    CrystalPerHour = Math.Round(resources.CrystalPerHour),
                    DeuteriumPerHour = Math.Round(resources.DeuteriumPerHour),
                    ProducedEnergy = Math.Round(resources.ProducedEnergy),
                    ConsumedEnergy = Math.Round(resources.ConsumedEnergy),
                    ServerTimeUtc = now.ToString("O"),
                    Buildings = p.Buildings.Select(b => new
                    {
                        b.Id,
                        b.BuildingType,
                        b.Level
                    }),
                    ActiveBuildingQueue = activeQueue is null ? null : new
                    {
                        activeQueue.Id,
                        activeQueue.BuildingType,
                        activeQueue.TargetLevel,
                        StartTimeUtc = DateTime.SpecifyKind(activeQueue.StartTimeUtc, DateTimeKind.Utc).ToString("O"),
                        EndTimeUtc = DateTime.SpecifyKind(activeQueue.EndTimeUtc, DateTimeKind.Utc).ToString("O")
                    },
                    ActiveLifeformQueue = lifeformState.ActiveQueue is null ? null : new
                    {
                        lifeformState.ActiveQueue.BuildingKey,
                        lifeformState.ActiveQueue.BuildingName,
                        lifeformState.ActiveQueue.TargetLevel,
                        lifeformState.ActiveQueue.StartTimeUtc,
                        lifeformState.ActiveQueue.EndTimeUtc
                    },
                    Units = stationedUnits.Select(u => new
                    {
                        u.UnitType,
                        u.Count
                    }),
                    ShipyardQueue = shipyardQueue.Select(q => new
                    {
                        q.Id,
                        q.UnitType,
                        q.TotalCount,
                        q.CompletedCount,
                        q.UnitDurationSeconds,
                        NextUnitFinishUtc = DateTime.SpecifyKind(q.NextUnitFinishUtc, DateTimeKind.Utc).ToString("O")
                    })
                });
            }

            var activeMissions = await dbContext.FleetMissions
                .AsNoTracking()
                .Include(m => m.Ships)
                .Where(m =>
                    (m.Status == FleetMissionStatus.Outbound || m.Status == FleetMissionStatus.Returning) &&
                    (m.UserId == commander.Id || (m.TargetPlanetId.HasValue && planetIds.Contains(m.TargetPlanetId.Value))))
                .OrderBy(m => m.ArrivalUtc)
                .ToListAsync(cancellationToken);

            var existingResearches = await dbContext.UserResearches
                .Where(r => r.UserId == commander.Id)
                .ToListAsync(cancellationToken);

            int defenderEspLevel = existingResearches.FirstOrDefault(r => r.ResearchType == ResearchType.EspionageTechnology)?.Level ?? 6;

            var incomingFleets = activeMissions
                .Where(m => m.Status == FleetMissionStatus.Outbound ? m.ArrivalUtc > now : m.ReturnUtc > now)
                .Select(m =>
                {
                    bool isReturning = m.Status == FleetMissionStatus.Returning || m.Status == FleetMissionStatus.Recalled;
                    DateTime effectiveEta = isReturning && m.ReturnUtc.HasValue ? m.ReturnUtc.Value : m.ArrivalUtc;
                    bool isHostile = m.UserId != commander.Id && m.MissionType == FleetMissionType.Attack;
                    bool canRecall = !isReturning && !isHostile && (m.Status == FleetMissionStatus.Outbound || m.Status == FleetMissionStatus.Holding);
                    string originPlanetName = planets.FirstOrDefault(p => p.Id == m.OriginPlanetId)?.Name ?? "Romulus";
                    string targetPlanetName = planets.FirstOrDefault(p => p.Id == m.TargetPlanetId)?.Name ?? "TR_NEW";
                    int attackerEspLevel = 4;

                    var rawShips = m.Ships.Select(s => (s.UnitType, s.Count)).ToList();
                    var breakdown = HostileFleetAlertFormulas.ResolveShipBreakdown(rawShips, defenderEspLevel, attackerEspLevel);

                    return new
                    {
                        Id = m.Id.ToString(),
                        OriginCoords = $"[{m.OriginGalaxy}:{m.OriginSystem}:{m.OriginSlot}]",
                        OriginPlanetName = originPlanetName,
                        AttackerName = isHostile ? "Romulus Komutanı" : commander.Username,
                        TargetCoords = $"[{m.TargetGalaxy}:{m.TargetSystem}:{m.TargetSlot}]",
                        TargetPlanetName = targetPlanetName,
                        MissionType = isReturning ? $"{m.MissionType} (Returning)" : m.MissionType.ToString(),
                        MissionTypeName = isHostile ? "Saldır" : m.MissionType.ToString(),
                        ArrivalUtc = DateTime.SpecifyKind(effectiveEta, DateTimeKind.Utc).ToString("O"),
                        ShipCount = m.Ships.Sum(s => s.Count),
                        IsHostile = isHostile,
                        IsReturning = isReturning,
                        CanRecall = canRecall,
                        AttackerEspionageLevel = attackerEspLevel,
                        DefenderEspionageLevel = defenderEspLevel,
                        IntelTier = (int)HostileFleetAlertFormulas.ResolveIntelTier(defenderEspLevel, attackerEspLevel),
                        Ships = breakdown.Select(s => new
                        {
                            UnitType = (int)s.UnitType,
                            ShipName = s.ShipName,
                            ExactCount = s.ExactCount,
                            DisplayCount = s.DisplayCount
                        }).ToList()
                    };
                })
                .ToList();

            var activeResearch = await dbContext.ResearchQueueItems
                .AsNoTracking()
                .Where(r => r.UserId == commander.Id && r.EndTimeUtc > now.AddSeconds(1))
                .OrderBy(r => r.EndTimeUtc)
                .Select(r => new
                {
                    r.Id,
                    r.OriginPlanetId,
                    r.ResearchType,
                    ResearchName = r.ResearchType.ToString(),
                    r.TargetLevel,
                    StartTimeUtc = DateTime.SpecifyKind(r.StartTimeUtc, DateTimeKind.Utc).ToString("O"),
                    EndTimeUtc = DateTime.SpecifyKind(r.EndTimeUtc, DateTimeKind.Utc).ToString("O")
                })
                .FirstOrDefaultAsync(cancellationToken);

            bool needsResearchSave = false;
            if (!existingResearches.Any(r => r.ResearchType == ResearchType.EnergyTechnology))
            {
                var energy = new UserResearch
                {
                    Id = Guid.NewGuid(),
                    UserId = commander.Id,
                    ResearchType = ResearchType.EnergyTechnology,
                    Level = 6
                };
                dbContext.UserResearches.Add(energy);
                existingResearches.Add(energy);
                needsResearchSave = true;
            }

            if (!existingResearches.Any(r => r.ResearchType == ResearchType.ComputerTechnology))
            {
                var comp = new UserResearch
                {
                    Id = Guid.NewGuid(),
                    UserId = commander.Id,
                    ResearchType = ResearchType.ComputerTechnology,
                    Level = 4
                };
                dbContext.UserResearches.Add(comp);
                existingResearches.Add(comp);
                needsResearchSave = true;
            }

            if (needsResearchSave)
            {
                await dbContext.SaveChangesAsync(cancellationToken);
            }

            var researches = existingResearches
                .Select(r => new
                {
                    r.ResearchType,
                    r.Level
                })
                .ToList();

            return Results.Ok(new
            {
                User = new
                {
                    commander.Id,
                    commander.Username,
                    commander.AllianceTag,
                    commander.DarkMatter,
                    commander.TotalPoints,
                    PlayerClass = commander.PlayerClass.ToString(),
                    PlayerClassId = (int)commander.PlayerClass,
                    HonorPoints = 0
                },
                Planets = planetDtos,
                Researches = researches,
                ActiveResearchQueue = activeResearch,
                IncomingFleets = incomingFleets
            });
        })
        .WithName("GetPlayerBootstrap");

        var lifeformsGroup = app.MapGroup("/api/lifeforms")
            .WithTags("Lifeforms");

        lifeformsGroup.MapGet("/planet/{id}", async (
            string id,
            IApplicationDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var planet = await ResolvePlanetAsync(id, dbContext, cancellationToken);
            if (planet is null) return Results.NotFound(new { Message = $"Planet {id} not found." });
            var actualId = planet.Id;
            var state = await GetOrLoadPlanetLifeformStateAsync(planet, dbContext, cancellationToken);
            return Results.Ok(BuildLifeformResponseDto(actualId, state));
        })
        .WithName("GetLifeformsByPlanetGroup");

        lifeformsGroup.MapPost("/planet/{id}/buildings/build", async (
            string id,
            EnqueueLifeformBuildingRequest request,
            IApplicationDbContext dbContext,
            IResourceCalculationService resourceService,
            IDistributedLockService lockService,
            CancellationToken cancellationToken) =>
        {
            var planet = await ResolvePlanetAsync(id, dbContext, cancellationToken);
            if (planet is null) return Results.NotFound(new { Message = $"Planet {id} not found." });
            var actualId = planet.Id;
            string lockKey = $"lock:planet:{actualId}";
            await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

            var now = DateTime.UtcNow;
            resourceService.ApplyLazyUpdate(planet, now);
            var state = await GetOrLoadPlanetLifeformStateAsync(planet, dbContext, cancellationToken);

            if (state.ActiveQueue is not null)
            {
                return Results.BadRequest(new { Message = "Bu gezegende zaten aktif bir canlı türü bina inşası var." });
            }

            double metalCost = Math.Max(0, request.MetalCost);
            double crystalCost = Math.Max(0, request.CrystalCost);
            double deutCost = Math.Max(0, request.DeuteriumCost);

            if (planet.Metal < metalCost || planet.Crystal < crystalCost || planet.Deuterium < deutCost)
            {
                return Results.BadRequest(new { Message = "Yetersiz hammadde." });
            }

            planet.Metal -= metalCost;
            planet.Crystal -= crystalCost;
            planet.Deuterium -= deutCost;
            await dbContext.SaveChangesAsync(cancellationToken);

            int currentLvl = state.BuildingLevels.GetValueOrDefault(request.BuildingKey, 0);
            int targetLvl = currentLvl + 1;
            int durationSec = Math.Clamp(request.DurationSeconds <= 0 ? 10 : request.DurationSeconds, 3, 7200);
            var endUtc = now.AddSeconds(durationSec);

            if (string.IsNullOrWhiteSpace(state.ActiveSpecies)) state.ActiveSpecies = "humans";
            state.IsActive = true;
            state.ActiveQueue = new ActiveLifeformQueueDto(
                BuildingKey: request.BuildingKey,
                BuildingName: request.BuildingName,
                TargetLevel: targetLvl,
                StartTimeUtc: now.ToString("O"),
                EndTimeUtc: endUtc.ToString("O"),
                RefundMetal: metalCost,
                RefundCrystal: crystalCost,
                RefundDeuterium: deutCost);

            await SavePlanetLifeformStateAsync(actualId, state, dbContext, cancellationToken);

            return Results.Ok(BuildLifeformResponseDto(actualId, state));
        })
        .WithName("BuildLifeformBuildingDirect");

        lifeformsGroup.MapPost("/planet/{id}/tech/research", async (
            string id,
            EnqueueLifeformTechRequest request,
            IApplicationDbContext dbContext,
            IResourceCalculationService resourceService,
            IDistributedLockService lockService,
            CancellationToken cancellationToken) =>
        {
            var planet = await ResolvePlanetAsync(id, dbContext, cancellationToken);
            if (planet is null) return Results.NotFound(new { Message = $"Planet {id} not found." });
            var actualId = planet.Id;
            string lockKey = $"lock:planet:{actualId}";
            await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

            var now = DateTime.UtcNow;
            resourceService.ApplyLazyUpdate(planet, now);
            var state = await GetOrLoadPlanetLifeformStateAsync(planet, dbContext, cancellationToken);

            if (state.ActiveTechQueue is not null)
            {
                return Results.BadRequest(new { Message = "Bu gezegende zaten aktif bir teknoloji araştırması var." });
            }

            string curSp = PlanetLifeformMemoryState.NormalizeSpeciesId(state.ActiveSpecies);
            var spDef = LifeformsSpeciesFormulas.GetSpecies(curSp);
            var b1Key = spDef.Buildings.FirstOrDefault(b => b.Index == 1)?.Key ?? "residentialSector";
            var b9Key = spDef.Buildings.FirstOrDefault(b => b.Index == 9)?.Key ?? "skyscraper";
            var b4Key = spDef.Buildings.FirstOrDefault(b => b.Index == 4)?.Key ?? "academyOfSciences";
            var b5Key = spDef.Buildings.FirstOrDefault(b => b.Index == 5)?.Key ?? "neuroCalibrationCentre";

            int resLvl = state.BuildingLevels.GetValueOrDefault(b1Key, 0);
            int skyLvl = state.BuildingLevels.GetValueOrDefault(b9Key, 0);
            int acadLvl = state.BuildingLevels.GetValueOrDefault(b4Key, 0);
            int neuroLvl = state.BuildingLevels.GetValueOrDefault(b5Key, 0);
            var tiers = LifeformsHumansFormulas.CalculatePopulationTiers(resLvl, skyLvl, acadLvl, neuroLvl);
            long totalPop = (long)tiers.T1 + tiers.T2 + tiers.T3;

            if (!LifeformsSpeciesFormulas.IsTechUnlocked(request.Slot, totalPop))
            {
                return Results.BadRequest(new { Message = $"Bu teknoloji için yeterli nüfus yok. Gerekli yuva: {request.Slot}" });
            }

            double metalCost = Math.Max(0, request.MetalCost);
            double crystalCost = Math.Max(0, request.CrystalCost);
            double deutCost = Math.Max(0, request.DeuteriumCost);

            if (planet.Metal < metalCost || planet.Crystal < crystalCost || planet.Deuterium < deutCost)
            {
                return Results.BadRequest(new { Message = "Yetersiz hammadde." });
            }

            planet.Metal -= metalCost;
            planet.Crystal -= crystalCost;
            planet.Deuterium -= deutCost;
            await dbContext.SaveChangesAsync(cancellationToken);

            int currentLvl = state.TechLevels.GetValueOrDefault(request.Slot, 0);
            int targetLvl = currentLvl + 1;
            int durationSec = Math.Clamp(request.DurationSeconds <= 0 ? 10 : request.DurationSeconds, 3, 7200);
            var endUtc = now.AddSeconds(durationSec);

            string slotSpecies = state.SlotSpecies.GetValueOrDefault(request.Slot, curSp);
            string techName = !string.IsNullOrWhiteSpace(request.TechName)
                ? request.TechName
                : (LifeformsSpeciesFormulas.GetTech(slotSpecies, request.Slot)?.Name ?? $"Teknoloji {request.Slot}");

            state.IsActive = true;
            state.ActiveTechQueue = new ActiveLifeformTechQueueDto(
                Slot: request.Slot,
                TechName: techName,
                TargetLevel: targetLvl,
                StartTimeUtc: now.ToString("O"),
                EndTimeUtc: endUtc.ToString("O"),
                RefundMetal: metalCost,
                RefundCrystal: crystalCost,
                RefundDeuterium: deutCost);

            await SavePlanetLifeformStateAsync(actualId, state, dbContext, cancellationToken);

            return Results.Ok(BuildLifeformResponseDto(actualId, state));
        })
        .WithName("EnqueueLifeformTechResearchDirect");

        lifeformsGroup.MapPost("/planet/{id}/stop", async (
            string id,
            IApplicationDbContext dbContext,
            IResourceCalculationService resourceService,
            IDistributedLockService lockService,
            CancellationToken cancellationToken) =>
        {
            var planet = await ResolvePlanetAsync(id, dbContext, cancellationToken);
            if (planet is null) return Results.NotFound(new { Message = $"Planet {id} not found." });
            var actualId = planet.Id;
            string lockKey = $"lock:planet:{actualId}";
            await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

            var now = DateTime.UtcNow;
            resourceService.ApplyLazyUpdate(planet, now);
            var state = await GetOrLoadPlanetLifeformStateAsync(planet, dbContext, cancellationToken);

            if (state.ActiveQueue is not null)
            {
                planet.Metal += state.ActiveQueue.RefundMetal;
                planet.Crystal += state.ActiveQueue.RefundCrystal;
                planet.Deuterium += state.ActiveQueue.RefundDeuterium;
                state.ActiveQueue = null;
            }

            if (state.ActiveTechQueue is not null)
            {
                planet.Metal += state.ActiveTechQueue.RefundMetal;
                planet.Crystal += state.ActiveTechQueue.RefundCrystal;
                planet.Deuterium += state.ActiveTechQueue.RefundDeuterium;
                state.ActiveTechQueue = null;
            }

            state.IsActive = false;
            await dbContext.SaveChangesAsync(cancellationToken);
            await SavePlanetLifeformStateAsync(actualId, state, dbContext, cancellationToken);

            return Results.Ok(BuildLifeformResponseDto(actualId, state));
        })
        .WithName("StopPlanetLifeformsDirect");

        lifeformsGroup.MapPost("/planet/{id}/activate", async (
            string id,
            IApplicationDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var planet = await ResolvePlanetAsync(id, dbContext, cancellationToken);
            if (planet is null) return Results.NotFound();

            var actualId = planet.Id;
            var state = await GetOrLoadPlanetLifeformStateAsync(planet, dbContext, cancellationToken);
            state.IsActive = true;
            if (string.IsNullOrWhiteSpace(state.ActiveSpecies)) state.ActiveSpecies = "humans";
            await SavePlanetLifeformStateAsync(actualId, state, dbContext, cancellationToken);

            return Results.Ok(BuildLifeformResponseDto(actualId, state));
        })
        .WithName("ActivatePlanetLifeformsDirect");

        lifeformsGroup.MapPost("/planet/{id}/species/select", async (
            string id,
            SelectSpeciesRequest request,
            IApplicationDbContext dbContext,
            IResourceCalculationService resourceService,
            IDistributedLockService lockService,
            CancellationToken cancellationToken) =>
        {
            var planet = await ResolvePlanetAsync(id, dbContext, cancellationToken);
            if (planet is null) return Results.NotFound(new { Message = $"Planet {id} not found." });
            var actualId = planet.Id;
            string lockKey = $"lock:planet:{actualId}";
            await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

            var now = DateTime.UtcNow;
            resourceService.ApplyLazyUpdate(planet, now);
            var state = await GetOrLoadPlanetLifeformStateAsync(planet, dbContext, cancellationToken);

            string targetNorm = PlanetLifeformMemoryState.NormalizeSpeciesId(request.SpeciesId);
            if (!LifeformDiscoveryStore.IsSpeciesUnlocked(planet.UserId, targetNorm))
            {
                return Results.BadRequest(new { Message = "Bu canlı türü henüz keşfedilmedi. Galaksi haritasındaki Mor DNA simgelerinden keşif yaparak türün kilidini açmalısınız." });
            }

            if (state.ActiveQueue is not null)
            {
                planet.Metal += state.ActiveQueue.RefundMetal;
                planet.Crystal += state.ActiveQueue.RefundCrystal;
                planet.Deuterium += state.ActiveQueue.RefundDeuterium;
                state.ActiveQueue = null;
            }

            if (state.ActiveTechQueue is not null)
            {
                planet.Metal += state.ActiveTechQueue.RefundMetal;
                planet.Crystal += state.ActiveTechQueue.RefundCrystal;
                planet.Deuterium += state.ActiveTechQueue.RefundDeuterium;
                state.ActiveTechQueue = null;
            }

            state.SwitchSpecies(request.SpeciesId);

            // If this is a colony (non-capital), update Directive 6 Step 7 progress
            if (!planet.IsCapital)
            {
                var d6Prog = await dbContext.UserTutorialProgresses
                    .FirstOrDefaultAsync(p => p.UserId == planet.UserId && p.DirectiveId == 6 && p.CurrentQuestStep == 7, cancellationToken);
                if (d6Prog != null)
                {
                    d6Prog.SubStepBitmask |= 1;
                }
            }

            await dbContext.SaveChangesAsync(cancellationToken);
            await SavePlanetLifeformStateAsync(actualId, state, dbContext, cancellationToken);

            return Results.Ok(BuildLifeformResponseDto(actualId, state));
        })
        .WithName("SelectPlanetSpeciesDirect");

        lifeformsGroup.MapPost("/planet/{id}/tech/slot/select", async (
            string id,
            SelectSlotTechRequest request,
            IApplicationDbContext dbContext,
            IDistributedLockService lockService,
            CancellationToken cancellationToken) =>
        {
            var planet = await ResolvePlanetAsync(id, dbContext, cancellationToken);
            if (planet is null) return Results.NotFound(new { Message = $"Planet {id} not found." });

            var actualId = planet.Id;
            string lockKey = $"lock:planet:{actualId}";
            await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

            if (request.Slot < 1 || request.Slot > 18)
            {
                return Results.BadRequest(new { Message = "Yuva numarası 1 ile 18 arasında olmalıdır." });
            }

            var state = await GetOrLoadPlanetLifeformStateAsync(planet, dbContext, cancellationToken);
            string normSp = PlanetLifeformMemoryState.NormalizeSpeciesId(request.SpeciesId);

            if (state.ArtifactCount >= 100)
            {
                state.ArtifactCount -= 100;
            }

            state.SlotSpecies[request.Slot] = normSp;
            await SavePlanetLifeformStateAsync(actualId, state, dbContext, cancellationToken);

            return Results.Ok(BuildLifeformResponseDto(actualId, state));
        })
        .WithName("SelectSlotTechDirect");

        return app;
    }

    private static async Task<PlayerClass> ResolvePlanetOwnerClassAsync(
        Guid planetId,
        IApplicationDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var ownerId = await dbContext.Planets
            .AsNoTracking()
            .Where(p => p.Id == planetId)
            .Select(p => p.UserId)
            .FirstOrDefaultAsync(cancellationToken);

        if (ownerId == Guid.Empty) return PlayerClass.None;

        return await dbContext.Users
            .AsNoTracking()
            .Where(u => u.Id == ownerId)
            .Select(u => u.PlayerClass)
            .FirstOrDefaultAsync(cancellationToken);
    }

    private static PlanetResourceSettingsDto NormalizeResourceSettings(PlanetResourceSettingsDto input, PlayerClass playerClass = PlayerClass.None)
    {
        static int ClampStep10(int value, int max = 100)
        {
            int clamped = Math.Clamp(value, 0, max);
            return (int)Math.Round(clamped / 10.0) * 10;
        }

        return new PlanetResourceSettingsDto(
            MetalMinePercent: ClampStep10(input.MetalMinePercent),
            CrystalMinePercent: ClampStep10(input.CrystalMinePercent),
            DeuteriumSynthesizerPercent: ClampStep10(input.DeuteriumSynthesizerPercent),
            SolarPlantPercent: ClampStep10(input.SolarPlantPercent),
            FusionReactorPercent: ClampStep10(input.FusionReactorPercent),
            SolarSatellitePercent: ClampStep10(input.SolarSatellitePercent),
            CrawlerPercent: ClampStep10(input.CrawlerPercent, playerClass == PlayerClass.Collector ? PlayerClassFormulas.CollectorMaxCrawlerPercent : PlayerClassFormulas.StandardMaxCrawlerPercent));
    }

    internal static bool EvaluateLifeformQueueCompletion(PlanetLifeformMemoryState state, DateTime nowUtc)
    {
        bool changed = false;
        string curSp = PlanetLifeformMemoryState.NormalizeSpeciesId(state.ActiveSpecies);

        if (state.ActiveQueue is not null)
        {
            if (DateTime.TryParse(state.ActiveQueue.EndTimeUtc, null, System.Globalization.DateTimeStyles.RoundtripKind, out var endUtc) &&
                nowUtc.AddSeconds(1) >= endUtc)
            {
                state.BuildingLevels[state.ActiveQueue.BuildingKey] = state.ActiveQueue.TargetLevel;
                if (state.SpeciesBuildingLevels.TryGetValue(curSp, out var spBuildings))
                {
                    spBuildings[state.ActiveQueue.BuildingKey] = state.ActiveQueue.TargetLevel;
                }
                state.ActiveQueue = null;
                state.CurrentXp = Math.Min(state.MaxXp, state.CurrentXp + 45);
                changed = true;
            }
        }

        if (state.ActiveTechQueue is not null)
        {
            if (DateTime.TryParse(state.ActiveTechQueue.EndTimeUtc, null, System.Globalization.DateTimeStyles.RoundtripKind, out var endTechUtc) &&
                nowUtc.AddSeconds(1) >= endTechUtc)
            {
                state.TechLevels[state.ActiveTechQueue.Slot] = state.ActiveTechQueue.TargetLevel;
                if (state.SpeciesTechLevels.TryGetValue(curSp, out var spTechs))
                {
                    spTechs[state.ActiveTechQueue.Slot] = state.ActiveTechQueue.TargetLevel;
                }
                state.ActiveTechQueue = null;
                state.CurrentXp = Math.Min(state.MaxXp, state.CurrentXp + 60);
                changed = true;
            }
        }

        return changed;
    }

    private static async Task<Planet?> ResolvePlanetAsync(
        string planetIdStr,
        IApplicationDbContext dbContext,
        CancellationToken cancellationToken)
    {
        if (Guid.TryParse(planetIdStr, out var guid))
        {
            return await dbContext.Planets
                .Include(p => p.Buildings)
                .FirstOrDefaultAsync(p => p.Id == guid, cancellationToken);
        }

        // Fallback for "planet-homeworld-01" or placeholder aliases
        return await dbContext.Planets
            .Include(p => p.Buildings)
            .Include(p => p.User)
            .Where(p => p.IsCapital || (p.User != null && p.User.Username == "Commander"))
            .OrderByDescending(p => p.IsCapital)
            .FirstOrDefaultAsync(cancellationToken);
    }

    private static object BuildLifeformResponseDto(Guid planetId, PlanetLifeformMemoryState state)
    {
        EvaluateLifeformQueueCompletion(state, DateTime.UtcNow);

        bool hasSpecies = !string.IsNullOrWhiteSpace(state.ActiveSpecies) &&
                          !state.ActiveSpecies.Equals("none", StringComparison.OrdinalIgnoreCase) &&
                          !state.ActiveSpecies.Equals("durduruldu", StringComparison.OrdinalIgnoreCase);

        string curSpId = hasSpecies ? PlanetLifeformMemoryState.NormalizeSpeciesId(state.ActiveSpecies) : "humans";
        var spDef = LifeformsSpeciesFormulas.GetSpecies(curSpId);

        var b1Key = spDef.Buildings.FirstOrDefault(b => b.Index == 1)?.Key ?? "residentialSector";
        var b2Key = spDef.Buildings.FirstOrDefault(b => b.Index == 2)?.Key ?? "biosphereFarm";
        var b4Key = spDef.Buildings.FirstOrDefault(b => b.Index == 4)?.Key ?? "academyOfSciences";
        var b5Key = spDef.Buildings.FirstOrDefault(b => b.Index == 5)?.Key ?? "neuroCalibrationCentre";
        var b7Key = spDef.Buildings.FirstOrDefault(b => b.Index == 7)?.Key ?? "foodSilo";
        var b9Key = spDef.Buildings.FirstOrDefault(b => b.Index == 9)?.Key ?? "skyscraper";
        var b10Key = spDef.Buildings.FirstOrDefault(b => b.Index == 10)?.Key ?? "biotechLab";
        var b12Key = spDef.Buildings.FirstOrDefault(b => b.Index == 12)?.Key ?? "planetaryShield";

        int resLvl = state.BuildingLevels.GetValueOrDefault(b1Key, 0);
        int farmLvl = state.BuildingLevels.GetValueOrDefault(b2Key, 0);
        int acadLvl = state.BuildingLevels.GetValueOrDefault(b4Key, 0);
        int neuroLvl = state.BuildingLevels.GetValueOrDefault(b5Key, 0);
        int siloLvl = state.BuildingLevels.GetValueOrDefault(b7Key, 0);
        int skyLvl = state.BuildingLevels.GetValueOrDefault(b9Key, 0);
        int biotechLvl = state.BuildingLevels.GetValueOrDefault(b10Key, 0);
        int shieldLvl = state.BuildingLevels.GetValueOrDefault(b12Key, 0);

        int maxPop = hasSpecies ? LifeformsHumansFormulas.CalculateMaxPopulation(resLvl, skyLvl) : 0;
        var (t1Pop, t2Pop, t3Pop) = hasSpecies ? LifeformsHumansFormulas.CalculatePopulationTiers(resLvl, skyLvl, acadLvl, neuroLvl) : (0, 0, 0);
        var (maxFood, foodBalance, foodPerSec) = hasSpecies ? LifeformsHumansFormulas.CalculateFoodMetrics(farmLvl, siloLvl, biotechLvl) : (0, 0, 0);

        if (!state.IsActive || !hasSpecies)
        {
            t1Pop = 0;
            t2Pop = 0;
            t3Pop = 0;
            foodBalance = 0;
            maxPop = 0;
            maxFood = 0;
            foodPerSec = 0;
        }

        int maxProtected = shieldLvl * 250;
        int protectedPop = Math.Min(t1Pop, maxProtected);

        double totalTechLevels = state.TechLevels.Values.Sum();
        double techBonusPercent = hasSpecies ? Math.Round(totalTechLevels * 0.4 + state.SpeciesLevel * 0.5, 1) : 0;

        return new
        {
            PlanetId = planetId,
            ActiveSpecies = !hasSpecies ? (string?)null : (state.IsActive ? curSpId : "Durduruldu"),
            IsActive = state.IsActive && hasSpecies,
            state.SpeciesLevel,
            state.CurrentXp,
            state.MaxXp,
            TechBonusPercent = techBonusPercent,
            state.ArtifactCount,
            state.MaxArtifacts,
            T1Population = t1Pop,
            T2Population = t2Pop,
            T3Population = t3Pop,
            MaxPopulation = maxPop,
            FoodBalance = foodBalance,
            MaxFoodCapacity = maxFood,
            FoodPerSecond = foodPerSec,
            ProtectedPopulation = protectedPop,
            MaxProtectedCapacity = maxProtected,
            BuildingLevels = state.BuildingLevels,
            TechLevels = state.TechLevels,
            SpeciesBuildingLevels = state.SpeciesBuildingLevels,
            SpeciesTechLevels = state.SpeciesTechLevels,
            SlotSpecies = state.SlotSpecies,
            UnlockedSpecies = state.UnlockedSpecies,
            ActiveQueue = state.ActiveQueue is null ? null : new
            {
                state.ActiveQueue.BuildingKey,
                state.ActiveQueue.BuildingName,
                state.ActiveQueue.TargetLevel,
                state.ActiveQueue.StartTimeUtc,
                state.ActiveQueue.EndTimeUtc
            },
            ActiveTechQueue = state.ActiveTechQueue is null ? null : new
            {
                state.ActiveTechQueue.Slot,
                state.ActiveTechQueue.TechName,
                state.ActiveTechQueue.TargetLevel,
                state.ActiveTechQueue.StartTimeUtc,
                state.ActiveTechQueue.EndTimeUtc
            }
        };
    }
}
