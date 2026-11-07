using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using OGame.Api.Hubs;
using OGame.Application.Common.Interfaces;
using OGame.Application.Interfaces;
using OGame.Domain.Entities;
using OGame.Domain.Enums;
using OGame.Domain.Services;

namespace OGame.Api.Endpoints;

public record SummonMerchantRequest(Guid? UserId);

public record MerchantTradeRequest(
    Guid PlanetId,
    string TargetResource, // "metal", "crystal", "deuterium"
    double SpentMetal,
    double SpentCrystal,
    double SpentDeuterium);

public record BuyResourcePackRequest(
    Guid PlanetId,
    string PackType); // "metal", "crystal", "deuterium", "all"

public record AuctionBidRequest(
    Guid PlanetId,
    double MetalBid,
    double CrystalBid,
    double DeuteriumBid,
    long HonorPointsBid = 0);

public record ScrapperBargainRequest(Guid PlanetId);

public record ScrapperRecycleRequest(
    Guid PlanetId,
    Dictionary<int, int> Units); // UnitType -> Count

public record ImportExportBuyRequest(
    Guid PlanetId,
    double PaidMetal,
    double PaidCrystal,
    double PaidDeuterium);

public class MerchantMemoryState
{
    // Auction state
    public string CurrentAuctionItem { get; set; } = "Bronz Metal Güçlendirici (+%10 / 7 Gün)";
    public string CurrentAuctionDescription { get; set; } = "7 gün boyunca gezegenin metal madeni temel üretimini %10 artırır.";
    public double HighestBid { get; set; } = 45000;
    public string HighestBidder { get; set; } = "Amiral Vance";
    public DateTime AuctionEndTimeUtc { get; set; } = DateTime.UtcNow.AddMinutes(18).AddSeconds(42);
    public List<AuctionHistoryEntry> RecentAuctions { get; set; } =
    [
        new("Gümüş Kristal Güçlendirici (+%20)", "Orion_99", 185000, DateTime.UtcNow.AddHours(-1).AddMinutes(-12)),
        new("Bronz Deuterium Güçlendirici (+%10)", "VegaCorsair", 94000, DateTime.UtcNow.AddHours(-2).AddMinutes(-40)),
        new("Yeni Nesil Kraken (Bina -2s)", "Kaelen", 320000, DateTime.UtcNow.AddHours(-4).AddMinutes(-5)),
        new("Altın Metal Güçlendirici (+%30)", "NovaPrime", 540000, DateTime.UtcNow.AddHours(-6).AddMinutes(-20)),
        new("Yeni Nesil Newtron (Tersane -2s)", "StarLord", 210000, DateTime.UtcNow.AddHours(-8).AddMinutes(-15)),
    ];

    // Scrapper state per user
    public Dictionary<Guid, int> UserScrapperRates { get; set; } = new();

    // Import/Export state
    public string DailyContainerItem { get; set; } = "Gizemli Konteyner (Günün Ürünü)";
    public double DailyContainerRequiredPoints { get; set; } = 75000;
    public Dictionary<Guid, DateTime> UserLastImportExportPurchaseUtc { get; set; } = new();
}

public record AuctionHistoryEntry(
    string ItemName,
    string WinnerName,
    double WinningBid,
    DateTime WonAtUtc);

public static class MerchantEndpoints
{
    private static readonly MerchantMemoryState State = new();

    public static IEndpointRouteBuilder MapMerchantEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/merchant")
            .WithTags("Merchant");

