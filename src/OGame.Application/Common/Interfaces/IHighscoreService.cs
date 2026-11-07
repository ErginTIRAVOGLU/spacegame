namespace OGame.Application.Common.Interfaces;

public record HighscoreEntryDto(
    Guid UserId,
    string Username,
    string? AllianceTag,
    long Points,
    long EconomyPoints,
    long ResearchPoints,
    long MilitaryPoints,
    int Rank,
    int? PreviousRank,
    int RankDelta,
    bool IsVacationMode,
    DateTime CalculatedAtUtc);

public interface IHighscoreService
{
    Task CalculateUniverseHighscoresAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<HighscoreEntryDto>> GetLeaderboardAsync(int topCount = 100, CancellationToken cancellationToken = default);
}
