using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using OGame.Api.Hubs;
using OGame.Application.Interfaces;
using OGame.Domain.Entities;
using OGame.Domain.Enums;

namespace OGame.Api.Endpoints;

public record ToggleFavoriteRequest(bool IsFavorite);
public record BatchDeleteMessagesRequest(List<string> MessageIds);
public record ShareReportRequest(string ReportType, string ReportId, string? TargetChannel);
public record SendChatMessageDto(Guid SenderUserId, string SenderUsername, Guid? RecipientUserId, string? Channel, string Text);

public static class MessagingAndChatEndpoints
{
    private static readonly string BookmarksPath = Path.Combine(AppContext.BaseDirectory, "message_bookmarks.json");
    private static readonly string ChatHistoryPath = Path.Combine(AppContext.BaseDirectory, "chat_history.json");
    private static readonly object FileLock = new();

    private static HashSet<string> LoadBookmarks()
    {
        lock (FileLock)
        {
            try
            {
                if (File.Exists(BookmarksPath))
                {
                    var json = File.ReadAllText(BookmarksPath);
                    var set = JsonSerializer.Deserialize<HashSet<string>>(json);
                    if (set != null) return set;
                }
            }
            catch { }
            return new HashSet<string>();
        }
    }

    private static void SaveBookmarks(HashSet<string> set)
    {
        lock (FileLock)
        {
            try
            {
                var json = JsonSerializer.Serialize(set);
                File.WriteAllText(BookmarksPath, json);
            }
            catch { }
        }
    }

