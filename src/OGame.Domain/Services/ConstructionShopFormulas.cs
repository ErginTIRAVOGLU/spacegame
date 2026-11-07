namespace OGame.Domain.Services;

public record ShopConstructionItemDef(
    string ItemKey,
    string Name,
    string Category, // "construction", "field", "lifeform"
    string Tier,     // "Bronze", "Silver", "Gold", "Platinum"
    double EffectValue,
    int BaseCostDarkMatter,
    int DiscountCostDarkMatter,
    bool IsDiscountActive,
    string Description,
    string TargetSummary);

public static class ConstructionShopFormulas
{
    private static readonly List<ShopConstructionItemDef> Catalog =
    [
        // Kraken Serisi (İnşaat Hızlandırıcıları)
        new(
            ItemKey: "kraken_bronze_30m",
            Name: "Bronz Kraken (30 Dakika)",
            Category: "construction",
            Tier: "Bronze",
            EffectValue: 1800, // 30 dk
            BaseCostDarkMatter: 5000,
            DiscountCostDarkMatter: 4000,
            IsDiscountActive: false,
            Description: "Gezegende devam eden bina inşasının kalan süresini 30 dakika kısaltır.",
            TargetSummary: "-30 Dk Bina İnşa Süresi"),

        new(
            ItemKey: "kraken_bronze_2h",
            Name: "Bronz Kraken (2 Saat)",
            Category: "construction",
            Tier: "Bronze",
            EffectValue: 7200, // 2 saat
            BaseCostDarkMatter: 15000,
            DiscountCostDarkMatter: 12000,
            IsDiscountActive: false,
            Description: "Gezegende devam eden bina inşasının kalan süresini 2 saat kısaltır.",
            TargetSummary: "-2 Saat Bina İnşa Süresi"),

        new(
            ItemKey: "kraken_silver_6h",
            Name: "Gümüş Kraken (6 Saat)",
            Category: "construction",
            Tier: "Silver",
            EffectValue: 21600, // 6 saat
            BaseCostDarkMatter: 35000,
            DiscountCostDarkMatter: 28000,
            IsDiscountActive: false,
            Description: "Gezegende devam eden bina inşasının kalan süresini 6 saat kısaltır.",
            TargetSummary: "-6 Saat Bina İnşa Süresi"),

        new(
            ItemKey: "kraken_gold_12h",
            Name: "Altın Kraken (12 Saat)",
            Category: "construction",
            Tier: "Gold",
            EffectValue: 43200, // 12 saat
            BaseCostDarkMatter: 65000,
            DiscountCostDarkMatter: 52000,
            IsDiscountActive: false,
            Description: "Gezegende devam eden bina inşasının kalan süresini 12 saat kısaltır.",
            TargetSummary: "-12 Saat Bina İnşa Süresi"),

        new(
            ItemKey: "kraken_platinum_24h",
            Name: "Platin Kraken (24 Saat / Anında)",
            Category: "construction",
            Tier: "Platinum",
            EffectValue: 86400, // 24 saat
            BaseCostDarkMatter: 100000,
            DiscountCostDarkMatter: 80000,
            IsDiscountActive: false,
            Description: "Gezegende devam eden bina inşasının kalan süresini 24 saat kısaltır veya anında tamamlar.",
            TargetSummary: "-24 Saat / Anında Tamamlama"),

        // Alan Genişleticiler (Fields)
        new(
            ItemKey: "field_bronze_4",
            Name: "Bronz Gezegen Alanı (+4)",
            Category: "field",
            Tier: "Bronze",
            EffectValue: 4,
            BaseCostDarkMatter: 50000,
            DiscountCostDarkMatter: 40000,
            IsDiscountActive: false,
            Description: "Gezegenin toplam inşa edilebilir bina alanını kalıcı olarak 4 artırır.",
            TargetSummary: "+4 Gezegen Alanı"),

        new(
            ItemKey: "field_silver_9",
            Name: "Gümüş Gezegen Alanı (+9)",
            Category: "field",
            Tier: "Silver",
            EffectValue: 9,
            BaseCostDarkMatter: 120000,
            DiscountCostDarkMatter: 96000,
            IsDiscountActive: false,
            Description: "Gezegenin toplam inşa edilebilir bina alanını kalıcı olarak 9 artırır.",
            TargetSummary: "+9 Gezegen Alanı"),

        new(
            ItemKey: "field_gold_15",
            Name: "Altın Gezegen Alanı (+15)",
            Category: "field",
            Tier: "Gold",
            EffectValue: 15,
            BaseCostDarkMatter: 220000,
            DiscountCostDarkMatter: 176000,
            IsDiscountActive: false,
            Description: "Gezegenin toplam inşa edilebilir bina alanını kalıcı olarak 15 artırır.",
            TargetSummary: "+15 Gezegen Alanı"),

        new(
            ItemKey: "field_platinum_20",
            Name: "Platin Gezegen Alanı (+20)",
            Category: "field",
            Tier: "Platinum",
            EffectValue: 20,
            BaseCostDarkMatter: 350000,
            DiscountCostDarkMatter: 280000,
            IsDiscountActive: false,
            Description: "Gezegenin toplam inşa edilebilir bina alanını kalıcı olarak 20 artırır.",
            TargetSummary: "+20 Gezegen Alanı"),

        new(
            ItemKey: "field_moon_8",
            Name: "Ay Alanı İtemı (+8)",
            Category: "field",
            Tier: "Gold",
            EffectValue: 8,
            BaseCostDarkMatter: 130000,
            DiscountCostDarkMatter: 104000,
            IsDiscountActive: false,
            Description: "Ayın toplam inşa edilebilir bina alanını kalıcı olarak 8 artırır. Yalnızca aylarda kullanılabilir.",
            TargetSummary: "+8 Ay Alanı (Özel)"),

        // Yaşam Formu Hızlandırıcıları (Lifeforms Detroid)
        new(
            ItemKey: "detroid_bronze_30m",
            Name: "Bronz Yaşam Formu Detroid (30 Dakika)",
            Category: "lifeform",
            Tier: "Bronze",
            EffectValue: 1800,
            BaseCostDarkMatter: 6000,
            DiscountCostDarkMatter: 4800,
            IsDiscountActive: false,
            Description: "Devam eden canlı türü bina inşasının süresini 30 dakika kısaltır.",
            TargetSummary: "-30 Dk Yaşam Formu Süresi"),

        new(
            ItemKey: "detroid_silver_2h",
            Name: "Gümüş Yaşam Formu Detroid (2 Saat)",
            Category: "lifeform",
            Tier: "Silver",
            EffectValue: 7200,
            BaseCostDarkMatter: 18000,
            DiscountCostDarkMatter: 14400,
            IsDiscountActive: false,
            Description: "Devam eden canlı türü bina inşasının süresini 2 saat kısaltır.",
            TargetSummary: "-2 Saat Yaşam Formu Süresi"),

        new(
            ItemKey: "detroid_gold_6h",
            Name: "Altın Yaşam Formu Detroid (6 Saat)",
            Category: "lifeform",
            Tier: "Gold",
            EffectValue: 21600,
            BaseCostDarkMatter: 40000,
            DiscountCostDarkMatter: 32000,
            IsDiscountActive: false,
            Description: "Devam eden canlı türü bina inşasının süresini 6 saat kısaltır.",
            TargetSummary: "-6 Saat Yaşam Formu Süresi"),

        new(
            ItemKey: "detroid_platinum_24h",
            Name: "Platin Yaşam Formu Detroid (24 Saat)",
            Category: "lifeform",
            Tier: "Platinum",
            EffectValue: 86400,
            BaseCostDarkMatter: 120000,
            DiscountCostDarkMatter: 96000,
            IsDiscountActive: false,
            Description: "Devam eden canlı türü bina inşasının süresini 24 saat kısaltır.",
            TargetSummary: "-24 Saat / Anında Tamamlama")
    ];

