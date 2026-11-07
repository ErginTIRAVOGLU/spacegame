using Microsoft.EntityFrameworkCore;
using OGame.Application.Common.Interfaces;
using OGame.Application.Interfaces;
using OGame.Domain.Entities;
using OGame.Domain.Enums;

namespace OGame.Api.Endpoints;

public record CreateAllianceRequest(
    Guid FounderUserId,
    string Name,
    string Tag,
    string? Description = null);

public record JoinAllianceRequest(
    Guid UserId,
    AllianceRole Role = AllianceRole.Member);

public record ConvertToAcsGroupRequest(
    Guid InitiatorUserId,
    Guid FleetMissionId,
    string GroupName,
    IReadOnlyList<Guid> InvitedUserIds);

public record UpdateAllianceSettingsRequest(
    string? Name,
    string? Tag,
    string? Description,
    string? InternalText,
    string? ExternalText,
    string? ApplicationText,
    string? LogoUrl,
    string? HomepageUrl,
    bool? ApplicationsOpen,
    string? FounderTitle,
    string? RecruitTitle,
    string? AllianceClass);

public record CircularMailRequest(
    Guid SenderUserId,
    string Subject,
    string Content,
    string? TargetRank = null);

public record AllianceApplicationRequest(
    Guid UserId,
    string Message);

public record HandleAllianceApplicationRequest(
    string Action);

public record ChangeAllianceClassRequest(
    string AllianceClass,
    Guid? UserId = null);

public static class AllianceAndAcsEndpoints
{
    private static readonly string ApplicationsFilePath = Path.Combine(AppContext.BaseDirectory, "alliance_applications.json");
    private static readonly string AllianceClassesFilePath = Path.Combine(AppContext.BaseDirectory, "alliance_classes.json");
    private static readonly System.Collections.Concurrent.ConcurrentDictionary<Guid, string> AllianceClassStore = LoadAllianceClasses();

    private static System.Collections.Concurrent.ConcurrentDictionary<Guid, string> LoadAllianceClasses()
    {
        var dict = new System.Collections.Concurrent.ConcurrentDictionary<Guid, string>();
        try
        {
            if (File.Exists(AllianceClassesFilePath))
            {
                var json = File.ReadAllText(AllianceClassesFilePath);
                var loaded = System.Text.Json.JsonSerializer.Deserialize<Dictionary<Guid, string>>(json);
                if (loaded != null)
                {
                    foreach (var kvp in loaded)
                    {
                        dict[kvp.Key] = kvp.Value;
                    }
                }
            }
        }
        catch
        {
            // Ignore load error
        }
        return dict;
    }

    private static void SaveAllianceClasses()
    {
        lock (FileLock)
        {
            try
            {
                var json = System.Text.Json.JsonSerializer.Serialize(AllianceClassStore, new System.Text.Json.JsonSerializerOptions { WriteIndented = true });
                File.WriteAllText(AllianceClassesFilePath, json);
            }
            catch
            {
                // Ignore write error
            }
        }
    }

    public record StoredApplication(
        Guid AllianceId,
        string ApplicationId,
        string UserName,
        int Rank,
        long Score,
        string Message,
        DateTime AppliedAt);

    private static readonly object FileLock = new();

    private static List<StoredApplication> LoadApplications()
    {
        lock (FileLock)
        {
            try
            {
                if (File.Exists(ApplicationsFilePath))
                {
                    var json = File.ReadAllText(ApplicationsFilePath);
                    var list = System.Text.Json.JsonSerializer.Deserialize<List<StoredApplication>>(json);
                    if (list != null) return list;
                }
            }
            catch
            {
                // Fallback to default list on read error
            }

            var defaultList = new List<StoredApplication>
            {
                new(Guid.Empty, "app-1", "StarCommanderX", 142, 84500, "Merhaba! 2. Galakside aktif bir filocuyum. İttifakınıza katılmak ve operasyonlara destek vermek istiyorum.", DateTime.UtcNow.AddHours(-2)),
                new(Guid.Empty, "app-2", "MiningBaron", 98, 165200, "Günlük maden sevkiyatı ve ticaret desteği sağlayabilirim. İttifak kurallarını okudum ve kabul ediyorum.", DateTime.UtcNow.AddHours(-14))
            };
            SaveApplications(defaultList);
            return defaultList;
        }
    }

