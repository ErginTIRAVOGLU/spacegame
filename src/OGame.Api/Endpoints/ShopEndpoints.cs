using System.Collections.Concurrent;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using OGame.Api.Hubs;
using OGame.Application.Common.Interfaces;
using OGame.Application.Interfaces;
using OGame.Domain.Entities;
using OGame.Domain.Enums;
using OGame.Domain.Services;

namespace OGame.Api.Endpoints;

public record ActivatePlayerClassRequest(
    Guid? UserId,
    PlayerClass TargetClass);

public record PurchaseShopItemRequest(
    Guid? UserId,
    string ItemKey,
    int Quantity = 1);

public record ActivateInventoryItemRequest(
    Guid? UserId,
    Guid? InventoryItemId,
    string? ItemKey,
    Guid PlanetId,
    string? TargetType = null);

public record BuyAndActivateShopItemRequest(
    Guid? UserId,
    string? ItemKey,
    Guid PlanetId,
    Guid? ItemId = null);

public record PurchaseAndActivateBoosterRequest(
    string ItemCode,
    Guid PlanetId,
    Guid? UserId = null);

public record PurchaseMonthlyOfficerRequest(
    string OfficerType,
    Guid? UserId = null);

public record Purchase90dBoosterRequest(
    string ItemCode,
    Guid PlanetId,
    Guid? UserId = null);

public record PurchaseQuarterlyOfficerRequest(
    string OfficerType,
    Guid? UserId = null);

public record StartRelocationRequest(
    Guid PlanetId,
    int TargetGalaxy,
    int TargetSystem,
    int TargetSlot,
    Guid? UserId = null);

public record CancelRelocationRequest(
    Guid PlanetId,
    Guid? UserId = null);

public record CompleteRelocationRequest(
    Guid PlanetId,
    Guid? UserId = null,
    bool ForceInstant = false);

public record ChangePlayerNameRequest(
    string NewUsername,
    Guid? UserId = null);

public record BuyCosmeticRequest(
    string CosmeticType,
    string CosmeticId,
    Guid? UserId = null);

public record EquipCosmeticsRequest(
    string? ActiveAvatar,
    string? ActiveTitle,
    Guid? UserId = null);

public record BuyBundleRequest(
    string BundleId,
    Guid PlanetId,
    Guid? UserId = null);

public record BuySpecialResourcePackRequest(
    Guid PlanetId,
    Guid? UserId = null);

public static class ShopEndpoints
{
    public class ActivePlanetRelocationState
    {
        public Guid PlanetId { get; set; }
        public Guid UserId { get; set; }
        public int TargetGalaxy { get; set; }
        public int TargetSystem { get; set; }
        public int TargetSlot { get; set; }
        public DateTime StartTimeUtc { get; set; }
        public DateTime EndTimeUtc { get; set; }
        public int CostDarkMatter { get; set; }
    }

    public class UserCosmeticProfileState
    {
        public string ActiveAvatar { get; set; } = "avatar_cadet";
        public string ActiveTitle { get; set; } = "title_commander";
        public HashSet<string> UnlockedAvatars { get; set; } = new(StringComparer.OrdinalIgnoreCase) { "avatar_cadet", "avatar_pilot" };
        public HashSet<string> UnlockedTitles { get; set; } = new(StringComparer.OrdinalIgnoreCase) { "title_commander" };
    }

    public static readonly ConcurrentDictionary<Guid, ActivePlanetRelocationState> RelocationsStore = new();
    public static readonly ConcurrentDictionary<Guid, DateTime> PlanetCooldownsStore = new();
    public static readonly ConcurrentDictionary<Guid, UserCosmeticProfileState> UserCosmeticsStore = new();

    public static IEndpointRouteBuilder MapShopEndpoints(this IEndpointRouteBuilder app)
    {
        var shopGroup = app.MapGroup("/api/shop")
            .WithTags("Shop");

        var inventoryGroup = app.MapGroup("/api/inventory")
            .WithTags("Inventory");

        // ----------------------------------------------------
        // SHOP: PLAYER CLASSES
        // ----------------------------------------------------
        shopGroup.MapGet("/classes", async (
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

            var currentClass = user.PlayerClass;
            var currentPerks = PlayerClassFormulas.GetPerks(currentClass);

            var catalog = new[]
            {
                PlayerClassFormulas.GetPerks(PlayerClass.Collector),
                PlayerClassFormulas.GetPerks(PlayerClass.General),
                PlayerClassFormulas.GetPerks(PlayerClass.Discoverer)
            }.Select(p => new
            {
                ClassId = (int)p.PlayerClass,
                Key = p.PlayerClass.ToString().ToLowerInvariant(),
                p.Name,
                p.TargetAudience,
                p.BaseCostDarkMatter,
                p.DiscountCostDarkMatter,
                p.IsDiscountActive,
                EffectiveCostDarkMatter = p.IsDiscountActive ? p.DiscountCostDarkMatter : p.BaseCostDarkMatter,
                Perks = p.LorePerks,
                Multipliers = new
                {
                    p.MineProductionMultiplier,
                    p.EnergyProductionMultiplier,
                    p.TransportSpeedMultiplier,
                    p.CombatSpeedMultiplier,
                    p.RecyclerSpeedMultiplier,
                    p.ExtraFleetSlots,
                    p.ExtraExpeditionSlots,
                    p.ExpeditionYieldMultiplier,
                    p.InactivePlunderRatio,
                    p.ResearchDurationMultiplier
                },
                IsActive = p.PlayerClass == currentClass
            }).ToList();

            return Results.Ok(new
            {
                User = new
                {
                    user.Id,
                    user.Username,
                    user.DarkMatter,
                    PlayerClass = currentClass.ToString(),
                    PlayerClassId = (int)currentClass
                },
                CurrentClass = new
                {
                    ClassId = (int)currentClass,
                    Key = currentClass.ToString().ToLowerInvariant(),
                    currentPerks.Name,
                    currentPerks.TargetAudience,
                    Perks = currentPerks.LorePerks
                },
                Catalog = catalog
            });
        })
        .WithName("GetShopClasses");

        shopGroup.MapPost("/classes/activate", async (
            ActivatePlayerClassRequest request,
            IApplicationDbContext dbContext,
            IDistributedLockService lockService,
            CancellationToken cancellationToken) =>
        {
            if (request.TargetClass is not (PlayerClass.Collector or PlayerClass.General or PlayerClass.Discoverer))
            {
                return Results.BadRequest(new { Message = "Geçersiz sınıf seçimi. Yalnızca Kolektör, General veya Kaşif seçilebilir." });
            }

            var user = request.UserId.HasValue
                ? await dbContext.Users.FirstOrDefaultAsync(u => u.Id == request.UserId.Value, cancellationToken)
                : await dbContext.Users.OrderBy(u => u.CreatedAtUtc).FirstOrDefaultAsync(cancellationToken);

            if (user is null)
            {
                return Results.NotFound(new { Message = "Kullanıcı bulunamadı." });
            }

            if (user.IsBanned)
            {
                return Results.BadRequest(new { Message = "Yasaklanmış hesaplar sınıf değiştiremez." });
            }

            string lockKey = $"lock:user:{user.Id}";
            await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

            if (user.PlayerClass == request.TargetClass)
            {
                return Results.BadRequest(new
                {
                    Success = false,
                    Message = $"{request.TargetClass} sınıfı zaten hesabınızda aktif."
                });
            }

            const int costKm = PlayerClassFormulas.BaseClassChangeCost;
            if (user.DarkMatter < costKm)
            {
                return Results.BadRequest(new
                {
                    Success = false,
                    Message = $"Yetersiz Karanlık Madde! Sınıf değiştirmek için {costKm:N0} KM gereklidir. (Mevcut: {user.DarkMatter:N0} KM)"
                });
            }

            user.DarkMatter -= costKm;
            user.PlayerClass = request.TargetClass;

            // Directive 7 Quest 3 hook (Player Class selected)
            var d7Progress = await dbContext.UserTutorialProgresses
                .FirstOrDefaultAsync(prog => prog.UserId == user.Id && prog.DirectiveId == 7, cancellationToken);
            if (d7Progress != null && d7Progress.CurrentQuestStep == 3)
            {
                d7Progress.SubStepBitmask = DirectiveMoreTipsFormulas.ProcessEvent(3, d7Progress.SubStepBitmask, "character_class_selected");
                d7Progress.UpdatedAtUtc = DateTime.UtcNow;
            }

            await dbContext.SaveChangesAsync(cancellationToken);

            var perks = PlayerClassFormulas.GetPerks(user.PlayerClass);
            return Results.Ok(new
            {
                Success = true,
                PlayerClass = user.PlayerClass.ToString(),
                PlayerClassId = (int)user.PlayerClass,
                ClassName = perks.Name,
                RemainingDarkMatter = user.DarkMatter,
                Message = $"{perks.Name} sınıfı başarıyla satın alındı ve aktif edildi!"
            });
        })
        .WithName("ActivatePlayerClass");

        // ----------------------------------------------------
        // SHOP: MASTER CATALOG (PAGINATED 3x3 WITH EXACT COUNTERS)
        // ----------------------------------------------------
        shopGroup.MapGet("/catalog", async (
            string? category,
            int? page,
            int? pageSize,
            Guid? planetId,
            Guid? userId,
            IApplicationDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var user = userId.HasValue
                ? await dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId.Value, cancellationToken)
                : await dbContext.Users.OrderBy(u => u.CreatedAtUtc).FirstOrDefaultAsync(cancellationToken);

            Planet? planet = null;
            if (planetId.HasValue && planetId.Value != Guid.Empty)
            {
                planet = await dbContext.Planets
                    .Include(p => p.Buildings)
                    .FirstOrDefaultAsync(p => p.Id == planetId.Value, cancellationToken);
            }
            else if (user is not null)
            {
                planet = await dbContext.Planets
                    .Include(p => p.Buildings)
                    .FirstOrDefaultAsync(p => p.UserId == user.Id, cancellationToken);
            }

            var categoryItems = ShopMasterCatalogFormulas.GetItemsByCategory(category);
            int p = Math.Max(1, page ?? 1);
            int size = Math.Clamp(pageSize ?? 9, 1, 30);
            int totalCount = categoryItems.Count;
            int totalPages = Math.Max(1, (int)Math.Ceiling((double)totalCount / size));
            if (p > totalPages) p = totalPages;

            var pagedItems = categoryItems
                .Skip((p - 1) * size)
                .Take(size)
                .ToList();

            Dictionary<string, int> ownedMap = new(StringComparer.OrdinalIgnoreCase);
            Dictionary<string, int> inventoryCategoryCounts = new(StringComparer.OrdinalIgnoreCase)
            {
                ["limited"] = 0,
                ["special"] = 0,
                ["classes"] = 0,
                ["construction"] = 0,
                ["resources"] = 0,
                ["boosters-30d"] = 0,
                ["boosters-90d"] = 0,
                ["profile"] = 0,
                ["all"] = 0
            };

            if (user is not null)
            {
                var inventoryItems = await dbContext.UserInventoryItems
                    .Where(i => i.UserId == user.Id && i.Quantity > 0)
                    .ToListAsync(cancellationToken);

                foreach (var invItem in inventoryItems)
                {
                    ownedMap[invItem.ItemKey] = ownedMap.GetValueOrDefault(invItem.ItemKey) + invItem.Quantity;
                    inventoryCategoryCounts["all"] += invItem.Quantity;

                    var masterDef = ShopMasterCatalogFormulas.FindItem(invItem.ItemKey);
                    if (masterDef != null)
                    {
                        foreach (var cat in masterDef.Categories)
                        {
                            if (inventoryCategoryCounts.ContainsKey(cat))
                            {
                                inventoryCategoryCounts[cat] += invItem.Quantity;
                            }
                        }
                        if (masterDef.Duration.Contains("Gün", StringComparison.OrdinalIgnoreCase) ||
                            masterDef.Duration.Contains("Saat", StringComparison.OrdinalIgnoreCase))
                        {
                            inventoryCategoryCounts["limited"] += invItem.Quantity;
                        }
                    }
                    else
                    {
                        string cNorm = ShopMasterCatalogFormulas.NormalizeCategoryKey(invItem.Category);
                        if (inventoryCategoryCounts.ContainsKey(cNorm))
                        {
                            inventoryCategoryCounts[cNorm] += invItem.Quantity;
                        }
                    }
                }
            }

            var itemsDto = pagedItems.Select(item =>
            {
                bool hasOverflow = false;
                string? warning = null;
                if (planet is not null)
                {
                    var overflowRes = ShopMasterCatalogFormulas.CheckStorageOverflow(item, planet);
                    hasOverflow = overflowRes.HasOverflow;
                    warning = overflowRes.WarningMessage;
                }

                return new
                {
                    item.ItemKey,
                    item.Name,
                    item.PrimaryCategory,
                    item.Categories,
                    item.Tier,
                    item.Duration,
                    item.DurationDays,
                    item.EffectValue,
                    item.BaseCostDarkMatter,
                    item.DiscountCostDarkMatter,
                    item.IsDiscountActive,
                    item.EffectiveCostDarkMatter,
                    item.Description,
                    item.TargetSummary,
                    item.IconKey,
                    item.MetalAmount,
                    item.CrystalAmount,
                    item.DeuteriumAmount,
                    OwnedQuantity = ownedMap.GetValueOrDefault(item.ItemKey, 0),
                    HasStorageOverflow = hasOverflow,
                    StorageWarning = warning
                };
            }).ToList();

            return Results.Ok(new
            {
                Category = string.IsNullOrWhiteSpace(category) ? "all" : ShopMasterCatalogFormulas.NormalizeCategoryKey(category),
                CurrentPage = p,
                PageSize = size,
                TotalCount = totalCount,
                TotalPages = totalPages,
                CategoryCounts = ShopMasterCatalogFormulas.GetCategoryCounts(),
                InventoryCategoryCounts = inventoryCategoryCounts,
                DarkMatter = user?.DarkMatter ?? 0,
                PlanetId = planet?.Id,
                Items = itemsDto
            });
        })
        .WithName("GetShopCatalogPaged");

