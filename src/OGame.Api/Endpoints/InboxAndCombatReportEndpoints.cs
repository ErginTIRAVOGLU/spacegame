using Microsoft.AspNetCore.Mvc;
using OGame.Application.Common.Interfaces;
using OGame.Domain.Enums;

namespace OGame.Api.Endpoints;

public record SendInboxMessageRequest(
    Guid RecipientUserId,
    Guid? SenderUserId,
    MessageFolder Folder,
    string Subject,
    string ContentJson);

public record BulkMarkMessagesReadRequest(
    Guid UserId,
    IReadOnlyList<Guid> MessageIds);

public record ShareCombatReportRequest(
    bool HidePlayerIdentities = true,
    bool HideExactFleetNumbers = false);

public static class InboxAndCombatReportEndpoints
{
    public static IEndpointRouteBuilder MapInboxAndCombatReportEndpoints(this IEndpointRouteBuilder app)
    {
        var inboxGroup = app.MapGroup("/api/inbox/messages")
            .WithTags("Inbox");

        inboxGroup.MapGet("/", async (
            [FromQuery] Guid userId,
            [FromQuery] MessageFolder? folder,
            [FromQuery] int? page,
            [FromQuery] int? pageSize,
            IInboxAndCombatReportService inboxService,
            CancellationToken cancellationToken) =>
        {
            var result = await inboxService.GetMessagesAsync(
                userId,
                folder,
                page ?? 1,
                pageSize ?? 20,
                cancellationToken);

            return Results.Ok(result);
        })
        .WithName("GetInboxMessages");

        inboxGroup.MapPost("/send", async (
            [FromBody] SendInboxMessageRequest request,
            IInboxAndCombatReportService inboxService,
            CancellationToken cancellationToken) =>
        {
            var message = await inboxService.SendMessageAsync(
                request.RecipientUserId,
                request.SenderUserId,
                request.Folder,
                request.Subject,
                request.ContentJson,
                cancellationToken);

            return Results.Created($"/api/inbox/messages/{message.Id}", message);
        })
        .WithName("SendInboxMessage");

        inboxGroup.MapPost("/mark-read", async (
            [FromBody] BulkMarkMessagesReadRequest request,
            IInboxAndCombatReportService inboxService,
            CancellationToken cancellationToken) =>
        {
            int updatedCount = await inboxService.MarkMessagesAsReadAsync(
                request.UserId,
                request.MessageIds,
                cancellationToken);

            return Results.Ok(new
            {
                UpdatedCount = updatedCount,
                TimestampUtc = DateTime.UtcNow
            });
        })
        .WithName("BulkMarkMessagesAsRead");

        inboxGroup.MapDelete("/purge", async (
            IInboxAndCombatReportService inboxService,
            CancellationToken cancellationToken) =>
        {
            int purgedCount = await inboxService.PurgeExpiredReadMessagesAsync(cancellationToken);
            return Results.Ok(new
            {
                PurgedCount = purgedCount,
                TimestampUtc = DateTime.UtcNow
            });
        })
        .WithName("PurgeExpiredReadMessages");

        var reportsGroup = app.MapGroup("/api/reports/combat")
            .WithTags("CombatReports");

        reportsGroup.MapGet("/{id:guid}", async (
            Guid id,
            [FromQuery] bool? anonymized,
            [FromQuery] bool? hideIdentities,
            [FromQuery] bool? hideFleetNumbers,
            IInboxAndCombatReportService inboxService,
            CancellationToken cancellationToken) =>
        {
            bool shouldHideIdentities = (anonymized ?? false) || (hideIdentities ?? false);
            bool shouldHideFleetNumbers = hideFleetNumbers ?? false;

            var report = await inboxService.GetPublicCombatReportAsync(
                id,
                hidePlayerIdentities: shouldHideIdentities,
                hideExactFleetNumbers: shouldHideFleetNumbers,
                cancellationToken);

            if (report is null)
            {
                return Results.NotFound(new { Error = $"Combat report {id} not found." });
            }

            return Results.Ok(report);
        })
        .WithName("GetPublicCombatReport");

        reportsGroup.MapPost("/{id:guid}/share", async (
            Guid id,
            [FromBody] ShareCombatReportRequest request,
            IInboxAndCombatReportService inboxService,
            CancellationToken cancellationToken) =>
        {
            var report = await inboxService.GetPublicCombatReportAsync(
                id,
                hidePlayerIdentities: request.HidePlayerIdentities,
                hideExactFleetNumbers: request.HideExactFleetNumbers,
                cancellationToken);

            if (report is null)
            {
                return Results.NotFound(new { Error = $"Combat report {id} not found." });
            }

            string queryFlags = $"?hideIdentities={request.HidePlayerIdentities.ToString().ToLowerInvariant()}&hideFleetNumbers={request.HideExactFleetNumbers.ToString().ToLowerInvariant()}";

            return Results.Ok(new
            {
                ReportId = id,
                PublicApiUrl = $"/api/reports/combat/{id}{queryFlags}",
                PublicViewerRoute = $"/reports/combat/{id}{queryFlags}",
                Report = report
            });
        })
        .WithName("GenerateShareableCombatReportLink");

        return app;
    }
}

