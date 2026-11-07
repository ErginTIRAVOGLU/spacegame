using OGame.Domain.Entities;
using OGame.Domain.Enums;

namespace OGame.Application.Common.Interfaces;

public record ResearchCompletedResult(
    Guid UserId,
    Guid QueueItemId,
    ResearchType ResearchType,
    int NewLevel,
    DateTime CompletedAtUtc);

public interface IResearchService
{
    Task<ResearchQueueItem> EnqueueResearchAsync(
        Guid userId,
        Guid originPlanetId,
        ResearchType researchType,
        CancellationToken cancellationToken = default);

    Task<ResearchCompletedResult?> CompleteResearchAsync(
        Guid userId,
        Guid queueItemId,
        CancellationToken cancellationToken = default);
}

