using Hangfire;
using Microsoft.Extensions.Logging;
using OGame.Application.Common.Interfaces;

namespace OGame.Infrastructure.Jobs;

[AutomaticRetry(Attempts = 3, DelaysInSeconds = [5, 5, 5])]
public class InboxPurgeRecurringJob(
    IInboxAndCombatReportService inboxService,
    IColonizationAndPlanetService colonizationService,
    ILogger<InboxPurgeRecurringJob> logger)
{
    public const string JobId = "inbox-read-message-purge";
    public const string CronExpression = "0 3 * * *";

    public async Task ExecuteAsync(CancellationToken cancellationToken = default)
    {
        int purgedCount = await inboxService.PurgeExpiredReadMessagesAsync(cancellationToken);
        int purgedPlanets = await colonizationService.PurgeExpiredDestroyedPlanetsAsync(cancellationToken);
        logger.LogInformation(
            "Completed InboxPurgeRecurringJob: Purged {PurgedCount} read messages and {PurgedPlanets} expired DestroyedPlanet placeholders.",
            purgedCount,
            purgedPlanets);
    }
}

