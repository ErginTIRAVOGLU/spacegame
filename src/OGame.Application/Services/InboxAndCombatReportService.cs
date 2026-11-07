using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using OGame.Application.Common.Interfaces;
using OGame.Application.Interfaces;
using OGame.Domain.Entities;
using OGame.Domain.Enums;
using OGame.Domain.Services;

namespace OGame.Application.Services;

public class InboxAndCombatReportService(
    IApplicationDbContext dbContext,
    IRealtimeNotificationService notificationService) : IInboxAndCombatReportService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true
    };

    public async Task<Message> SendMessageAsync(
        Guid recipientUserId,
        Guid? senderUserId,
        MessageFolder folder,
        string subject,
        string contentJson,
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;

        var message = new Message
        {
            Id = Guid.NewGuid(),
            RecipientUserId = recipientUserId,
            SenderUserId = senderUserId,
            Folder = folder,
            Subject = string.IsNullOrWhiteSpace(subject) ? "System Notification" : subject.Trim(),
            ContentJson = string.IsNullOrWhiteSpace(contentJson) ? "{}" : contentJson,
            IsRead = false,
            CreatedAtUtc = now
        };

        dbContext.Messages.Add(message);
        await dbContext.SaveChangesAsync(cancellationToken);

        await notificationService.SendToUserAsync(
            recipientUserId,
            "NewInboxMessage",
            new
            {
                MessageId = message.Id,
                Folder = message.Folder.ToString(),
                Subject = message.Subject,
                TimestampUtc = now
            },
            cancellationToken);

        return message;
    }

    public async Task<PaginatedMessagesResult> GetMessagesAsync(
        Guid userId,
        MessageFolder? folder = null,
        int page = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        int normalizedPage = Math.Max(1, page);
        int normalizedPageSize = Math.Clamp(pageSize, 1, 100);

        var baseQuery = dbContext.Messages
            .AsNoTracking()
            .Where(m => m.RecipientUserId == userId);

        if (folder.HasValue)
        {
            baseQuery = baseQuery.Where(m => m.Folder == folder.Value);
        }

        int totalCount = await baseQuery.CountAsync(cancellationToken);
        int unreadCount = await baseQuery.CountAsync(m => !m.IsRead, cancellationToken);

        var items = await baseQuery
            .OrderByDescending(m => m.CreatedAtUtc)
            .Skip((normalizedPage - 1) * normalizedPageSize)
            .Take(normalizedPageSize)
            .Select(m => new MessageDto(
                m.Id,
                m.RecipientUserId,
                m.SenderUserId,
                m.Folder,
                m.Subject,
                m.ContentJson,
                m.IsRead,
                m.CreatedAtUtc))
            .ToListAsync(cancellationToken);

        return new PaginatedMessagesResult(
            Items: items,
            Page: normalizedPage,
            PageSize: normalizedPageSize,
            TotalCount: totalCount,
            UnreadCount: unreadCount);
    }

    public async Task<int> MarkMessagesAsReadAsync(
        Guid userId,
        IReadOnlyList<Guid> messageIds,
        CancellationToken cancellationToken = default)
    {
        if (messageIds is null || messageIds.Count == 0)
        {
            return 0;
        }

        var distinctIds = messageIds.Distinct().ToList();
        var messagesToUpdate = await dbContext.Messages
            .Where(m => m.RecipientUserId == userId && distinctIds.Contains(m.Id) && !m.IsRead)
            .ToListAsync(cancellationToken);

        foreach (var msg in messagesToUpdate)
        {
            msg.IsRead = true;
        }

        if (messagesToUpdate.Count > 0)
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        return messagesToUpdate.Count;
    }

    public async Task<int> PurgeExpiredReadMessagesAsync(CancellationToken cancellationToken = default)
    {
        var cutoffUtc = CombatReportFormulas.GetReadMessagePurgeCutoffUtc(DateTime.UtcNow);

        var expiredMessages = await dbContext.Messages
            .Where(m => m.IsRead && m.CreatedAtUtc < cutoffUtc)
            .ToListAsync(cancellationToken);

        if (expiredMessages.Count == 0)
        {
            return 0;
        }

        dbContext.Messages.RemoveRange(expiredMessages);
        await dbContext.SaveChangesAsync(cancellationToken);

        return expiredMessages.Count;
    }

    public async Task<CombatReport> CreateAndArchiveCombatReportAsync(
        PublicCombatReportPayload payload,
        Guid attackerUserId,
        Guid defenderUserId,
        Guid? targetPlanetId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(payload);

        var now = payload.OccurredAtUtc;
        string serializedJson = JsonSerializer.Serialize(payload, JsonOptions);

        var report = new CombatReport
        {
            Id = payload.ReportId == Guid.Empty ? Guid.NewGuid() : payload.ReportId,
            AttackerUserId = attackerUserId,
            DefenderUserId = defenderUserId,
            TargetPlanetId = targetPlanetId,
            AttackerName = payload.Attacker.PlayerName,
            DefenderName = payload.Defender.PlayerName,
            Coordinates = payload.BattleCoordinates,
            Winner = payload.Winner,
            DataJson = serializedJson,
            CreatedAtUtc = now
        };

        dbContext.CombatReports.Add(report);

        string subject = $"Combat Report {payload.BattleCoordinates} - Winner: {payload.Winner}";

        var attackerMessage = new Message
        {
            Id = Guid.NewGuid(),
            RecipientUserId = attackerUserId,
            SenderUserId = null,
            Folder = MessageFolder.Combat,
            Subject = subject,
            ContentJson = serializedJson,
            IsRead = false,
            CreatedAtUtc = now
        };
        dbContext.Messages.Add(attackerMessage);

        if (defenderUserId != Guid.Empty && defenderUserId != attackerUserId)
        {
            var defenderMessage = new Message
            {
                Id = Guid.NewGuid(),
                RecipientUserId = defenderUserId,
                SenderUserId = null,
                Folder = MessageFolder.Combat,
                Subject = subject,
                ContentJson = serializedJson,
                IsRead = false,
                CreatedAtUtc = now
            };
            dbContext.Messages.Add(defenderMessage);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return report;
    }

    public async Task<PublicCombatReportPayload?> GetPublicCombatReportAsync(
        Guid reportId,
        bool hidePlayerIdentities = false,
        bool hideExactFleetNumbers = false,
        CancellationToken cancellationToken = default)
    {
        var reportEntity = await dbContext.CombatReports
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == reportId, cancellationToken);

        if (reportEntity is null || string.IsNullOrWhiteSpace(reportEntity.DataJson))
        {
            return null;
        }

        var payload = JsonSerializer.Deserialize<PublicCombatReportPayload>(reportEntity.DataJson, JsonOptions);
        if (payload is null)
        {
            return null;
        }

        if (hidePlayerIdentities || hideExactFleetNumbers)
        {
            return CombatReportFormulas.AnonymizeCombatReport(
                payload,
                hidePlayerIdentities: hidePlayerIdentities,
                hideExactFleetNumbers: hideExactFleetNumbers);
        }

        return payload;
    }
}