        // 1. GET /api/merchant/status
        group.MapGet("/status", async (
            Guid? planetId,
            IApplicationDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var now = DateTime.UtcNow;

            // Roll auction if expired
            if (now >= State.AuctionEndTimeUtc)
            {
                State.RecentAuctions.Insert(0, new AuctionHistoryEntry(
                    State.CurrentAuctionItem,
                    State.HighestBidder,
                    State.HighestBid,
                    State.AuctionEndTimeUtc));

                if (State.RecentAuctions.Count > 10)
                {
                    State.RecentAuctions.RemoveAt(State.RecentAuctions.Count - 1);
                }

                State.CurrentAuctionItem = GetNextAuctionItem();
                State.CurrentAuctionDescription = "Aktif müzayede ürünü. Açık artırma süresi boyunca en yüksek teklif sahibine gider.";
                State.HighestBid = 20000;
                State.HighestBidder = "Galaktik Otorite";
                State.AuctionEndTimeUtc = now.AddMinutes(25);
            }

            int scrapperRate = 35;
            bool dailyContainerPurchased = false;

            if (planetId.HasValue)
            {
                var planet = await dbContext.Planets.AsNoTracking().FirstOrDefaultAsync(p => p.Id == planetId.Value, cancellationToken);
                if (planet is not null)
                {
                    scrapperRate = State.UserScrapperRates.GetValueOrDefault(planet.UserId, 35);
                    if (State.UserLastImportExportPurchaseUtc.TryGetValue(planet.UserId, out var lastUtc))
                    {
                        dailyContainerPurchased = lastUtc.Date == now.Date;
                    }
                }
            }

            return Results.Ok(new
            {
                Auction = new
                {
                    ItemName = State.CurrentAuctionItem,
                    Description = State.CurrentAuctionDescription,
                    State.HighestBid,
                    State.HighestBidder,
                    EndTimeUtc = State.AuctionEndTimeUtc.ToString("O"),
                    RemainingSeconds = Math.Max(0, (int)(State.AuctionEndTimeUtc - now).TotalSeconds),
                    RecentAuctions = State.RecentAuctions.Take(5).Select(a => new
                    {
                        a.ItemName,
                        a.WinnerName,
                        a.WinningBid,
                        WonAtUtc = a.WonAtUtc.ToString("O")
                    })
                },
                Scrapper = new
                {
                    ScrapRatePercent = scrapperRate,
                    BargainCostDarkMatter = 2000
                },
                ImportExport = new
                {
                    ItemName = State.DailyContainerItem,
                    RequiredValuation = State.DailyContainerRequiredPoints,
                    AlreadyPurchasedToday = dailyContainerPurchased
                }
            });
        })
        .WithName("GetMerchantStatus");

        // POST /api/merchant/summon
        group.MapPost("/summon", async (
            SummonMerchantRequest? request,
            IApplicationDbContext dbContext,
            IHubContext<GameHub> hubContext,
            CancellationToken cancellationToken) =>
        {
            var user = request?.UserId.HasValue == true
                ? await dbContext.Users.FirstOrDefaultAsync(u => u.Id == request.UserId.Value, cancellationToken)
                : await dbContext.Users.OrderBy(u => u.CreatedAtUtc).FirstOrDefaultAsync(cancellationToken);

            if (user is null)
            {
                return Results.NotFound(new { Message = "Kullanıcı bulunamadı." });
            }

            // Hook Directive 7 Quest 4
            var d7Progress = await dbContext.UserTutorialProgresses
                .FirstOrDefaultAsync(prog => prog.UserId == user.Id && prog.DirectiveId == 7, cancellationToken);
            if (d7Progress != null && d7Progress.CurrentQuestStep == 4)
            {
                d7Progress.SubStepBitmask = DirectiveMoreTipsFormulas.ProcessEvent(4, d7Progress.SubStepBitmask, "merchant_summoned");
                d7Progress.UpdatedAtUtc = DateTime.UtcNow;
                await dbContext.SaveChangesAsync(cancellationToken);

                await hubContext.Clients.User(user.Id.ToString()).SendAsync("TutorialProgressUpdated", new
                {
                    UserId = user.Id,
                    d7Progress.DirectiveId,
                    d7Progress.CurrentQuestStep,
                    d7Progress.SubStepBitmask
                }, cancellationToken);
            }

            return Results.Ok(new
            {
                Success = true,
                Message = "Hammadde Tüccarı başarıyla çağrıldı. Yeni takas kurları aktif.",
                ExchangeRates = new
                {
                    Metal = 3.0,
                    Crystal = 2.0,
                    Deuterium = 1.0
                }
            });
        })
        .WithName("SummonMerchant");

