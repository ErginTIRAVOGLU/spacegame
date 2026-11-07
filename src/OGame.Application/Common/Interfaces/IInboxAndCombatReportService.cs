using OGame.Domain.Entities;
using OGame.Domain.Enums;
using OGame.Domain.Services;

namespace OGame.Application.Common.Interfaces;

public record MessageDto(
    Guid Id,
    Guid RecipientUserId,
    Guid? SenderUserId,
    MessageFolder Folder,
    string Subject,
    string ContentJson,
    bool IsRead,
    DateTime CreatedAtUtc);

public record PaginatedMessagesResult(
    IReadOnlyList<MessageDto> Items,
    int Page,
    int PageSize,
    int TotalCount,
    int UnreadCount);

public interface IInboxAndCombatReportService
{
    Task<Message> SendMessageAsync(
        Guid recipientUserId,
        Guid? senderUserId,
        MessageFolder folder,
        string subject,
        string contentJson,
        CancellationToken cancellationToken = default);

    Task<PaginatedMessagesResult> GetMessagesAsync(
        Guid userId,
        MessageFolder? folder = null,
        int page = 1,
        int pageSize = 20,
        CancellationToken cancellationToken = default);

    Task<int> MarkMessagesAsReadAsync(
        Guid userId,
        IReadOnlyList<Guid> messageIds,
        CancellationToken cancellationToken = default);

    Task<int> PurgeExpiredReadMessagesAsync(CancellationToken cancellationToken = default);

    Task<CombatReport> CreateAndArchiveCombatReportAsync(
        PublicCombatReportPayload payload,
        Guid attackerUserId,
        Guid defenderUserId,
        Guid? targetPlanetId,
        CancellationToken cancellationToken = default);

    Task<PublicCombatReportPayload?> GetPublicCombatReportAsync(
        Guid reportId,
        bool hidePlayerIdentities = false,
        bool hideExactFleetNumbers = false,
        CancellationToken cancellationToken = default);
}

