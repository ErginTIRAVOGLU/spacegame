using OGame.Domain.Enums;

namespace OGame.Application.Common.Interfaces;

public interface IActivityService
{
    Task RecordActivityAsync(
        int galaxy,
        int system,
        int slot,
        CoordinateType type = CoordinateType.Planet,
        DateTimeOffset? timestampUtc = null,
        CancellationToken cancellationToken = default);

    Task<string?> GetActivityDisplayAsync(
        int galaxy,
        int system,
        int slot,
        CoordinateType type = CoordinateType.Planet,
        bool isSelf = false,
        DateTimeOffset? nowUtc = null,
        CancellationToken cancellationToken = default);
}

