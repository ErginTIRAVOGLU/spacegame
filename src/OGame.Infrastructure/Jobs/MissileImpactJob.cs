using Hangfire;
using Microsoft.Extensions.Logging;
using OGame.Application.Common.Interfaces;

namespace OGame.Infrastructure.Jobs;

[AutomaticRetry(Attempts = 3, DelaysInSeconds = [5, 5, 5])]
public class MissileImpactJob(
    IMissileService missileService,
    ILogger<MissileImpactJob> logger)
{
    public async Task ExecuteAsync(Guid missileLaunchId, CancellationToken cancellationToken = default)
    {
        logger.LogInformation("Executing MissileImpactJob for Launch {MissileLaunchId}.", missileLaunchId);
        await missileService.ResolveMissileImpactAsync(missileLaunchId, cancellationToken);
    }
}

