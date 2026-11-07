using Microsoft.EntityFrameworkCore;
using OGame.Application.Common.Interfaces;
using OGame.Application.Interfaces;
using OGame.Domain.Entities;
using OGame.Domain.Enums;
using OGame.Domain.Services;

namespace OGame.Api.Endpoints;

public record SelectCharacterClassRequest(string ClassType, Guid? UserId);

public static class CharacterClassEndpoints
{
    public static IEndpointRouteBuilder MapCharacterClassEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/character-class")
            .WithTags("CharacterClass");

        group.MapGet("/", async (
            Guid? userId,
            IApplicationDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var user = userId.HasValue
                ? await dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId.Value, cancellationToken)
                : await dbContext.Users.OrderBy(u => u.CreatedAtUtc).FirstOrDefaultAsync(cancellationToken);

            if (user is null)
            {
                return Results.NotFound(new { Message = "Kullanıcı bulunamadı." });
            }

            bool isFreeEligible = user.PlayerClass == PlayerClass.None;

            int classTokenCount = await dbContext.UserInventoryItems
                .Where(i => i.UserId == user.Id &&
                    (i.ItemKey.Contains("class_change") || i.ItemKey.StartsWith("class_") || i.Category == "classes") &&
                    i.Quantity > 0)
                .SumAsync(i => i.Quantity, cancellationToken);

            var collectorPerks = new[]
            {
                "+%25 Maden üretimi",
                "+%10 Enerji üretimi",
                "+%50 Paletli bonusu",
                "Nakliye gemisi için +%100 hız",
                "Nakliye gemisi +%25 ambar",
                "+%10 daha fazla kullanılabilir jeologlu Paletli",
                "Paletlilerde %150 limitine kadar aşırı yükleme",
                "Hızlanma (bina) için +%10 indirim"
            };

            var generalPerks = new[]
            {
                "Savaş gemileri için +%100 hız",
                "Geri dönüşümcüler için +%100 hız",
                "Geri Dönüşümcü ve Rehber için +%20 ambar",
                "Tüm gemiler için -%50 deuterium tüketimi",
                "Savaş başına bir hafif avcılı Ölüm Yıldızını yok etmek için düşük şans",
                "Saldırıda hurda alanı (başlangıç gezegenine nakliye)",
                "+2 Savaş araştırması seviyesi",
                "+2 filo alanı",
                "+5 ekstra ay alanı",
                "Filo hızının ayrıntılı ayarı",
                "Hızlanma (tersane) için +%10 indirim"
            };

            var discovererPerks = new[]
            {
                "-%25 araştırma zamanı",
                "Başarılı keşiflerde artırılmış kazanç",
                "Kolonileştirmede +%10 daha büyük gezegenler",
                "Keşifler esnasında oluşan enkaz alanları Galaksi görünümünde mevcut",
                "+2 keşif",
                "Sefer rakipleri için -%50 şans",
                "+%20 Falanks menzili",
                "Etkisizlerden %75 ganimet",
                "Hızlanma (araştırma) için +%10 indirim"
            };

            var classes = new[]
            {
                new
                {
                    ClassType = "Collector",
                    Name = "Koleksiyoncu (Collector)",
                    Subtitle = "Madenci (Miner)",
                    Color = "amber",
                    Perks = collectorPerks,
                    SpecialUnit = new
                    {
                        UnitType = (int)UnitType.Crawler,
                        Name = "Paletli (Crawler)",
                        Subtitle = "Maden Üretim Destek Aracı",
                        Description = "Traktör/maden üretim aracı, maden toplam kademesine göre her biri %0.02 metal, kristal ve deuterium üretimi artırır. Koleksiyoncu sınıfında %0.03 artış sağlar."
                    },
                    CostKm = isFreeEligible ? 0 : PlayerClassFormulas.BaseClassChangeCost,
                    IsActive = user.PlayerClass == PlayerClass.Collector
                },
                new
                {
                    ClassType = "General",
                    Name = "General",
                    Subtitle = "Savaşçı / Yağmacı (Fleeter)",
                    Color = "rose",
                    Perks = generalPerks,
                    SpecialUnit = new
                    {
                        UnitType = (int)UnitType.Reaper,
                        Name = "Azrail (Reaper)",
                        Subtitle = "Ağır Savaş ve Enkaz Gemisi",
                        Description = "Savaş sonrasında ortaya çıkan enkaz alanının bir kısmını derhal toplama kabiliyetine sahip ağır muharebe kruvazörü."
                    },
                    CostKm = isFreeEligible ? 0 : PlayerClassFormulas.BaseClassChangeCost,
                    IsActive = user.PlayerClass == PlayerClass.General
                },
                new
                {
                    ClassType = "Discoverer",
                    Name = "Kaşif (Discoverer)",
                    Subtitle = "Keşifçi (Explorer)",
                    Color = "cyan",
                    Perks = discovererPerks,
                    SpecialUnit = new
                    {
                        UnitType = (int)UnitType.Pathfinder,
                        Name = "Rehber (Pathfinder)",
                        Subtitle = "Derin Uzay Keşif Gemisi",
                        Description = "Keşiflerdeki enkaz alanlarını keşfedip sökebilme, eşya bulma ve sefer kazançlarını katlama kabiliyetine sahip derin uzay keşif gemisi."
                    },
                    CostKm = isFreeEligible ? 0 : PlayerClassFormulas.BaseClassChangeCost,
                    IsActive = user.PlayerClass == PlayerClass.Discoverer
                }
            };

            return Results.Ok(new
            {
                CurrentClass = user.PlayerClass.ToString(),
                CurrentClassId = (int)user.PlayerClass,
                IsFreeActivationEligible = isFreeEligible,
                DarkMatter = user.DarkMatter,
                ClassChangeTokenCount = classTokenCount,
                BaseChangeCost = PlayerClassFormulas.BaseClassChangeCost,
                Classes = classes
            });
        })
        .WithName("GetCharacterClassStatus");

        group.MapPost("/select", async (
            SelectCharacterClassRequest request,
            IApplicationDbContext dbContext,
            IDistributedLockService lockService,
            CancellationToken cancellationToken) =>
        {
            var user = request.UserId.HasValue
                ? await dbContext.Users.FirstOrDefaultAsync(u => u.Id == request.UserId.Value, cancellationToken)
                : await dbContext.Users.OrderBy(u => u.CreatedAtUtc).FirstOrDefaultAsync(cancellationToken);

            if (user is null)
            {
                return Results.NotFound(new { Message = "Kullanıcı bulunamadı." });
            }

            if (user.IsBanned)
            {
                return Results.BadRequest(new { Message = "Yasaklanmış hesaplar sınıf seçemez." });
            }

            PlayerClass targetClass = request.ClassType.ToLowerInvariant() switch
            {
                "collector" or "koleksiyoncu" or "kolektör" => PlayerClass.Collector,
                "general" => PlayerClass.General,
                "discoverer" or "kaşif" or "kasif" => PlayerClass.Discoverer,
                _ => PlayerClass.None
            };

            if (targetClass == PlayerClass.None)
            {
                return Results.BadRequest(new { Success = false, Message = "Geçersiz sınıf tipi. Yalnızca Koleksiyoncu, General veya Kaşif seçilebilir." });
            }

            if (user.PlayerClass == targetClass)
            {
                return Results.BadRequest(new
                {
                    Success = false,
                    Message = $"{targetClass} sınıfı zaten hesabınızda aktif durumda."
                });
            }

            string lockKey = $"lock:user:{user.Id}";
            await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

            bool isInitialFree = user.PlayerClass == PlayerClass.None;

            if (!isInitialFree)
            {
                // Check if user has an inventory token
                var token = await dbContext.UserInventoryItems
                    .FirstOrDefaultAsync(i => i.UserId == user.Id &&
                        (i.ItemKey.Contains("class_change") || i.ItemKey.StartsWith("class_") || i.Category == "classes") &&
                        i.Quantity > 0, cancellationToken);

                if (token != null)
                {
                    token.Quantity -= 1;
                    if (token.Quantity <= 0)
                    {
                        dbContext.UserInventoryItems.Remove(token);
                    }
                }
                else
                {
                    const int costKm = PlayerClassFormulas.BaseClassChangeCost;
                    if (user.DarkMatter < costKm)
                    {
                        return Results.BadRequest(new
                        {
                            Success = false,
                            Message = $"Yetersiz Karanlık Madde! Sınıf değiştirmek için {costKm:N0} KM veya Sınıf Değiştirme Eşyası gereklidir. (Mevcut: {user.DarkMatter:N0} KM)"
                        });
                    }
                    user.DarkMatter -= costKm;
                }
            }

            user.PlayerClass = targetClass;

            // Directive 7 Quest 3 hook (Player Class selected)
            var d7Progress = await dbContext.UserTutorialProgresses
                .FirstOrDefaultAsync(prog => prog.UserId == user.Id && prog.DirectiveId == 7, cancellationToken);
            if (d7Progress != null && d7Progress.CurrentQuestStep == 3)
            {
                d7Progress.SubStepBitmask = DirectiveMoreTipsFormulas.ProcessEvent(3, d7Progress.SubStepBitmask, "character_class_selected");
                d7Progress.UpdatedAtUtc = DateTime.UtcNow;
            }

            await dbContext.SaveChangesAsync(cancellationToken);

            string classNameTr = targetClass switch
            {
                PlayerClass.Collector => "Koleksiyoncu (Collector)",
                PlayerClass.General => "General",
                PlayerClass.Discoverer => "Kaşif (Discoverer)",
                _ => targetClass.ToString()
            };

            return Results.Ok(new
            {
                Success = true,
                PlayerClass = targetClass.ToString(),
                PlayerClassId = (int)targetClass,
                ClassName = classNameTr,
                RemainingDarkMatter = user.DarkMatter,
                Message = isInitialFree
                    ? $"{classNameTr} sınıfı ücretsiz olarak hesabınızda etkinleştirildi!"
                    : $"{classNameTr} sınıfı başarıyla değiştirildi ve etkinleştirildi!"
            });
        })
        .WithName("SelectCharacterClass");

        return app;
    }
}