    private static void SaveApplications(List<StoredApplication> list)
    {
        lock (FileLock)
        {
            try
            {
                var json = System.Text.Json.JsonSerializer.Serialize(list, new System.Text.Json.JsonSerializerOptions { WriteIndented = true });
                File.WriteAllText(ApplicationsFilePath, json);
            }
            catch
            {
                // Ignore write error
            }
        }
    }
    public static IEndpointRouteBuilder MapAllianceAndAcsEndpoints(this IEndpointRouteBuilder app)
    {
        var allianceGroup = app.MapGroup("/api/alliances")
            .WithTags("Alliances");

        allianceGroup.MapGet("/user/{userId:guid}", async (
            Guid userId,
            IApplicationDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var user = await dbContext.Users
                .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

            if (user is null)
            {
                return Results.NotFound(new { Message = "Kullanıcı bulunamadı." });
            }

            var membership = await dbContext.AllianceMembers
                .Include(m => m.Alliance)
                .FirstOrDefaultAsync(m => m.UserId == userId, cancellationToken);

            // If user has tag NOVA but no membership yet, seed Nova Vanguard alliance
            if (membership is null && user.AllianceTag == "NOVA")
            {
                var existingNova = await dbContext.Alliances.FirstOrDefaultAsync(a => a.Tag == "NOVA", cancellationToken);
                if (existingNova is null)
                {
                    existingNova = new Alliance
                    {
                        Id = Guid.NewGuid(),
                        Name = "Nova Vanguard",
                        Tag = "NOVA",
                        FounderUserId = user.Id,
                        Description = "Evrenin en güçlü ittifakı. Galaktik savunma, ortak filo taarruzları (ACS) ve adil kaynak ticareti.",
                        CreatedAtUtc = DateTime.UtcNow.AddDays(-14)
                    };
                    dbContext.Alliances.Add(existingNova);
                }

                membership = new AllianceMember
                {
                    UserId = user.Id,
                    AllianceId = existingNova.Id,
                    Role = AllianceRole.Founder,
                    JoinedAtUtc = existingNova.CreatedAtUtc
                };
                dbContext.AllianceMembers.Add(membership);
                await dbContext.SaveChangesAsync(cancellationToken);
                membership.Alliance = existingNova;
            }

            if (membership is null || membership.Alliance is null)
            {
                return Results.Ok(new { InAlliance = false });
            }

            var alliance = membership.Alliance;

            var allMembers = await dbContext.AllianceMembers
                .AsNoTracking()
                .Include(m => m.User)
                .Where(m => m.AllianceId == alliance.Id)
                .OrderByDescending(m => m.Role)
                .ThenBy(m => m.JoinedAtUtc)
                .ToListAsync(cancellationToken);

            var memberUserIds = allMembers.Select(m => m.UserId).ToList();

            var planets = await dbContext.Planets
                .AsNoTracking()
                .Where(p => memberUserIds.Contains(p.UserId) && p.IsCapital)
                .ToListAsync(cancellationToken);

            var now = DateTime.UtcNow;

            var memberDtos = allMembers.Select(m =>
            {
                var capPlanet = planets.FirstOrDefault(p => p.UserId == m.UserId);
                string coords = capPlanet != null ? $"{capPlanet.Galaxy}:{capPlanet.System}:{capPlanet.Slot}" : "1:142:4";
                bool isOnline = m.User != null && (now - m.User.LastLoginUtc).TotalMinutes < 15;

                string roleName = m.Role switch
                {
                    AllianceRole.Founder => "Kurucu",
                    AllianceRole.General => "General",
                    _ => "Üye"
                };

                long points = m.User?.TotalPoints ?? 0;

                return new
                {
                    UserId = m.UserId,
                    UserName = m.User?.Username ?? "Komutan",
                    Role = (int)m.Role,
                    RoleName = roleName,
                    Score = points,
                    Rank = 1,
                    MainCoordinates = coords,
                    JoinedAt = m.JoinedAtUtc.ToString("o"),
                    LastLogin = m.User != null ? m.User.LastLoginUtc.ToString("g") : "Bilinmiyor",
                    IsOnline = isOnline
                };
            }).ToList();

            long totalScore = memberDtos.Sum(m => (long)m.Score);

            var applications = LoadApplications();
            var pendingApps = applications
                .Where(a => a.AllianceId == Guid.Empty || a.AllianceId == alliance.Id)
                .Select(a => new
                {
                    Id = a.ApplicationId,
                    UserId = Guid.NewGuid().ToString(),
                    UserName = a.UserName,
                    AppliedAt = a.AppliedAt.ToString("o"),
                    Rank = a.Rank,
                    Score = a.Score,
                    Message = a.Message
                }).ToList();

            return Results.Ok(new
            {
                InAlliance = true,
                Alliance = new
                {
                    alliance.Id,
                    alliance.Name,
                    alliance.Tag,
                    alliance.Description,
                    alliance.FounderUserId,
                    alliance.CreatedAtUtc,
                    CreatedAt = alliance.CreatedAtUtc,
                    MemberCount = alliance.Members.Count,
                    MaxMembers = 50,
                    Rank = 1,
                    Score = totalScore,
                    FounderTitle = "Kurucu",
                    RecruitTitle = "Yeni Üye",
                    AllianceClass = AllianceClassStore.GetValueOrDefault(alliance.Id, "warrior"),
                    IsOpenForApplications = true,
                    ApplicationsOpen = true,
                    LogoUrl = "",
                    HomepageUrl = "",
                    InternalText = "Hoş geldiniz müttefikler! Günlük filo hareketlerinizi koordinasyon panelinden takip ediniz.",
                    ExternalText = alliance.Description,
                    ApplicationText = "İttifakımıza katılmak için başvurunuzu iletiniz. Minimum 5,000 puan şartı aranır.",
                    Members = memberDtos,
                    Applications = pendingApps,
                    UserRole = (int)membership.Role,
                    IsAdmin = membership.Role == AllianceRole.Founder || membership.Role == AllianceRole.General
                }
            });
        })
        .WithName("GetUserAlliance");

        allianceGroup.MapGet("/search", async (
            string? query,
            IApplicationDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var q = query?.Trim() ?? string.Empty;

            var alliances = await dbContext.Alliances
                .AsNoTracking()
                .Include(a => a.Members)
                .Where(a => string.IsNullOrEmpty(q) ||
                            a.Name.ToLower().Contains(q.ToLower()) ||
                            a.Tag.ToLower().Contains(q.ToLower()))
                .OrderBy(a => a.Name)
                .Take(20)
                .ToListAsync(cancellationToken);

            var founderIds = alliances.Select(a => a.FounderUserId).Distinct().ToList();
            var founders = await dbContext.Users
                .AsNoTracking()
                .Where(u => founderIds.Contains(u.Id))
                .ToDictionaryAsync(u => u.Id, u => u.Username, cancellationToken);

            return Results.Ok(alliances.Select(a => new
            {
                a.Id,
                a.Name,
                a.Tag,
                a.Description,
                a.CreatedAtUtc,
                MemberCount = a.Members.Count,
                FounderName = founders.TryGetValue(a.FounderUserId, out var fn) ? fn : "Komutan"
            }));
        })
        .WithName("SearchAlliances");

        allianceGroup.MapPost("/apply", (
            AllianceApplicationRequest request) =>
        {
            return Results.Ok(new
            {
                Success = true,
                Message = "İttifak başvurunuz başarıyla iletildi. İttifak yöneticileri değerlendirdikten sonra bilgilendirileceksiniz."
            });
        })
        .WithName("ApplyToAlliance");

        allianceGroup.MapPost("/{allianceId:guid}/applications/{applicationId}", (
            Guid allianceId,
            string applicationId,
            HandleAllianceApplicationRequest request) =>
        {
            var apps = LoadApplications();
            apps.RemoveAll(a => a.ApplicationId == applicationId);
            SaveApplications(apps);

            string actionText = request.Action.ToLowerInvariant() == "accept" ? "kabul edildi" : "reddedildi";
            return Results.Ok(new
            {
                Success = true,
                Message = $"Aday başvurusu başarıyla {actionText}."
            });
        })
        .WithName("HandleAllianceApplication");

        allianceGroup.MapPost("/{allianceId:guid}/class", async (
            Guid allianceId,
            ChangeAllianceClassRequest request,
            IApplicationDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var alliance = await dbContext.Alliances.FirstOrDefaultAsync(a => a.Id == allianceId, cancellationToken);
            if (alliance is null)
            {
                return Results.NotFound(new { Message = "İttifak bulunamadı." });
            }

            var targetUserId = request.UserId ?? alliance.FounderUserId;
            var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Id == targetUserId, cancellationToken);

            const int costKm = 500_000;
            if (user == null || user.DarkMatter < costKm)
            {
                int currentKm = user?.DarkMatter ?? 0;
                return Results.BadRequest(new
                {
                    Success = false,
                    Message = $"Yetersiz Karanlık Madde! İttifak sınıfını değiştirmek için 500.000 Karanlık Madde gereklidir. Mevcut Karanlık Madde: {currentKm:N0} KM"
                });
            }

            user.DarkMatter -= costKm;
            AllianceClassStore[alliance.Id] = request.AllianceClass.ToLowerInvariant();
            SaveAllianceClasses();

            await dbContext.SaveChangesAsync(cancellationToken);

            string className = request.AllianceClass.ToLowerInvariant() switch
            {
                "warrior" => "Savaşçı Birliği (Warrior)",
                "trader" => "Ticaret Birliği (Trader)",
                "researcher" => "Kaşif & Araştırmacı Birliği (Researcher)",
                _ => request.AllianceClass
            };

            return Results.Ok(new
            {
                Success = true,
                AllianceClass = request.AllianceClass.ToLowerInvariant(),
                RemainingDarkMatter = user.DarkMatter,
                Message = $"İttifak sınıfı başarıyla {className} olarak güncellendi!"
            });
        })
        .WithName("ChangeAllianceClass");

