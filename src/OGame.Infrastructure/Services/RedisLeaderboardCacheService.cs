using System.Text.Json;
using Microsoft.Extensions.Logging;
using OGame.Application.Common.Interfaces;
using StackExchange.Redis;

namespace OGame.Infrastructure.Services;

public class RedisLeaderboardCacheService(
    IConnectionMultiplexer redis,
    ILogger<RedisLeaderboardCacheService> logger) : ILeaderboardCacheService
{
    private const string LeaderboardSnapshotKey = "leaderboard:universe:snapshots";
    private const string LeaderboardZSetKey = "leaderboard:universe:zset";
    private static readonly TimeSpan CacheTtl = TimeSpan.FromHours(12);

    public async Task SetLeaderboardAsync(
        IReadOnlyList<HighscoreEntryDto> entries,
        CancellationToken cancellationToken = default)
    {
        if (entries is null)
        {
            return;
        }

        try
        {
            var db = redis.GetDatabase();
            string payloadJson = JsonSerializer.Serialize(entries);
            await db.StringSetAsync(LeaderboardSnapshotKey, payloadJson, CacheTtl);

            var sortedEntries = entries
                .Select(e => new SortedSetEntry(e.UserId.ToString(), e.Points))
                .ToArray();

            await db.KeyDeleteAsync(LeaderboardZSetKey);
            if (sortedEntries.Length > 0)
            {
                await db.SortedSetAddAsync(LeaderboardZSetKey, sortedEntries);
                await db.KeyExpireAsync(LeaderboardZSetKey, CacheTtl);
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Redis leaderboard cache update skipped (falling back to PostgreSQL).");
        }
    }

    public async Task<IReadOnlyList<HighscoreEntryDto>?> GetLeaderboardAsync(
        int topCount = 100,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var db = redis.GetDatabase();
            var cachedJson = await db.StringGetAsync(LeaderboardSnapshotKey);
            if (!cachedJson.HasValue || cachedJson.IsNullOrEmpty)
            {
                return null;
            }

            var allEntries = JsonSerializer.Deserialize<List<HighscoreEntryDto>>(cachedJson.ToString());
            if (allEntries is null || allEntries.Count == 0)
            {
                return null;
            }

            return allEntries
                .OrderBy(e => e.Rank)
                .Take(Math.Clamp(topCount, 1, 500))
                .ToList();
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Redis leaderboard cache read failed (falling back to PostgreSQL).");
            return null;
        }
    }
}