        // ----------------------------------------------------
        // SHOP: UNIFIED FULL CATALOG (71+ ITEMS)
        // ----------------------------------------------------
        shopGroup.MapGet("/items", async (
            string? category,
            string? tier,
            Guid? userId,
            IApplicationDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var user = userId.HasValue
                ? await dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId.Value, cancellationToken)
                : await dbContext.Users.OrderBy(u => u.CreatedAtUtc).FirstOrDefaultAsync(cancellationToken);

            // Merge full canonical catalog with construction field expanders
            var catalog = GetAllUnifiedCatalog();

            if (!string.IsNullOrWhiteSpace(category) && !category.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                if (category.Equals("construction", StringComparison.OrdinalIgnoreCase))
                {
                    catalog = catalog.Where(i => i.Category.Equals("construction", StringComparison.OrdinalIgnoreCase) ||
                                                 i.Category.Equals("field", StringComparison.OrdinalIgnoreCase)).ToList();
                }
                else
                {
                    catalog = catalog.Where(i => i.Category.Equals(category, StringComparison.OrdinalIgnoreCase)).ToList();
                }
            }

            if (!string.IsNullOrWhiteSpace(tier) && !tier.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                catalog = catalog.Where(i => i.Tier.Equals(tier, StringComparison.OrdinalIgnoreCase)).ToList();
            }

            Dictionary<string, int> ownedMap = new(StringComparer.OrdinalIgnoreCase);
            if (user is not null)
            {
                var inventoryItems = await dbContext.UserInventoryItems
                    .Where(i => i.UserId == user.Id && i.Quantity > 0)
                    .ToListAsync(cancellationToken);

                foreach (var item in inventoryItems)
                {
                    ownedMap[item.ItemKey] = ownedMap.GetValueOrDefault(item.ItemKey) + item.Quantity;
                }
            }

            var itemsDto = catalog.Select(i => new
            {
                i.ItemKey,
                i.Name,
                i.Category,
                i.Tier,
                i.DurationDays,
                i.EffectValue,
                i.BaseCostDarkMatter,
                i.DiscountCostDarkMatter,
                i.IsDiscountActive,
                EffectiveCostDarkMatter = i.IsDiscountActive ? i.DiscountCostDarkMatter : i.BaseCostDarkMatter,
                i.Description,
                i.TargetSummary,
                OwnedQuantity = ownedMap.GetValueOrDefault(i.ItemKey, 0)
            }).ToList();

            return Results.Ok(new
            {
                DarkMatter = user?.DarkMatter ?? 0,
                UserId = user?.Id,
                Items = itemsDto,
                TotalCount = itemsDto.Count
            });
        })
        .WithName("GetShopItems");

        // ----------------------------------------------------
        // SHOP: ACTIVE BOOSTERS & BUFFS
        // ----------------------------------------------------
        shopGroup.MapGet("/active-boosters", async (
            Guid planetId,
            IApplicationDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var now = DateTime.UtcNow;
            var boosters = await dbContext.PlanetActiveBoosters
                .Where(b => b.PlanetId == planetId && b.ExpiresAtUtc > now)
                .OrderBy(b => b.ResourceType)
                .Select(b => new
                {
                    b.Id,
                    b.PlanetId,
                    b.ResourceType,
                    b.Multiplier,
                    Percent = (int)(b.Multiplier * 100),
                    b.Tier,
                    b.ItemKey,
                    b.ExpiresAtUtc,
                    RemainingSeconds = Math.Max(0, (b.ExpiresAtUtc - now).TotalSeconds)
                })
                .ToListAsync(cancellationToken);

            return Results.Ok(new { PlanetId = planetId, Boosters = boosters });
        })
        .WithName("GetPlanetActiveBoosters");

        shopGroup.MapGet("/active-buffs", async (
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

            var now = DateTime.UtcNow;
            var buffs = await dbContext.UserActiveBuffs
                .Where(b => b.UserId == user.Id && b.ExpiresAtUtc > now)
                .OrderBy(b => b.BuffType)
                .Select(b => new
                {
                    b.Id,
                    b.UserId,
                    b.BuffType,
                    b.Value,
                    b.Tier,
                    b.ItemKey,
                    b.ExpiresAtUtc,
                    RemainingSeconds = Math.Max(0, (b.ExpiresAtUtc - now).TotalSeconds)
                })
                .ToListAsync(cancellationToken);

            return Results.Ok(new { UserId = user.Id, Buffs = buffs });
        })
        .WithName("GetUserActiveBuffs");

        // ----------------------------------------------------
        // SHOP: 30-DAY BOOSTERS & OFFICERS CATALOG
        // ----------------------------------------------------
        shopGroup.MapGet("/boosters-30d", async (
            Guid? planetId,
            Guid? userId,
            IApplicationDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var user = userId.HasValue
                ? await dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId.Value, cancellationToken)
                : await dbContext.Users.OrderBy(u => u.CreatedAtUtc).FirstOrDefaultAsync(cancellationToken);

            var now = DateTime.UtcNow;

            List<PlanetActiveBooster> activeBoosters = [];
            if (planetId.HasValue)
            {
                activeBoosters = await dbContext.PlanetActiveBoosters
                    .Where(b => b.PlanetId == planetId.Value && b.ExpiresAtUtc > now)
                    .ToListAsync(cancellationToken);
            }

            List<UserOfficer> userOfficers = [];
            if (user is not null)
            {
                userOfficers = await dbContext.UserOfficers
                    .Where(o => o.UserId == user.Id && o.ExpiresAtUtc > now)
                    .ToListAsync(cancellationToken);
            }

            var boosters = MonthlyBoostersFormulas.GetMonthlyBoosters().Select(b =>
            {
                var active = activeBoosters.FirstOrDefault(ab => ab.ResourceType.Equals(b.ResourceType, StringComparison.OrdinalIgnoreCase));
                bool isExactMatch = active is not null && active.ItemKey.Equals(b.ItemCode, StringComparison.OrdinalIgnoreCase);
                bool isDifferentTierActive = active is not null && !isExactMatch;

                return new
                {
                    b.ItemCode,
                    b.Name,
                    b.ResourceType,
                    b.Tier,
                    b.Multiplier,
                    Percent = (int)(b.Multiplier * 100),
                    b.DurationDays,
                    b.CostDarkMatter,
                    b.Description,
                    b.TargetSummary,
                    IsActive = isExactMatch,
                    ActiveDifferentTier = isDifferentTierActive,
                    ActiveDifferentTierPercent = isDifferentTierActive ? (int)(active!.Multiplier * 100) : 0,
                    ActiveRemainingSeconds = active is not null ? Math.Max(0, (int)(active.ExpiresAtUtc - now).TotalSeconds) : 0,
                    ActiveExpiresAtUtc = active?.ExpiresAtUtc
                };
            }).ToList();

            var officers = MonthlyBoostersFormulas.GetMonthlyOfficers().Select(o =>
            {
                bool isActive = false;
                DateTime? expiresAt = null;
                int remainingSecs = 0;

                if (o.OfficerKey.Equals("Staff", StringComparison.OrdinalIgnoreCase))
                {
                    bool allActive = userOfficers.Count(uo => uo.ExpiresAtUtc > now) >= 5;
                    isActive = allActive;
                    if (allActive)
                    {
                        expiresAt = userOfficers.Min(uo => uo.ExpiresAtUtc);
                        remainingSecs = Math.Max(0, (int)(expiresAt.Value - now).TotalSeconds);
                    }
                }
                else
                {
                    OfficerType type = o.OfficerKey switch
                    {
                        "Commander" => OfficerType.Commander,
                        "Admiral" => OfficerType.FleetAdmiral,
                        "Engineer" => OfficerType.Engineer,
                        "Geologist" => OfficerType.Geologist,
                        "Technocrat" => OfficerType.Technocrat,
                        _ => OfficerType.Commander
                    };
                    var match = userOfficers.FirstOrDefault(uo => uo.Type == type);
                    if (match is not null)
                    {
                        isActive = true;
                        expiresAt = match.ExpiresAtUtc;
                        remainingSecs = Math.Max(0, (int)(match.ExpiresAtUtc - now).TotalSeconds);
                    }
                }

                return new
                {
                    o.OfficerKey,
                    o.Name,
                    o.DurationDays,
                    o.CostDarkMatter,
                    o.Description,
                    o.PerksSummary,
                    IsActive = isActive,
                    ExpiresAtUtc = expiresAt,
                    RemainingSeconds = remainingSecs
                };
            }).ToList();

            return Results.Ok(new
            {
                DarkMatter = user?.DarkMatter ?? 0,
                UserId = user?.Id,
                PlanetId = planetId,
                Boosters = boosters,
                Officers = officers
            });
        })
        .WithName("GetShop30DayBoosters");

        // ----------------------------------------------------
        // SHOP: PURCHASE AND ACTIVATE 30-DAY BOOSTER
        // ----------------------------------------------------
        shopGroup.MapPost("/boosters/purchase-and-activate", async (
            PurchaseAndActivateBoosterRequest request,
            IApplicationDbContext dbContext,
            IDistributedLockService lockService,
            IHubContext<GameHub> hubContext,
            CancellationToken cancellationToken) =>
        {
            var planet = await dbContext.Planets.FirstOrDefaultAsync(p => p.Id == request.PlanetId, cancellationToken);
            if (planet is null)
            {
                return Results.NotFound(new { Message = "Hedef gezegen veya ay bulunamadı." });
            }

            if (planet.IsMoon)
            {
                return Results.BadRequest(new { Message = "Hammadde maden güçlendiricileri Aylarda kullanılamaz." });
            }

            var boosterDef = MonthlyBoostersFormulas.FindBooster(request.ItemCode);
            if (boosterDef is null)
            {
                return Results.NotFound(new { Message = $"'{request.ItemCode}' kodlu 30 günlük maden güçlendiricisi bulunamadı." });
            }

            var user = request.UserId.HasValue
                ? await dbContext.Users.FirstOrDefaultAsync(u => u.Id == request.UserId.Value, cancellationToken)
                : await dbContext.Users.FirstOrDefaultAsync(u => u.Id == planet.UserId, cancellationToken);

            if (user is null)
            {
                return Results.NotFound(new { Message = "Kullanıcı bulunamadı." });
            }

            if (user.IsBanned)
            {
                return Results.BadRequest(new { Message = "Yasaklanmış hesaplar güçlendirici satın alamaz." });
            }

            string lockKey = $"lock:planet:{planet.Id}";
            await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

            if (user.DarkMatter < boosterDef.CostDarkMatter)
            {
                return Results.BadRequest(new
                {
                    Success = false,
                    Message = $"Yetersiz Karanlık Madde! Gereken: {boosterDef.CostDarkMatter:N0} KM, Mevcut: {user.DarkMatter:N0} KM."
                });
            }

            user.DarkMatter -= boosterDef.CostDarkMatter;

            var now = DateTime.UtcNow;
            var newExpires = now.AddDays(boosterDef.DurationDays);

            var existing = await dbContext.PlanetActiveBoosters
                .FirstOrDefaultAsync(b => b.PlanetId == planet.Id && b.ResourceType == boosterDef.ResourceType, cancellationToken);

            if (existing is not null)
            {
                existing.Multiplier = boosterDef.Multiplier;
                existing.ExpiresAtUtc = newExpires;
                existing.ItemKey = boosterDef.ItemCode;
                existing.Tier = boosterDef.Tier;
            }
            else
            {
                dbContext.PlanetActiveBoosters.Add(new PlanetActiveBooster
                {
                    Id = Guid.NewGuid(),
                    PlanetId = planet.Id,
                    ResourceType = boosterDef.ResourceType,
                    Multiplier = boosterDef.Multiplier,
                    ExpiresAtUtc = newExpires,
                    ItemKey = boosterDef.ItemCode,
                    Tier = boosterDef.Tier,
                    CreatedAtUtc = now
                });
            }

            await dbContext.SaveChangesAsync(cancellationToken);

            await hubContext.Clients.User(user.Id.ToString()).SendAsync("PlanetUpdated", new
            {
                PlanetId = planet.Id,
                BoosterActive = true,
                boosterDef.ResourceType,
                Multiplier = boosterDef.Multiplier,
                ExpiresAtUtc = newExpires
            }, cancellationToken);

            int percent = (int)(boosterDef.Multiplier * 100);
            return Results.Ok(new
            {
                Success = true,
                ItemCode = boosterDef.ItemCode,
                PlanetId = planet.Id,
                boosterDef.ResourceType,
                Multiplier = boosterDef.Multiplier,
                Percent = percent,
                ExpiresAtUtc = newExpires,
                RemainingDarkMatter = user.DarkMatter,
                Message = $"{planet.Name} üzerinde +%{percent} {boosterDef.ResourceType} Güçlendirici (30 Gün) başarıyla aktif edildi!"
            });
        })
        .WithName("PurchaseAndActivate30DayBooster");

        // ----------------------------------------------------
        // SHOP: PURCHASE MONTHLY OFFICER SUBSCRIPTION
        // ----------------------------------------------------
        shopGroup.MapPost("/officers/purchase-monthly", async (
            PurchaseMonthlyOfficerRequest request,
            IApplicationDbContext dbContext,
            IDistributedLockService lockService,
            IHubContext<GameHub> hubContext,
            CancellationToken cancellationToken) =>
        {
            var officerDef = MonthlyBoostersFormulas.FindOfficer(request.OfficerType);
            if (officerDef is null)
            {
                return Results.NotFound(new { Message = $"'{request.OfficerType}' tanımlı bir 30 günlük subay paketi bulunamadı." });
            }

            var user = request.UserId.HasValue
                ? await dbContext.Users.FirstOrDefaultAsync(u => u.Id == request.UserId.Value, cancellationToken)
                : await dbContext.Users.OrderBy(u => u.CreatedAtUtc).FirstOrDefaultAsync(cancellationToken);

            if (user is null)
            {
                return Results.NotFound(new { Message = "Kullanıcı bulunamadı." });
            }

            if (user.IsBanned)
            {
                return Results.BadRequest(new { Message = "Yasaklanmış hesaplar subay kiralayamaz." });
            }

            string lockKey = $"lock:user:{user.Id}";
            await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

            if (user.DarkMatter < officerDef.CostDarkMatter)
            {
                return Results.BadRequest(new
                {
                    Success = false,
                    Message = $"Yetersiz Karanlık Madde! Gereken: {officerDef.CostDarkMatter:N0} KM, Mevcut: {user.DarkMatter:N0} KM."
                });
            }

            user.DarkMatter -= officerDef.CostDarkMatter;

            var now = DateTime.UtcNow;
            var targetTypes = officerDef.OfficerKey.Equals("Staff", StringComparison.OrdinalIgnoreCase)
                ? new[] { OfficerType.Commander, OfficerType.FleetAdmiral, OfficerType.Engineer, OfficerType.Geologist, OfficerType.Technocrat }
                : new[]
                {
                    officerDef.OfficerKey switch
                    {
                        "Commander" => OfficerType.Commander,
                        "Admiral" => OfficerType.FleetAdmiral,
                        "Engineer" => OfficerType.Engineer,
                        "Geologist" => OfficerType.Geologist,
                        "Technocrat" => OfficerType.Technocrat,
                        _ => OfficerType.Commander
                    }
                };

            foreach (var type in targetTypes)
            {
                var existing = await dbContext.UserOfficers
                    .FirstOrDefaultAsync(o => o.UserId == user.Id && o.Type == type, cancellationToken);

                if (existing is not null)
                {
                    existing.ExpiresAtUtc = MonthlyBoostersFormulas.CalculateExtendedExpiration(existing.ExpiresAtUtc, now, 30);
                }
                else
                {
                    dbContext.UserOfficers.Add(new UserOfficer
                    {
                        Id = Guid.NewGuid(),
                        UserId = user.Id,
                        Type = type,
                        ExpiresAtUtc = now.AddDays(30),
                        HiredAtUtc = now
                    });
                }
            }

            await dbContext.SaveChangesAsync(cancellationToken);

            await hubContext.Clients.User(user.Id.ToString()).SendAsync("UserOfficersUpdated", new { UserId = user.Id }, cancellationToken);
            await hubContext.Clients.User(user.Id.ToString()).SendAsync("OfficerUpdated", new { UserId = user.Id }, cancellationToken);

            return Results.Ok(new
            {
                Success = true,
                OfficerKey = officerDef.OfficerKey,
                OfficerName = officerDef.Name,
                CostDarkMatter = officerDef.CostDarkMatter,
                RemainingDarkMatter = user.DarkMatter,
                Message = $"{officerDef.Name} (30 Gün) başarıyla satın alındı ve aktif edildi!"
            });
        })
        .WithName("PurchaseMonthlyOfficer");

        // ----------------------------------------------------
        // SHOP: 90-DAY (QUARTERLY) BOOSTERS & OFFICERS CATALOG
        // ----------------------------------------------------
        shopGroup.MapGet("/boosters-90d", async (
            Guid? planetId,
            Guid? userId,
            IApplicationDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var user = userId.HasValue
                ? await dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId.Value, cancellationToken)
                : await dbContext.Users.OrderBy(u => u.CreatedAtUtc).FirstOrDefaultAsync(cancellationToken);

            var now = DateTime.UtcNow;

            List<PlanetActiveBooster> activeBoosters = [];
            if (planetId.HasValue)
            {
                activeBoosters = await dbContext.PlanetActiveBoosters
                    .Where(b => b.PlanetId == planetId.Value && b.ExpiresAtUtc > now)
                    .ToListAsync(cancellationToken);
            }

            List<UserOfficer> userOfficers = [];
            if (user is not null)
            {
                userOfficers = await dbContext.UserOfficers
                    .Where(o => o.UserId == user.Id && o.ExpiresAtUtc > now)
                    .ToListAsync(cancellationToken);
            }

            var boosters = QuarterlyBoostersFormulas.GetQuarterlyBoosters().Select(b =>
            {
                var active = activeBoosters.FirstOrDefault(ab => ab.ResourceType.Equals(b.ResourceType, StringComparison.OrdinalIgnoreCase));
                bool isExactMatch = active is not null && active.ItemKey.Equals(b.ItemCode, StringComparison.OrdinalIgnoreCase);
                bool isDifferentTierActive = active is not null && !isExactMatch;

                return new
                {
                    b.ItemCode,
                    b.Name,
                    b.ResourceType,
                    b.Tier,
                    b.Multiplier,
                    Percent = (int)(b.Multiplier * 100),
                    b.DurationDays,
                    b.CostDarkMatter,
                    b.SavingsDarkMatter,
                    b.Description,
                    b.TargetSummary,
                    IsActive = isExactMatch,
                    ActiveDifferentTier = isDifferentTierActive,
                    ActiveDifferentTierPercent = isDifferentTierActive ? (int)(active!.Multiplier * 100) : 0,
                    ActiveRemainingSeconds = active is not null ? Math.Max(0, (int)(active.ExpiresAtUtc - now).TotalSeconds) : 0,
                    ActiveExpiresAtUtc = active?.ExpiresAtUtc
                };
            }).ToList();

            var officers = QuarterlyBoostersFormulas.GetQuarterlyOfficers().Select(o =>
            {
                bool isActive = false;
                DateTime? expiresAt = null;
                int remainingSecs = 0;

                if (o.OfficerKey.Equals("Staff", StringComparison.OrdinalIgnoreCase))
                {
                    bool allActive = userOfficers.Count(uo => uo.ExpiresAtUtc > now) >= 5;
                    isActive = allActive;
                    if (allActive)
                    {
                        expiresAt = userOfficers.Min(uo => uo.ExpiresAtUtc);
                        remainingSecs = Math.Max(0, (int)(expiresAt.Value - now).TotalSeconds);
                    }
                }
                else
                {
                    OfficerType type = o.OfficerKey switch
                    {
                        "Commander" => OfficerType.Commander,
                        "Admiral" => OfficerType.FleetAdmiral,
                        "Engineer" => OfficerType.Engineer,
                        "Geologist" => OfficerType.Geologist,
                        "Technocrat" => OfficerType.Technocrat,
                        _ => OfficerType.Commander
                    };
                    var match = userOfficers.FirstOrDefault(uo => uo.Type == type);
                    if (match is not null)
                    {
                        isActive = true;
                        expiresAt = match.ExpiresAtUtc;
                        remainingSecs = Math.Max(0, (int)(match.ExpiresAtUtc - now).TotalSeconds);
                    }
                }

                return new
                {
                    o.OfficerKey,
                    o.Name,
                    o.DurationDays,
                    o.CostDarkMatter,
                    o.Description,
                    o.PerksSummary,
                    IsActive = isActive,
                    ExpiresAtUtc = expiresAt,
                    RemainingSeconds = remainingSecs
                };
            }).ToList();

            return Results.Ok(new
            {
                DarkMatter = user?.DarkMatter ?? 0,
                UserId = user?.Id,
                PlanetId = planetId,
                Boosters = boosters,
                Officers = officers
            });
        })
        .WithName("GetShop90DayBoosters");

        // ----------------------------------------------------
        // SHOP: PURCHASE AND ACTIVATE 90-DAY BOOSTER
        // ----------------------------------------------------
        shopGroup.MapPost("/boosters/purchase-90d", async (
            Purchase90dBoosterRequest request,
            IApplicationDbContext dbContext,
            IDistributedLockService lockService,
            IHubContext<GameHub> hubContext,
            CancellationToken cancellationToken) =>
        {
            var planet = await dbContext.Planets.FirstOrDefaultAsync(p => p.Id == request.PlanetId, cancellationToken);
            if (planet is null)
            {
                return Results.NotFound(new { Message = "Hedef gezegen veya ay bulunamadı." });
            }

            if (planet.IsMoon)
            {
                return Results.BadRequest(new { Message = "Hammadde maden güçlendiricileri Aylarda kullanılamaz." });
            }

            var boosterDef = QuarterlyBoostersFormulas.FindBooster(request.ItemCode);
            if (boosterDef is null)
            {
                return Results.NotFound(new { Message = $"'{request.ItemCode}' kodlu 90 günlük maden güçlendiricisi bulunamadı." });
            }

            var user = request.UserId.HasValue
                ? await dbContext.Users.FirstOrDefaultAsync(u => u.Id == request.UserId.Value, cancellationToken)
                : await dbContext.Users.FirstOrDefaultAsync(u => u.Id == planet.UserId, cancellationToken);

            if (user is null)
            {
                return Results.NotFound(new { Message = "Kullanıcı bulunamadı." });
            }

            if (user.IsBanned)
            {
                return Results.BadRequest(new { Message = "Yasaklanmış hesaplar güçlendirici satın alamaz." });
            }

            string lockKey = $"lock:planet:{planet.Id}";
            await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

            if (user.DarkMatter < boosterDef.CostDarkMatter)
            {
                return Results.BadRequest(new
                {
                    Success = false,
                    Message = $"Yetersiz Karanlık Madde! Gereken: {boosterDef.CostDarkMatter:N0} KM, Mevcut: {user.DarkMatter:N0} KM."
                });
            }

            user.DarkMatter -= boosterDef.CostDarkMatter;

            var now = DateTime.UtcNow;
            var newExpires = now.AddDays(boosterDef.DurationDays);

            var existing = await dbContext.PlanetActiveBoosters
                .FirstOrDefaultAsync(b => b.PlanetId == planet.Id && b.ResourceType == boosterDef.ResourceType, cancellationToken);

            if (existing is not null)
            {
                existing.Multiplier = boosterDef.Multiplier;
                existing.ExpiresAtUtc = newExpires;
                existing.ItemKey = boosterDef.ItemCode;
                existing.Tier = boosterDef.Tier;
            }
            else
            {
                dbContext.PlanetActiveBoosters.Add(new PlanetActiveBooster
                {
                    Id = Guid.NewGuid(),
                    PlanetId = planet.Id,
                    ResourceType = boosterDef.ResourceType,
                    Multiplier = boosterDef.Multiplier,
                    ExpiresAtUtc = newExpires,
                    ItemKey = boosterDef.ItemCode,
                    Tier = boosterDef.Tier,
                    CreatedAtUtc = now
                });
            }

            await dbContext.SaveChangesAsync(cancellationToken);

            int percent = (int)(boosterDef.Multiplier * 100);
            await hubContext.Clients.User(user.Id.ToString()).SendAsync("PlanetBoosterUpdated", new
            {
                PlanetId = planet.Id,
                boosterDef.ResourceType,
                Multiplier = boosterDef.Multiplier,
                Percent = percent,
                ExpiresAtUtc = newExpires,
                RemainingSeconds = (int)(newExpires - now).TotalSeconds,
                ItemKey = boosterDef.ItemCode,
                Tier = boosterDef.Tier
            }, cancellationToken);

            return Results.Ok(new
            {
                Success = true,
                ItemCode = boosterDef.ItemCode,
                PlanetId = planet.Id,
                boosterDef.ResourceType,
                Multiplier = boosterDef.Multiplier,
                Percent = percent,
                ExpiresAtUtc = newExpires,
                RemainingDarkMatter = user.DarkMatter,
                Message = $"{planet.Name} üzerinde +%{percent} {boosterDef.ResourceType} Güçlendirici (90 Gün) başarıyla aktif edildi!"
            });
        })
        .WithName("PurchaseAndActivate90DayBooster");

        // ----------------------------------------------------
        // SHOP: PURCHASE QUARTERLY OFFICER SUBSCRIPTION
        // ----------------------------------------------------
        shopGroup.MapPost("/officers/purchase-quarterly", async (
            PurchaseQuarterlyOfficerRequest request,
            IApplicationDbContext dbContext,
            IDistributedLockService lockService,
            IHubContext<GameHub> hubContext,
            CancellationToken cancellationToken) =>
        {
            var officerDef = QuarterlyBoostersFormulas.FindOfficer(request.OfficerType);
            if (officerDef is null)
            {
                return Results.NotFound(new { Message = $"'{request.OfficerType}' tanımlı bir 90 günlük subay paketi bulunamadı." });
            }

            var user = request.UserId.HasValue
                ? await dbContext.Users.FirstOrDefaultAsync(u => u.Id == request.UserId.Value, cancellationToken)
                : await dbContext.Users.OrderBy(u => u.CreatedAtUtc).FirstOrDefaultAsync(cancellationToken);

            if (user is null)
            {
                return Results.NotFound(new { Message = "Kullanıcı bulunamadı." });
            }

            if (user.IsBanned)
            {
                return Results.BadRequest(new { Message = "Yasaklanmış hesaplar subay kiralayamaz." });
            }

            string lockKey = $"lock:user:{user.Id}";
            await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

            if (user.DarkMatter < officerDef.CostDarkMatter)
            {
                return Results.BadRequest(new
                {
                    Success = false,
                    Message = $"Yetersiz Karanlık Madde! Gereken: {officerDef.CostDarkMatter:N0} KM, Mevcut: {user.DarkMatter:N0} KM."
                });
            }

            user.DarkMatter -= officerDef.CostDarkMatter;

            var now = DateTime.UtcNow;
            var targetTypes = officerDef.OfficerKey.Equals("Staff", StringComparison.OrdinalIgnoreCase)
                ? new[] { OfficerType.Commander, OfficerType.FleetAdmiral, OfficerType.Engineer, OfficerType.Geologist, OfficerType.Technocrat }
                : new[]
                {
                    officerDef.OfficerKey switch
                    {
                        "Commander" => OfficerType.Commander,
                        "Admiral" => OfficerType.FleetAdmiral,
                        "Engineer" => OfficerType.Engineer,
                        "Geologist" => OfficerType.Geologist,
                        "Technocrat" => OfficerType.Technocrat,
                        _ => OfficerType.Commander
                    }
                };

            foreach (var type in targetTypes)
            {
                var existing = await dbContext.UserOfficers
                    .FirstOrDefaultAsync(o => o.UserId == user.Id && o.Type == type, cancellationToken);

                if (existing is not null)
                {
                    existing.ExpiresAtUtc = QuarterlyBoostersFormulas.CalculateExtendedExpiration(existing.ExpiresAtUtc, now, 90);
                }
                else
                {
                    dbContext.UserOfficers.Add(new UserOfficer
                    {
                        Id = Guid.NewGuid(),
                        UserId = user.Id,
                        Type = type,
                        ExpiresAtUtc = now.AddDays(90),
                        HiredAtUtc = now
                    });
                }
            }

            await dbContext.SaveChangesAsync(cancellationToken);

            await hubContext.Clients.User(user.Id.ToString()).SendAsync("UserOfficersUpdated", new { UserId = user.Id }, cancellationToken);
            await hubContext.Clients.User(user.Id.ToString()).SendAsync("OfficerUpdated", new { UserId = user.Id }, cancellationToken);

            return Results.Ok(new
            {
                Success = true,
                OfficerKey = officerDef.OfficerKey,
                OfficerName = officerDef.Name,
                CostDarkMatter = officerDef.CostDarkMatter,
                RemainingDarkMatter = user.DarkMatter,
                Message = $"{officerDef.Name} (90 Gün) başarıyla satın alındı ve aktif edildi!"
            });
        })
        .WithName("PurchaseQuarterlyOfficer");

        // ----------------------------------------------------
        // SHOP: PURCHASE ITEM TO INVENTORY
        // ----------------------------------------------------
        shopGroup.MapPost("/items/purchase", async (
            PurchaseShopItemRequest request,
            IApplicationDbContext dbContext,
            IDistributedLockService lockService,
            CancellationToken cancellationToken) =>
        {
            if (request.Quantity <= 0)
            {
                return Results.BadRequest(new { Message = "Geçersiz adet. En az 1 adet satın alınmalıdır." });
            }

            var itemDef = FindUnifiedItem(request.ItemKey);
            if (itemDef is null)
            {
                return Results.NotFound(new { Message = $"'{request.ItemKey}' tanımlı bir eşya bulunamadı." });
            }

            var user = request.UserId.HasValue
                ? await dbContext.Users.FirstOrDefaultAsync(u => u.Id == request.UserId.Value, cancellationToken)
                : await dbContext.Users.OrderBy(u => u.CreatedAtUtc).FirstOrDefaultAsync(cancellationToken);

            if (user is null)
            {
                return Results.NotFound(new { Message = "Kullanıcı bulunamadı." });
            }

            if (user.IsBanned)
            {
                return Results.BadRequest(new { Message = "Yasaklanmış hesaplar alışveriş yapamaz." });
            }

            string lockKey = $"lock:user:{user.Id}";
            await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

            int unitCost = itemDef.IsDiscountActive ? itemDef.DiscountCostDarkMatter : itemDef.BaseCostDarkMatter;
            int totalCost = checked(unitCost * request.Quantity);

            if (user.DarkMatter < totalCost)
            {
                return Results.BadRequest(new
                {
                    Success = false,
                    Message = $"Yetersiz Karanlık Madde! Gereken: {totalCost:N0} KM, Mevcut: {user.DarkMatter:N0} KM."
                });
            }

            user.DarkMatter -= totalCost;

            var existingItem = await dbContext.UserInventoryItems
                .FirstOrDefaultAsync(i => i.UserId == user.Id && i.ItemKey == itemDef.ItemKey, cancellationToken);

            if (existingItem is not null)
            {
                existingItem.Quantity += request.Quantity;
            }
            else
            {
                dbContext.UserInventoryItems.Add(new UserInventoryItem
                {
                    Id = Guid.NewGuid(),
                    UserId = user.Id,
                    ItemKey = itemDef.ItemKey,
                    Name = itemDef.Name,
                    Category = itemDef.Category,
                    Tier = itemDef.Tier,
                    EffectValue = itemDef.EffectValue,
                    Quantity = request.Quantity,
                    CreatedAtUtc = DateTime.UtcNow
                });
            }

            await dbContext.SaveChangesAsync(cancellationToken);

            int totalOwned = await dbContext.UserInventoryItems
                .Where(i => i.UserId == user.Id && i.ItemKey == itemDef.ItemKey)
                .SumAsync(i => i.Quantity, cancellationToken);

            return Results.Ok(new
            {
                Success = true,
                ItemKey = itemDef.ItemKey,
                QuantityPurchased = request.Quantity,
                TotalOwned = totalOwned,
                RemainingDarkMatter = user.DarkMatter,
                Message = $"{itemDef.Name} ({request.Quantity} adet) envantere eklendi!"
            });
        })
        .WithName("PurchaseShopItem");

        // ----------------------------------------------------
        // INVENTORY: LIST USER ITEMS
        // ----------------------------------------------------
        inventoryGroup.MapGet("/items", async (
            Guid? userId,
            string? category,
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

            var rawItems = await dbContext.UserInventoryItems
                .Where(i => i.UserId == user.Id && i.Quantity > 0)
                .OrderByDescending(i => i.CreatedAtUtc)
                .ToListAsync(cancellationToken);

            var items = rawItems;
            if (!string.IsNullOrWhiteSpace(category) && !category.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                string catNorm = ShopMasterCatalogFormulas.NormalizeCategoryKey(category);
                items = rawItems.Where(i =>
                {
                    if (i.Category.Equals(catNorm, StringComparison.OrdinalIgnoreCase)) return true;
                    var mDef = ShopMasterCatalogFormulas.FindItem(i.ItemKey);
                    if (mDef != null)
                    {
                        if (mDef.Categories.Contains(catNorm, StringComparer.OrdinalIgnoreCase)) return true;
                        if (catNorm == "limited" && (mDef.Duration.Contains("Gün", StringComparison.OrdinalIgnoreCase) || mDef.Duration.Contains("Saat", StringComparison.OrdinalIgnoreCase)))
                        {
                            return true;
                        }
                    }
                    return false;
                }).ToList();
            }

            var itemsDto = items.Select(item =>
            {
                var def = FindUnifiedItem(item.ItemKey);
                return new
                {
                    item.Id,
                    item.ItemKey,
                    Name = def?.Name ?? item.Name,
                    Category = def?.Category ?? item.Category,
                    Tier = def?.Tier ?? item.Tier,
                    EffectValue = def?.EffectValue ?? item.EffectValue,
                    DurationDays = def?.DurationDays ?? 0,
                    item.Quantity,
                    Description = def?.Description ?? string.Empty,
                    TargetSummary = def?.TargetSummary ?? string.Empty,
                    item.CreatedAtUtc
                };
            }).ToList();

            return Results.Ok(new
            {
                UserId = user.Id,
                DarkMatter = user.DarkMatter,
                Items = itemsDto,
                TotalCount = itemsDto.Sum(i => i.Quantity)
            });
        })
        .WithName("GetUserInventoryItems");

        // ----------------------------------------------------
        // INVENTORY: ACTIVATE ITEM ON PLANET / ACCOUNT
        // ----------------------------------------------------
        inventoryGroup.MapPost("/items/activate", async (
            ActivateInventoryItemRequest request,
            IApplicationDbContext dbContext,
            IBuildingService buildingService,
            IShipyardService shipyardService,
            IResearchService researchService,
            IJobScheduler jobScheduler,
            IDistributedLockService lockService,
            IHubContext<GameHub> hubContext,
            CancellationToken cancellationToken) =>
        {
            var planet = await dbContext.Planets.FirstOrDefaultAsync(p => p.Id == request.PlanetId, cancellationToken);
            if (planet is null)
            {
                return Results.NotFound(new { Message = "Hedef gezegen veya ay bulunamadı." });
            }

            var user = request.UserId.HasValue
                ? await dbContext.Users.FirstOrDefaultAsync(u => u.Id == request.UserId.Value, cancellationToken)
                : await dbContext.Users.FirstOrDefaultAsync(u => u.Id == planet.UserId, cancellationToken);

            if (user is null)
            {
                return Results.NotFound(new { Message = "Kullanıcı bulunamadı." });
            }

            string lockKey = $"lock:planet:{planet.Id}";
            await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

            var invQuery = dbContext.UserInventoryItems
                .Where(i => i.UserId == user.Id && i.Quantity > 0);

            if (request.InventoryItemId.HasValue)
            {
                invQuery = invQuery.Where(i => i.Id == request.InventoryItemId.Value);
            }
            else if (!string.IsNullOrWhiteSpace(request.ItemKey))
            {
                invQuery = invQuery.Where(i => i.ItemKey == request.ItemKey);
            }
            else
            {
                return Results.BadRequest(new { Message = "Kullanılacak eşya belirtilmedi." });
            }

            var inventoryItem = await invQuery.FirstOrDefaultAsync(cancellationToken);
            if (inventoryItem is null)
            {
                return Results.BadRequest(new { Message = "Envanterinizde bu eşyadan bulunmamaktadır." });
            }

            var itemDef = FindUnifiedItem(inventoryItem.ItemKey);
            if (itemDef is null)
            {
                return Results.BadRequest(new { Message = "Geçersiz veya tanımsız eşya." });
            }

            var activationResult = await ExecuteItemEffectAsync(
                itemDef,
                planet,
                user,
                dbContext,
                buildingService,
                shipyardService,
                researchService,
                jobScheduler,
                hubContext,
                cancellationToken);

            if (!activationResult.Success)
            {
                return Results.BadRequest(new { Message = activationResult.Message });
            }

            inventoryItem.Quantity -= 1;
            if (inventoryItem.Quantity <= 0)
            {
                dbContext.UserInventoryItems.Remove(inventoryItem);
            }

            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Ok(new
            {
                Success = true,
                ItemKey = itemDef.ItemKey,
                PlanetId = planet.Id,
                RemainingQuantity = Math.Max(0, inventoryItem.Quantity),
                Message = activationResult.Message,
                activationResult.Details
            });
        })
        .WithName("ActivateInventoryItem");

        // ----------------------------------------------------
        // SHOP: BUY AND ACTIVATE DIRECTLY
        // ----------------------------------------------------
        var handleBuyAndActivate = async (
            BuyAndActivateShopItemRequest request,
            IApplicationDbContext dbContext,
            IBuildingService buildingService,
            IShipyardService shipyardService,
            IResearchService researchService,
            IJobScheduler jobScheduler,
            IDistributedLockService lockService,
            IHubContext<GameHub> hubContext,
            CancellationToken cancellationToken) =>
        {
            var planet = await dbContext.Planets
                .Include(p => p.Buildings)
                .FirstOrDefaultAsync(p => p.Id == request.PlanetId, cancellationToken);

            if (planet is null)
            {
                return Results.NotFound(new { Message = "Hedef gezegen veya ay bulunamadı." });
            }

            var user = request.UserId.HasValue
                ? await dbContext.Users.FirstOrDefaultAsync(u => u.Id == request.UserId.Value, cancellationToken)
                : await dbContext.Users.FirstOrDefaultAsync(u => u.Id == planet.UserId, cancellationToken);

            if (user is null)
            {
                return Results.NotFound(new { Message = "Kullanıcı bulunamadı." });
            }

            string itemKey = request.ItemKey ?? string.Empty;
            if (string.IsNullOrWhiteSpace(itemKey) && request.ItemId.HasValue)
            {
                var inv = await dbContext.UserInventoryItems.FirstOrDefaultAsync(i => i.Id == request.ItemId.Value, cancellationToken);
                itemKey = inv?.ItemKey ?? request.ItemId.Value.ToString();
            }

            if (string.IsNullOrWhiteSpace(itemKey))
            {
                return Results.BadRequest(new { Message = "Geçersiz eşya anahtarı veya kimliği." });
            }

            string lockKey = $"lock:planet:{planet.Id}";
            await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

            var masterDef = ShopMasterCatalogFormulas.FindItem(itemKey);

            // A. Resource Packs with Storage Overflow Handling
            if (masterDef != null && (masterDef.MetalAmount > 0 || masterDef.CrystalAmount > 0 || masterDef.DeuteriumAmount > 0))
            {
                int cost = masterDef.EffectiveCostDarkMatter;
                if (user.DarkMatter < cost)
                {
                    return Results.BadRequest(new
                    {
                        Success = false,
                        Message = $"Yetersiz Karanlık Madde! Gereken: {cost:N0} KM, Mevcut: {user.DarkMatter:N0} KM."
                    });
                }

                int metalStorageLvl = planet.Buildings.FirstOrDefault(b => b.BuildingType == BuildingType.MetalStorage)?.Level ?? 0;
                int crystalStorageLvl = planet.Buildings.FirstOrDefault(b => b.BuildingType == BuildingType.CrystalStorage)?.Level ?? 0;
                int deutTankLvl = planet.Buildings.FirstOrDefault(b => b.BuildingType == BuildingType.DeuteriumTank)?.Level ?? 0;

                double metalCap = ResourceFormulas.CalculateStorageCapacity(metalStorageLvl);
                double crystalCap = ResourceFormulas.CalculateStorageCapacity(crystalStorageLvl);
                double deutCap = ResourceFormulas.CalculateStorageCapacity(deutTankLvl);

                var overflowCheck = ShopMasterCatalogFormulas.CheckStorageOverflow(masterDef, planet);

                planet.Metal = Math.Min(metalCap, planet.Metal + masterDef.MetalAmount);
                planet.Crystal = Math.Min(crystalCap, planet.Crystal + masterDef.CrystalAmount);
                planet.Deuterium = Math.Min(deutCap, planet.Deuterium + masterDef.DeuteriumAmount);
                planet.LastResourceUpdateUtc = DateTime.UtcNow;

                user.DarkMatter -= cost;
                await dbContext.SaveChangesAsync(cancellationToken);

                await hubContext.Clients.User(user.Id.ToString()).SendAsync("PlanetResourcesUpdated", new
                {
                    PlanetId = planet.Id,
                    planet.Metal,
                    planet.Crystal,
                    planet.Deuterium,
                    ServerTimeUtc = DateTime.UtcNow
                }, cancellationToken);

                return Results.Ok(new
                {
                    Success = true,
                    ItemKey = masterDef.ItemKey,
                    PlanetId = planet.Id,
                    RemainingDarkMatter = user.DarkMatter,
                    Message = $"{masterDef.Name} satın alındı ve başarıyla uygulandı!" +
                        (overflowCheck.HasOverflow ? " (Depo kapasitesini aşan madenler sığmadığı için ziyan oldu.)" : ""),
                    HadStorageOverflow = overflowCheck.HasOverflow,
                    StorageCapacities = new { Metal = metalCap, Crystal = crystalCap, Deuterium = deutCap },
                    NewResources = new { planet.Metal, planet.Crystal, planet.Deuterium }
                });
            }

            // B. Class Selection / Change Items
            if (masterDef != null && masterDef.Categories.Contains("classes", StringComparer.OrdinalIgnoreCase))
            {
                PlayerClass targetClass = masterDef.ItemKey switch
                {
                    "class_collector" or "class_change_collector" => PlayerClass.Collector,
                    "class_general" or "class_change_general" => PlayerClass.General,
                    "class_discoverer" or "class_change_discoverer" => PlayerClass.Discoverer,
                    _ => PlayerClass.None
                };

                if (targetClass != PlayerClass.None)
                {
                    int cost = masterDef.EffectiveCostDarkMatter;
                    if (user.DarkMatter < cost)
                    {
                        return Results.BadRequest(new
                        {
                            Success = false,
                            Message = $"Yetersiz Karanlık Madde! Gereken: {cost:N0} KM, Mevcut: {user.DarkMatter:N0} KM."
                        });
                    }

                    user.DarkMatter -= cost;
                    user.PlayerClass = targetClass;
                    await dbContext.SaveChangesAsync(cancellationToken);

                    return Results.Ok(new
                    {
                        Success = true,
                        ItemKey = masterDef.ItemKey,
                        PlanetId = planet.Id,
                        RemainingDarkMatter = user.DarkMatter,
                        Message = $"{masterDef.Name} başarıyla aktif edildi!",
                        PlayerClass = targetClass.ToString()
                    });
                }
            }

            // C. Unified Item Effects (Kraken, Detroid, Newtron, Field, Lifeform, Booster)
            var itemDef = FindUnifiedItem(itemKey);
            if (itemDef is null)
            {
                return Results.NotFound(new { Message = $"'{itemKey}' tanımlı bir eşya bulunamadı." });
            }

            int unitCost = itemDef.IsDiscountActive ? itemDef.DiscountCostDarkMatter : itemDef.BaseCostDarkMatter;
            if (user.DarkMatter < unitCost)
            {
                return Results.BadRequest(new
                {
                    Success = false,
                    Message = $"Yetersiz Karanlık Madde! Gereken: {unitCost:N0} KM, Mevcut: {user.DarkMatter:N0} KM."
                });
            }

            var activationResult = await ExecuteItemEffectAsync(
                itemDef,
                planet,
                user,
                dbContext,
                buildingService,
                shipyardService,
                researchService,
                jobScheduler,
                hubContext,
                cancellationToken);

            if (!activationResult.Success)
            {
                return Results.BadRequest(new { Message = activationResult.Message });
            }

            user.DarkMatter -= unitCost;
            await dbContext.SaveChangesAsync(cancellationToken);

            return Results.Ok(new
            {
                Success = true,
                ItemKey = itemDef.ItemKey,
                PlanetId = planet.Id,
                RemainingDarkMatter = user.DarkMatter,
                Message = $"{itemDef.Name} satın alındı ve başarıyla uygulandı!",
                activationResult.Details
            });
        };

        shopGroup.MapPost("/buy-and-activate", handleBuyAndActivate)
            .WithName("BuyAndActivateShopItemRoot");

        shopGroup.MapPost("/items/buy-and-activate", handleBuyAndActivate)
            .WithName("BuyAndActivateShopItem");

        // ----------------------------------------------------
        // SHOP: PROFILE & CUSTOMIZATION OVERVIEW
        // ----------------------------------------------------
        shopGroup.MapGet("/profile", async (
            Guid? planetId,
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

            var now = DateTime.UtcNow;
            var cosmeticProfile = UserCosmeticsStore.GetOrAdd(user.Id, _ => new UserCosmeticProfileState());

            // Check relocation for planet
            ActivePlanetRelocationState? activeRelocation = null;
            DateTime? cooldownUntil = null;
            if (planetId.HasValue)
            {
                if (RelocationsStore.TryGetValue(planetId.Value, out var rel))
                {
                    activeRelocation = rel;
                }
                if (PlanetCooldownsStore.TryGetValue(planetId.Value, out var cd) && cd > now)
                {
                    cooldownUntil = cd;
                }
            }

            var avatars = ProfileCustomizationFormulas.GetAvatars().Select(a => new
            {
                a.Id,
                a.Name,
                a.CostDarkMatter,
                a.IsDefault,
                a.Description,
                a.IconKey,
                IsUnlocked = a.IsDefault || cosmeticProfile.UnlockedAvatars.Contains(a.Id),
                IsEquipped = cosmeticProfile.ActiveAvatar.Equals(a.Id, StringComparison.OrdinalIgnoreCase)
            }).ToList();

            var titles = ProfileCustomizationFormulas.GetTitles().Select(t => new
            {
                t.Id,
                t.Name,
                t.CostDarkMatter,
                t.IsDefault,
                t.Description,
                t.IconKey,
                IsUnlocked = t.IsDefault || cosmeticProfile.UnlockedTitles.Contains(t.Id),
                IsEquipped = cosmeticProfile.ActiveTitle.Equals(t.Id, StringComparison.OrdinalIgnoreCase)
            }).ToList();

            return Results.Ok(new
            {
                UserId = user.Id,
                user.Username,
                user.Email,
                user.DarkMatter,
                user.TotalPoints,
                PlayerClass = user.PlayerClass.ToString(),
                cosmeticProfile.ActiveAvatar,
                cosmeticProfile.ActiveTitle,
                Avatars = avatars,
                Titles = titles,
                Relocation = new
                {
                    PlanetId = planetId,
                    IsRelocating = activeRelocation is not null,
                    TargetGalaxy = activeRelocation?.TargetGalaxy,
                    TargetSystem = activeRelocation?.TargetSystem,
                    TargetSlot = activeRelocation?.TargetSlot,
                    StartTimeUtc = activeRelocation?.StartTimeUtc,
                    EndTimeUtc = activeRelocation?.EndTimeUtc,
                    RemainingSeconds = activeRelocation is not null ? Math.Max(0, (int)(activeRelocation.EndTimeUtc - now).TotalSeconds) : 0,
                    CostDarkMatter = ProfileCustomizationFormulas.RelocationCostDarkMatter,
                    IsCooldownActive = cooldownUntil.HasValue,
                    CooldownUntilUtc = cooldownUntil,
                    CooldownRemainingSeconds = cooldownUntil.HasValue ? Math.Max(0, (int)(cooldownUntil.Value - now).TotalSeconds) : 0
                }
            });
        })
        .WithName("GetShopProfile");

        // ----------------------------------------------------
        // SHOP: START PLANET RELOCATION
        // ----------------------------------------------------
        shopGroup.MapPost("/relocation/start", async (
            StartRelocationRequest request,
            IApplicationDbContext dbContext,
            IDistributedLockService lockService,
            IHubContext<GameHub> hubContext,
            CancellationToken cancellationToken) =>
        {
            var planet = await dbContext.Planets.FirstOrDefaultAsync(p => p.Id == request.PlanetId, cancellationToken);
            if (planet is null)
            {
                return Results.NotFound(new { Message = "Taşınacak gezegen bulunamadı." });
            }

            if (planet.IsMoon)
            {
                return Results.BadRequest(new { Message = "Doğrudan Ay taşınamaz; ana gezegen taşındığında bağlı olan Ay da otomatik olarak birlikte taşınır." });
            }

            var user = request.UserId.HasValue
                ? await dbContext.Users.FirstOrDefaultAsync(u => u.Id == request.UserId.Value, cancellationToken)
                : await dbContext.Users.FirstOrDefaultAsync(u => u.Id == planet.UserId, cancellationToken);

            if (user is null)
            {
                return Results.NotFound(new { Message = "Kullanıcı bulunamadı." });
            }

            if (user.IsBanned)
            {
                return Results.BadRequest(new { Message = "Yasaklanmış hesaplar gezegen taşıyamaz." });
            }

            // Validate coordinates
            var (isValidCoord, coordError) = ProfileCustomizationFormulas.ValidateRelocationTarget(request.TargetGalaxy, request.TargetSystem, request.TargetSlot);
            if (!isValidCoord)
            {
                return Results.BadRequest(new { Message = coordError });
            }

            if (!ColonizationFormulas.CanRelocateToSlot(planet.Slot, request.TargetSlot))
            {
                return Results.BadRequest(new { Message = "4–12 arasındaki gezegenler yalnızca 4–12 arasındaki pozisyonlara taşınabilir." });
            }

            if (planet.Galaxy == request.TargetGalaxy && planet.System == request.TargetSystem && planet.Slot == request.TargetSlot)
            {
                return Results.BadRequest(new { Message = "Hedef koordinatlar mevcut gezegen konumu ile aynı olamaz." });
            }

            var now = DateTime.UtcNow;

            // Check if planet is on cooldown
            if (PlanetCooldownsStore.TryGetValue(planet.Id, out var cd) && cd > now)
            {
                var remainingMinutes = (int)Math.Ceiling((cd - now).TotalMinutes);
                return Results.BadRequest(new { Message = $"Bu gezegen henüz bekleme süresinde ({remainingMinutes} dakika kaldı). Yeni bir taşıma başlatılamaz." });
            }

            // Check if already relocating
            if (RelocationsStore.ContainsKey(planet.Id))
            {
                return Results.BadRequest(new { Message = "Bu gezegen için zaten devam eden bir taşıma hazırlığı bulunmaktadır." });
            }

            // Target slot emptiness check
            var slotOccupied = await dbContext.Planets.AnyAsync(p =>
                p.Galaxy == request.TargetGalaxy &&
                p.System == request.TargetSystem &&
                p.Slot == request.TargetSlot &&
                !p.IsDestroyedPlanet, cancellationToken);

            if (slotOccupied)
            {
                return Results.BadRequest(new { Message = $"[{request.TargetGalaxy}:{request.TargetSystem}:{request.TargetSlot}] koordinatı dolu. Yalnızca boş pozisyonlara taşıma yapılabilir." });
            }

            // Check Dark Matter
            if (user.DarkMatter < ProfileCustomizationFormulas.RelocationCostDarkMatter)
            {
                return Results.BadRequest(new
                {
                    Success = false,
                    Message = $"Yetersiz Karanlık Madde! Gereken: {ProfileCustomizationFormulas.RelocationCostDarkMatter:N0} KM, Mevcut: {user.DarkMatter:N0} KM."
                });
            }

            // Operational checks:
            // 1. Fleet missions check
            var moon = await dbContext.Planets.FirstOrDefaultAsync(p => p.ParentPlanetId == planet.Id && p.IsMoon, cancellationToken);
            var originIds = new List<Guid> { planet.Id };
            if (moon is not null) originIds.Add(moon.Id);

            var activeFleet = await dbContext.FleetMissions.AnyAsync(f =>
                (originIds.Contains(f.OriginPlanetId) || (f.TargetPlanetId.HasValue && originIds.Contains(f.TargetPlanetId.Value))) &&
                (f.Status == FleetMissionStatus.Outbound || f.Status == FleetMissionStatus.Holding || f.Status == FleetMissionStatus.Returning), cancellationToken);

            if (activeFleet)
            {
                return Results.BadRequest(new { Message = "Taşıma engeli: Gezegene veya Ay'a bağlı aktif filo görevleri (gidiş, dönüş veya bekleme) bulunuyor." });
            }

            // 2. Building queue check
            var activeBuilding = await dbContext.BuildingQueueItems.AnyAsync(b => b.PlanetId == planet.Id, cancellationToken);
            if (activeBuilding)
            {
                return Results.BadRequest(new { Message = "Taşıma engeli: Gezegende devam eden aktif bina inşaatı bulunmaktadır." });
            }

            // 3. Shipyard queue check
            var activeShipyard = await dbContext.ShipyardQueueItems.AnyAsync(s => s.PlanetId == planet.Id, cancellationToken);
            if (activeShipyard)
            {
                return Results.BadRequest(new { Message = "Taşıma engeli: Tersanede devam eden aktif gemi veya savunma üretimi bulunmaktadır." });
            }

            // 4. Research queue check
            var activeResearch = await dbContext.ResearchQueueItems.AnyAsync(r => r.UserId == user.Id && r.OriginPlanetId == planet.Id, cancellationToken);
            if (activeResearch)
            {
                return Results.BadRequest(new { Message = "Taşıma engeli: Bu gezegendeki Araştırma Laboratuvarında yürütülen aktif bir araştırma bulunmaktadır." });
            }

            // 5. Lifeform queue check
            if (PlanetEndpoints.PlanetLifeformsStore.TryGetValue(planet.Id, out var lfState) && lfState.ActiveQueue is not null)
            {
                return Results.BadRequest(new { Message = "Taşıma engeli: Gezegende devam eden aktif canlı türü inşası bulunmaktadır." });
            }

            string lockKey = $"lock:planet:{planet.Id}";
            await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

            // Per Task 16: Dark Matter (240.000 KM) is only deducted when relocation completes successfully.
            // Verified above that user currently has sufficient DM.

            var endTime = now.AddHours(ProfileCustomizationFormulas.RelocationPreparationHours);
            var relocationState = new ActivePlanetRelocationState
            {
                PlanetId = planet.Id,
                UserId = user.Id,
                TargetGalaxy = request.TargetGalaxy,
                TargetSystem = request.TargetSystem,
                TargetSlot = request.TargetSlot,
                StartTimeUtc = now,
                EndTimeUtc = endTime,
                CostDarkMatter = ProfileCustomizationFormulas.RelocationCostDarkMatter
            };

            RelocationsStore[planet.Id] = relocationState;

            await hubContext.Clients.User(user.Id.ToString()).SendAsync("PlanetRelocationStarted", new
            {
                PlanetId = planet.Id,
                relocationState.TargetGalaxy,
                relocationState.TargetSystem,
                relocationState.TargetSlot,
                EndTimeUtc = endTime,
                RemainingSeconds = (int)(endTime - now).TotalSeconds
            }, cancellationToken);

            return Results.Ok(new
            {
                Success = true,
                Message = $"Gezegen taşıma hazırlığı başlatıldı! [{request.TargetGalaxy}:{request.TargetSystem}:{request.TargetSlot}] koordinatına 24 saatlik intikal geri sayımı devrede.",
                Relocation = relocationState,
                RemainingDarkMatter = user.DarkMatter
            });
        })
        .WithName("StartPlanetRelocation");

        // ----------------------------------------------------
        // SHOP: CANCEL PLANET RELOCATION
        // ----------------------------------------------------
        shopGroup.MapDelete("/relocation/cancel", async (
            Guid planetId,
            Guid? userId,
            IApplicationDbContext dbContext,
            IDistributedLockService lockService,
            IHubContext<GameHub> hubContext,
            CancellationToken cancellationToken) =>
        {
            if (!RelocationsStore.TryRemove(planetId, out var relState))
            {
                return Results.NotFound(new { Message = "Bu gezegen için aktif bir taşıma işlemi bulunamadı." });
            }

            var user = userId.HasValue
                ? await dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId.Value, cancellationToken)
                : await dbContext.Users.FirstOrDefaultAsync(u => u.Id == relState.UserId, cancellationToken);

            if (user is not null)
            {
                await hubContext.Clients.User(user.Id.ToString()).SendAsync("PlanetRelocationCancelled", new
                {
                    PlanetId = planetId,
                    RefundedDarkMatter = 0,
                    RemainingDarkMatter = user.DarkMatter
                }, cancellationToken);
            }

            return Results.Ok(new
            {
                Success = true,
                Message = "Gezegen taşıma işlemi iptal edildi. Herhangi bir Karanlık Madde kesilmedi.",
                RemainingDarkMatter = user?.DarkMatter ?? 0
            });
        })
        .WithName("CancelPlanetRelocation");

        // ----------------------------------------------------
        // SHOP: COMPLETE PLANET RELOCATION
        // ----------------------------------------------------
        shopGroup.MapPost("/relocation/complete", async (
            CompleteRelocationRequest request,
            IApplicationDbContext dbContext,
            IDistributedLockService lockService,
            IJumpGateCooldownService jumpGateCooldownService,
            IHubContext<GameHub> hubContext,
            CancellationToken cancellationToken) =>
        {
            if (!RelocationsStore.TryGetValue(request.PlanetId, out var relState))
            {
                return Results.NotFound(new { Message = "Bu gezegen için aktif bir taşıma işlemi bulunamadı." });
            }

            var now = DateTime.UtcNow;
            if (!request.ForceInstant && relState.EndTimeUtc > now)
            {
                var remainingSecs = (int)(relState.EndTimeUtc - now).TotalSeconds;
                return Results.BadRequest(new { Message = $"Taşıma hazırlık süresi henüz dolmadı ({remainingSecs} saniye kaldı)." });
            }

            var planet = await dbContext.Planets.FirstOrDefaultAsync(p => p.Id == request.PlanetId, cancellationToken);
            if (planet is null)
            {
                return Results.NotFound(new { Message = "Gezegen bulunamadı." });
            }

            var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Id == planet.UserId, cancellationToken);
            if (user is null)
            {
                RelocationsStore.TryRemove(planet.Id, out _);
                return Results.NotFound(new { Message = "Kullanıcı bulunamadı." });
            }

            // Check if user has sufficient Dark Matter at completion time
            if (user.DarkMatter < ProfileCustomizationFormulas.RelocationCostDarkMatter)
            {
                RelocationsStore.TryRemove(planet.Id, out _);
                return Results.BadRequest(new { Message = $"Yetersiz Karanlık Madde! Taşıma tamamlanamadı. Gereken: {ProfileCustomizationFormulas.RelocationCostDarkMatter:N0} KM, Mevcut: {user.DarkMatter:N0} KM." });
            }

            // Operational checks at relocation moment (Task 16):
            // 1. Fleet missions check
            var moon = await dbContext.Planets.FirstOrDefaultAsync(p => p.ParentPlanetId == planet.Id && p.IsMoon, cancellationToken);
            var originIds = new List<Guid> { planet.Id };
            if (moon is not null) originIds.Add(moon.Id);

            var activeFleet = await dbContext.FleetMissions.AnyAsync(f =>
                (originIds.Contains(f.OriginPlanetId) || (f.TargetPlanetId.HasValue && originIds.Contains(f.TargetPlanetId.Value))) &&
                (f.Status == FleetMissionStatus.Outbound || f.Status == FleetMissionStatus.Holding || f.Status == FleetMissionStatus.Returning), cancellationToken);

            if (activeFleet)
            {
                RelocationsStore.TryRemove(planet.Id, out _);
                return Results.BadRequest(new { Message = "Taşıma anında gezegene veya Ay'a bağlı aktif filo hareketi bulunduğundan taşıma iptal edildi. Karanlık Madde kesilmedi." });
            }

            // 2. Building queue check
            var activeBuilding = await dbContext.BuildingQueueItems.AnyAsync(b => b.PlanetId == planet.Id, cancellationToken);
            if (activeBuilding)
            {
                RelocationsStore.TryRemove(planet.Id, out _);
                return Results.BadRequest(new { Message = "Taşıma anında gezegende aktif bina inşaatı bulunduğundan taşıma iptal edildi. Karanlık Madde kesilmedi." });
            }

            // 3. Shipyard queue check
            var activeShipyard = await dbContext.ShipyardQueueItems.AnyAsync(s => s.PlanetId == planet.Id, cancellationToken);
            if (activeShipyard)
            {
                RelocationsStore.TryRemove(planet.Id, out _);
                return Results.BadRequest(new { Message = "Taşıma anında tersanede aktif üretim bulunduğundan taşıma iptal edildi. Karanlık Madde kesilmedi." });
            }

            // 4. Research queue check
            var activeResearch = await dbContext.ResearchQueueItems.AnyAsync(r => r.UserId == user.Id && r.OriginPlanetId == planet.Id, cancellationToken);
            if (activeResearch)
            {
                RelocationsStore.TryRemove(planet.Id, out _);
                return Results.BadRequest(new { Message = "Taşıma anında laboratuvarda aktif araştırma yürütüldüğünden taşıma iptal edildi. Karanlık Madde kesilmedi." });
            }

            // Re-verify target slot emptiness
            var isSlotOccupied = await dbContext.Planets.AnyAsync(p =>
                p.Galaxy == relState.TargetGalaxy &&
                p.System == relState.TargetSystem &&
                p.Slot == relState.TargetSlot &&
                p.Id != planet.Id &&
                !p.IsDestroyedPlanet, cancellationToken);

            if (isSlotOccupied)
            {
                RelocationsStore.TryRemove(planet.Id, out _);
                return Results.BadRequest(new { Message = "Hedef koordinat başka bir oyuncu tarafından doldurulmuş! Taşıma iptal edildi. Karanlık Madde kesilmedi." });
            }

            string lockKey = $"lock:planet:{planet.Id}";
            await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

            // Deduct Dark Matter upon successful completion (Task 16)
            user.DarkMatter -= ProfileCustomizationFormulas.RelocationCostDarkMatter;

            planet.Galaxy = relState.TargetGalaxy;
            planet.System = relState.TargetSystem;
            planet.Slot = relState.TargetSlot;

            // Recalculate temperature for the new orbit slot (MaxFields is preserved unchanged)
            var (tempMin, tempMax) = ColonizationFormulas.GetSlotTemperatureBand(planet.Slot);
            planet.TempMin = tempMin;
            planet.TempMax = tempMax;

            // Also move connected Moon if any and lock Jump Gate for 24 hours
            if (moon is not null)
            {
                moon.Galaxy = relState.TargetGalaxy;
                moon.System = relState.TargetSystem;
                moon.Slot = relState.TargetSlot;
                moon.TempMin = tempMin - 20;
                moon.TempMax = tempMax - 20;

                await jumpGateCooldownService.SetCooldownAsync(moon.Id, TimeSpan.FromHours(24), cancellationToken);
            }

            await dbContext.SaveChangesAsync(cancellationToken);

            // Clean up relocation and set 48h cooldown
            RelocationsStore.TryRemove(planet.Id, out _);
            var cooldownUntil = now.AddHours(ProfileCustomizationFormulas.RelocationCooldownHours);
            PlanetCooldownsStore[planet.Id] = cooldownUntil;
            if (user is not null)
            {
                await hubContext.Clients.User(user.Id.ToString()).SendAsync("PlanetRelocated", new
                {
                    PlanetId = planet.Id,
                    planet.Galaxy,
                    planet.System,
                    planet.Slot,
                    TempMin = tempMin,
                    TempMax = tempMax,
                    CooldownUntilUtc = cooldownUntil
                }, cancellationToken);
            }

            return Results.Ok(new
            {
                Success = true,
                Message = $"{planet.Name} başarıyla [{planet.Galaxy}:{planet.System}:{planet.Slot}] konumuna taşındı! Sıcaklık: {tempMin}°C - {tempMax}°C.",
                NewCoords = $"[{planet.Galaxy}:{planet.System}:{planet.Slot}]",
                planet.Galaxy,
                planet.System,
                planet.Slot,
                TempMin = tempMin,
                TempMax = tempMax,
                CooldownUntilUtc = cooldownUntil
            });
        })
        .WithName("CompletePlanetRelocation");

        // ----------------------------------------------------
        // SHOP: PLAYER NAME CHANGE
        // ----------------------------------------------------
        shopGroup.MapPost("/name-change", async (
            ChangePlayerNameRequest request,
            IApplicationDbContext dbContext,
            IDistributedLockService lockService,
            IHubContext<GameHub> hubContext,
            CancellationToken cancellationToken) =>
        {
            if (!ProfileCustomizationFormulas.ValidateUsername(request.NewUsername, out string valError))
            {
                return Results.BadRequest(new { Message = valError });
            }

            string cleanName = request.NewUsername.Trim();

            var user = request.UserId.HasValue
                ? await dbContext.Users.FirstOrDefaultAsync(u => u.Id == request.UserId.Value, cancellationToken)
                : await dbContext.Users.OrderBy(u => u.CreatedAtUtc).FirstOrDefaultAsync(cancellationToken);

            if (user is null)
            {
                return Results.NotFound(new { Message = "Kullanıcı bulunamadı." });
            }

            if (user.IsBanned)
            {
                return Results.BadRequest(new { Message = "Yasaklanmış hesaplar isim değiştiremez." });
            }

            if (user.Username.Equals(cleanName, StringComparison.OrdinalIgnoreCase))
            {
                return Results.BadRequest(new { Message = "Yeni kullanıcı adı mevcut adınız ile aynı olamaz." });
            }

            // Case-insensitive uniqueness check
            var nameTaken = await dbContext.Users.AnyAsync(u =>
                u.Id != user.Id &&
                u.Username.ToLower() == cleanName.ToLower(), cancellationToken);

            if (nameTaken)
            {
                return Results.BadRequest(new { Message = $"'{cleanName}' kullanıcı adı zaten başka bir oyuncu tarafından kullanılıyor." });
            }

            if (user.DarkMatter < ProfileCustomizationFormulas.NameChangeCostDarkMatter)
            {
                return Results.BadRequest(new
                {
                    Success = false,
                    Message = $"Yetersiz Karanlık Madde! İsim değişikliği için {ProfileCustomizationFormulas.NameChangeCostDarkMatter:N0} KM gereklidir (Mevcut: {user.DarkMatter:N0} KM)."
                });
            }

            string lockKey = $"lock:user:{user.Id}";
            await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

            user.DarkMatter -= ProfileCustomizationFormulas.NameChangeCostDarkMatter;
            string oldName = user.Username;
            user.Username = cleanName;

            await dbContext.SaveChangesAsync(cancellationToken);

            await hubContext.Clients.User(user.Id.ToString()).SendAsync("UserNameChanged", new
            {
                UserId = user.Id,
                OldUsername = oldName,
                NewUsername = cleanName,
                RemainingDarkMatter = user.DarkMatter
            }, cancellationToken);

            return Results.Ok(new
            {
                Success = true,
                OldUsername = oldName,
                NewUsername = cleanName,
                CostDarkMatter = ProfileCustomizationFormulas.NameChangeCostDarkMatter,
                RemainingDarkMatter = user.DarkMatter,
                Message = $"Oyuncu adınız başarıyla '{cleanName}' olarak güncellendi!"
            });
        })
        .WithName("ChangePlayerName");

        // ----------------------------------------------------
        // SHOP: BUY COSMETIC AVATAR OR TITLE
        // ----------------------------------------------------
        shopGroup.MapPost("/cosmetics/buy", async (
            BuyCosmeticRequest request,
            IApplicationDbContext dbContext,
            IDistributedLockService lockService,
            IHubContext<GameHub> hubContext,
            CancellationToken cancellationToken) =>
        {
            var itemDef = ProfileCustomizationFormulas.FindCosmetic(request.CosmeticType, request.CosmeticId);
            if (itemDef is null)
            {
                return Results.NotFound(new { Message = $"'{request.CosmeticId}' kodlu kozmetik ürün bulunamadı." });
            }

            var user = request.UserId.HasValue
                ? await dbContext.Users.FirstOrDefaultAsync(u => u.Id == request.UserId.Value, cancellationToken)
                : await dbContext.Users.OrderBy(u => u.CreatedAtUtc).FirstOrDefaultAsync(cancellationToken);

            if (user is null)
            {
                return Results.NotFound(new { Message = "Kullanıcı bulunamadı." });
            }

            var profileState = UserCosmeticsStore.GetOrAdd(user.Id, _ => new UserCosmeticProfileState());
            var unlockedSet = itemDef.Type == "avatar" ? profileState.UnlockedAvatars : profileState.UnlockedTitles;

            if (unlockedSet.Contains(itemDef.Id))
            {
                return Results.BadRequest(new { Message = $"'{itemDef.Name}' zaten hesabınızda açık." });
            }

            if (user.DarkMatter < itemDef.CostDarkMatter)
            {
                return Results.BadRequest(new
                {
                    Success = false,
                    Message = $"Yetersiz Karanlık Madde! Gereken: {itemDef.CostDarkMatter:N0} KM, Mevcut: {user.DarkMatter:N0} KM."
                });
            }

            string lockKey = $"lock:user:{user.Id}";
            await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

            if (itemDef.CostDarkMatter > 0)
            {
                user.DarkMatter -= itemDef.CostDarkMatter;
                await dbContext.SaveChangesAsync(cancellationToken);
            }

            unlockedSet.Add(itemDef.Id);

            await hubContext.Clients.User(user.Id.ToString()).SendAsync("CosmeticsUpdated", new
            {
                UserId = user.Id,
                CosmeticType = itemDef.Type,
                CosmeticId = itemDef.Id,
                RemainingDarkMatter = user.DarkMatter
            }, cancellationToken);

            return Results.Ok(new
            {
                Success = true,
                CosmeticType = itemDef.Type,
                CosmeticId = itemDef.Id,
                CostDarkMatter = itemDef.CostDarkMatter,
                RemainingDarkMatter = user.DarkMatter,
                Message = $"'{itemDef.Name}' başarıyla açıldı!"
            });
        })
        .WithName("BuyCosmeticItem");

        // ----------------------------------------------------
        // USER PROFILE: EQUIP ACTIVE COSMETICS
        // ----------------------------------------------------
        app.MapPut("/api/user/profile/cosmetics", async (
            EquipCosmeticsRequest request,
            IApplicationDbContext dbContext,
            IHubContext<GameHub> hubContext,
            CancellationToken cancellationToken) =>
        {
            var user = request.UserId.HasValue
                ? await dbContext.Users.FirstOrDefaultAsync(u => u.Id == request.UserId.Value, cancellationToken)
                : await dbContext.Users.OrderBy(u => u.CreatedAtUtc).FirstOrDefaultAsync(cancellationToken);

            if (user is null)
            {
                return Results.NotFound(new { Message = "Kullanıcı bulunamadı." });
            }

            var profileState = UserCosmeticsStore.GetOrAdd(user.Id, _ => new UserCosmeticProfileState());

            if (!string.IsNullOrWhiteSpace(request.ActiveAvatar))
            {
                var avatarDef = ProfileCustomizationFormulas.FindCosmetic("avatar", request.ActiveAvatar);
                if (avatarDef is null)
                {
                    return Results.BadRequest(new { Message = "Tanımsız avatar seçimi." });
                }
                if (!avatarDef.IsDefault && !profileState.UnlockedAvatars.Contains(avatarDef.Id))
                {
                    return Results.BadRequest(new { Message = "Bu avatar henüz hesabınızda kilitli." });
                }
                profileState.ActiveAvatar = avatarDef.Id;
            }

            if (!string.IsNullOrWhiteSpace(request.ActiveTitle))
            {
                var titleDef = ProfileCustomizationFormulas.FindCosmetic("title", request.ActiveTitle);
                if (titleDef is null)
                {
                    return Results.BadRequest(new { Message = "Tanımsız unvan seçimi." });
                }
                if (!titleDef.IsDefault && !profileState.UnlockedTitles.Contains(titleDef.Id))
                {
                    return Results.BadRequest(new { Message = "Bu unvan henüz hesabınızda kilitli." });
                }
                profileState.ActiveTitle = titleDef.Id;
            }

            await hubContext.Clients.User(user.Id.ToString()).SendAsync("ProfileUpdated", new
            {
                UserId = user.Id,
                profileState.ActiveAvatar,
                profileState.ActiveTitle
            }, cancellationToken);

            return Results.Ok(new
            {
                Success = true,
                profileState.ActiveAvatar,
                profileState.ActiveTitle,
                Message = "Profil görünümünüz güncellendi."
            });
        })
        .WithName("EquipProfileCosmetics");

        // ----------------------------------------------------
        // SHOP: SPECIAL OFFERS & DYNAMIC EVENT PROMOTIONS
        // ----------------------------------------------------
        shopGroup.MapGet("/special-offers", async (
            Guid? planetId,
            Guid? userId,
            IApplicationDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var user = userId.HasValue
                ? await dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId.Value, cancellationToken)
                : await dbContext.Users.OrderBy(u => u.CreatedAtUtc).FirstOrDefaultAsync(cancellationToken);

            var now = DateTime.UtcNow;
            // 4 days 16 hours event window
            int eventRemainingSeconds = 403_200;

            var bundles = SpecialOffersFormulas.GetBundles();

            var ladderBoosters = new[]
            {
                new
                {
                    ItemCode = "BOOSTER_METAL_PLATINUM_90D",
                    Name = "90 Günlük Platin Metal Güçlendirici",
                    Tier = "Platinum",
                    DurationDays = 90,
                    Percent = 40,
                    BasePrice = 300_000,
                    DiscountPercent = 20,
                    SalePrice = 240_000,
                    Description = "Metal üretimini 90 gün boyunca +%40 artırır. Platin indirim haftasına özel %20 indirimli!"
                },
                new
                {
                    ItemCode = "BOOSTER_CRYSTAL_PLATINUM_90D",
                    Name = "90 Günlük Platin Kristal Güçlendirici",
                    Tier = "Platinum",
                    DurationDays = 90,
                    Percent = 40,
                    BasePrice = 300_000,
                    DiscountPercent = 20,
                    SalePrice = 240_000,
                    Description = "Kristal üretimini 90 gün boyunca +%40 artırır. Platin indirim haftasına özel %20 indirimli!"
                },
                new
                {
                    ItemCode = "BOOSTER_DEUT_PLATINUM_90D",
                    Name = "90 Günlük Platin Döteryum Güçlendirici",
                    Tier = "Platinum",
                    DurationDays = 90,
                    Percent = 40,
                    BasePrice = 300_000,
                    DiscountPercent = 20,
                    SalePrice = 240_000,
                    Description = "Döteryum üretimini 90 gün boyunca +%40 artırır. Platin indirim haftasına özel %20 indirimli!"
                },
                new
                {
                    ItemCode = "BOOSTER_ALL_PLATINUM_30D",
                    Name = "30 Günlük Platin Üçlü Paket",
                    Tier = "Platinum",
                    DurationDays = 30,
                    Percent = 40,
                    BasePrice = 330_000,
                    DiscountPercent = 15,
                    SalePrice = 280_500,
                    Description = "Metal, Kristal ve Döteryum için 30 günlük +%40 platin maden artışı (%15 İndirim)."
                }
            };

            return Results.Ok(new
            {
                EventTitle = SpecialOffersFormulas.EventTitle,
                EventPromoBadge = SpecialOffersFormulas.EventPromoBadge,
                EventRemainingSeconds = eventRemainingSeconds,
                UserDarkMatter = user?.DarkMatter ?? 0,
                UserId = user?.Id,
                PlanetId = planetId,
                ClassChangePromo = new
                {
                    BasePrice = SpecialOffersFormulas.ClassChangeBasePrice,
                    SalePrice = SpecialOffersFormulas.ClassChangeSalePrice,
                    DiscountPercent = SpecialOffersFormulas.ClassChangeDiscountPercent,
                    Savings = SpecialOffersFormulas.ClassChangeBasePrice - SpecialOffersFormulas.ClassChangeSalePrice
                },
                RelocationPromo = new
                {
                    BasePrice = SpecialOffersFormulas.RelocationBasePrice,
                    SalePrice = SpecialOffersFormulas.RelocationSalePrice,
                    DiscountPercent = SpecialOffersFormulas.RelocationDiscountPercent,
                    Savings = SpecialOffersFormulas.RelocationBasePrice - SpecialOffersFormulas.RelocationSalePrice
                },
                ResourcePackPromo = new
                {
                    BasePrice = SpecialOffersFormulas.ResourcePackBasePrice,
                    SalePrice = SpecialOffersFormulas.ResourcePackSalePrice,
                    DiscountPercent = SpecialOffersFormulas.ResourcePackDiscountPercent,
                    Savings = SpecialOffersFormulas.ResourcePackBasePrice - SpecialOffersFormulas.ResourcePackSalePrice
                },
                SpeedupPromo = new
                {
                    MinBasePrice = SpecialOffersFormulas.SpeedupMinBasePrice,
                    MinSalePrice = SpecialOffersFormulas.SpeedupMinSalePrice,
                    DiscountPercent = SpecialOffersFormulas.SpeedupDiscountPercent
                },
                LadderBoosters = ladderBoosters,
                Bundles = bundles
            });
        })
        .WithName("GetSpecialOffers");

        // ----------------------------------------------------
        // SHOP: BUY COMPOSITE BUNDLE
        // ----------------------------------------------------
        shopGroup.MapPost("/special-offers/buy-bundle", async (
            BuyBundleRequest request,
            IApplicationDbContext dbContext,
            IDistributedLockService lockService,
            IHubContext<GameHub> hubContext,
            CancellationToken cancellationToken) =>
        {
            var bundleDef = SpecialOffersFormulas.FindBundle(request.BundleId);
            if (bundleDef is null)
            {
                return Results.NotFound(new { Message = $"'{request.BundleId}' tanımlı bir kompozit paket bulunamadı." });
            }

            Planet? planet = null;
            if (request.PlanetId != Guid.Empty)
            {
                planet = await dbContext.Planets.FirstOrDefaultAsync(p => p.Id == request.PlanetId, cancellationToken);
            }
            if (planet is null && request.UserId.HasValue)
            {
                planet = await dbContext.Planets.FirstOrDefaultAsync(p => p.UserId == request.UserId.Value, cancellationToken);
            }
            if (planet is null)
            {
                planet = await dbContext.Planets.FirstOrDefaultAsync(cancellationToken);
            }

            if (planet is null)
            {
                return Results.NotFound(new { Message = "Hedef gezegen bulunamadı." });
            }

            var user = request.UserId.HasValue
                ? await dbContext.Users.FirstOrDefaultAsync(u => u.Id == request.UserId.Value, cancellationToken)
                : await dbContext.Users.FirstOrDefaultAsync(u => u.Id == planet.UserId, cancellationToken);

            if (user is null)
            {
                return Results.NotFound(new { Message = "Kullanıcı bulunamadı." });
            }

            if (user.DarkMatter < bundleDef.BundlePriceDarkMatter)
            {
                return Results.BadRequest(new
                {
                    Success = false,
                    Message = $"Yetersiz Karanlık Madde! Gereken: {bundleDef.BundlePriceDarkMatter:N0} KM, Mevcut: {user.DarkMatter:N0} KM."
                });
            }

            string lockKey = $"lock:planet:{planet.Id}";
            await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

            user.DarkMatter -= bundleDef.BundlePriceDarkMatter;

            var now = DateTime.UtcNow;
            var newExpires = now.AddDays(30);

            // Apply bundle effects based on bundle ID
            if (bundleDef.BundleId == "bundle_explorer")
            {
                // Activate Platinum Crystal Booster
                var crystalBooster = await dbContext.PlanetActiveBoosters
                    .FirstOrDefaultAsync(b => b.PlanetId == planet.Id && b.ResourceType == "Crystal", cancellationToken);
                if (crystalBooster is not null)
                {
                    crystalBooster.Multiplier = 0.40;
                    crystalBooster.ExpiresAtUtc = newExpires;
                    crystalBooster.Tier = "Platinum";
                }
                else
                {
                    dbContext.PlanetActiveBoosters.Add(new PlanetActiveBooster
                    {
                        Id = Guid.NewGuid(),
                        PlanetId = planet.Id,
                        ResourceType = "Crystal",
                        Multiplier = 0.40,
                        ExpiresAtUtc = newExpires,
                        ItemKey = "BOOSTER_CRYSTAL_PLATINUM_30D",
                        Tier = "Platinum",
                        CreatedAtUtc = now
                    });
                }
            }
            else if (bundleDef.BundleId == "bundle_industrialist")
            {
                // Activate all 3 Platinum Boosters
                foreach (var resType in new[] { "Metal", "Crystal", "Deuterium" })
                {
                    var booster = await dbContext.PlanetActiveBoosters
                        .FirstOrDefaultAsync(b => b.PlanetId == planet.Id && b.ResourceType == resType, cancellationToken);
                    if (booster is not null)
                    {
                        booster.Multiplier = 0.40;
                        booster.ExpiresAtUtc = newExpires;
                        booster.Tier = "Platinum";
                    }
                    else
                    {
                        dbContext.PlanetActiveBoosters.Add(new PlanetActiveBooster
                        {
                            Id = Guid.NewGuid(),
                            PlanetId = planet.Id,
                            ResourceType = resType,
                            Multiplier = 0.40,
                            ExpiresAtUtc = newExpires,
                            ItemKey = $"BOOSTER_{resType.ToUpperInvariant()}_PLATINUM_30D",
                            Tier = "Platinum",
                            CreatedAtUtc = now
                        });
                    }
                }
            }

            await dbContext.SaveChangesAsync(cancellationToken);

            await hubContext.Clients.User(user.Id.ToString()).SendAsync("SpecialOfferBundlePurchased", new
            {
                BundleId = bundleDef.BundleId,
                PlanetId = planet.Id,
                RemainingDarkMatter = user.DarkMatter
            }, cancellationToken);

            return Results.Ok(new
            {
                Success = true,
                BundleId = bundleDef.BundleId,
                bundleDef.Name,
                CostDarkMatter = bundleDef.BundlePriceDarkMatter,
                RemainingDarkMatter = user.DarkMatter,
                Message = $"'{bundleDef.Name}' başarıyla satın alındı ve içeriği gezegeninize tanımlandı!"
            });
        })
        .WithName("BuySpecialOfferBundle");

        // ----------------------------------------------------
        // SHOP: BUY DISCOUNTED 1-DAY RESOURCE PACK
        // ----------------------------------------------------
        shopGroup.MapPost("/special-offers/buy-resource-pack", async (
            BuySpecialResourcePackRequest request,
            IApplicationDbContext dbContext,
            IDistributedLockService lockService,
            IHubContext<GameHub> hubContext,
            CancellationToken cancellationToken) =>
        {
            Planet? planet = null;
            if (request.PlanetId != Guid.Empty)
            {
                planet = await dbContext.Planets
                    .Include(p => p.Buildings)
                    .FirstOrDefaultAsync(p => p.Id == request.PlanetId, cancellationToken);
            }
            if (planet is null && request.UserId.HasValue)
            {
                planet = await dbContext.Planets
                    .Include(p => p.Buildings)
                    .FirstOrDefaultAsync(p => p.UserId == request.UserId.Value, cancellationToken);
            }
            if (planet is null)
            {
                planet = await dbContext.Planets
                    .Include(p => p.Buildings)
                    .FirstOrDefaultAsync(cancellationToken);
            }

            if (planet is null)
            {
                return Results.NotFound(new { Message = "Hedef gezegen bulunamadı." });
            }

            if (planet.IsMoon)
            {
                return Results.BadRequest(new { Message = "Hammadde paketleri Aylara doldurulamaz." });
            }

            var user = request.UserId.HasValue
                ? await dbContext.Users.FirstOrDefaultAsync(u => u.Id == request.UserId.Value, cancellationToken)
                : await dbContext.Users.FirstOrDefaultAsync(u => u.Id == planet.UserId, cancellationToken);

            if (user is null)
            {
                return Results.NotFound(new { Message = "Kullanıcı bulunamadı." });
            }

            if (user.DarkMatter < SpecialOffersFormulas.ResourcePackSalePrice)
            {
                return Results.BadRequest(new
                {
                    Success = false,
                    Message = $"Yetersiz Karanlık Madde! Gereken: {SpecialOffersFormulas.ResourcePackSalePrice:N0} KM, Mevcut: {user.DarkMatter:N0} KM."
                });
            }

            string lockKey = $"lock:planet:{planet.Id}";
            await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

            user.DarkMatter -= SpecialOffersFormulas.ResourcePackSalePrice;

            // Calculate storage capacity based on storage building levels
            int metalStorageLvl = planet.Buildings.FirstOrDefault(b => b.BuildingType == BuildingType.MetalStorage)?.Level ?? 0;
            int crystalStorageLvl = planet.Buildings.FirstOrDefault(b => b.BuildingType == BuildingType.CrystalStorage)?.Level ?? 0;
            int deutTankLvl = planet.Buildings.FirstOrDefault(b => b.BuildingType == BuildingType.DeuteriumTank)?.Level ?? 0;

            double metalCap = ResourceFormulas.CalculateStorageCapacity(metalStorageLvl);
            double crystalCap = ResourceFormulas.CalculateStorageCapacity(crystalStorageLvl);
            double deutCap = ResourceFormulas.CalculateStorageCapacity(deutTankLvl);

            // Calculate 24h worth of resources (minimum 100,000 Metal, 50,000 Crystal, 25,000 Deut)
            int metalMineLvl = planet.Buildings.FirstOrDefault(b => b.BuildingType == BuildingType.MetalMine)?.Level ?? 10;
            int crystalMineLvl = planet.Buildings.FirstOrDefault(b => b.BuildingType == BuildingType.CrystalMine)?.Level ?? 8;
            int deutSynthLvl = planet.Buildings.FirstOrDefault(b => b.BuildingType == BuildingType.DeuteriumSynthesizer)?.Level ?? 6;

            double metal24h = Math.Max(100_000, metalMineLvl * 24 * 1_200);
            double crystal24h = Math.Max(50_000, crystalMineLvl * 24 * 800);
            double deut24h = Math.Max(25_000, deutSynthLvl * 24 * 400);

            planet.Metal = Math.Min(metalCap, planet.Metal + metal24h);
            planet.Crystal = Math.Min(crystalCap, planet.Crystal + crystal24h);
            planet.Deuterium = Math.Min(deutCap, planet.Deuterium + deut24h);
            planet.LastResourceUpdateUtc = DateTime.UtcNow;

            await dbContext.SaveChangesAsync(cancellationToken);

            await hubContext.Clients.User(user.Id.ToString()).SendAsync("PlanetResourcesUpdated", new
            {
                PlanetId = planet.Id,
                planet.Metal,
                planet.Crystal,
                planet.Deuterium,
                ServerTimeUtc = DateTime.UtcNow
            }, cancellationToken);

            return Results.Ok(new
            {
                Success = true,
                CostDarkMatter = SpecialOffersFormulas.ResourcePackSalePrice,
                RemainingDarkMatter = user.DarkMatter,
                AddedMetal = (int)metal24h,
                AddedCrystal = (int)crystal24h,
                AddedDeuterium = (int)deut24h,
                CurrentMetal = (int)planet.Metal,
                CurrentCrystal = (int)planet.Crystal,
                CurrentDeuterium = (int)planet.Deuterium,
                Message = $"1 Günlük Tam Üretim Paketi (%30 İndirimle) başarıyla yüklendi! (+{(int)metal24h:N0} Metal, +{(int)crystal24h:N0} Kristal, +{(int)deut24h:N0} Döteryum)"
            });
        })
        .WithName("BuySpecialResourcePack");

        return app;
    }

    private record ItemEffectExecutionResult(bool Success, string Message, object? Details = null);

    private static async Task<ItemEffectExecutionResult> ExecuteItemEffectAsync(
        ShopCatalogItemDef itemDef,
        Planet planet,
        User user,
        IApplicationDbContext dbContext,
        IBuildingService buildingService,
        IShipyardService shipyardService,
        IResearchService researchService,
        IJobScheduler jobScheduler,
        IHubContext<GameHub> hubContext,
        CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;

        // 1. RESOURCE BOOSTERS (Metal, Crystal, Deuterium)
        if (itemDef.Category.Equals("resource", StringComparison.OrdinalIgnoreCase))
        {
            if (planet.IsMoon)
            {
                return new ItemEffectExecutionResult(false, "Hammadde güçlendiricileri Aylarda kullanılamaz.");
            }

            string resourceType = "Metal";
            if (itemDef.ItemKey.Contains("crystal", StringComparison.OrdinalIgnoreCase)) resourceType = "Crystal";
            else if (itemDef.ItemKey.Contains("deut", StringComparison.OrdinalIgnoreCase)) resourceType = "Deuterium";

            var existing = await dbContext.PlanetActiveBoosters
                .FirstOrDefaultAsync(b => b.PlanetId == planet.Id && b.ResourceType == resourceType, cancellationToken);

            int days = Math.Max(1, itemDef.DurationDays);
            var newExpires = now.AddDays(days);

            if (existing is not null)
            {
                existing.Multiplier = itemDef.EffectValue;
                existing.ExpiresAtUtc = newExpires;
                existing.ItemKey = itemDef.ItemKey;
                existing.Tier = itemDef.Tier;
            }
            else
            {
                dbContext.PlanetActiveBoosters.Add(new PlanetActiveBooster
                {
                    Id = Guid.NewGuid(),
                    PlanetId = planet.Id,
                    ResourceType = resourceType,
                    Multiplier = itemDef.EffectValue,
                    ExpiresAtUtc = newExpires,
                    ItemKey = itemDef.ItemKey,
                    Tier = itemDef.Tier,
                    CreatedAtUtc = now
                });
            }

            await dbContext.SaveChangesAsync(cancellationToken);

            await hubContext.Clients.User(user.Id.ToString()).SendAsync("PlanetUpdated", new
            {
                PlanetId = planet.Id,
                BoosterActive = true,
                ResourceType = resourceType,
                itemDef.EffectValue,
                ExpiresAtUtc = newExpires
            }, cancellationToken);

            int percent = (int)(itemDef.EffectValue * 100);
            return new ItemEffectExecutionResult(true, $"{planet.Name} üzerinde +%{percent} {resourceType} Güçlendirici ({days} Gün) aktif edildi!", new
            {
                planet.Id,
                ResourceType = resourceType,
                Multiplier = itemDef.EffectValue,
                ExpiresAtUtc = newExpires
            });
        }

        // 2. KRAKEN (Building Speedup)
        if (itemDef.Category.Equals("construction", StringComparison.OrdinalIgnoreCase))
        {
            var queueItem = await dbContext.BuildingQueueItems
                .Where(q => q.PlanetId == planet.Id)
                .OrderBy(q => q.StartTimeUtc)
                .FirstOrDefaultAsync(cancellationToken);

            if (queueItem is null)
            {
                return new ItemEffectExecutionResult(false, "Bu gezegende devam eden aktif bir bina inşası bulunamadı.");
            }

            double remainingSeconds = Math.Max(0, (queueItem.EndTimeUtc - now).TotalSeconds);
            var (isInstant, newRemaining) = ConstructionShopFormulas.CalculateQueueReduction(remainingSeconds, itemDef.EffectValue);

            if (isInstant || newRemaining <= 2.0)
            {
                if (!string.IsNullOrEmpty(queueItem.HangfireJobId))
                {
                    jobScheduler.CancelScheduledJob(queueItem.HangfireJobId);
                }

                var result = await buildingService.CompleteBuildingUpgradeAsync(planet.Id, queueItem.Id, cancellationToken);

                await hubContext.Clients.User(user.Id.ToString()).SendAsync("QueueCompleted", new
                {
                    Type = "Building",
                    PlanetId = planet.Id,
                    queueItem.BuildingType,
                    NewLevel = result?.NewLevel ?? queueItem.TargetLevel
                }, cancellationToken);

                return new ItemEffectExecutionResult(true, $"{itemDef.Name} uygulandı: Bina inşası anında tamamlandı!", new
                {
                    Completed = true,
                    queueItem.BuildingType,
                    NewLevel = result?.NewLevel ?? queueItem.TargetLevel
                });
            }
            else
            {
                if (!string.IsNullOrEmpty(queueItem.HangfireJobId))
                {
                    jobScheduler.CancelScheduledJob(queueItem.HangfireJobId);
                }

                var newEndUtc = now.AddSeconds(newRemaining);
                double totalDurationSeconds = Math.Max(1.0, (queueItem.EndTimeUtc - queueItem.StartTimeUtc).TotalSeconds);

                queueItem.HangfireJobId = jobScheduler.ScheduleBuildingCompletion(
                    planet.Id,
                    queueItem.Id,
                    new DateTimeOffset(newEndUtc, TimeSpan.Zero));
                queueItem.StartTimeUtc = newEndUtc.AddSeconds(-totalDurationSeconds);
                queueItem.EndTimeUtc = newEndUtc;

                return new ItemEffectExecutionResult(true, $"{itemDef.Name} uygulandı: Kalan süre kısaltıldı.", new
                {
                    Completed = false,
                    NewEndTimeUtc = DateTime.SpecifyKind(newEndUtc, DateTimeKind.Utc).ToString("O"),
                    RemainingSeconds = newRemaining
                });
            }
        }

        // 3. DETROID (Shipyard Speedup)
        if (itemDef.Category.Equals("shipyard", StringComparison.OrdinalIgnoreCase))
        {
            var batchItem = await dbContext.ShipyardQueueItems
                .Where(q => q.PlanetId == planet.Id)
                .OrderBy(q => q.BatchStartTimeUtc)
                .FirstOrDefaultAsync(cancellationToken);

            if (batchItem is null)
            {
                return new ItemEffectExecutionResult(false, "Bu tersanede devam eden aktif bir gemi veya savunma üretimi bulunamadı.");
            }

            double reductionSeconds = itemDef.EffectValue;
            batchItem.BatchStartTimeUtc = batchItem.BatchStartTimeUtc.AddSeconds(-reductionSeconds);

            if (!string.IsNullOrEmpty(batchItem.HangfireBatchJobId))
            {
                jobScheduler.CancelScheduledJob(batchItem.HangfireBatchJobId);
            }

            var batchEndUtc = batchItem.BatchStartTimeUtc.AddSeconds(batchItem.TotalCount * batchItem.UnitDurationSeconds);
            if (batchEndUtc > now)
            {
                batchItem.HangfireBatchJobId = jobScheduler.ScheduleShipyardBatchCompletion(
                    planet.Id,
                    batchItem.Id,
                    new DateTimeOffset(batchEndUtc, TimeSpan.Zero));
            }

            await dbContext.SaveChangesAsync(cancellationToken);

            // Immediately evaluate newly finished units from the time jump
            var eval = await shipyardService.EvaluatePlanetShipyardQueueAsync(planet.Id, now, cancellationToken);

            if (eval.NewlyCompletedUnitsTotal > 0)
            {
                await hubContext.Clients.User(user.Id.ToString()).SendAsync("QueueCompleted", new
                {
                    Type = "Shipyard",
                    PlanetId = planet.Id,
                    batchItem.UnitType,
                    NewlyCompleted = eval.NewlyCompletedUnitsTotal
                }, cancellationToken);
            }

            return new ItemEffectExecutionResult(true, $"{itemDef.Name} uygulandı: Tersane üretim süresi {reductionSeconds / 3600.0:0.#} saat hızlandırıldı!", new
            {
                NewlyCompleted = eval.NewlyCompletedUnitsTotal,
                RemainingQueueCount = eval.ActiveQueueItems.Count
            });
        }

        // 4. NEWTRON (Research Speedup - Account-Wide)
        if (itemDef.Category.Equals("research", StringComparison.OrdinalIgnoreCase))
        {
            var resQueue = await dbContext.ResearchQueueItems
                .Where(q => q.UserId == user.Id)
                .OrderBy(q => q.StartTimeUtc)
                .FirstOrDefaultAsync(cancellationToken);

            if (resQueue is null)
            {
                return new ItemEffectExecutionResult(false, "Laboratuvarlarınızda devam eden aktif bir teknoloji araştırması bulunamadı.");
            }

            double remainingSeconds = Math.Max(0, (resQueue.EndTimeUtc - now).TotalSeconds);
            var (isInstant, newRemaining) = ConstructionShopFormulas.CalculateQueueReduction(remainingSeconds, itemDef.EffectValue);

            if (isInstant || newRemaining <= 2.0)
            {
                if (!string.IsNullOrEmpty(resQueue.HangfireJobId))
                {
                    jobScheduler.CancelScheduledJob(resQueue.HangfireJobId);
                }

                var result = await researchService.CompleteResearchAsync(user.Id, resQueue.Id, cancellationToken);

                await hubContext.Clients.User(user.Id.ToString()).SendAsync("QueueCompleted", new
                {
                    Type = "Research",
                    UserId = user.Id,
                    resQueue.ResearchType,
                    NewLevel = result?.NewLevel ?? resQueue.TargetLevel
                }, cancellationToken);

                return new ItemEffectExecutionResult(true, $"{itemDef.Name} uygulandı: {resQueue.ResearchType} araştırması anında tamamlandı!", new
                {
                    Completed = true,
                    resQueue.ResearchType,
                    NewLevel = result?.NewLevel ?? resQueue.TargetLevel
                });
            }
            else
            {
                if (!string.IsNullOrEmpty(resQueue.HangfireJobId))
                {
                    jobScheduler.CancelScheduledJob(resQueue.HangfireJobId);
                }

                var newEndUtc = now.AddSeconds(newRemaining);
                resQueue.EndTimeUtc = newEndUtc;
                resQueue.HangfireJobId = jobScheduler.ScheduleResearchCompletion(
                    user.Id,
                    resQueue.Id,
                    new DateTimeOffset(newEndUtc, TimeSpan.Zero));

                return new ItemEffectExecutionResult(true, $"{itemDef.Name} uygulandı: Araştırma süresi kısaltıldı.", new
                {
                    Completed = false,
                    NewEndTimeUtc = DateTime.SpecifyKind(newEndUtc, DateTimeKind.Utc).ToString("O"),
                    RemainingSeconds = newRemaining
                });
            }
        }

        // 5. FIELD EXPANDERS
        if (itemDef.Category.Equals("field", StringComparison.OrdinalIgnoreCase))
        {
            bool isMoonItem = itemDef.ItemKey.Equals("field_moon_8", StringComparison.OrdinalIgnoreCase);

            if (isMoonItem && !planet.IsMoon)
            {
                return new ItemEffectExecutionResult(false, "Ay Alanı İtemı yalnızca Aylarda kullanılabilir.");
            }

            if (!isMoonItem && planet.IsMoon)
            {
                return new ItemEffectExecutionResult(false, "Gezegen Alanı İtemı Aylarda kullanılamaz. Yalnızca Ay Alanı İtemı kullanabilirsiniz.");
            }

            int addedFields = (int)itemDef.EffectValue;
            planet.MaxFields += addedFields;

            await hubContext.Clients.User(user.Id.ToString()).SendAsync("PlanetUpdated", new
            {
                PlanetId = planet.Id,
                planet.MaxFields,
                planet.FieldsUsed
            }, cancellationToken);

            return new ItemEffectExecutionResult(true, $"{itemDef.Name} uygulandı: Toplam alan {addedFields} artırıldı! (Yeni Toplam: {planet.MaxFields})", new
            {
                planet.MaxFields,
                AddedFields = addedFields
            });
        }

        // 6. SPECIAL & EXPANSION ITEMS (Expedition, Scrapper, Lifeforms)
        if (itemDef.Category.Equals("special", StringComparison.OrdinalIgnoreCase))
        {
            if (itemDef.ItemKey.Equals("expedition_slots_computer", StringComparison.OrdinalIgnoreCase))
            {
                await ApplyUserBuffAsync("ExpeditionSlots", 2.0, 7, itemDef, user, dbContext, cancellationToken);
                return new ItemEffectExecutionResult(true, "Keşif Bilgisayarı aktif edildi! 7 gün boyunca +2 ilave Keşif Slotu kazandınız.");
            }

            if (itemDef.ItemKey.Equals("expedition_turbo", StringComparison.OrdinalIgnoreCase))
            {
                await ApplyUserBuffAsync("ExpeditionTurbo", 0.50, 7, itemDef, user, dbContext, cancellationToken);
                return new ItemEffectExecutionResult(true, "Keşif Turbo Hızlandırıcısı aktif edildi! 7 gün boyunca tüm keşif uçuş süreleri %50 kısaltıldı.");
            }

            if (itemDef.ItemKey.Equals("expedition_resource_booster", StringComparison.OrdinalIgnoreCase))
            {
                await ApplyUserBuffAsync("ExpeditionResource", 0.30, 7, itemDef, user, dbContext, cancellationToken);
                return new ItemEffectExecutionResult(true, "Keşif Hammadde Güçlendiricisi aktif edildi! 7 gün boyunca keşif ganimetleri +%30 artırıldı.");
            }

            if (itemDef.ItemKey.Equals("scrapper_rate_boost", StringComparison.OrdinalIgnoreCase))
            {
                await ApplyUserBuffAsync("ScrapMerchantOffer", 0.75, 3, itemDef, user, dbContext, cancellationToken);
                return new ItemEffectExecutionResult(true, "Hurdacı Özel Teklifi aktif edildi! 3 gün boyunca hurda geri dönüşüm oranı %75 sabitlendi.");
            }

            if (itemDef.ItemKey.Equals("lifeforms_xp_booster", StringComparison.OrdinalIgnoreCase))
            {
                var state = PlanetEndpoints.PlanetLifeformsStore.GetOrAdd(planet.Id, _ => PlanetEndpoints.CreatePlanetLifeformState(planet));
                state.CurrentXp += 1500;
                while (state.CurrentXp >= state.MaxXp)
                {
                    state.CurrentXp -= state.MaxXp;
                    state.SpeciesLevel += 1;
                    state.MaxXp = (int)(state.MaxXp * 1.5);
                }

                return new ItemEffectExecutionResult(true, $"{planet.Name} üzerindeki {state.ActiveSpecies} ırkına +1.500 XP eklendi! (Seviye: {state.SpeciesLevel}, XP: {state.CurrentXp}/{state.MaxXp})", new
                {
                    state.SpeciesLevel,
                    state.CurrentXp,
                    state.MaxXp
                });
            }

            if (itemDef.ItemKey.Equals("lifeforms_detroid", StringComparison.OrdinalIgnoreCase))
            {
                return await ApplyLifeformReductionAsync(itemDef, planet, user, hubContext, isBuilding: true, cancellationToken);
            }

            if (itemDef.ItemKey.Equals("lifeforms_newtron", StringComparison.OrdinalIgnoreCase))
            {
                return await ApplyLifeformReductionAsync(itemDef, planet, user, hubContext, isBuilding: false, cancellationToken);
            }
        }

        // 7. LEGACY LIFEFORMS DETROID
        if (itemDef.Category.Equals("lifeform", StringComparison.OrdinalIgnoreCase))
        {
            return await ApplyLifeformReductionAsync(itemDef, planet, user, hubContext, isBuilding: true, cancellationToken);
        }

        return new ItemEffectExecutionResult(false, "Bilinmeyen eşya kategorisi.");
    }

    private static async Task ApplyUserBuffAsync(
        string buffType,
        double value,
        int days,
        ShopCatalogItemDef itemDef,
        User user,
        IApplicationDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var existing = await dbContext.UserActiveBuffs
            .FirstOrDefaultAsync(b => b.UserId == user.Id && b.BuffType == buffType, cancellationToken);

        var expires = now.AddDays(days);
        if (existing is not null)
        {
            existing.Value = value;
            existing.ExpiresAtUtc = expires;
            existing.ItemKey = itemDef.ItemKey;
            existing.Tier = itemDef.Tier;
        }
        else
        {
            dbContext.UserActiveBuffs.Add(new UserActiveBuff
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                BuffType = buffType,
                Value = value,
                ExpiresAtUtc = expires,
                ItemKey = itemDef.ItemKey,
                Tier = itemDef.Tier,
                CreatedAtUtc = now
            });
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static async Task<ItemEffectExecutionResult> ApplyLifeformReductionAsync(
        ShopCatalogItemDef itemDef,
        Planet planet,
        User user,
        IHubContext<GameHub> hubContext,
        bool isBuilding,
        CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        if (planet.IsMoon)
        {
            return new ItemEffectExecutionResult(false, "Canlı türü binaları ve araştırmaları Aylarda bulunmaz.");
        }

        var state = PlanetEndpoints.PlanetLifeformsStore.GetOrAdd(planet.Id, _ => PlanetEndpoints.CreatePlanetLifeformState(planet));
        PlanetEndpoints.EvaluateLifeformQueueCompletion(state, now);

        if (state.ActiveQueue is null)
        {
            return new ItemEffectExecutionResult(false, "Bu gezegende devam eden aktif bir canlı türü inşası bulunamadı.");
        }

        if (!DateTime.TryParse(state.ActiveQueue.EndTimeUtc, null, System.Globalization.DateTimeStyles.RoundtripKind, out var endUtc))
        {
            return new ItemEffectExecutionResult(false, "Canlı türü kuyruk bitiş zamanı okunamadı.");
        }

        double remainingSeconds = Math.Max(0, (endUtc - now).TotalSeconds);
        var (isInstant, newRemaining) = ConstructionShopFormulas.CalculateQueueReduction(remainingSeconds, itemDef.EffectValue);

        if (isInstant || newRemaining <= 2.0)
        {
            string buildingKey = state.ActiveQueue.BuildingKey;
            int targetLevel = state.ActiveQueue.TargetLevel;
            string buildingName = state.ActiveQueue.BuildingName;

            state.BuildingLevels[buildingKey] = targetLevel;
            state.ActiveQueue = null;

            await hubContext.Clients.User(user.Id.ToString()).SendAsync("QueueCompleted", new
            {
                Type = "Lifeform",
                PlanetId = planet.Id,
                BuildingKey = buildingKey,
                NewLevel = targetLevel
            }, cancellationToken);

            return new ItemEffectExecutionResult(true, $"{itemDef.Name} uygulandı: {buildingName} Seviye {targetLevel} tamamlandı!", new
            {
                Completed = true,
                BuildingKey = buildingKey,
                NewLevel = targetLevel
            });
        }
        else
        {
            var newEndUtc = now.AddSeconds(newRemaining);
            state.ActiveQueue = state.ActiveQueue with
            {
                EndTimeUtc = DateTime.SpecifyKind(newEndUtc, DateTimeKind.Utc).ToString("O")
            };

            return new ItemEffectExecutionResult(true, $"{itemDef.Name} uygulandı: Canlı türü süresi kısaltıldı.", new
            {
                Completed = false,
                NewEndTimeUtc = DateTime.SpecifyKind(newEndUtc, DateTimeKind.Utc).ToString("O"),
                RemainingSeconds = newRemaining
            });
        }
    }

    private static List<ShopCatalogItemDef> GetAllUnifiedCatalog()
    {
        var list = ShopCatalogFormulas.GetCatalog().ToList();

        // Also add the canonical field items if not already in list
        foreach (var c in ConstructionShopFormulas.GetCatalog())
        {
            if (c.Category == "field" && !list.Any(i => i.ItemKey.Equals(c.ItemKey, StringComparison.OrdinalIgnoreCase)))
            {
                list.Add(new ShopCatalogItemDef(
                    ItemKey: c.ItemKey,
                    Name: c.Name,
                    Category: "field",
                    Tier: c.Tier,
                    DurationDays: 0,
                    EffectValue: c.EffectValue,
                    BaseCostDarkMatter: c.BaseCostDarkMatter,
                    DiscountCostDarkMatter: c.DiscountCostDarkMatter,
                    IsDiscountActive: c.IsDiscountActive,
                    Description: c.Description,
                    TargetSummary: c.TargetSummary
                ));
            }
        }

        return list;
    }

    private static ShopCatalogItemDef? FindUnifiedItem(string itemKey)
    {
        var found = ShopCatalogFormulas.FindItem(itemKey);
        if (found is not null) return found;

        var constructionItem = ConstructionShopFormulas.FindItem(itemKey);
        if (constructionItem is not null)
        {
            return new ShopCatalogItemDef(
                ItemKey: constructionItem.ItemKey,
                Name: constructionItem.Name,
                Category: constructionItem.Category,
                Tier: constructionItem.Tier,
                DurationDays: 0,
                EffectValue: constructionItem.EffectValue,
                BaseCostDarkMatter: constructionItem.BaseCostDarkMatter,
                DiscountCostDarkMatter: constructionItem.DiscountCostDarkMatter,
                IsDiscountActive: constructionItem.IsDiscountActive,
                Description: constructionItem.Description,
                TargetSummary: constructionItem.TargetSummary
            );
        }

        var master = ShopMasterCatalogFormulas.FindItem(itemKey);
        if (master is not null)
        {
            return new ShopCatalogItemDef(
                ItemKey: master.ItemKey,
                Name: master.Name,
                Category: master.PrimaryCategory,
                Tier: master.Tier,
                DurationDays: master.DurationDays,
                EffectValue: master.EffectValue,
                BaseCostDarkMatter: master.BaseCostDarkMatter,
                DiscountCostDarkMatter: master.DiscountCostDarkMatter,
                IsDiscountActive: master.IsDiscountActive,
                Description: master.Description,
                TargetSummary: master.TargetSummary
            );
        }

        return null;
    }
}
