using Hangfire;
using Hangfire.PostgreSql;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using OGame.Application.Common.Interfaces;
using OGame.Application.Interfaces;
using OGame.Infrastructure.Jobs;
using OGame.Infrastructure.Locking;
using OGame.Infrastructure.Persistence;
using OGame.Infrastructure.Services;
using StackExchange.Redis;

namespace OGame.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? "Host=localhost;Port=5432;Database=ogame_db;Username=ogame_user;Password=ogame_password";

        var redisConnectionString = configuration.GetConnectionString("Redis")
            ?? "localhost:6379,abortConnect=false";

        services.AddDbContext<OGameDbContext>(options =>
            options.UseNpgsql(connectionString, npgsql =>
                npgsql.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery)));

        services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<OGameDbContext>());

        // Redis ConnectionMultiplexer, Distributed Lock & Activity Service
        services.AddSingleton<IConnectionMultiplexer>(_ =>
        {
            var options = ConfigurationOptions.Parse(redisConnectionString);
            options.AbortOnConnectFail = false;
            return ConnectionMultiplexer.Connect(options);
        });

        services.AddSingleton<IDistributedLockService, RedisDistributedLockService>();
        services.AddSingleton<IActivityService, RedisActivityService>();
        services.AddSingleton<IJumpGateCooldownService, RedisJumpGateCooldownService>();
        services.AddSingleton<ILeaderboardCacheService, RedisLeaderboardCacheService>();
        services.AddSingleton<IUniverseConfigService, RedisUniverseConfigService>();

        // Hangfire with PostgreSQL storage & AutomaticRetry resilience policy (Attempts = 3, 5s backoff)
        services.AddHangfire(hangfireConfig =>
        {
            hangfireConfig
                .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
                .UseSimpleAssemblyNameTypeSerializer()
                .UseRecommendedSerializerSettings()
                .UsePostgreSqlStorage(options =>
                    options.UseNpgsqlConnection(connectionString))
                .UseFilter(new AutomaticRetryAttribute
                {
                    Attempts = 3,
                    DelaysInSeconds = [5, 5, 5],
                    LogEvents = true
                });
        });

        services.AddScoped<IJobScheduler, HangfireJobScheduler>();

        // Register Job Handlers
        services.AddScoped<BuildingCompletionJob>();
        services.AddScoped<ResearchCompletionJob>();
        services.AddScoped<ShipyardBatchCompletionJob>();
        services.AddScoped<FleetArrivalJob>();
        services.AddScoped<FleetReturnJob>();
        services.AddScoped<MissileImpactJob>();
        services.AddScoped<HighscoreRecurringJob>();
        services.AddScoped<InboxPurgeRecurringJob>();

        // Register default domain service implementations (can be overridden by later slices)
        services.AddScoped<IRealtimeNotificationService, DefaultRealtimeNotificationService>();

        return services;
    }
}