        // 2. POST /api/merchant/trade
        group.MapPost("/trade", async (
            MerchantTradeRequest request,
            IApplicationDbContext dbContext,
            IResourceCalculationService resourceService,
            IDistributedLockService lockService,
            CancellationToken cancellationToken) =>
        {
            string lockKey = $"lock:planet:{request.PlanetId}";
            await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

            var planet = await dbContext.Planets.FirstOrDefaultAsync(p => p.Id == request.PlanetId, cancellationToken);
            if (planet is null)
            {
                return Results.NotFound(new { Message = "Gezegen bulunamadı." });
            }

            var now = DateTime.UtcNow;
            resourceService.ApplyLazyUpdate(planet, now);

            if (planet.Metal < request.SpentMetal ||
                planet.Crystal < request.SpentCrystal ||
                planet.Deuterium < request.SpentDeuterium)
            {
                return Results.BadRequest(new { Message = "Takas için yetersiz hammadde." });
            }

            double gainedAmount = MerchantFormulas.CalculateTradeOutput(
                request.TargetResource,
                request.SpentMetal,
                request.SpentCrystal,
                request.SpentDeuterium);

            if (gainedAmount <= 0)
            {
                return Results.BadRequest(new { Message = "Geçersiz hedef kaynak türü veya sıfır miktar." });
            }

            planet.Metal -= request.SpentMetal;
            planet.Crystal -= request.SpentCrystal;
            planet.Deuterium -= request.SpentDeuterium;

            switch (request.TargetResource.ToLowerInvariant())
            {
                case "metal":
                    planet.Metal += gainedAmount;
                    break;
                case "crystal":
                    planet.Crystal += gainedAmount;
                    break;
                case "deuterium":
                    planet.Deuterium += gainedAmount;
                    break;
            }

            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Ok(new
            {
                Message = "Takas başarıyla gerçekleşti.",
                GainedResource = request.TargetResource,
                GainedAmount = Math.Floor(gainedAmount),
                CurrentMetal = Math.Floor(planet.Metal),
                CurrentCrystal = Math.Floor(planet.Crystal),
                CurrentDeuterium = Math.Floor(planet.Deuterium)
            });
        })
        .WithName("ExecuteMerchantTrade");

        // 3. POST /api/merchant/buy-resources
        group.MapPost("/buy-resources", async (
            BuyResourcePackRequest request,
            IApplicationDbContext dbContext,
            IResourceCalculationService resourceService,
            IDistributedLockService lockService,
            CancellationToken cancellationToken) =>
        {
            string lockKey = $"lock:planet:{request.PlanetId}";
            await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

            var planet = await dbContext.Planets
                .Include(p => p.User)
                .Include(p => p.Buildings)
                .FirstOrDefaultAsync(p => p.Id == request.PlanetId, cancellationToken);

            if (planet is null || planet.User is null)
            {
                return Results.NotFound(new { Message = "Gezegen veya kullanıcı bulunamadı." });
            }

            var now = DateTime.UtcNow;
            resourceService.ApplyLazyUpdate(planet, now);
            var res = resourceService.GetCurrentResources(planet, now);

            // 1-day (24h) production amounts
            double dailyMetal = Math.Max(50000, res.MetalPerHour * 24);
            double dailyCrystal = Math.Max(30000, res.CrystalPerHour * 24);
            double dailyDeut = Math.Max(10000, res.DeuteriumPerHour * 24);

            int costDm = request.PackType.ToLowerInvariant() switch
            {
                "metal" => 5000,
                "crystal" => 5000,
                "deuterium" => 5000,
                "all" => 12000,
                _ => 5000
            };

            if (planet.User.DarkMatter < costDm)
            {
                return Results.BadRequest(new { Message = $"Yetersiz Karanlık Madde. Gereken: {costDm} KM, Mevcut: {planet.User.DarkMatter} KM." });
            }

            planet.User.DarkMatter -= costDm;

            switch (request.PackType.ToLowerInvariant())
            {
                case "metal":
                    planet.Metal += dailyMetal;
                    break;
                case "crystal":
                    planet.Crystal += dailyCrystal;
                    break;
                case "deuterium":
                    planet.Deuterium += dailyDeut;
                    break;
                case "all":
                    planet.Metal += dailyMetal;
                    planet.Crystal += dailyCrystal;
                    planet.Deuterium += dailyDeut;
                    break;
            }

            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Ok(new
            {
                Message = "Hammadde paketi başarıyla satın alındı.",
                RemainingDarkMatter = planet.User.DarkMatter,
                CurrentMetal = Math.Floor(planet.Metal),
                CurrentCrystal = Math.Floor(planet.Crystal),
                CurrentDeuterium = Math.Floor(planet.Deuterium)
            });
        })
        .WithName("BuyResourcePack");