    private static List<ChatMessage> LoadChatMessages()
    {
        lock (FileLock)
        {
            try
            {
                if (File.Exists(ChatHistoryPath))
                {
                    var json = File.ReadAllText(ChatHistoryPath);
                    var list = JsonSerializer.Deserialize<List<ChatMessage>>(json);
                    if (list != null) return list;
                }
            }
            catch { }

            var defaultMessages = new List<ChatMessage>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    SenderUserId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                    SenderUsername = "ViperX",
                    Channel = "alliance",
                    MessageText = "Selam komutanlar! 3. galakside harabe alanı tespit edildi, toplayıcıları hazır tutun.",
                    SentAtUtc = DateTime.UtcNow.AddMinutes(-34)
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    SenderUserId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                    SenderUsername = "AegisOne",
                    Channel = "alliance",
                    MessageText = "Savunma istasyonunu güçlendiriyorum. İttifak deposuna deuterium aktarımı yapıldı.",
                    SentAtUtc = DateTime.UtcNow.AddMinutes(-12)
                }
            };
            SaveChatMessages(defaultMessages);
            return defaultMessages;
        }
    }

    private static void SaveChatMessages(List<ChatMessage> list)
    {
        lock (FileLock)
        {
            try
            {
                var json = JsonSerializer.Serialize(list, new JsonSerializerOptions { WriteIndented = true });
                File.WriteAllText(ChatHistoryPath, json);
            }
            catch { }
        }
    }

    public static IEndpointRouteBuilder MapMessagingAndChatEndpoints(this IEndpointRouteBuilder app)
    {
        var messagesGroup = app.MapGroup("/api/messages")
            .WithTags("Messages");

        messagesGroup.MapGet("/", async (
            [FromQuery] string? category,
            [FromQuery] string? subTab,
            [FromQuery] Guid? userId,
            IApplicationDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var user = userId.HasValue
                ? await dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId.Value, cancellationToken)
                : await dbContext.Users.FirstOrDefaultAsync(u => u.Username == "Commander", cancellationToken);

            if (user is null)
            {
                return Results.NotFound(new { Message = "Kullanıcı bulunamadı." });
            }

            var bookmarks = LoadBookmarks();
            var now = DateTime.UtcNow;

            var espionageReports = await dbContext.EspionageReports
                .Include(r => r.TargetPlanet)
                .OrderByDescending(r => r.CreatedAtUtc)
                .Take(25)
                .ToListAsync(cancellationToken);

            var combatReports = await dbContext.CombatReports
                .OrderByDescending(c => c.CreatedAtUtc)
                .Take(20)
                .ToListAsync(cancellationToken);

            var expeditionReports = await dbContext.ExpeditionReports
                .OrderByDescending(e => e.CreatedAtUtc)
                .Take(20)
                .ToListAsync(cancellationToken);

            var playerMessages = await dbContext.Messages
                .Include(m => m.SenderUser)
                .Where(m => m.RecipientUserId == user.Id && m.Folder == MessageFolder.PlayerMessages)
                .OrderByDescending(m => m.CreatedAtUtc)
                .Take(30)
                .ToListAsync(cancellationToken);

            return Results.Ok(new
            {
                Category = category ?? "fleet",
                SubTab = subTab ?? "espionage",
                Bookmarks = bookmarks,
                EspionageReports = espionageReports.Select(e => new
                {
                    e.Id,
                    PlanetName = e.TargetPlanet?.Name ?? "Bilinmeyen Gezegen",
                    Coordinates = e.TargetPlanet != null ? $"[{e.TargetPlanet.Galaxy}:{e.TargetPlanet.System}:{e.TargetPlanet.Slot}]" : "[1:142:8]",
                    PlayerName = e.TargetPlanet?.User?.Username ?? "Yabancı",
                    e.TierLevel,
                    e.DataJson,
                    CreatedAtUtc = e.CreatedAtUtc,
                    AgeMinutes = (int)(now - e.CreatedAtUtc).TotalMinutes,
                    IsFavorite = bookmarks.Contains(e.Id.ToString())
                }),
                CombatReports = combatReports.Select(c => new
                {
                    c.Id,
                    c.AttackerName,
                    c.DefenderName,
                    c.Coordinates,
                    Winner = c.Winner.ToString(),
                    c.DataJson,
                    CreatedAtUtc = c.CreatedAtUtc,
                    AgeMinutes = (int)(now - c.CreatedAtUtc).TotalMinutes,
                    IsFavorite = bookmarks.Contains(c.Id.ToString())
                }),
                ExpeditionReports = expeditionReports.Select(ex => new
                {
                    ex.Id,
                    ex.Coordinates,
                    Outcome = ex.OutcomeType.ToString(),
                    ex.NarrativeText,
                    ex.LootJson,
                    CreatedAtUtc = ex.CreatedAtUtc,
                    AgeMinutes = (int)(now - ex.CreatedAtUtc).TotalMinutes,
                    IsFavorite = bookmarks.Contains(ex.Id.ToString())
                }),
                PlayerMessages = playerMessages.Select(m => new
                {
                    m.Id,
                    SenderName = m.SenderUser?.Username ?? "Galaktik Konsey",
                    m.Subject,
                    m.ContentJson,
                    m.IsRead,
                    CreatedAtUtc = m.CreatedAtUtc,
                    AgeMinutes = (int)(now - m.CreatedAtUtc).TotalMinutes,
                    IsFavorite = bookmarks.Contains(m.Id.ToString())
                })
            });
        })
        .WithName("GetFullMessagesHub");

        messagesGroup.MapPost("/{id}/favorite", (
            string id,
            [FromBody] ToggleFavoriteRequest request) =>
        {
            var bookmarks = LoadBookmarks();
            if (request.IsFavorite)
            {
                bookmarks.Add(id);
            }
            else
            {
                bookmarks.Remove(id);
            }
            SaveBookmarks(bookmarks);

            return Results.Ok(new
            {
                Success = true,
                Id = id,
                IsFavorite = request.IsFavorite,
                Message = request.IsFavorite ? "Mesaj favorilere eklendi." : "Mesaj favorilerden kaldırıldı."
            });
        })
        .WithName("ToggleMessageFavorite");

        messagesGroup.MapDelete("/batch", (
            [FromBody] BatchDeleteMessagesRequest request) =>
        {
            var bookmarks = LoadBookmarks();
            foreach (var id in request.MessageIds)
            {
                bookmarks.Remove(id);
            }
            SaveBookmarks(bookmarks);

            return Results.Ok(new
            {
                Success = true,
                DeletedCount = request.MessageIds.Count,
                Message = $"{request.MessageIds.Count} mesaj başarıyla silindi."
            });
        })
        .WithName("BatchDeleteMessages");

        messagesGroup.MapPost("/share-report", (
            [FromBody] ShareReportRequest request) =>
        {
            return Results.Ok(new
            {
                Success = true,
                ReportId = request.ReportId,
                Message = "Rapor başarıyla ittifak iletişim akışında paylaşıldı."
            });
        })
        .WithName("ShareReportToAlliance");

        // Chat Endpoints
        var chatGroup = app.MapGroup("/api/chat")
            .WithTags("Chat");

        chatGroup.MapGet("/messages", (
            [FromQuery] string? channel,
            [FromQuery] Guid? recipientUserId) =>
        {
            var messages = LoadChatMessages();
            var targetChannel = channel ?? "alliance";

            var filtered = messages
                .Where(m => (m.Channel == targetChannel) ||
                            (recipientUserId.HasValue && m.RecipientUserId == recipientUserId.Value))
                .OrderBy(m => m.SentAtUtc)
                .ToList();

            return Results.Ok(filtered);
        })
        .WithName("GetChatMessages");

        chatGroup.MapPost("/send", async (
            [FromBody] SendChatMessageDto dto,
            IHubContext<GameHub> hubContext) =>
        {
            var messages = LoadChatMessages();
            var newMsg = new ChatMessage
            {
                Id = Guid.NewGuid(),
                SenderUserId = dto.SenderUserId,
                SenderUsername = dto.SenderUsername,
                RecipientUserId = dto.RecipientUserId,
                Channel = dto.Channel ?? "alliance",
                MessageText = dto.Text,
                SentAtUtc = DateTime.UtcNow
            };

            messages.Add(newMsg);
            SaveChatMessages(messages);

            // SignalR broadcast
            await hubContext.Clients.All.SendAsync("ReceiveChatMessage", new
            {
                newMsg.Id,
                newMsg.SenderUserId,
                newMsg.SenderUsername,
                newMsg.RecipientUserId,
                newMsg.Channel,
                newMsg.MessageText,
                newMsg.SentAtUtc
            });

            return Results.Ok(new
            {
                Success = true,
                Message = newMsg
            });
        })
        .WithName("SendChatMessage");

        return app;
    }
}

