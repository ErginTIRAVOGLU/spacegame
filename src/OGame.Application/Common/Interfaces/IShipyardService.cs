using OGame.Domain.Entities;
using OGame.Domain.Enums;

namespace OGame.Application.Common.Interfaces;

public record ShipyardEvaluationSnapshot(
    Guid PlanetId,
    int NewlyCompletedUnitsTotal,
    IReadOnlyList<ShipyardQueueItem> ActiveQueueItems,
    IReadOnlyList<PlanetUnit> StationedUnits);

public interface IShipyardService
{
    Task<ShipyardQueueItem> EnqueueUnitBatchAsync(
        Guid planetId,
        UnitType unitType,
        int count,
        CancellationToken cancellationToken = default);

    Task<ShipyardEvaluationSnapshot> EvaluatePlanetShipyardQueueAsync(
        Guid planetId,
        DateTime utcNow,
        CancellationToken cancellationToken = default);

    Task CompleteShipyardBatchAsync(
        Guid planetId,
        Guid batchQueueItemId,
        CancellationToken cancellationToken = default);
}

