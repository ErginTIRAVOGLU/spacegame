using System.Collections.Concurrent;
using OGame.Application.Common.Interfaces;
using OGame.Domain.Enums;
using OGame.Domain.Services;
using StackExchange.Redis;

namespace OGame.Infrastructure.Services;

public class RedisActivityService(IConnectionMultiplexer? redisConnection) : IActivityService
{
    private static readonly TimeSpan ActivityTtl = TimeSpan.FromSeconds(3600);
    private static readonly ConcurrentDictionary<string, (long EpochSeconds, DateTimeOffset ExpiresAtUtc)> InMemoryFallback = new();

    public async Task RecordActivityAsync(
        int galaxy,
        int system,
        int slot,
        CoordinateType type = CoordinateType.Planet,
        DateTimeOffset? timestampUtc = null,
        CancellationToken cancellationToken = default)
    {
        var now = timestampUtc ?? DateTimeOffset.UtcNow;
        long epochSeconds = now.ToUnixTimeSeconds();
        string key = FleetNavigationFormulas.BuildActivityKey(galaxy, system, slot, type);

        if (redisConnection is { IsConnected: true })
        {
            var db = redisConnection.GetDatabase();
            await db.StringSetAsync(key, epochSeconds.ToString(), ActivityTtl);
            return;
        }

        InMemoryFallback[key] = (epochSeconds, now.Add(ActivityTtl));
    }

    public async Task<string?> GetActivityDisplayAsync(
        int galaxy,
        int system,
        int slot,
        CoordinateType type = CoordinateType.Planet,
        bool isSelf = false,
        DateTimeOffset? nowUtc = null,
        CancellationToken cancellationToken = default)
    {
        if (isSelf)
        {
            return null;
        }

        var now = nowUtc ?? DateTimeOffset.UtcNow;
        long nowEpoch = now.ToUnixTimeSeconds();
        string key = FleetNavigationFormulas.BuildActivityKey(galaxy, system, slot, type);

        long? activityEpoch = null;

        if (redisConnection is { IsConnected: true })
        {
            var db = redisConnection.GetDatabase();
            var val = await db.StringGetAsync(key);
            if (val.HasValue && long.TryParse(val.ToString(), out long parsed))
            {
                activityEpoch = parsed;
            }
        }
        else if (InMemoryFallback.TryGetValue(key, out var entry))
        {
            if (entry.ExpiresAtUtc > now)
            {
                activityEpoch = entry.EpochSeconds;
            }
            else
            {
                InMemoryFallback.TryRemove(key, out _);
            }
        }

        return FleetNavigationFormulas.FormatActivityIndicator(activityEpoch, nowEpoch, isSelf);
    }
}