        allianceGroup.MapPost("/{allianceId:guid}/circular-mail", async (
            Guid allianceId,
            CircularMailRequest request,
            IApplicationDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var alliance = await dbContext.Alliances
                .Include(a => a.Members)
                .FirstOrDefaultAsync(a => a.Id == allianceId, cancellationToken);

            if (alliance is null)
            {
                return Results.NotFound(new { Message = "İttifak bulunamadı." });
            }

            int recipientCount = alliance.Members.Count;
            return Results.Ok(new
            {
                Success = true,
                RecipientCount = recipientCount,
                Message = $"Sirküler mesaj {recipientCount} ittifak üyesine başarıyla gönderildi."
            });
        })
        .WithName("SendCircularMail");

        allianceGroup.MapDelete("/{allianceId:guid}/members/{memberUserId:guid}", async (
            Guid allianceId,
            Guid memberUserId,
            IApplicationDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var membership = await dbContext.AllianceMembers
                .FirstOrDefaultAsync(m => m.AllianceId == allianceId && m.UserId == memberUserId, cancellationToken);

            if (membership is not null)
            {
                var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Id == memberUserId, cancellationToken);
                if (user is not null)
                {
                    user.AllianceTag = null;
                }
                dbContext.AllianceMembers.Remove(membership);
                await dbContext.SaveChangesAsync(cancellationToken);
            }

            return Results.Ok(new { Success = true, Message = "Üyelik sonlandırıldı." });
        })
        .WithName("RemoveAllianceMember");

        allianceGroup.MapDelete("/{allianceId:guid}", async (
            Guid allianceId,
            IApplicationDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var alliance = await dbContext.Alliances
                .Include(a => a.Members)
                .FirstOrDefaultAsync(a => a.Id == allianceId, cancellationToken);

            if (alliance is not null)
            {
                var memberUserIds = alliance.Members.Select(m => m.UserId).ToList();
                var users = await dbContext.Users.Where(u => memberUserIds.Contains(u.Id)).ToListAsync(cancellationToken);
                foreach (var u in users)
                {
                    u.AllianceTag = null;
                }
                dbContext.Alliances.Remove(alliance);
                await dbContext.SaveChangesAsync(cancellationToken);
            }

            return Results.Ok(new { Success = true, Message = "İttifak başarıyla dağıtıldı." });
        })
        .WithName("DisbandAlliance");

        allianceGroup.MapPost("/", async (
            CreateAllianceRequest request,
            IAllianceAndAcsService service,
            IApplicationDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var alliance = await service.CreateAllianceAsync(
                    request.FounderUserId,
                    request.Name,
                    request.Tag,
                    request.Description ?? string.Empty,
                    cancellationToken);

                var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Id == request.FounderUserId, cancellationToken);
                if (user is not null)
                {
                    user.AllianceTag = alliance.Tag;
                    await dbContext.SaveChangesAsync(cancellationToken);
                }

                return Results.Ok(new
                {
                    alliance.Id,
                    alliance.Name,
                    alliance.Tag,
                    alliance.FounderUserId,
                    alliance.Description,
                    alliance.CreatedAtUtc
                });
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { Message = ex.Message });
            }
        })
        .WithName("CreateAlliance");

        allianceGroup.MapPost("/{allianceId:guid}/members", async (
            Guid allianceId,
            JoinAllianceRequest request,
            IAllianceAndAcsService service,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var member = await service.JoinAllianceAsync(
                    request.UserId,
                    allianceId,
                    request.Role,
                    cancellationToken);

                return Results.Ok(new
                {
                    member.UserId,
                    member.AllianceId,
                    member.Role,
                    member.JoinedAtUtc
                });
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { Message = ex.Message });
            }
        })
        .WithName("JoinAlliance");

        var acsGroup = app.MapGroup("/api/acs")
            .WithTags("ACS");

        acsGroup.MapPost("/groups", async (
            ConvertToAcsGroupRequest request,
            IAllianceAndAcsService service,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var group = await service.ConvertMissionToAcsGroupAsync(
                    request.InitiatorUserId,
                    request.FleetMissionId,
                    request.GroupName,
                    request.InvitedUserIds,
                    cancellationToken);

                return Results.Ok(new
                {
                    group.Id,
                    group.Name,
                    group.InitiatorUserId,
                    group.InitiatorFleetMissionId,
                    TargetCoordinates = $"[{group.TargetGalaxy}:{group.TargetSystem}:{group.TargetSlot}]",
                    group.SynchronizedArrivalUtc,
                    InvitedUsers = group.Invitations.Select(i => i.InvitedUserId)
                });
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { Message = ex.Message });
            }
        })
        .WithName("ConvertMissionToAcsGroup");

        acsGroup.MapPost("/groups/{groupId:guid}/join", async (
            Guid groupId,
            FleetDispatchCommand command,
            IAllianceAndAcsService service,
            CancellationToken cancellationToken) =>
        {
            try
            {
                var mission = await service.JoinAcsAttackGroupAsync(groupId, command, cancellationToken);
                return Results.Ok(new
                {
                    mission.Id,
                    mission.AcsAttackGroupId,
                    mission.UserId,
                    mission.ArrivalUtc,
                    mission.ReturnUtc,
                    mission.FuelConsumed
                });
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { Message = ex.Message });
            }
        })
        .WithName("JoinAcsAttackGroup");

        return app;
    }
}