        // 4. POST /api/merchant/auction/bid
        group.MapPost("/auction/bid", async (
            AuctionBidRequest request,
            IApplicationDbContext dbContext,
            IResourceCalculationService resourceService,
            IDistributedLockService lockService,
            CancellationToken cancellationToken) =>
        {
            string lockKey = $"lock:planet:{request.PlanetId}";
            await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

            var planet = await dbContext.Planets
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.Id == request.PlanetId, cancellationToken);

            if (planet is null || planet.User is null)
            {
                return Results.NotFound(new { Message = "Gezegen veya kullanıcı bulunamadı." });
            }

            var now = DateTime.UtcNow;
            resourceService.ApplyLazyUpdate(planet, now);

            if (planet.Metal < request.MetalBid ||
                planet.Crystal < request.CrystalBid ||
                planet.Deuterium < request.DeuteriumBid)
            {
                return Results.BadRequest(new { Message = "Teklif vermek için yetersiz hammadde." });
            }

            if (request.HonorPointsBid > 0 && (planet.User.HonorPoints < request.HonorPointsBid || request.HonorPointsBid < 0))
            {
                return Results.BadRequest(new { Message = "Teklif vermek için yetersiz onur puanı." });
            }

            // TotalBid = (Metal * 1) + (Crystal * 1.5) + (Deut * 3) + (HonorPoints * 100)
            double effectiveBid = HonorAndRetreatFormulas.CalculateAuctionBidValue(
                request.MetalBid,
                request.CrystalBid,
                request.DeuteriumBid,
                request.HonorPointsBid);

            if (effectiveBid <= State.HighestBid)
            {
                return Results.BadRequest(new { Message = $"Teklif mevcut en yüksek tekliften ({State.HighestBid:N0}) büyük olmalıdır. Sizin teklifiniz: {effectiveBid:N0}." });
            }

            // Deduct non-refundable bid
            planet.Metal -= request.MetalBid;
            planet.Crystal -= request.CrystalBid;
            planet.Deuterium -= request.DeuteriumBid;
            if (request.HonorPointsBid > 0)
            {
                planet.User.HonorPoints -= request.HonorPointsBid;
            }

            State.HighestBid = effectiveBid;
            State.HighestBidder = planet.User.Username;

            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Ok(new
            {
                Message = "Teklifiniz başarıyla kaydedildi!",
                State.HighestBid,
                State.HighestBidder,
                CurrentMetal = Math.Floor(planet.Metal),
                CurrentCrystal = Math.Floor(planet.Crystal),
                CurrentDeuterium = Math.Floor(planet.Deuterium),
                CurrentHonorPoints = planet.User.HonorPoints
            });
        })
        .WithName("SubmitAuctionBid");

        // 5. POST /api/merchant/scrapper/bargain
        group.MapPost("/scrapper/bargain", async (
            ScrapperBargainRequest request,
            IApplicationDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var planet = await dbContext.Planets
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.Id == request.PlanetId, cancellationToken);

            if (planet is null || planet.User is null)
            {
                return Results.NotFound(new { Message = "Gezegen bulunamadı." });
            }

            if (planet.User.DarkMatter < 2000)
            {
                return Results.BadRequest(new { Message = "Pazarlık için 2.000 Karanlık Madde gereklidir." });
            }

            planet.User.DarkMatter -= 2000;

            int currentRate = State.UserScrapperRates.GetValueOrDefault(planet.UserId, 35);
            int newRate = Math.Min(75, Math.Max(currentRate + 5, Random.Shared.Next(45, 76)));
            State.UserScrapperRates[planet.UserId] = newRate;

            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Ok(new
            {
                Message = $"Hurdacı ile pazarlık başarılı! Yeni geri kazanım oranı: %{newRate}.",
                NewRate = newRate,
                RemainingDarkMatter = planet.User.DarkMatter
            });
        })
        .WithName("ScrapperBargain");

        // 6. POST /api/merchant/scrapper/recycle
        group.MapPost("/scrapper/recycle", async (
            ScrapperRecycleRequest request,
            IApplicationDbContext dbContext,
            IResourceCalculationService resourceService,
            IDistributedLockService lockService,
            CancellationToken cancellationToken) =>
        {
            string lockKey = $"lock:planet:{request.PlanetId}";
            await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

            var planet = await dbContext.Planets
                .Include(p => p.Units)
                .FirstOrDefaultAsync(p => p.Id == request.PlanetId, cancellationToken);

            if (planet is null)
            {
                return Results.NotFound(new { Message = "Gezegen bulunamadı." });
            }

            var now = DateTime.UtcNow;
            resourceService.ApplyLazyUpdate(planet, now);

            int scrapperRate = State.UserScrapperRates.GetValueOrDefault(planet.UserId, 35);
            double rateMultiplier = scrapperRate / 100.0;

            double totalYieldMetal = 0;
            double totalYieldCrystal = 0;
            double totalYieldDeut = 0;

            foreach (var (unitTypeId, count) in request.Units)
            {
                if (count <= 0) continue;

                var unit = planet.Units.FirstOrDefault(u => (int)u.UnitType == unitTypeId);
                if (unit is null || unit.Count < count)
                {
                    return Results.BadRequest(new { Message = $"Yetersiz ünite: Ünite #{unitTypeId} için mevcut: {unit?.Count ?? 0}, istenen: {count}." });
                }

                unit.Count -= count;

                var scrapYield = MerchantFormulas.CalculateScrapYield((UnitType)unitTypeId, count, scrapperRate);
                totalYieldMetal += scrapYield.Metal;
                totalYieldCrystal += scrapYield.Crystal;
                totalYieldDeut += scrapYield.Deuterium;
            }

            // Remove zero count units
            var zeroUnits = planet.Units.Where(u => u.Count <= 0).ToList();
            foreach (var zu in zeroUnits)
            {
                dbContext.PlanetUnits.Remove(zu);
            }

            planet.Metal += totalYieldMetal;
            planet.Crystal += totalYieldCrystal;
            planet.Deuterium += totalYieldDeut;

            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Ok(new
            {
                Message = "Seçilen filolar/savunmalar başarıyla hurdaya dönüştürüldü.",
                ScrappedMetal = Math.Floor(totalYieldMetal),
                ScrappedCrystal = Math.Floor(totalYieldCrystal),
                ScrappedDeuterium = Math.Floor(totalYieldDeut),
                CurrentMetal = Math.Floor(planet.Metal),
                CurrentCrystal = Math.Floor(planet.Crystal),
                CurrentDeuterium = Math.Floor(planet.Deuterium)
            });
        })
        .WithName("ScrapperRecycle");

        // 7. POST /api/merchant/import-export/buy
        group.MapPost("/import-export/buy", async (
            ImportExportBuyRequest request,
            IApplicationDbContext dbContext,
            IResourceCalculationService resourceService,
            IDistributedLockService lockService,
            CancellationToken cancellationToken) =>
        {
            string lockKey = $"lock:planet:{request.PlanetId}";
            await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

            var planet = await dbContext.Planets
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.Id == request.PlanetId, cancellationToken);

            if (planet is null || planet.User is null)
            {
                return Results.NotFound(new { Message = "Gezegen bulunamadı." });
            }

            var now = DateTime.UtcNow;
            if (State.UserLastImportExportPurchaseUtc.TryGetValue(planet.UserId, out var lastUtc) && lastUtc.Date == now.Date)
            {
                return Results.BadRequest(new { Message = "Bugün için zaten bir Günün Ürünü konteyneri satın aldınız. Yarın (00:00 UTC) tekrar deneyin." });
            }

            resourceService.ApplyLazyUpdate(planet, now);

            if (planet.Metal < request.PaidMetal ||
                planet.Crystal < request.PaidCrystal ||
                planet.Deuterium < request.PaidDeuterium)
            {
                return Results.BadRequest(new { Message = "Ödeme için yetersiz hammadde." });
            }

            // TotalValuation = (Metal * 1) + (Crystal * 1.5) + (Deut * 3)
            double paidValuation = (request.PaidMetal * 1.0) + (request.PaidCrystal * 1.5) + (request.PaidDeuterium * 3.0);
            if (paidValuation < State.DailyContainerRequiredPoints)
            {
                return Results.BadRequest(new { Message = $"Yetersiz ödeme. Gereken değer: {State.DailyContainerRequiredPoints:N0}, Ödenen: {paidValuation:N0}." });
            }

            planet.Metal -= request.PaidMetal;
            planet.Crystal -= request.PaidCrystal;
            planet.Deuterium -= request.PaidDeuterium;

            State.UserLastImportExportPurchaseUtc[planet.UserId] = now;

            // Random daily prize
            var rewards = new[]
            {
                "Gümüş Metal Güçlendirici (+%20 / 7 Gün)",
                "Altın Kristal Güçlendirici (+%30 / 7 Gün)",
                "Kraken Yeni Nesil (İnşaat Hızlandırıcı)",
                "Newtron Yeni Nesil (Tersane Hızlandırıcı)",
                "Detroid Yeni Nesil (Genel Üretim Hızlandırıcı)",
                "1,500 Karanlık Madde Ödülü"
            };
            string wonReward = rewards[Random.Shared.Next(rewards.Length)];

            if (wonReward.Contains("Karanlık Madde"))
            {
                planet.User.DarkMatter += 1500;
            }

            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Ok(new
            {
                Message = "Konteyner başarıyla açıldı!",
                WonReward = wonReward,
                CurrentMetal = Math.Floor(planet.Metal),
                CurrentCrystal = Math.Floor(planet.Crystal),
                CurrentDeuterium = Math.Floor(planet.Deuterium),
                DarkMatter = planet.User.DarkMatter
            });
        })
        .WithName("BuyImportExportContainer");

        return app;
    }

    private static string GetNextAuctionItem()
    {
        var items = new[]
        {
            "Altın Metal Güçlendirici (+%30 / 7 Gün)",
            "Gümüş Kristal Güçlendirici (+%20 / 7 Gün)",
            "Platin Deuterium Güçlendirici (+%40 / 7 Gün)",
            "Yeni Nesil Kraken (Bina inşaatını 2 saat kısaltır)",
            "Yeni Nesil Newtron (Tersane üretimini 2 saat kısaltır)",
            "Yeni Nesil Detroid (Tesis yükseltmesini 2 saat kısaltır)"
        };
        return items[Random.Shared.Next(items.Length)];
    }
}

