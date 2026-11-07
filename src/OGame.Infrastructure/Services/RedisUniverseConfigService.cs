using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using OGame.Application.Common.Interfaces;
using OGame.Domain.Services;
using StackExchange.Redis;

namespace OGame.Infrastructure.Services;

public class RedisUniverseConfigService : IUniverseConfigService
{
    private readonly IConnectionMultiplexer _redis;
    private readonly ILogger<RedisUniverseConfigService> _logger;
    private UniverseConfig _cachedConfig;

    public RedisUniverseConfigService(
        IConnectionMultiplexer redis,
        IConfiguration configuration,
        ILogger<RedisUniverseConfigService> logger)
    {
        _redis = redis;
        _logger = logger;

        double econSpeed = configuration.GetValue<double?>("UniverseConfig:EconomySpeedMultiplier") ?? 1.0;
        double fleetSpeed = configuration.GetValue<double?>("UniverseConfig:FleetSpeedMultiplier") ?? 1.0;
        double researchSpeed = configuration.GetValue<double?>("UniverseConfig:ResearchSpeedMultiplier") ?? 1.0;
        double debrisRatio = configuration.GetValue<double?>("UniverseConfig:DebrisRatio") ?? 0.30;
        bool defToDebris = configuration.GetValue<bool?>("UniverseConfig:DefenseToDebris") ?? false;
        double deutFactor = configuration.GetValue<double?>("UniverseConfig:DeutConsumptionFactor") ?? 1.0;

        _cachedConfig = new UniverseConfig(
            EconomySpeedMultiplier: econSpeed,
            FleetSpeedMultiplier: fleetSpeed,
            ResearchSpeedMultiplier: researchSpeed,
            DebrisRatio: debrisRatio,
            DefenseToDebris: defToDebris,
            DeutConsumptionFactor: deutFactor);
    }

    public UniverseConfig GetCachedConfig() => _cachedConfig;

    public async Task<UniverseConfig> GetConfigAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var db = _redis.GetDatabase();
            var rawJson = await db.StringGetAsync(MissileAndUniverseFormulas.UniverseConfigRedisKey);
            if (rawJson.HasValue && !rawJson.IsNullOrEmpty)
            {
                var deserialized = JsonSerializer.Deserialize<UniverseConfig>(rawJson.ToString());
                if (deserialized is not null)
                {
                    _cachedConfig = deserialized;
                    return _cachedConfig;
                }
            }

            string defaultJson = JsonSerializer.Serialize(_cachedConfig);
            await db.StringSetAsync(MissileAndUniverseFormulas.UniverseConfigRedisKey, defaultJson);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Redis config:universe read skipped; using in-memory UniverseConfig snapshot.");
        }

        return _cachedConfig;
    }

    public async Task<UniverseConfig> UpdateConfigAsync(
        UniverseConfig config,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(config);
        _cachedConfig = config;

        try
        {
            var db = _redis.GetDatabase();
            string json = JsonSerializer.Serialize(config);
            await db.StringSetAsync(MissileAndUniverseFormulas.UniverseConfigRedisKey, json);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Redis config:universe write skipped; updated in-memory UniverseConfig snapshot.");
        }

        return _cachedConfig;
    }
}

