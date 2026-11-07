namespace OGame.Domain.Services;

public record ShopCatalogItemDef(
    string ItemKey,
    string Name,
    string Category, // "resource", "construction", "shipyard", "research", "special"
    string Tier,     // "Bronze", "Silver", "Gold", "Platinum"
    int DurationDays, // 0 for instant/permanent, >0 for active buffs/boosters
    double EffectValue, // Multiplier (0.10, 0.20, etc.) or seconds (1800, 7200, etc.) or count/xp
    int BaseCostDarkMatter,
    int DiscountCostDarkMatter,
    bool IsDiscountActive,
    string Description,
    string TargetSummary);

public static class ShopCatalogFormulas
{
    private static readonly List<ShopCatalogItemDef> FullCatalog = GenerateCatalog();

    private static List<ShopCatalogItemDef> GenerateCatalog()
    {
        var list = new List<ShopCatalogItemDef>(71);

        // -------------------------------------------------------------
        // A. HAMMADDE GÜÇLENDİRİCİLERİ (36 Ürün)
        // -------------------------------------------------------------
        var resources = new[]
        {
            ("metal", "Metal", "Metal Madeni"),
            ("crystal", "Kristal", "Kristal Madeni"),
            ("deut", "Döteryum", "Döteryum Sentezleyicisi")
        };

        var tiers = new[]
        {
            ("bronze", "Bronz", 0.10, 2500, 8500, 20000),
            ("silver", "Gümüş", 0.20, 6500, 20000, 48000),
            ("gold", "Altın", 0.30, 13000, 40000, 95000),
            ("platinum", "Platin", 0.40, 25000, 75000, 180000)
        };

        var durations = new[]
        {
            (7, "7 Gün", 0),
            (30, "30 Gün", 1),
            (90, "90 Gün", 2)
        };

        foreach (var (resKey, resName, buildingName) in resources)
        {
            // Deut is slightly higher cost
            int deutCostSurcharge = resKey == "deut" ? 120 : 100;

            foreach (var (tierKey, tierName, boostRatio, cost7, cost30, cost90) in tiers)
            {
                int[] costs = [cost7, cost30, cost90];

                foreach (var (days, daysLabel, costIdx) in durations)
                {
                    int baseCost = (costs[costIdx] * deutCostSurcharge) / 100;
                    int discountCost = (int)(baseCost * 0.80);
                    int percent = (int)(boostRatio * 100);

                    list.Add(new ShopCatalogItemDef(
                        ItemKey: $"booster_{resKey}_{tierKey}_{days}d",
                        Name: $"{tierName} {resName} Güçlendirici ({daysLabel})",
                        Category: "resource",
                        Tier: Capitalize(tierKey),
                        DurationDays: days,
                        EffectValue: boostRatio,
                        BaseCostDarkMatter: baseCost,
                        DiscountCostDarkMatter: discountCost,
                        IsDiscountActive: false,
                        Description: $"{buildingName} temel üretimini {daysLabel} boyunca +%{percent} artırır. Gezegende aynı anda yalnızca bir {resName} güçlendirici aktif olabilir.",
                        TargetSummary: $"+%{percent} {resName} Üretimi ({daysLabel})"
                    ));
                }
            }
        }

        // -------------------------------------------------------------
        // B. İNŞAAT HIZLANDIRICILARI (Kraken - 12 Ürün)
        // -------------------------------------------------------------
        var krakenDefs = new[]
        {
            ("bronze_30m", "Bronz Kraken (30 Dakika)", "Bronze", 1800, 5000, "-30 Dk Bina İnşa Süresi"),
            ("bronze_2h", "Bronz Kraken (2 Saat)", "Bronze", 7200, 15000, "-2 Saat Bina İnşa Süresi"),
            ("bronze_6h", "Bronz Kraken (6 Saat)", "Bronze", 21600, 30000, "-6 Saat Bina İnşa Süresi"),

            ("silver_30m", "Gümüş Kraken (30 Dakika)", "Silver", 1800, 8000, "-30 Dk Bina İnşa Süresi"),
            ("silver_2h", "Gümüş Kraken (2 Saat)", "Silver", 7200, 22000, "-2 Saat Bina İnşa Süresi"),
            ("silver_6h", "Gümüş Kraken (6 Saat)", "Silver", 21600, 45000, "-6 Saat Bina İnşa Süresi"),

            ("gold_2h", "Altın Kraken (2 Saat)", "Gold", 7200, 30000, "-2 Saat Bina İnşa Süresi"),
            ("gold_6h", "Altın Kraken (6 Saat)", "Gold", 21600, 65000, "-6 Saat Bina İnşa Süresi"),
            ("gold_12h", "Altın Kraken (12 Saat)", "Gold", 43200, 100000, "-12 Saat Bina İnşa Süresi"),

            ("platinum_6h", "Platin Kraken (6 Saat)", "Platinum", 21600, 80000, "-6 Saat Bina İnşa Süresi"),
            ("platinum_12h", "Platin Kraken (12 Saat)", "Platinum", 43200, 140000, "-12 Saat Bina İnşa Süresi"),
            ("platinum_24h", "Platin Kraken (24 Saat / Anında)", "Platinum", 86400, 200000, "-24 Saat / Anında Tamamlama")
        };

        foreach (var (key, name, tier, seconds, cost, summary) in krakenDefs)
        {
            list.Add(new ShopCatalogItemDef(
                ItemKey: $"kraken_{key}",
                Name: name,
                Category: "construction",
                Tier: tier,
                DurationDays: 0,
                EffectValue: seconds,
                BaseCostDarkMatter: cost,
                DiscountCostDarkMatter: (int)(cost * 0.80),
                IsDiscountActive: false,
                Description: $"Gezegende devam eden bina inşasının kalan süresini {summary.Replace("-", "")} kısaltır veya anında tamamlar.",
                TargetSummary: summary
            ));
        }

        // -------------------------------------------------------------
        // C. TERSANE HIZLANDIRICILARI (Detroid - 12 Ürün)
        // -------------------------------------------------------------
        var detroidDefs = new[]
        {
            ("bronze_30m", "Bronz Detroid (30 Dakika)", "Bronze", 1800, 5000, "-30 Dk Tersane Süresi"),
            ("bronze_2h", "Bronz Detroid (2 Saat)", "Bronze", 7200, 15000, "-2 Saat Tersane Süresi"),
            ("bronze_6h", "Bronz Detroid (6 Saat)", "Bronze", 21600, 30000, "-6 Saat Tersane Süresi"),

            ("silver_30m", "Gümüş Detroid (30 Dakika)", "Silver", 1800, 8000, "-30 Dk Tersane Süresi"),
            ("silver_2h", "Gümüş Detroid (2 Saat)", "Silver", 7200, 22000, "-2 Saat Tersane Süresi"),
            ("silver_6h", "Gümüş Detroid (6 Saat)", "Silver", 21600, 45000, "-6 Saat Tersane Süresi"),

            ("gold_2h", "Altın Detroid (2 Saat)", "Gold", 7200, 30000, "-2 Saat Tersane Süresi"),
            ("gold_6h", "Altın Detroid (6 Saat)", "Gold", 21600, 65000, "-6 Saat Tersane Süresi"),
            ("gold_12h", "Altın Detroid (12 Saat)", "Gold", 43200, 100000, "-12 Saat Tersane Süresi"),

            ("platinum_6h", "Platin Detroid (6 Saat)", "Platinum", 21600, 80000, "-6 Saat Tersane Süresi"),
            ("platinum_12h", "Platin Detroid (12 Saat)", "Platinum", 43200, 140000, "-12 Saat Tersane Süresi"),
            ("platinum_24h", "Platin Detroid (24 Saat / Anında)", "Platinum", 86400, 200000, "-24 Saat / Anında Tersane")
        };

        foreach (var (key, name, tier, seconds, cost, summary) in detroidDefs)
        {
            list.Add(new ShopCatalogItemDef(
                ItemKey: $"detroid_ship_{key}",
                Name: name,
                Category: "shipyard",
                Tier: tier,
                DurationDays: 0,
                EffectValue: seconds,
                BaseCostDarkMatter: cost,
                DiscountCostDarkMatter: (int)(cost * 0.80),
                IsDiscountActive: false,
                Description: $"Tersanede devam eden gemi ve savunma inşaatının toplam süresini {summary.Replace("-", "")} kısaltır.",
                TargetSummary: summary
            ));
        }

        // -------------------------------------------------------------
        // D. ARAŞTIRMA HIZLANDIRICILARI (Newtron - 12 Ürün)
        // -------------------------------------------------------------
        var newtronDefs = new[]
        {
            ("bronze_30m", "Bronz Newtron (30 Dakika)", "Bronze", 1800, 6000, "-30 Dk Araştırma Süresi"),
            ("bronze_2h", "Bronz Newtron (2 Saat)", "Bronze", 7200, 18000, "-2 Saat Araştırma Süresi"),
            ("bronze_6h", "Bronz Newtron (6 Saat)", "Bronze", 21600, 35000, "-6 Saat Araştırma Süresi"),

            ("silver_30m", "Gümüş Newtron (30 Dakika)", "Silver", 1800, 10000, "-30 Dk Araştırma Süresi"),
            ("silver_2h", "Gümüş Newtron (2 Saat)", "Silver", 7200, 26000, "-2 Saat Araştırma Süresi"),
            ("silver_6h", "Gümüş Newtron (6 Saat)", "Silver", 21600, 50000, "-6 Saat Araştırma Süresi"),

            ("gold_2h", "Altın Newtron (2 Saat)", "Gold", 7200, 35000, "-2 Saat Araştırma Süresi"),
            ("gold_6h", "Altın Newtron (6 Saat)", "Gold", 21600, 75000, "-6 Saat Araştırma Süresi"),
            ("gold_12h", "Altın Newtron (12 Saat)", "Gold", 43200, 120000, "-12 Saat Araştırma Süresi"),

            ("platinum_6h", "Platin Newtron (6 Saat)", "Platinum", 21600, 95000, "-6 Saat Araştırma Süresi"),
            ("platinum_12h", "Platin Newtron (12 Saat)", "Platinum", 43200, 160000, "-12 Saat Araştırma Süresi"),
            ("platinum_24h", "Platin Newtron (24 Saat / Anında)", "Platinum", 86400, 240000, "-24 Saat / Anında Araştırma")
        };

        foreach (var (key, name, tier, seconds, cost, summary) in newtronDefs)
        {
            list.Add(new ShopCatalogItemDef(
                ItemKey: $"newtron_{key}",
                Name: name,
                Category: "research",
                Tier: tier,
                DurationDays: 0,
                EffectValue: seconds,
                BaseCostDarkMatter: cost,
                DiscountCostDarkMatter: (int)(cost * 0.80),
                IsDiscountActive: false,
                Description: $"Laboratuvarda devam eden teknoloji araştırmasının süresini {summary.Replace("-", "")} kısaltır veya anında tamamlar.",
                TargetSummary: summary
            ));
        }

        // -------------------------------------------------------------
        // E. GÜNCEL EKLENEN YENİ DÜKKAN ÖĞELERİ (7 Ürün)
        // -------------------------------------------------------------
        list.Add(new ShopCatalogItemDef(
            ItemKey: "expedition_slots_computer",
            Name: "Keşif Bilgisayarı (+2 Keşif Slotu)",
            Category: "special",
            Tier: "Platinum",
            DurationDays: 7,
            EffectValue: 2,
            BaseCostDarkMatter: 80000,
            DiscountCostDarkMatter: 64000,
            IsDiscountActive: false,
            Description: "Aktif olduğu 7 gün boyunca imparatorluğunuza +2 ilave keşif filosu slotu tahsis eder.",
            TargetSummary: "+2 Keşif Slotu (7 Gün)"
        ));

        list.Add(new ShopCatalogItemDef(
            ItemKey: "expedition_turbo",
            Name: "Keşif Turbo Hızlandırıcısı (%50 Hız)",
            Category: "special",
            Tier: "Gold",
            DurationDays: 7,
            EffectValue: 0.50,
            BaseCostDarkMatter: 60000,
            DiscountCostDarkMatter: 48000,
            IsDiscountActive: false,
            Description: "7 gün boyunca gönderilen tüm keşif görevlerinin uçuş süresini %50 kısaltır.",
            TargetSummary: "%50 Keşif Uçuş Hızı (7 Gün)"
        ));

        list.Add(new ShopCatalogItemDef(
            ItemKey: "expedition_resource_booster",
            Name: "Keşif Hammadde Güçlendiricisi (+%30)",
            Category: "special",
            Tier: "Gold",
            DurationDays: 7,
            EffectValue: 0.30,
            BaseCostDarkMatter: 75000,
            DiscountCostDarkMatter: 60000,
            IsDiscountActive: false,
            Description: "7 gün boyunca keşiflerden elde edilen metal, kristal ve döteryum ganimetlerini %30 artırır.",
            TargetSummary: "+%30 Keşif Ganimeti (7 Gün)"
        ));

        list.Add(new ShopCatalogItemDef(
            ItemKey: "scrapper_rate_boost",
            Name: "Hurdacı Özel Teklifi (%75 Geri Dönüşüm)",
            Category: "special",
            Tier: "Silver",
            DurationDays: 3,
            EffectValue: 0.75,
            BaseCostDarkMatter: 50000,
            DiscountCostDarkMatter: 40000,
            IsDiscountActive: false,
            Description: "Hurdacıdaki hurda geri dönüşüm oranını 3 gün boyunca taban orandan %75 sabit orana yükseltir.",
            TargetSummary: "%75 Sabit Hurda Oranı (3 Gün)"
        ));

        list.Add(new ShopCatalogItemDef(
            ItemKey: "lifeforms_newtron",
            Name: "Yaşam Formu Newtron (4 Saat)",
            Category: "special",
            Tier: "Silver",
            DurationDays: 0,
            EffectValue: 14400, // 4 saat
            BaseCostDarkMatter: 30000,
            DiscountCostDarkMatter: 24000,
            IsDiscountActive: false,
            Description: "Devam eden canlı türü teknoloji araştırmasının kalan süresini 4 saat kısaltır.",
            TargetSummary: "-4 Saat Yaşam Formu Teknoloji"
        ));

        list.Add(new ShopCatalogItemDef(
            ItemKey: "lifeforms_detroid",
            Name: "Yaşam Formu Detroid (4 Saat)",
            Category: "special",
            Tier: "Silver",
            DurationDays: 0,
            EffectValue: 14400, // 4 saat
            BaseCostDarkMatter: 30000,
            DiscountCostDarkMatter: 24000,
            IsDiscountActive: false,
            Description: "Gezegende devam eden canlı türü bina inşaatının süresini 4 saat kısaltır.",
            TargetSummary: "-4 Saat Yaşam Formu Bina"
        ));

        list.Add(new ShopCatalogItemDef(
            ItemKey: "lifeforms_xp_booster",
            Name: "Yaşam Formu Deneyim Paketi (+1.500 XP)",
            Category: "special",
            Tier: "Gold",
            DurationDays: 0,
            EffectValue: 1500,
            BaseCostDarkMatter: 40000,
            DiscountCostDarkMatter: 32000,
            IsDiscountActive: false,
            Description: "Gezegendeki aktif canlı türü ırkına anında 1.500 Deneyim Puanı (XP) kazandırır.",
            TargetSummary: "+1.500 Canlı Türü XP"
        ));

        return list;
    }

    public static IReadOnlyList<ShopCatalogItemDef> GetCatalog() => FullCatalog;

    public static ShopCatalogItemDef? FindItem(string itemKey) =>
        FullCatalog.FirstOrDefault(i => i.ItemKey.Equals(itemKey, StringComparison.OrdinalIgnoreCase));

    public static IEnumerable<ShopCatalogItemDef> GetItemsByCategory(string category) =>
        category.Equals("all", StringComparison.OrdinalIgnoreCase)
            ? FullCatalog
            : FullCatalog.Where(i => i.Category.Equals(category, StringComparison.OrdinalIgnoreCase));

    private static string Capitalize(string str)
    {
        if (string.IsNullOrEmpty(str)) return str;
        return char.ToUpperInvariant(str[0]) + str[1..].ToLowerInvariant();
    }
}