    public static IReadOnlyList<ShopConstructionItemDef> GetCatalog() => Catalog;

    public static ShopConstructionItemDef? FindItem(string itemKey)
    {
        var existing = Catalog.FirstOrDefault(i => i.ItemKey.Equals(itemKey, StringComparison.OrdinalIgnoreCase));
        if (existing is not null) return existing;

        var fullDef = ShopCatalogFormulas.FindItem(itemKey);
        if (fullDef is not null)
        {
            return new ShopConstructionItemDef(
                ItemKey: fullDef.ItemKey,
                Name: fullDef.Name,
                Category: fullDef.Category,
                Tier: fullDef.Tier,
                EffectValue: fullDef.EffectValue,
                BaseCostDarkMatter: fullDef.BaseCostDarkMatter,
                DiscountCostDarkMatter: fullDef.DiscountCostDarkMatter,
                IsDiscountActive: fullDef.IsDiscountActive,
                Description: fullDef.Description,
                TargetSummary: fullDef.TargetSummary
            );
        }

        return null;
    }

    public static (bool IsInstantComplete, double NewRemainingSeconds) CalculateQueueReduction(
        double remainingSeconds,
        double reductionSeconds)
    {
        if (remainingSeconds <= reductionSeconds)
        {
            return (true, 0.0);
        }

        return (false, remainingSeconds - reductionSeconds);
    }
}

