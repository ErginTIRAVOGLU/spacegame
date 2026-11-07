namespace OGame.Application.Common.Interfaces;

public interface ILeaderboardCacheService
{
    Task SetLeaderboardAsync(IReadOnlyList<HighscoreEntryDto> entries, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<HighscoreEntryDto>?> GetLeaderboardAsync(int topCount = 100, CancellationToken cancellationToken = default);
}

