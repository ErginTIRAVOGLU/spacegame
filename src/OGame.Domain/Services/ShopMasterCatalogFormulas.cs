namespace OGame.Domain.Services;

using OGame.Domain.Entities;
using OGame.Domain.Enums;

public record ShopMasterItemDef(
    string ItemKey,
    string Name,
    string PrimaryCategory,
    IReadOnlyList<string> Categories,
    string Tier,
    string Duration,
    int DurationDays,
    double EffectValue,
    int BaseCostDarkMatter,
    int DiscountCostDarkMatter,
    bool IsDiscountActive,
    string Description,
    string TargetSummary,
    string IconKey,
    double MetalAmount = 0,
    double CrystalAmount = 0,
    double DeuteriumAmount = 0
)
{
    public int EffectiveCostDarkMatter => IsDiscountActive ? DiscountCostDarkMatter : BaseCostDarkMatter;
}

public static class ShopMasterCatalogFormulas
{
    public const string WarningStorageOverflow =
        "Dikkat: Yeterli depo alanın yok! Paketi şimdi etkinleştirirsen, ancak depolarının alabildiği kadar kaynak alırsın. Fazlalıklar geçerliliğini yitirir.";

    private static readonly List<ShopMasterItemDef> MasterList = BuildCatalog();

    public static IReadOnlyList<ShopMasterItemDef> GetAllItems() => MasterList;

    public static IReadOnlyList<ShopMasterItemDef> GetItemsByCategory(string? category)
    {
        if (string.IsNullOrWhiteSpace(category) || category.Equals("all", StringComparison.OrdinalIgnoreCase) || category.Equals("hepsi", StringComparison.OrdinalIgnoreCase))
        {
            return MasterList;
        }

        string catNormalized = NormalizeCategoryKey(category);
        return MasterList.Where(item => item.Categories.Any(c => c.Equals(catNormalized, StringComparison.OrdinalIgnoreCase))).ToList();
    }

    public static ShopMasterItemDef? FindItem(string itemKey) =>
        MasterList.FirstOrDefault(i => i.ItemKey.Equals(itemKey, StringComparison.OrdinalIgnoreCase));

