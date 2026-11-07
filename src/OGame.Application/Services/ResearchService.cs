using Microsoft.EntityFrameworkCore;
using OGame.Application.Common.Interfaces;
using OGame.Application.Interfaces;
using OGame.Domain.Entities;
using OGame.Domain.Enums;
using OGame.Domain.Services;

namespace OGame.Application.Services;

public class ResearchService(
    IApplicationDbContext dbContext,
    IResourceCalculationService resourceService,
    IJobScheduler jobScheduler,
    IDistributedLockService lockService,
    IUniverseConfigService? universeConfigService = null) : IResearchService
{
    public async Task<ResearchQueueItem> EnqueueResearchAsync(
        Guid userId,
        Guid originPlanetId,
        ResearchType researchType,
        CancellationToken cancellationToken = default)
    {
        string userResearchLockKey = $"lock:user:research:{userId}";
        string planetLockKey = $"lock:planet:{originPlanetId}";

        await using var userLock = await lockService.AcquireLockAsync(userResearchLockKey, cancellationToken: cancellationToken);
        await using var planetLock = await lockService.AcquireLockAsync(planetLockKey, cancellationToken: cancellationToken);

        bool hasActiveResearch = await dbContext.ResearchQueueItems
            .AnyAsync(r => r.UserId == userId, cancellationToken);

        if (hasActiveResearch)
        {
            throw new InvalidOperationException("Only 1 active research per player is allowed at a time.");
        }

        var planets = await dbContext.Planets
            .Include(p => p.Buildings)
            .Where(p => p.UserId == userId)
            .ToListAsync(cancellationToken);

        var originPlanet = planets.FirstOrDefault(p => p.Id == originPlanetId)
            ?? throw new InvalidOperationException($"Origin planet {originPlanetId} does not belong to user {userId}.");

        var userResearches = await dbContext.UserResearches
            .Where(r => r.UserId == userId)
            .ToListAsync(cancellationToken);

        bool needsSave = false;
        if (!userResearches.Any(r => r.ResearchType == ResearchType.EnergyTechnology))
        {
            var defaultEnergy = new UserResearch
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                ResearchType = ResearchType.EnergyTechnology,
                Level = 6
            };
            dbContext.UserResearches.Add(defaultEnergy);
            userResearches.Add(defaultEnergy);
            needsSave = true;
        }

        if (!userResearches.Any(r => r.ResearchType == ResearchType.ComputerTechnology))
        {
            var defaultComp = new UserResearch
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                ResearchType = ResearchType.ComputerTechnology,
                Level = 4
            };
            dbContext.UserResearches.Add(defaultComp);
            userResearches.Add(defaultComp);
            needsSave = true;
        }

        if (needsSave)
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        int currentLevel = userResearches.FirstOrDefault(r => r.ResearchType == researchType)?.Level ?? 0;
        int targetLevel = currentLevel + 1;

        var (cost, requiredLabLevel) = ConstructionFormulas.GetResearchDefinition(researchType, targetLevel);

        int originLabLevel = originPlanet.Buildings
            .FirstOrDefault(b => b.BuildingType == BuildingType.ResearchLab)?.Level ?? 0;

        if (originLabLevel < requiredLabLevel)
        {
            throw new InvalidOperationException(
                $"{GetResearchDisplayName(researchType)} için Bilimsel Araştırma Laboratuvarı Seviye {requiredLabLevel} gereklidir (Mevcut: {originLabLevel}).");
        }

        var techPrereqs = ConstructionFormulas.GetResearchPrerequisites(researchType);
        foreach (var req in techPrereqs)
        {
            int currentReqLevel = userResearches.FirstOrDefault(r => r.ResearchType == req.Type)?.Level ?? 0;
            if (currentReqLevel < req.Level)
            {
                throw new InvalidOperationException(
                    $"{GetResearchDisplayName(researchType)} için {GetResearchDisplayName(req.Type)} Seviye {req.Level} gereklidir (Mevcut: {currentReqLevel}).");
            }
        }

        var now = DateTime.UtcNow;
        resourceService.ApplyLazyUpdate(originPlanet, now);

        if (researchType == ResearchType.GravitonTechnology)
        {
            var res = resourceService.GetCurrentResources(originPlanet, now);
            if (res.ProducedEnergy < 300_000)
            {
                throw new InvalidOperationException(
                    $"Graviton Araştırması için en az 300.000 Enerji gereklidir (Mevcut üretilen: {res.ProducedEnergy:N0}).");
            }
        }

        int irnLevel = userResearches
            .FirstOrDefault(r => r.ResearchType == ResearchType.IntergalacticResearchNetwork)?.Level ?? 0;

        var otherLabLevels = planets
            .Where(p => p.Id != originPlanetId)
            .Select(p => p.Buildings.FirstOrDefault(b => b.BuildingType == BuildingType.ResearchLab)?.Level ?? 0);

        int effectiveLabLevel = ConstructionFormulas.CalculateEffectiveResearchLabLevel(
            originLabLevel,
            otherLabLevels,
            irnLevel,
            requiredLabLevel);

        if (originPlanet.Metal < cost.Metal ||
            originPlanet.Crystal < cost.Crystal ||
            originPlanet.Deuterium < cost.Deuterium)
        {
            throw new InvalidOperationException("Insufficient resources on origin planet to start research.");
        }

        originPlanet.Metal -= cost.Metal;
        originPlanet.Crystal -= cost.Crystal;
        originPlanet.Deuterium -= cost.Deuterium;

        var universeConfig = universeConfigService is not null
            ? await universeConfigService.GetConfigAsync(cancellationToken)
            : new UniverseConfig();
        double researchMultiplier = Math.Max(0.1, universeConfig.ResearchSpeedMultiplier);

        var user = await dbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
        double classMultiplier = user?.PlayerClass == PlayerClass.Discoverer
            ? PlayerClassFormulas.DiscovererResearchDurationMultiplier
            : 1.0;

        double baseDurationSeconds = researchType == ResearchType.GravitonTechnology
            ? 1.0
            : ConstructionFormulas.CalculateResearchDurationSeconds(
                cost.Metal,
                cost.Crystal,
                effectiveLabLevel);
        double durationSeconds = Math.Max(1.0, (baseDurationSeconds * classMultiplier) / researchMultiplier);

        var endTimeUtc = now.AddSeconds(durationSeconds);
        var queueItem = new ResearchQueueItem
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            OriginPlanetId = originPlanetId,
            ResearchType = researchType,
            TargetLevel = targetLevel,
            StartTimeUtc = now,
            EndTimeUtc = endTimeUtc
        };

        string jobId = jobScheduler.ScheduleResearchCompletion(
            userId,
            queueItem.Id,
            new DateTimeOffset(endTimeUtc, TimeSpan.Zero));

        queueItem.HangfireJobId = jobId;

        dbContext.ResearchQueueItems.Add(queueItem);
        await dbContext.SaveChangesAsync(cancellationToken);

        return queueItem;
    }

    public async Task<ResearchCompletedResult?> CompleteResearchAsync(
        Guid userId,
        Guid queueItemId,
        CancellationToken cancellationToken = default)
    {
        var queueItem = await dbContext.ResearchQueueItems
            .FirstOrDefaultAsync(q => q.Id == queueItemId && q.UserId == userId, cancellationToken);

        if (queueItem is null)
        {
            return null;
        }

        var userResearch = await dbContext.UserResearches
            .FirstOrDefaultAsync(r => r.UserId == userId && r.ResearchType == queueItem.ResearchType, cancellationToken);

        if (userResearch is null)
        {
            userResearch = new UserResearch
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                ResearchType = queueItem.ResearchType,
                Level = queueItem.TargetLevel
            };
            dbContext.UserResearches.Add(userResearch);
        }
        else
        {
            userResearch.Level = Math.Max(userResearch.Level, queueItem.TargetLevel);
        }

        dbContext.ResearchQueueItems.Remove(queueItem);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new ResearchCompletedResult(
            UserId: userId,
            QueueItemId: queueItem.Id,
            ResearchType: queueItem.ResearchType,
            NewLevel: userResearch.Level,
            CompletedAtUtc: DateTime.UtcNow);
    }

    private static string GetResearchDisplayName(ResearchType type) => type switch
    {
        ResearchType.EnergyTechnology => "Enerji Tekniği",
        ResearchType.LaserTechnology => "Lazer Tekniği",
        ResearchType.IonTechnology => "İyon Tekniği",
        ResearchType.HyperspaceTechnology => "Hiperuzay Tekniği",
        ResearchType.PlasmaTechnology => "Plazma Tekniği",
        ResearchType.CombustionDrive => "Yanma Motoru",
        ResearchType.ImpulseDrive => "İtki Motoru",
        ResearchType.HyperspaceDrive => "Hiperuzay İticisi",
        ResearchType.EspionageTechnology => "Casusluk Tekniği",
        ResearchType.ComputerTechnology => "Bilgisayar Tekniği",
        ResearchType.Astrophysics => "Astrofizik",
        ResearchType.IntergalacticResearchNetwork => "Galaksilerarası Araştırma Ağı",
        ResearchType.GravitonTechnology => "Graviton Tekniği",
        ResearchType.WeaponsTechnology => "Silah Tekniği",
        ResearchType.ShieldingTechnology => "Kalkan Tekniği",
        ResearchType.ArmourTechnology => "Zırh Tekniği",
        _ => type.ToString()
    };
}

