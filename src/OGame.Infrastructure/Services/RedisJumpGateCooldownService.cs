using System.Collections.Concurrent;
using OGame.Application.Common.Interfaces;
using OGame.Domain.Services;
using StackExchange.Redis;

namespace OGame.Infrastructure.Services;

public class RedisJumpGateCooldownService(IConnectionMultiplexer? redisConnection) : IJumpGateCooldownService
{
    private static readonly ConcurrentDictionary<string, DateTimeOffset> InMemoryCooldowns = new();

    public async Task<TimeSpan?> GetRemainingCooldownAsync(Guid moonId, CancellationToken cancellationToken = default)
    {
        string key = MoonAndPhalanxFormulas.BuildJumpGateCooldownKey(moonId);

        if (redisConnection is { IsConnected: true })
        {
            var db = redisConnection.GetDatabase();
            return await db.KeyTimeToLiveAsync(key);
        }

        if (InMemoryCooldowns.TryGetValue(key, out var expiresAt))
        {
            var remaining = expiresAt - DateTimeOffset.UtcNow;
            if (remaining > TimeSpan.Zero)
            {
                return remaining;
            }

            InMemoryCooldowns.TryRemove(key, out _);
        }

        return null;
    }

    public async Task SetCooldownAsync(Guid moonId, TimeSpan cooldownDuration, CancellationToken cancellationToken = default)
    {
        string key = MoonAndPhalanxFormulas.BuildJumpGateCooldownKey(moonId);

        if (redisConnection is { IsConnected: true })
        {
            var db = redisConnection.GetDatabase();
            await db.StringSetAsync(key, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), cooldownDuration);
            return;
        }

        InMemoryCooldowns[key] = DateTimeOffset.UtcNow.Add(cooldownDuration);
    }
}

