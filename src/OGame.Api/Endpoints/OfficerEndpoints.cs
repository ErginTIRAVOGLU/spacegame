using Microsoft.EntityFrameworkCore;
using OGame.Application.Interfaces;
using OGame.Domain.Entities;
using OGame.Domain.Services;

namespace OGame.Api.Endpoints;

public record HireOfficerRequest(
    Guid UserId,
    string OfficerKey, // "commander", "admiral", "engineer", "geologist", "technocrat", "command_staff"
    string Duration); // "week" or "month"

public static class OfficerEndpoints
{
    public static IEndpointRouteBuilder MapOfficerEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/officers")
            .WithTags("Officers");

        group.MapGet("/status", async (
            Guid? userId,
            IApplicationDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var user = userId.HasValue
                ? await dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId.Value, cancellationToken)
                : null;

            user ??= await dbContext.Users
                .FirstOrDefaultAsync(u => u.Email == "commander@nova.ogame" || u.Username.ToLower() == "commander", cancellationToken)
                ?? await dbContext.Users.OrderBy(u => u.CreatedAtUtc).FirstOrDefaultAsync(cancellationToken);

            if (user is null)
            {
                return Results.NotFound(new { Message = "Kullanıcı bulunamadı." });
            }

            var now = DateTime.UtcNow;
            var activeOfficers = await dbContext.UserOfficers
                .Where(o => o.UserId == user.Id && o.ExpiresAtUtc > now)
                .ToListAsync(cancellationToken);

            var officersDict = new Dictionary<string, object>();
            var officerTypes = new[]
            {
                ("commander", OfficerType.Commander),
                ("admiral", OfficerType.FleetAdmiral),
                ("engineer", OfficerType.Engineer),
                ("geologist", OfficerType.Geologist),
                ("technocrat", OfficerType.Technocrat)
            };

            foreach (var (key, type) in officerTypes)
            {
                var match = activeOfficers.FirstOrDefault(o => o.Type == type);
                bool isActive = match != null;
                DateTime? expiresAt = match?.ExpiresAtUtc;
                int remainingSeconds = isActive && expiresAt.HasValue ? Math.Max(0, (int)(expiresAt.Value - now).TotalSeconds) : 0;

                officersDict[key] = new
                {
                    IsActive = isActive,
                    ExpiresAtUtc = expiresAt,
                    RemainingSeconds = remainingSeconds
                };
            }

            bool hasCmd = activeOfficers.Any(o => o.Type == OfficerType.Commander);
            bool hasAdm = activeOfficers.Any(o => o.Type == OfficerType.FleetAdmiral);
            bool hasEng = activeOfficers.Any(o => o.Type == OfficerType.Engineer);
            bool hasGeo = activeOfficers.Any(o => o.Type == OfficerType.Geologist);
            bool hasTech = activeOfficers.Any(o => o.Type == OfficerType.Technocrat);

            var bonuses = OfficerFormulas.EvaluateBonuses(hasCmd, hasAdm, hasEng, hasGeo, hasTech);
            int activeCount = (hasCmd ? 1 : 0) + (hasAdm ? 1 : 0) + (hasEng ? 1 : 0) + (hasGeo ? 1 : 0) + (hasTech ? 1 : 0);

            return Results.Ok(new
            {
                DarkMatter = user.DarkMatter,
                ActiveCount = activeCount,
                Officers = officersDict,
                Bonuses = bonuses
            });
        })
        .WithName("GetOfficersStatus");

        group.MapPost("/hire", async (
            HireOfficerRequest request,
            IApplicationDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken)
                ?? await dbContext.Users.OrderBy(u => u.CreatedAtUtc).FirstOrDefaultAsync(cancellationToken);
            if (user is null)
            {
                return Results.NotFound(new { Message = "Kullanıcı bulunamadı." });
            }

            bool isThreeMonths = request.Duration.ToLowerInvariant() switch
            {
                "3months" or "three_months" or "month" or "90days" or "3ay" => true,
                _ => false
            };
            var durationSpan = isThreeMonths ? TimeSpan.FromDays(90) : TimeSpan.FromDays(7);
            string durationLabel = isThreeMonths ? "3 Ay (90 Gün)" : "1 Hafta";

            var now = DateTime.UtcNow;

            if (request.OfficerKey.ToLowerInvariant() == "command_staff")
            {
                var (weeklyStaffCost, threeMonthsStaffCost) = OfficerFormulas.GetCanonicalCost("command_staff");
                int cost = isThreeMonths ? threeMonthsStaffCost : weeklyStaffCost;
                if (user.DarkMatter < cost)
                {
                    return Results.BadRequest(new
                    {
                        Success = false,
                        Message = $"Yetersiz Karanlık Madde! Komuta Heyeti için gereken: {cost:N0} KM. Mevcut: {user.DarkMatter:N0} KM."
                    });
                }

                user.DarkMatter -= cost;

                var allTypes = new[]
                {
                    OfficerType.Commander,
                    OfficerType.FleetAdmiral,
                    OfficerType.Engineer,
                    OfficerType.Geologist,
                    OfficerType.Technocrat
                };

                foreach (var type in allTypes)
                {
                    var existing = await dbContext.UserOfficers
                        .FirstOrDefaultAsync(o => o.UserId == user.Id && o.Type == type, cancellationToken);

                    if (existing == null)
                    {
                        dbContext.UserOfficers.Add(new UserOfficer
                        {
                            UserId = user.Id,
                            Type = type,
                            ExpiresAtUtc = now.Add(durationSpan),
                            HiredAtUtc = now
                        });
                    }
                    else
                    {
                        var baseDate = existing.ExpiresAtUtc > now ? existing.ExpiresAtUtc : now;
                        existing.ExpiresAtUtc = baseDate.Add(durationSpan);
                    }
                }

                await dbContext.SaveChangesAsync(cancellationToken);

                return Results.Ok(new
                {
                    Success = true,
                    Message = $"Tüm Komuta Heyeti başarıyla {durationLabel} süreyle görevlendirildi!",
                    RemainingDarkMatter = user.DarkMatter
                });
            }

            OfficerType targetType = request.OfficerKey.ToLowerInvariant() switch
            {
                "commander" => OfficerType.Commander,
                "admiral" => OfficerType.FleetAdmiral,
                "engineer" => OfficerType.Engineer,
                "geologist" => OfficerType.Geologist,
                "technocrat" => OfficerType.Technocrat,
                _ => (OfficerType)0
            };

            if ((int)targetType == 0)
            {
                return Results.BadRequest(new { Success = false, Message = "Geçersiz subay tipi." });
            }

            var (weeklySingleCost, threeMonthsSingleCost) = OfficerFormulas.GetCanonicalCost(request.OfficerKey);
            int singleCost = isThreeMonths ? threeMonthsSingleCost : weeklySingleCost;
            if (user.DarkMatter < singleCost)
            {
                return Results.BadRequest(new
                {
                    Success = false,
                    Message = $"Yetersiz Karanlık Madde! Gereken: {singleCost:N0} KM. Mevcut: {user.DarkMatter:N0} KM."
                });
            }

            user.DarkMatter -= singleCost;

            var existingOfficer = await dbContext.UserOfficers
                .FirstOrDefaultAsync(o => o.UserId == user.Id && o.Type == targetType, cancellationToken);

            if (existingOfficer == null)
            {
                dbContext.UserOfficers.Add(new UserOfficer
                {
                    UserId = user.Id,
                    Type = targetType,
                    ExpiresAtUtc = now.Add(durationSpan),
                    HiredAtUtc = now
                });
            }
            else
            {
                var baseDate = existingOfficer.ExpiresAtUtc > now ? existingOfficer.ExpiresAtUtc : now;
                existingOfficer.ExpiresAtUtc = baseDate.Add(durationSpan);
            }

            await dbContext.SaveChangesAsync(cancellationToken);

            string officerDisplayName = targetType switch
            {
                OfficerType.Commander => "Commander",
                OfficerType.FleetAdmiral => "Amiral",
                OfficerType.Engineer => "Mühendis",
                OfficerType.Geologist => "Jeolog",
                OfficerType.Technocrat => "Teknokrat",
                _ => "Subay"
            };

            return Results.Ok(new
            {
                Success = true,
                Message = $"{officerDisplayName} başarıyla {durationLabel} süreyle kiralandı!",
                RemainingDarkMatter = user.DarkMatter
            });
        })
        .WithName("HireOfficer");

        group.MapPost("/topup", async (
            Guid userId,
            int amount,
            IApplicationDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId, cancellationToken)
                ?? await dbContext.Users.OrderBy(u => u.CreatedAtUtc).FirstOrDefaultAsync(cancellationToken);
            if (user is null)
            {
                return Results.NotFound(new { Message = "Kullanıcı bulunamadı." });
            }

            user.DarkMatter += Math.Max(0, amount);
            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Ok(new
            {
                Success = true,
                Message = $"{amount:N0} Karanlık Madde hesabınıza tanımlandı.",
                DarkMatter = user.DarkMatter
            });
        })
        .WithName("TopUpDarkMatter");

        return app;
    }
}