    public static Dictionary<string, int> GetCategoryCounts()
    {
        return new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase)
        {
            ["special"] = MasterList.Count(i => i.Categories.Contains("special", StringComparer.OrdinalIgnoreCase)),
            ["classes"] = MasterList.Count(i => i.Categories.Contains("classes", StringComparer.OrdinalIgnoreCase)),
            ["construction"] = MasterList.Count(i => i.Categories.Contains("construction", StringComparer.OrdinalIgnoreCase)),
            ["resources"] = MasterList.Count(i => i.Categories.Contains("resources", StringComparer.OrdinalIgnoreCase)),
            ["boosters-30d"] = MasterList.Count(i => i.Categories.Contains("boosters-30d", StringComparer.OrdinalIgnoreCase)),
            ["boosters-90d"] = MasterList.Count(i => i.Categories.Contains("boosters-90d", StringComparer.OrdinalIgnoreCase)),
            ["profile"] = MasterList.Count(i => i.Categories.Contains("profile", StringComparer.OrdinalIgnoreCase)),
            ["all"] = MasterList.Count // 176 unique items
        };
    }

    public static (bool HasOverflow, string? WarningMessage, double MetalOverflow, double CrystalOverflow, double DeutOverflow) CheckStorageOverflow(
        ShopMasterItemDef item,
        Planet planet)
    {
        if (item.MetalAmount <= 0 && item.CrystalAmount <= 0 && item.DeuteriumAmount <= 0)
        {
            return (false, null, 0, 0, 0);
        }

        int metalStorageLvl = planet.Buildings?.FirstOrDefault(b => b.BuildingType == BuildingType.MetalStorage)?.Level ?? 0;
        int crystalStorageLvl = planet.Buildings?.FirstOrDefault(b => b.BuildingType == BuildingType.CrystalStorage)?.Level ?? 0;
        int deutTankLvl = planet.Buildings?.FirstOrDefault(b => b.BuildingType == BuildingType.DeuteriumTank)?.Level ?? 0;

        double metalCap = ResourceFormulas.CalculateStorageCapacity(metalStorageLvl);
        double crystalCap = ResourceFormulas.CalculateStorageCapacity(crystalStorageLvl);
        double deutCap = ResourceFormulas.CalculateStorageCapacity(deutTankLvl);

        double metalOverflow = Math.Max(0, (planet.Metal + item.MetalAmount) - metalCap);
        double crystalOverflow = Math.Max(0, (planet.Crystal + item.CrystalAmount) - crystalCap);
        double deutOverflow = Math.Max(0, (planet.Deuterium + item.DeuteriumAmount) - deutCap);

        bool hasOverflow = metalOverflow > 0 || crystalOverflow > 0 || deutOverflow > 0;

        return (
            hasOverflow,
            hasOverflow ? WarningStorageOverflow : null,
            metalOverflow,
            crystalOverflow,
            deutOverflow
        );
    }

    public static string NormalizeCategoryKey(string raw)
    {
        return raw.Trim().ToLowerInvariant() switch
        {
            "özel indirimler" or "ozel indirimler" or "special-offers" or "special" => "special",
            "sınıf seçimi" or "sinif secimi" or "classes" => "classes",
            "inşa" or "insa" or "construction" => "construction",
            "ham maddeler" or "hammaddeler" or "resources" or "resource" => "resources",
            "30 günlük güçlendirici" or "30-gunluk" or "boosters-30d" or "30d" => "boosters-30d",
            "90 günlük güçlendirici" or "90-gunluk" or "boosters-90d" or "90d" => "boosters-90d",
            "profil" or "profile" => "profile",
            _ => "all"
        };
    }

    private static List<ShopMasterItemDef> BuildCatalog()
    {
        var items = new List<ShopMasterItemDef>(185);

        // -----------------------------------------------------------------------------------
        // 1. ÖZEL İNDİRİMLER (4 ÜRÜN)
        // -----------------------------------------------------------------------------------
        items.Add(new ShopMasterItemDef(
            ItemKey: "special_resource_pack_1d",
            Name: "1 Günlük Tam Hammadde Paketi",
            PrimaryCategory: "special",
            Categories: ["special"],
            Tier: "Gold",
            Duration: "hemen",
            DurationDays: 0,
            EffectValue: 24,
            BaseCostDarkMatter: 120000,
            DiscountCostDarkMatter: 84000,
            IsDiscountActive: true,
            Description: "Gezegenin 24 saatlik maden üretimini depoların alabildiği azami sınıra kadar anında doldurur. Depo aşımı durumunda taşan hammadde ziyan olur.",
            TargetSummary: "+24s Tam Maden Üretimi (%30 İndirim)",
            IconKey: "resource_pack_gold",
            MetalAmount: 250000,
            CrystalAmount: 150000,
            DeuteriumAmount: 75000
        ));

        items.Add(new ShopMasterItemDef(
            ItemKey: "special_class_token",
            Name: "Sınıf Değişim Fişi",
            PrimaryCategory: "special",
            Categories: ["special"],
            Tier: "Platinum",
            Duration: "Daimi",
            DurationDays: 0,
            EffectValue: 1,
            BaseCostDarkMatter: 500000,
            DiscountCostDarkMatter: 400000,
            IsDiscountActive: true,
            Description: "İstediğiniz bir oyuncu sınıfına (Kolektör, General veya Kaşif) %20 indirimli geçiş hakkı sağlar.",
            TargetSummary: "%20 İndirimli Sınıf Seçim Fişi",
            IconKey: "class_token"
        ));

        items.Add(new ShopMasterItemDef(
            ItemKey: "special_relocation_flash",
            Name: "Gezegen Taşıma Flaş İndirimi",
            PrimaryCategory: "special",
            Categories: ["special"],
            Tier: "Gold",
            Duration: "hemen",
            DurationDays: 0,
            EffectValue: 1,
            BaseCostDarkMatter: 240000,
            DiscountCostDarkMatter: 120000,
            IsDiscountActive: true,
            Description: "Gezegeninizi ve ayınızı %50 flaş indirimle koordinat matrisinde yeni bir konuma taşır.",
            TargetSummary: "%50 İndirimli Gezegen Taşıma",
            IconKey: "relocation_flash"
        ));

        items.Add(new ShopMasterItemDef(
            ItemKey: "special_platinum_booster_90d",
            Name: "90 Günlük Mega Platin Üretim Paketi",
            PrimaryCategory: "special",
            Categories: ["special"],
            Tier: "Platinum",
            Duration: "90 Gün",
            DurationDays: 90,
            EffectValue: 0.40,
            BaseCostDarkMatter: 300000,
            DiscountCostDarkMatter: 240000,
            IsDiscountActive: true,
            Description: "Tüm madenlerinizde 90 gün boyunca +%40 üretim artıran Platin booster koleksiyonu.",
            TargetSummary: "+%40 Tüm Madenler (90 Gün)",
            IconKey: "mega_booster"
        ));

        // -----------------------------------------------------------------------------------
        // 2. SINIF SEÇİMİ (6 ÜRÜN)
        // -----------------------------------------------------------------------------------
        items.Add(new ShopMasterItemDef(
            ItemKey: "class_collector",
            Name: "Kolektör Sınıfı",
            PrimaryCategory: "classes",
            Categories: ["classes"],
            Tier: "Gold",
            Duration: "Daimi",
            DurationDays: 0,
            EffectValue: 0.25,
            BaseCostDarkMatter: 500000,
            DiscountCostDarkMatter: 500000,
            IsDiscountActive: false,
            Description: "+%25 Maden üretimi, +%10 Enerji, +%100 Yük gemisi hızı, Paletli aşırı yükleme desteği.",
            TargetSummary: "+%25 Maden, +%10 Enerji",
            IconKey: "collector_crest"
        ));

        items.Add(new ShopMasterItemDef(
            ItemKey: "class_general",
            Name: "General Sınıfı",
            PrimaryCategory: "classes",
            Categories: ["classes"],
            Tier: "Platinum",
            Duration: "Daimi",
            DurationDays: 0,
            EffectValue: 1.0,
            BaseCostDarkMatter: 500000,
            DiscountCostDarkMatter: 500000,
            IsDiscountActive: false,
            Description: "+%100 Savaş gemisi hızı, +%100 Geri dönüşümcü hızı, +2 Filo slotu, Savaş enkazı toplama.",
            TargetSummary: "+%100 Filo Hızı, +2 Slot",
            IconKey: "general_crest"
        ));

        items.Add(new ShopMasterItemDef(
            ItemKey: "class_discoverer",
            Name: "Kaşif Sınıfı",
            PrimaryCategory: "classes",
            Categories: ["classes"],
            Tier: "Platinum",
            Duration: "Daimi",
            DurationDays: 0,
            EffectValue: 0.30,
            BaseCostDarkMatter: 500000,
            DiscountCostDarkMatter: 500000,
            IsDiscountActive: false,
            Description: "-%50 Keşif süresi, +%30 Keşif kazancı, +2 Keşif slotu, Phalanx menzili +%20.",
            TargetSummary: "+%30 Keşif, +2 Keşif Slotu",
            IconKey: "discoverer_crest"
        ));

        items.Add(new ShopMasterItemDef(
            ItemKey: "class_change_collector",
            Name: "Kolektör Sınıf Değişimi",
            PrimaryCategory: "classes",
            Categories: ["classes"],
            Tier: "Gold",
            Duration: "Daimi",
            DurationDays: 0,
            EffectValue: 0.25,
            BaseCostDarkMatter: 500000,
            DiscountCostDarkMatter: 400000,
            IsDiscountActive: true,
            Description: "Mevcut sınıfınızı iptal ederek hesabınızı derhal Kolektör sınıfına dönüştürür.",
            TargetSummary: "Sınıf Dönüşümü: Kolektör",
            IconKey: "class_token_collector"
        ));

        items.Add(new ShopMasterItemDef(
            ItemKey: "class_change_general",
            Name: "General Sınıf Değişimi",
            PrimaryCategory: "classes",
            Categories: ["classes"],
            Tier: "Platinum",
            Duration: "Daimi",
            DurationDays: 0,
            EffectValue: 1.0,
            BaseCostDarkMatter: 500000,
            DiscountCostDarkMatter: 400000,
            IsDiscountActive: true,
            Description: "Mevcut sınıfınızı iptal ederek hesabınızı derhal General sınıfına dönüştürür.",
            TargetSummary: "Sınıf Dönüşümü: General",
            IconKey: "class_token_general"
        ));

        items.Add(new ShopMasterItemDef(
            ItemKey: "class_change_discoverer",
            Name: "Kaşif Sınıf Değişimi",
            PrimaryCategory: "classes",
            Categories: ["classes"],
            Tier: "Platinum",
            Duration: "Daimi",
            DurationDays: 0,
            EffectValue: 0.30,
            BaseCostDarkMatter: 500000,
            DiscountCostDarkMatter: 400000,
            IsDiscountActive: true,
            Description: "Mevcut sınıfınızı iptal ederek hesabınızı derhal Kaşif sınıfına dönüştürür.",
            TargetSummary: "Sınıf Dönüşümü: Kaşif",
            IconKey: "class_token_discoverer"
        ));

        // -----------------------------------------------------------------------------------
        // 3. İNŞA (37 ÜRÜN)
        // -----------------------------------------------------------------------------------
        // 12 Kraken (Bina Hızlandırıcı)
        var krakenList = new[]
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
        foreach (var (kKey, kName, kTier, kSec, kCost, kSumm) in krakenList)
        {
            items.Add(new ShopMasterItemDef(
                ItemKey: $"kraken_{kKey}",
                Name: kName,
                PrimaryCategory: "construction",
                Categories: ["construction"],
                Tier: kTier,
                Duration: "hemen",
                DurationDays: 0,
                EffectValue: kSec,
                BaseCostDarkMatter: kCost,
                DiscountCostDarkMatter: (int)(kCost * 0.8),
                IsDiscountActive: false,
                Description: $"Gezegende devam eden bina inşasının kalan süresini {kSumm.Replace("-", "")} kısaltır.",
                TargetSummary: kSumm,
                IconKey: "kraken"
            ));
        }

        // 12 Detroid (Tersane Hızlandırıcı)
        var detroidList = new[]
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
        foreach (var (dKey, dName, dTier, dSec, dCost, dSumm) in detroidList)
        {
            items.Add(new ShopMasterItemDef(
                ItemKey: $"detroid_ship_{dKey}",
                Name: dName,
                PrimaryCategory: "construction",
                Categories: ["construction"],
                Tier: dTier,
                Duration: "hemen",
                DurationDays: 0,
                EffectValue: dSec,
                BaseCostDarkMatter: dCost,
                DiscountCostDarkMatter: (int)(dCost * 0.8),
                IsDiscountActive: false,
                Description: $"Tersanede devam eden filo veya savunma üretiminin süresini {dSumm.Replace("-", "")} kısaltır.",
                TargetSummary: dSumm,
                IconKey: "detroid"
            ));
        }

        // 8 Gezegen & Ay Alan Genişleticileri
        var fieldItems = new[]
        {
            ("field_planet_bronze_2", "Bronz Gezegen Alanları", "Bronze", 2, 30000, "+2 Gezegen Alanı", false),
            ("field_planet_silver_4", "Gümüş Gezegen Alanları", "Silver", 4, 60000, "+4 Gezegen Alanı", false),
            ("field_planet_gold_6", "Altın Gezegen Alanları", "Gold", 6, 100000, "+6 Gezegen Alanı", false),
            ("field_planet_platinum_15", "Platin Gezegen Alanları", "Platinum", 15, 200000, "+15 Gezegen Alanı", false),
            ("field_moon_bronze_2", "Bronz Ay Alanları", "Bronze", 2, 50000, "+2 Ay Alanı", true),
            ("field_moon_silver_4", "Gümüş Ay Alanları", "Silver", 4, 100000, "+4 Ay Alanı", true),
            ("field_moon_gold_6", "Altın Ay Alanları", "Gold", 6, 175000, "+6 Ay Alanı", true),
            ("field_moon_platinum_10", "Platin Ay Alanları", "Platinum", 10, 300000, "+10 Ay Alanı", true),
        };
        foreach (var (fKey, fName, fTier, fFields, fCost, fSumm, isMoon) in fieldItems)
        {
            items.Add(new ShopMasterItemDef(
                ItemKey: fKey,
                Name: fName,
                PrimaryCategory: "construction",
                Categories: ["construction"],
                Tier: fTier,
                Duration: "Daimi",
                DurationDays: 0,
                EffectValue: fFields,
                BaseCostDarkMatter: fCost,
                DiscountCostDarkMatter: (int)(fCost * 0.8),
                IsDiscountActive: false,
                Description: isMoon
                    ? $"Ay yüzeyine daimi olarak +{fFields} inşaat alanı ekler."
                    : $"Gezegene daimi olarak +{fFields} inşaat alanı ekler.",
                TargetSummary: fSumm,
                IconKey: isMoon ? "moon_fields" : "planet_fields"
            ));
        }

        // 5 Modern / Yaşam Formu İnşaat Öğesi
        items.Add(new ShopMasterItemDef(
            ItemKey: "lifeforms_detroid_4h",
            Name: "Yaşam Formu Detroid (4 Saat)",
            PrimaryCategory: "construction",
            Categories: ["construction"],
            Tier: "Silver",
            Duration: "hemen",
            DurationDays: 0,
            EffectValue: 14400,
            BaseCostDarkMatter: 30000,
            DiscountCostDarkMatter: 24000,
            IsDiscountActive: false,
            Description: "Devam eden yaşam formu bina inşaatının süresini 4 saat kısaltır.",
            TargetSummary: "-4 Saat Yaşam Formu Bina",
            IconKey: "lifeforms_detroid"
        ));

        items.Add(new ShopMasterItemDef(
            ItemKey: "lifeforms_newtron_4h",
            Name: "Yaşam Formu Newtron (4 Saat)",
            PrimaryCategory: "construction",
            Categories: ["construction"],
            Tier: "Silver",
            Duration: "hemen",
            DurationDays: 0,
            EffectValue: 14400,
            BaseCostDarkMatter: 30000,
            DiscountCostDarkMatter: 24000,
            IsDiscountActive: false,
            Description: "Devam eden yaşam formu teknoloji araştırmasının süresini 4 saat kısaltır.",
            TargetSummary: "-4 Saat Yaşam Formu Teknoloji",
            IconKey: "lifeforms_newtron"
        ));

        items.Add(new ShopMasterItemDef(
            ItemKey: "lifeforms_xp_booster_1500",
            Name: "Yaşam Formu Deneyim Paketi (+1.500 XP)",
            PrimaryCategory: "construction",
            Categories: ["construction"],
            Tier: "Gold",
            Duration: "hemen",
            DurationDays: 0,
            EffectValue: 1500,
            BaseCostDarkMatter: 40000,
            DiscountCostDarkMatter: 32000,
            IsDiscountActive: false,
            Description: "Gezegendeki aktif canlı türü ırkına anında 1.500 Deneyim Puanı kazandırır.",
            TargetSummary: "+1.500 Canlı Türü XP",
            IconKey: "lifeforms_xp"
        ));

        items.Add(new ShopMasterItemDef(
            ItemKey: "construction_queue_slot",
            Name: "İlave İnşaat Yuvası (+1 Kuyruk)",
            PrimaryCategory: "construction",
            Categories: ["construction"],
            Tier: "Gold",
            Duration: "7 Gün",
            DurationDays: 7,
            EffectValue: 1,
            BaseCostDarkMatter: 45000,
            DiscountCostDarkMatter: 36000,
            IsDiscountActive: false,
            Description: "Binalarınız için eşzamanlı ek bir inşaat sırası yuvası tahsis eder.",
            TargetSummary: "+1 İnşaat Kuyruk Slotu (7 Gün)",
            IconKey: "queue_slot"
        ));

        items.Add(new ShopMasterItemDef(
            ItemKey: "terraformer_charge_5",
            Name: "Termo-Gezegen Çekirdek Şarjı",
            PrimaryCategory: "construction",
            Categories: ["construction"],
            Tier: "Platinum",
            Duration: "Daimi",
            DurationDays: 0,
            EffectValue: 5,
            BaseCostDarkMatter: 125000,
            DiscountCostDarkMatter: 100000,
            IsDiscountActive: false,
            Description: "Gezegen çekirdeğini termal olarak uyararak ek +5 daimi inşaat alanı kazandırır.",
            TargetSummary: "+5 Termal Daimi Alan",
            IconKey: "terraformer_core"
        ));
        // construction total: 12 + 12 + 8 + 5 = 37 items

        // -----------------------------------------------------------------------------------
        // 4. HAM MADDELER (71 ÜRÜN)
        // -----------------------------------------------------------------------------------
        // 36 Hammadde Üretim Güçlendiricisi
        // Exactly 5 30d boosters are shared with "boosters-30d"
        // Exactly 4 90d boosters are shared with "boosters-90d"
        // (Total shared = 9 items)
        var resList = new[]
        {
            ("metal", "Metal", "Metal Madeni", 100),
            ("crystal", "Kristal", "Kristal Madeni", 100),
            ("deut", "Döteryum", "Döteryum Sentezleyicisi", 120)
        };
        var rTiers = new[]
        {
            ("bronze", "Bronz", 0.10, 2500, 8500, 20000),
            ("silver", "Gümüş", 0.20, 6500, 20000, 48000),
            ("gold", "Altın", 0.30, 13000, 40000, 95000),
            ("platinum", "Platin", 0.40, 25000, 75000, 180000)
        };

        int shared30Count = 0;
        int shared90Count = 0;

        foreach (var (rKey, rName, bName, surcharge) in resList)
        {
            foreach (var (tKey, tName, ratio, cost7, cost30, cost90) in rTiers)
            {
                int pcent = (int)(ratio * 100);

                // 7 Days
                int c7 = (cost7 * surcharge) / 100;
                items.Add(new ShopMasterItemDef(
                    ItemKey: $"booster_{rKey}_{tKey}_7d",
                    Name: $"{tName} {rName} Güçlendirici (7 Gün)",
                    PrimaryCategory: "resources",
                    Categories: ["resources"],
                    Tier: Capitalize(tKey),
                    Duration: "7 Gün",
                    DurationDays: 7,
                    EffectValue: ratio,
                    BaseCostDarkMatter: c7,
                    DiscountCostDarkMatter: (int)(c7 * 0.8),
                    IsDiscountActive: false,
                    Description: $"{bName} temel üretimini 7 gün boyunca +%{pcent} artırır.",
                    TargetSummary: $"+%{pcent} {rName} Üretimi (7 Gün)",
                    IconKey: $"booster_{rKey}_{tKey}"
                ));

                // 30 Days: Share first 5 with boosters-30d
                int c30 = (cost30 * surcharge) / 100;
                bool isShared30 = shared30Count < 5;
                if (isShared30) shared30Count++;

                items.Add(new ShopMasterItemDef(
                    ItemKey: $"booster_{rKey}_{tKey}_30d",
                    Name: $"{tName} {rName} Güçlendirici (30 Gün)",
                    PrimaryCategory: "resources",
                    Categories: isShared30 ? ["resources", "boosters-30d"] : ["resources"],
                    Tier: Capitalize(tKey),
                    Duration: "30 Gün",
                    DurationDays: 30,
                    EffectValue: ratio,
                    BaseCostDarkMatter: c30,
                    DiscountCostDarkMatter: (int)(c30 * 0.8),
                    IsDiscountActive: false,
                    Description: $"{bName} temel üretimini 30 gün boyunca +%{pcent} artırır.",
                    TargetSummary: $"+%{pcent} {rName} Üretimi (30 Gün)",
                    IconKey: $"booster_{rKey}_{tKey}"
                ));

                // 90 Days: Share first 4 with boosters-90d
                int c90 = (cost90 * surcharge) / 100;
                bool isShared90 = shared90Count < 4;
                if (isShared90) shared90Count++;

                items.Add(new ShopMasterItemDef(
                    ItemKey: $"booster_{rKey}_{tKey}_90d",
                    Name: $"{tName} {rName} Güçlendirici (90 Gün)",
                    PrimaryCategory: "resources",
                    Categories: isShared90 ? ["resources", "boosters-90d"] : ["resources"],
                    Tier: Capitalize(tKey),
                    Duration: "90 Gün",
                    DurationDays: 90,
                    EffectValue: ratio,
                    BaseCostDarkMatter: c90,
                    DiscountCostDarkMatter: (int)(c90 * 0.8),
                    IsDiscountActive: false,
                    Description: $"{bName} temel üretimini 90 gün boyunca +%{pcent} artırır.",
                    TargetSummary: $"+%{pcent} {rName} Üretimi (90 Gün)",
                    IconKey: $"booster_{rKey}_{tKey}"
                ));
            }
        }
        // 36 resource boosters added above

        // 10 Resource Packs (Direct Resource Injection with Storage Overflow Protection)
        var packList = new[]
        {
            ("pack_metal_small_100k", "Küçük Metal Paketi (100.000)", "Bronze", 100000.0, 0.0, 0.0, 10000, "Depoya anında 100.000 Metal yükler."),
            ("pack_metal_medium_500k", "Orta Metal Paketi (500.000)", "Silver", 500000.0, 0.0, 0.0, 45000, "Depoya anında 500.000 Metal yükler."),
            ("pack_metal_large_2m", "Büyük Metal Paketi (2.000.000)", "Gold", 2000000.0, 0.0, 0.0, 150000, "Depoya anında 2.000.000 Metal yükler."),
            ("pack_crystal_small_50k", "Küçük Kristal Paketi (50.000)", "Bronze", 0.0, 50000.0, 0.0, 10000, "Depoya anında 50.000 Kristal yükler."),
            ("pack_crystal_medium_250k", "Orta Kristal Paketi (250.000)", "Silver", 0.0, 250000.0, 0.0, 45000, "Depoya anında 250.000 Kristal yükler."),
            ("pack_crystal_large_1m", "Büyük Kristal Paketi (1.000.000)", "Gold", 0.0, 1000000.0, 0.0, 150000, "Depoya anında 1.000.000 Kristal yükler."),
            ("pack_deut_small_25k", "Küçük Döteryum Paketi (25.000)", "Bronze", 0.0, 0.0, 25000.0, 10000, "Depoya anında 25.000 Döteryum yükler."),
            ("pack_deut_medium_125k", "Orta Döteryum Paketi (125.000)", "Silver", 0.0, 0.0, 125000.0, 45000, "Depoya anında 125.000 Döteryum yükler."),
            ("pack_deut_large_500k", "Büyük Döteryum Paketi (500.000)", "Gold", 0.0, 0.0, 500000.0, 150000, "Depoya anında 500.000 Döteryum yükler."),
            ("pack_master_bundle_all", "Master Hammadde Paketi", "Platinum", 1000000.0, 500000.0, 250000.0, 220000, "1M Metal, 500K Kristal ve 250K Döteryumdan oluşan kombine ikmal sandığı.")
        };
        foreach (var (pKey, pName, pTier, pMet, pCry, pDeu, pCost, pDesc) in packList)
        {
            items.Add(new ShopMasterItemDef(
                ItemKey: pKey,
                Name: pName,
                PrimaryCategory: "resources",
                Categories: ["resources"],
                Tier: pTier,
                Duration: "hemen",
                DurationDays: 0,
                EffectValue: pMet + pCry + pDeu,
                BaseCostDarkMatter: pCost,
                DiscountCostDarkMatter: (int)(pCost * 0.8),
                IsDiscountActive: false,
                Description: pDesc,
                TargetSummary: $"İkmal: {pMet:N0} M / {pCry:N0} C / {pDeu:N0} D",
                IconKey: "resource_pack",
                MetalAmount: pMet,
                CrystalAmount: pCry,
                DeuteriumAmount: pDeu
            ));
        }

        // 12 Newtron (Araştırma Hızlandırıcı)
        var newtronList = new[]
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
        foreach (var (nKey, nName, nTier, nSec, nCost, nSumm) in newtronList)
        {
            items.Add(new ShopMasterItemDef(
                ItemKey: $"newtron_{nKey}",
                Name: nName,
                PrimaryCategory: "resources",
                Categories: ["resources"],
                Tier: nTier,
                Duration: "hemen",
                DurationDays: 0,
                EffectValue: nSec,
                BaseCostDarkMatter: nCost,
                DiscountCostDarkMatter: (int)(nCost * 0.8),
                IsDiscountActive: false,
                Description: $"Laboratuvarda devam eden teknoloji araştırmasının süresini {nSumm.Replace("-", "")} kısaltır.",
                TargetSummary: nSumm,
                IconKey: "newtron"
            ));
        }

        // 7 Modern Expedition & Special Items
        items.Add(new ShopMasterItemDef(
            ItemKey: "expedition_slots_computer",
            Name: "Keşif Bilgisayarı (+2 Keşif Slotu)",
            PrimaryCategory: "resources",
            Categories: ["resources"],
            Tier: "Platinum",
            Duration: "7 Gün",
            DurationDays: 7,
            EffectValue: 2,
            BaseCostDarkMatter: 80000,
            DiscountCostDarkMatter: 64000,
            IsDiscountActive: false,
            Description: "Aktif olduğu 7 gün boyunca imparatorluğunuza +2 ilave keşif filosu slotu tahsis eder.",
            TargetSummary: "+2 Keşif Slotu (7 Gün)",
            IconKey: "expedition_computer"
        ));

        items.Add(new ShopMasterItemDef(
            ItemKey: "expedition_turbo",
            Name: "Keşif Turbo Hızlandırıcısı (%50 Hız)",
            PrimaryCategory: "resources",
            Categories: ["resources"],
            Tier: "Gold",
            Duration: "7 Gün",
            DurationDays: 7,
            EffectValue: 0.50,
            BaseCostDarkMatter: 60000,
            DiscountCostDarkMatter: 48000,
            IsDiscountActive: false,
            Description: "7 gün boyunca gönderilen tüm keşif görevlerinin uçuş süresini %50 kısaltır.",
            TargetSummary: "%50 Keşif Uçuş Hızı (7 Gün)",
            IconKey: "expedition_turbo"
        ));

        items.Add(new ShopMasterItemDef(
            ItemKey: "expedition_resource_booster",
            Name: "Keşif Hammadde Güçlendiricisi (+%30)",
            PrimaryCategory: "resources",
            Categories: ["resources"],
            Tier: "Gold",
            Duration: "7 Gün",
            DurationDays: 7,
            EffectValue: 0.30,
            BaseCostDarkMatter: 75000,
            DiscountCostDarkMatter: 60000,
            IsDiscountActive: false,
            Description: "7 gün boyunca keşiflerden elde edilen metal, kristal ve döteryum ganimetlerini %30 artırır.",
            TargetSummary: "+%30 Keşif Ganimeti (7 Gün)",
            IconKey: "expedition_yield"
        ));

        items.Add(new ShopMasterItemDef(
            ItemKey: "scrapper_rate_boost",
            Name: "Hurdacı Özel Teklifi (%75 Geri Dönüşüm)",
            PrimaryCategory: "resources",
            Categories: ["resources"],
            Tier: "Silver",
            Duration: "3 Gün",
            DurationDays: 3,
            EffectValue: 0.75,
            BaseCostDarkMatter: 50000,
            DiscountCostDarkMatter: 40000,
            IsDiscountActive: false,
            Description: "Hurdacıdaki hurda geri dönüşüm oranını 3 gün boyunca taban orandan %75 sabit orana yükseltir.",
            TargetSummary: "%75 Sabit Hurda Oranı (3 Gün)",
            IconKey: "scrapper_offer"
        ));

        items.Add(new ShopMasterItemDef(
            ItemKey: "plasma_tech_booster_7d",
            Name: "Plazma Reaktör Katalizörü (+%15)",
            PrimaryCategory: "resources",
            Categories: ["resources"],
            Tier: "Gold",
            Duration: "7 Gün",
            DurationDays: 7,
            EffectValue: 0.15,
            BaseCostDarkMatter: 55000,
            DiscountCostDarkMatter: 44000,
            IsDiscountActive: false,
            Description: "Plazma teknolojisi verimini 7 gün boyunca %15 artırarak metal ve kristal üretimini takviye eder.",
            TargetSummary: "+%15 Plazma Verimi (7 Gün)",
            IconKey: "plasma_booster"
        ));

        items.Add(new ShopMasterItemDef(
            ItemKey: "fusion_coolant_pack_7d",
            Name: "Füzyon Reaktörü Ağır Su Soğutucusu",
            PrimaryCategory: "resources",
            Categories: ["resources"],
            Tier: "Silver",
            Duration: "7 Gün",
            DurationDays: 7,
            EffectValue: 0.20,
            BaseCostDarkMatter: 35000,
            DiscountCostDarkMatter: 28000,
            IsDiscountActive: false,
            Description: "Füzyon reaktörünün döteryum yakıt sarfiyatını 7 gün boyunca %20 azaltır.",
            TargetSummary: "-%20 Füzyon Yakıtı (7 Gün)",
            IconKey: "fusion_coolant"
        ));

        items.Add(new ShopMasterItemDef(
            ItemKey: "deep_core_probe_7d",
            Name: "Derin Çekirdek Madencilik Sondası",
            PrimaryCategory: "resources",
            Categories: ["resources"],
            Tier: "Platinum",
            Duration: "7 Gün",
            DurationDays: 7,
            EffectValue: 0.25,
            BaseCostDarkMatter: 90000,
            DiscountCostDarkMatter: 72000,
            IsDiscountActive: false,
            Description: "Gezegen kabuğunun derinliklerine inerek 7 gün boyunca tüm maden çıktısını ek %25 artırır.",
            TargetSummary: "+%25 Tüm Madenler (7 Gün)",
            IconKey: "deep_probe"
        ));

        // 6 Merchant & Trade Call Items
        var tradeList = new[]
        {
            ("merchant_call_metal", "Metal Tüccarı Çağrısı", "Silver", 3500, "Gezegeninize anında bir Metal Tüccarı çağırır."),
            ("merchant_call_crystal", "Kristal Tüccarı Çağrısı", "Silver", 3500, "Gezegeninize anında bir Kristal Tüccarı çağırır."),
            ("merchant_call_deut", "Döteryum Tüccarı Çağrısı", "Silver", 3500, "Gezegeninize anında bir Döteryum Tüccarı çağırır."),
            ("merchant_call_scrapper", "Hurda Tüccarı VIP Çağrısı", "Gold", 8000, "Hurda tüccarını gezegene bağlar ve en iyi oranları sağlar."),
            ("auction_token", "Galaktik Müzayede Fişi", "Bronze", 2500, "Müzayedede anında geçerli teklif pulu sağlar."),
            ("import_export_crate", "İthalat / İhracat Gizemli Konteyner", "Bronze", 3000, "İçinden rastgele güçlendirici veya materyal çıkan konteyner.")
        };
        foreach (var (trKey, trName, trTier, trCost, trDesc) in tradeList)
        {
            items.Add(new ShopMasterItemDef(
                ItemKey: trKey,
                Name: trName,
                PrimaryCategory: "resources",
                Categories: ["resources"],
                Tier: trTier,
                Duration: "hemen",
                DurationDays: 0,
                EffectValue: 1,
                BaseCostDarkMatter: trCost,
                DiscountCostDarkMatter: (int)(trCost * 0.8),
                IsDiscountActive: false,
                Description: trDesc,
                TargetSummary: "Tüccar & Müzayede Hizmeti",
                IconKey: "merchant_item"
            ));
        }
        // resources total: 36 + 10 + 12 + 7 + 6 = 71 items

        // -----------------------------------------------------------------------------------
        // 5. 30 GÜNLÜK GÜÇLENDİRİCİ (24 ÜRÜN)
        // -----------------------------------------------------------------------------------
        // 5 items were shared from resources. We now add 19 dedicated items:
        // 7 additional 30d resource booster specialized models
        var resDedicated30 = new[]
        {
            ("booster_special_metal_30d", "Platin Ağır Metal Katalizörü (30 Gün)", "Platinum", 0.45, 80000, "+%45 Metal Üretimi (30 Gün)"),
            ("booster_special_crystal_30d", "Platin Saf Kristal Matrisi (30 Gün)", "Platinum", 0.45, 80000, "+%45 Kristal Üretimi (30 Gün)"),
            ("booster_special_deut_30d", "Platin Ağır Döteryum Filtresi (30 Gün)", "Platinum", 0.45, 96000, "+%45 Döteryum Üretimi (30 Gün)"),
            ("booster_alloy_refinery_30d", "Yüksek Alaşım Rafinerisi (30 Gün)", "Gold", 0.35, 65000, "+%35 Alaşım ve Metal (30 Gün)"),
            ("booster_prism_synthesizer_30d", "Prizmatik Kristal Odaklayıcı (30 Gün)", "Gold", 0.35, 65000, "+%35 Kristal Verimi (30 Gün)"),
            ("booster_cryo_condenser_30d", "Kriyojenik Döteryum Yoğunlaştırıcı (30 Gün)", "Gold", 0.35, 78000, "+%35 Döteryum Verimi (30 Gün)"),
            ("booster_nanite_catalyst_30d", "Nanit Maden Katalizörü (30 Gün)", "Silver", 0.25, 45000, "+%25 Tüm Madenler (30 Gün)")
        };
        foreach (var (bKey, bName, bTier, bRatio, bCost, bSumm) in resDedicated30)
        {
            items.Add(new ShopMasterItemDef(
                ItemKey: bKey,
                Name: bName,
                PrimaryCategory: "boosters-30d",
                Categories: ["boosters-30d"],
                Tier: bTier,
                Duration: "30 Gün",
                DurationDays: 30,
                EffectValue: bRatio,
                BaseCostDarkMatter: bCost,
                DiscountCostDarkMatter: (int)(bCost * 0.85),
                IsDiscountActive: false,
                Description: $"{bName} aktif gezegende 30 gün boyunca üstün üretim artışı sağlar.",
                TargetSummary: bSumm,
                IconKey: "booster_special_30d"
            ));
        }

        // 4 Energy Boosters (30d)
        var energyTiers30 = new[]
        {
            ("bronze", "Bronz", 0.10, 8000),
            ("silver", "Gümüş", 0.20, 18000),
            ("gold", "Altın", 0.30, 36000),
            ("platinum", "Platin", 0.40, 68000)
        };
        foreach (var (eKey, eName, eVal, eCost) in energyTiers30)
        {
            int p = (int)(eVal * 100);
            items.Add(new ShopMasterItemDef(
                ItemKey: $"booster_energy_{eKey}_30d",
                Name: $"{eName} Güneş Enerjisi Güçlendirici (30 Gün)",
                PrimaryCategory: "boosters-30d",
                Categories: ["boosters-30d"],
                Tier: Capitalize(eKey),
                Duration: "30 Gün",
                DurationDays: 30,
                EffectValue: eVal,
                BaseCostDarkMatter: eCost,
                DiscountCostDarkMatter: (int)(eCost * 0.85),
                IsDiscountActive: false,
                Description: $"Güneş santrali ve uydulardan üretilen enerjiyi 30 gün boyunca +%{p} artırır.",
                TargetSummary: $"+%{p} Enerji (30 Gün)",
                IconKey: "energy_booster"
            ));
        }

        // 6 Monthly Officers (30 Days)
        var officers30 = new[]
        {
            ("officer_commander_30d", "Komutan (30 Gün)", "Altın", 100000, "Gelişmiş filo komutası, kısayollar ve mesaj filtreleri sağlar."),
            ("officer_admiral_30d", "Amiral (30 Gün)", "Altın", 100000, "+2 İlave filo slotu ve taktiksel kaçış manevrası kazandırır."),
            ("officer_engineer_30d", "Mühendis (30 Gün)", "Altın", 100000, "Savunma onarım oranını %85'e çıkarır ve enerji üretimini +%10 artırır."),
            ("officer_geologist_30d", "Jeolog (30 Gün)", "Altın", 125000, "Tüm maden üretimlerini gezegenler genelinde +%10 artırır."),
            ("officer_technocrat_30d", "Teknokrat (30 Gün)", "Altın", 100000, "Araştırma süresini %25 kısaltır ve casusluk seviyesini +2 artırır."),
            ("officer_staff_30d", "Komuta Kademesi Paketi (30 Gün)", "Platin", 425000, "Tüm 5 subayı aynı anda 30 günlüğüne devreye sokar ve ilave +%2 maden bonusu verir.")
        };
        foreach (var (offKey, offName, offTier, offCost, offDesc) in officers30)
        {
            items.Add(new ShopMasterItemDef(
                ItemKey: offKey,
                Name: offName,
                PrimaryCategory: "boosters-30d",
                Categories: ["boosters-30d"],
                Tier: offTier.Equals("Platin", StringComparison.OrdinalIgnoreCase) ? "Platinum" : "Gold",
                Duration: "30 Gün",
                DurationDays: 30,
                EffectValue: 1,
                BaseCostDarkMatter: offCost,
                DiscountCostDarkMatter: (int)(offCost * 0.85),
                IsDiscountActive: false,
                Description: offDesc,
                TargetSummary: "Subay & İmparatorluk Komutası (30 Gün)",
                IconKey: "officer"
            ));
        }

        // 2 Special 30d Buffs
        items.Add(new ShopMasterItemDef(
            ItemKey: "booster_expedition_30d",
            Name: "Aylık Keşif İmtiyazı (30 Gün)",
            PrimaryCategory: "boosters-30d",
            Categories: ["boosters-30d"],
            Tier: "Platinum",
            Duration: "30 Gün",
            DurationDays: 30,
            EffectValue: 1,
            BaseCostDarkMatter: 160000,
            DiscountCostDarkMatter: 136000,
            IsDiscountActive: false,
            Description: "30 gün boyunca +1 ilave keşif filosu ve %25 daha hızlı keşif uçuşu sunar.",
            TargetSummary: "+1 Keşif Slotu & Hız (30 Gün)",
            IconKey: "expedition_monthly"
        ));

        items.Add(new ShopMasterItemDef(
            ItemKey: "booster_storage_shield_30d",
            Name: "Depo Emniyet Kalkanı (30 Gün)",
            PrimaryCategory: "boosters-30d",
            Categories: ["boosters-30d"],
            Tier: "Gold",
            Duration: "30 Gün",
            DurationDays: 30,
            EffectValue: 0.20,
            BaseCostDarkMatter: 110000,
            DiscountCostDarkMatter: 93500,
            IsDiscountActive: false,
            Description: "Düşman yağmalarında depolarınızdaki madenlerin %20'sini dokunulmaz koruma altına alır.",
            TargetSummary: "%20 Koruma Kalkanı (30 Gün)",
            IconKey: "storage_shield"
        ));
        // boosters-30d total: 5 shared + 7 + 4 + 6 + 2 = 24 items!

        // -----------------------------------------------------------------------------------
        // 6. 90 GÜNLÜK GÜÇLENDİRİCİ (21 ÜRÜN)
        // -----------------------------------------------------------------------------------
        // 4 items were shared from resources. We now add 17 dedicated items:
        // 8 Quarterly specialized production boosters
        var resDedicated90 = new[]
        {
            ("booster_special_metal_90d", "Platin Ağır Metal Katalizörü (90 Gün)", "Platinum", 0.45, 195000, "+%45 Metal Üretimi (90 Gün)"),
            ("booster_special_crystal_90d", "Platin Saf Kristal Matrisi (90 Gün)", "Platinum", 0.45, 195000, "+%45 Kristal Üretimi (90 Gün)"),
            ("booster_special_deut_90d", "Platin Ağır Döteryum Filtresi (90 Gün)", "Platinum", 0.45, 234000, "+%45 Döteryum Üretimi (90 Gün)"),
            ("booster_alloy_refinery_90d", "Yüksek Alaşım Rafinerisi (90 Gün)", "Gold", 0.35, 155000, "+%35 Alaşım ve Metal (90 Gün)"),
            ("booster_prism_synthesizer_90d", "Prizmatik Kristal Odaklayıcı (90 Gün)", "Gold", 0.35, 155000, "+%35 Kristal Verimi (90 Gün)"),
            ("booster_cryo_condenser_90d", "Kriyojenik Döteryum Yoğunlaştırıcı (90 Gün)", "Gold", 0.35, 186000, "+%35 Döteryum Verimi (90 Gün)"),
            ("booster_nanite_catalyst_90d", "Nanit Maden Katalizörü (90 Gün)", "Silver", 0.25, 110000, "+%25 Tüm Madenler (90 Gün)"),
            ("booster_quantum_siphon_90d", "Kuantum Maden Sifonu (90 Gün)", "Platinum", 0.50, 250000, "+%50 Efsanevi Maden Üretimi (90 Gün)")
        };
        foreach (var (bKey, bName, bTier, bRatio, bCost, bSumm) in resDedicated90)
        {
            items.Add(new ShopMasterItemDef(
                ItemKey: bKey,
                Name: bName,
                PrimaryCategory: "boosters-90d",
                Categories: ["boosters-90d"],
                Tier: bTier,
                Duration: "90 Gün",
                DurationDays: 90,
                EffectValue: bRatio,
                BaseCostDarkMatter: bCost,
                DiscountCostDarkMatter: (int)(bCost * 0.8),
                IsDiscountActive: false,
                Description: $"{bName} aktif gezegende 90 gün boyunca kesintisiz azami üretim sağlar.",
                TargetSummary: bSumm,
                IconKey: "booster_special_90d"
            ));
        }

        // 3 Energy Boosters (90d)
        var energyTiers90 = new[]
        {
            ("bronze", "Bronz", 0.10, 18000),
            ("silver", "Gümüş", 0.20, 42000),
            ("gold", "Altın", 0.30, 85000)
        };
        foreach (var (eKey, eName, eVal, eCost) in energyTiers90)
        {
            int p = (int)(eVal * 100);
            items.Add(new ShopMasterItemDef(
                ItemKey: $"booster_energy_{eKey}_90d",
                Name: $"{eName} Güneş Enerjisi Güçlendirici (90 Gün)",
                PrimaryCategory: "boosters-90d",
                Categories: ["boosters-90d"],
                Tier: Capitalize(eKey),
                Duration: "90 Gün",
                DurationDays: 90,
                EffectValue: eVal,
                BaseCostDarkMatter: eCost,
                DiscountCostDarkMatter: (int)(eCost * 0.8),
                IsDiscountActive: false,
                Description: $"Güneş santrali ve uydulardan üretilen enerjiyi 90 gün boyunca +%{p} artırır.",
                TargetSummary: $"+%{p} Enerji (90 Gün)",
                IconKey: "energy_booster"
            ));
        }

        // 6 Quarterly Officers (90 Days)
        var officers90 = new[]
        {
            ("officer_commander_90d", "Komutan (3 Ay)", "Altın", 240000, "Gelişmiş filo komutası ve imparatorluk paneli (90 Gün)."),
            ("officer_admiral_90d", "Amiral (3 Ay)", "Altın", 240000, "+2 İlave filo slotu ve taktiksel kaçış manevrası (90 Gün)."),
            ("officer_engineer_90d", "Mühendis (3 Ay)", "Altın", 240000, "Savunma onarımı %85 ve enerji +%10 (90 Gün)."),
            ("officer_geologist_90d", "Jeolog (3 Ay)", "Altın", 300000, "Tüm maden üretimlerini +%10 artırır (90 Gün)."),
            ("officer_technocrat_90d", "Teknokrat (3 Ay)", "Altın", 240000, "Araştırma süresini %25 kısaltır ve casusluk seviyesini +2 artırır (90 Gün)."),
            ("officer_staff_90d", "Komuta Kademesi Paketi (3 Ay)", "Platin", 1000000, "Tüm 5 subayı 3 ay boyunca aktif tutar ve ilave +%2 maden bonusu verir.")
        };
        foreach (var (offKey, offName, offTier, offCost, offDesc) in officers90)
        {
            items.Add(new ShopMasterItemDef(
                ItemKey: offKey,
                Name: offName,
                PrimaryCategory: "boosters-90d",
                Categories: ["boosters-90d"],
                Tier: offTier.Equals("Platin", StringComparison.OrdinalIgnoreCase) ? "Platinum" : "Gold",
                Duration: "90 Gün",
                DurationDays: 90,
                EffectValue: 1,
                BaseCostDarkMatter: offCost,
                DiscountCostDarkMatter: (int)(offCost * 0.8),
                IsDiscountActive: false,
                Description: offDesc,
                TargetSummary: "Üç Aylık Subay Komutası (90 Gün)",
                IconKey: "officer"
            ));
        }
        // boosters-90d total: 4 shared + 8 + 3 + 6 = 21 items!

        // -----------------------------------------------------------------------------------
        // 7. PROFİL (22 ÜRÜN)
        // -----------------------------------------------------------------------------------
        // 1 Relocation
        items.Add(new ShopMasterItemDef(
            ItemKey: "profile_relocation_240k",
            Name: "Gezegen Taşıma (Relocation)",
            PrimaryCategory: "profile",
            Categories: ["profile"],
            Tier: "Platinum",
            Duration: "hemen",
            DurationDays: 0,
            EffectValue: 1,
            BaseCostDarkMatter: 240000,
            DiscountCostDarkMatter: 240000,
            IsDiscountActive: false,
            Description: "Seçilen gezegeni ve ayını tüm binaları, filoları ve savunmasıyla boş bir koordinata taşır.",
            TargetSummary: "Galaksi Koordinat Transferi",
            IconKey: "relocation"
        ));

        // 1 Name Change
        items.Add(new ShopMasterItemDef(
            ItemKey: "profile_name_change_25k",
            Name: "Oyuncu Adı Değiştirme",
            PrimaryCategory: "profile",
            Categories: ["profile"],
            Tier: "Silver",
            Duration: "hemen",
            DurationDays: 0,
            EffectValue: 1,
            BaseCostDarkMatter: 25000,
            DiscountCostDarkMatter: 25000,
            IsDiscountActive: false,
            Description: "İmparatorluk sicilinizdeki komutan adınızı kalıcı olarak değiştirir.",
            TargetSummary: "Komutan Kimlik Değişimi",
            IconKey: "name_change"
        ));

        // 10 Avatarlar
        var avatars = new[]
        {
            ("avatar_miner", "Madenci", 15000, "Ağır sanayi maden işletmecisi kaskı ve zırhı."),
            ("avatar_admiral", "Yıldız Amirali", 25000, "Altın işlemeli amiral üniforması ve madalyaları."),
            ("avatar_cyborg", "Sayborg Komutan", 35000, "Siber optik protezli ve sibernetik zırhlı siborg portresi."),
            ("avatar_diplomat", "Galaktik Diplomat", 20000, "Barış elçisi cübbesi ve diplomatik asa."),
            ("avatar_explorer", "Kaşif Kaptanı", 25000, "Derin uzay navigasyon kaskı ve yıldız haritası vizörü."),
            ("avatar_pirate", "Korsan Lordu", 30000, "Göz bantlı ve enerji kılıçlı kanun kaçağı lider."),
            ("avatar_droid", "Taktik Droid Muhafız", 35000, "Yapay zeka muharebe droidi ön yüzü."),
            ("avatar_trader", "Karanlık Madde Tüccarı", 40000, "Zengin tüccar kürkleri ve holografik borsa vizörü."),
            ("avatar_nova", "Birinci Subay Nova", 45000, "Efsanevi Birinci Subay Nova'nın resmi portresi."),
            ("avatar_paladin", "Plazma Şövalyesi", 50000, "Parlayan plazma kalkanı ve ağır zırhlı elit savaşçı.")
        };
        foreach (var (avKey, avName, avCost, avDesc) in avatars)
        {
            items.Add(new ShopMasterItemDef(
                ItemKey: avKey,
                Name: $"Avatar: {avName}",
                PrimaryCategory: "profile",
                Categories: ["profile"],
                Tier: "Gold",
                Duration: "Daimi",
                DurationDays: 0,
                EffectValue: 1,
                BaseCostDarkMatter: avCost,
                DiscountCostDarkMatter: (int)(avCost * 0.8),
                IsDiscountActive: false,
                Description: avDesc,
                TargetSummary: "Profil Kozmetik Avatarı",
                IconKey: avKey
            ));
        }

        // 10 Unvanlar
        var titles = new[]
        {
            ("title_conqueror", "Galaksi Fatihi", 30000, "Galaksiler boyu fetihlerin simgesi unvan."),
            ("title_dm_baron", "Karanlık Madde Baronu", 50000, "Engin KM servetine sahip liderlerin unvanı."),
            ("title_fleet_admiral", "Yıldız Filosu Komutanı", 35000, "Yenilmez filolar yöneten komutanların simgesi."),
            ("title_deep_explorer", "Derin Uzay Kaşifi", 25000, "Bilinmeyen sektörleri haritalandıran öncülerin unvanı."),
            ("title_scrap_hunter", "Hurda Avcısı", 20000, "Savaş enkazlarını hızla toplayan uzmanların unvanı."),
            ("title_architect", "Kozmik Mimar", 30000, "Gelişmiş koloniler ve devasa yapılar inşa edenlerin unvanı."),
            ("title_nebula_guard", "Nebula Koruyucusu", 35000, "Müttefik sınırlarını savunan sadık muhafız unvanı."),
            ("title_grand_strategist", "Efsanevi Stratejist", 40000, "Kusursuz savaş simülasyonları tasarlayan dehaların unvanı."),
            ("title_sovereign", "Galaktik Hükümdar", 60000, "Kozmik tahtın mutlak hükümdarı unvanı."),
            ("title_blade_empire", "İmparatorluğun Kılıcı", 45000, "Düşmanlara aman vermeyen kılıç darbesi unvanı.")
        };
        foreach (var (tiKey, tiName, tiCost, tiDesc) in titles)
        {
            items.Add(new ShopMasterItemDef(
                ItemKey: tiKey,
                Name: $"Unvan: {tiName}",
                PrimaryCategory: "profile",
                Categories: ["profile"],
                Tier: "Gold",
                Duration: "Daimi",
                DurationDays: 0,
                EffectValue: 1,
                BaseCostDarkMatter: tiCost,
                DiscountCostDarkMatter: (int)(tiCost * 0.8),
                IsDiscountActive: false,
                Description: tiDesc,
                TargetSummary: "Profil Rozeti ve Sohbet Unvanı",
                IconKey: tiKey
            ));
        }
        // profile total: 1 + 1 + 10 + 10 = 22 items

        return items;
    }

    private static string Capitalize(string str)
    {
        if (string.IsNullOrEmpty(str)) return str;
        return char.ToUpperInvariant(str[0]) + str[1..].ToLowerInvariant();
    }
}
