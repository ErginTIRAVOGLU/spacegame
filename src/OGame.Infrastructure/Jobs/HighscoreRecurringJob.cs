using Hangfire;
using Microsoft.Extensions.Logging;
using OGame.Application.Common.Interfaces;

namespace OGame.Infrastructure.Jobs;

[AutomaticRetry(Attempts = 3, DelaysInSeconds = [5, 5, 5])]
public class HighscoreRecurringJob(
    IHighscoreService highscoreService,
    ILogger<HighscoreRecurringJob> logger)
{
    public const string JobId = "universe-highscore-recalculation";
    public const string CronExpression = "0 */6 * * *";

    public async Task ExecuteAsync(CancellationToken cancellationToken = default)
    {
        logger.LogInformation("Starting recurring HighscoreRecurringJob recalculation.");
        await highscoreService.CalculateUniverseHighscoresAsync(cancellationToken);
        logger.LogInformation("Completed recurring HighscoreRecurringJob recalculation.");
    }
}

