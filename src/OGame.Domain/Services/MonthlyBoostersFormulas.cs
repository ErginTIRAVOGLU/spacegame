namespace OGame.Domain.Services;

public record MonthlyBoosterDef(
    string ItemCode,
    string Name,
    string ResourceType, // "Metal", "Crystal", "Deuterium"
    string Tier,         // "Silver", "Gold", "Platinum"
    double Multiplier,   // 0.20, 0.30, 0.40
    int DurationDays,    // 30
    int CostDarkMatter,
    string Description,
    string TargetSummary);

public record MonthlyOfficerDef(
    string OfficerKey,   // "Commander", "Admiral", "Engineer", "Geologist", "Technocrat", "Staff"
    string Name,
    int DurationDays,    // 30
    int CostDarkMatter,
    string Description,
    string PerksSummary);

public static class MonthlyBoostersFormulas
{
    private static readonly List<MonthlyBoosterDef> Boosters =
    [
        // Metal
        new(
            ItemCode: "BOOSTER_METAL_SILVER_30D",
            Name: "Gümüş Metal Güçlendirici",
            ResourceType: "Metal",
            Tier: "Silver",
            Multiplier: 0.20,
            DurationDays: 30,
            CostDarkMatter: 28_000,
            Description: "Metal Madeninin temel üretimini 30 gün boyunca +%20 artırır.",
            TargetSummary: "+%20 Metal Üretimi (30 Gün)"),

        new(
            ItemCode: "BOOSTER_METAL_GOLD_30D",
            Name: "Altın Metal Güçlendirici",
            ResourceType: "Metal",
            Tier: "Gold",
            Multiplier: 0.30,
            DurationDays: 30,
            CostDarkMatter: 75_000,
            Description: "Metal Madeninin temel üretimini 30 gün boyunca +%30 artırır.",
            TargetSummary: "+%30 Metal Üretimi (30 Gün)"),

        new(
            ItemCode: "BOOSTER_METAL_PLATINUM_30D",
            Name: "Platin Metal Güçlendirici",
            ResourceType: "Metal",
            Tier: "Platinum",
            Multiplier: 0.40,
            DurationDays: 30,
            CostDarkMatter: 110_000,
            Description: "Metal Madeninin temel üretimini 30 gün boyunca +%40 artırır.",
            TargetSummary: "+%40 Metal Üretimi (30 Gün)"),

        // Crystal
        new(
            ItemCode: "BOOSTER_CRYSTAL_SILVER_30D",
            Name: "Gümüş Kristal Güçlendirici",
            ResourceType: "Crystal",
            Tier: "Silver",
            Multiplier: 0.20,
            DurationDays: 30,
            CostDarkMatter: 28_000,
            Description: "Kristal Madeninin temel üretimini 30 gün boyunca +%20 artırır.",
            TargetSummary: "+%20 Kristal Üretimi (30 Gün)"),

        new(
            ItemCode: "BOOSTER_CRYSTAL_GOLD_30D",
            Name: "Altın Kristal Güçlendirici",
            ResourceType: "Crystal",
            Tier: "Gold",
            Multiplier: 0.30,
            DurationDays: 30,
            CostDarkMatter: 75_000,
            Description: "Kristal Madeninin temel üretimini 30 gün boyunca +%30 artırır.",
            TargetSummary: "+%30 Kristal Üretimi (30 Gün)"),

        new(
            ItemCode: "BOOSTER_CRYSTAL_PLATINUM_30D",
            Name: "Platin Kristal Güçlendirici",
            ResourceType: "Crystal",
            Tier: "Platinum",
            Multiplier: 0.40,
            DurationDays: 30,
            CostDarkMatter: 110_000,
            Description: "Kristal Madeninin temel üretimini 30 gün boyunca +%40 artırır.",
            TargetSummary: "+%40 Kristal Üretimi (30 Gün)"),

        // Deuterium
        new(
            ItemCode: "BOOSTER_DEUT_SILVER_30D",
            Name: "Gümüş Döteryum Güçlendirici",
            ResourceType: "Deuterium",
            Tier: "Silver",
            Multiplier: 0.20,
            DurationDays: 30,
            CostDarkMatter: 28_000,
            Description: "Döteryum Sentezleyicisinin temel üretimini 30 gün boyunca +%20 artırır.",
            TargetSummary: "+%20 Döteryum Üretimi (30 Gün)"),

        new(
            ItemCode: "BOOSTER_DEUT_GOLD_30D",
            Name: "Altın Döteryum Güçlendirici",
            ResourceType: "Deuterium",
            Tier: "Gold",
            Multiplier: 0.30,
            DurationDays: 30,
            CostDarkMatter: 75_000,
            Description: "Döteryum Sentezleyicisinin temel üretimini 30 gün boyunca +%30 artırır.",
            TargetSummary: "+%30 Döteryum Üretimi (30 Gün)"),

        new(
            ItemCode: "BOOSTER_DEUT_PLATINUM_30D",
            Name: "Platin Döteryum Güçlendirici",
            ResourceType: "Deuterium",
            Tier: "Platinum",
            Multiplier: 0.40,
            DurationDays: 30,
            CostDarkMatter: 110_000,
            Description: "Döteryum Sentezleyicisinin temel üretimini 30 gün boyunca +%40 artırır.",
            TargetSummary: "+%40 Döteryum Üretimi (30 Gün)")
    ];

    private static readonly List<MonthlyOfficerDef> Officers =
    [
        new(
            OfficerKey: "Commander",
            Name: "OGame Komutanı",
            DurationDays: 30,
            CostDarkMatter: 20_000,
            Description: "+İnşaat listesi sıralaması, reklamsız arayüz ve imparatorluk genel görünümü.",
            PerksSummary: "İnşaat Sırası • İmparatorluk Görünümü"),

        new(
            OfficerKey: "Admiral",
            Name: "Amiral (Fleet Admiral)",
            DurationDays: 30,
            CostDarkMatter: 15_000,
            Description: "Maksimum filo slotunu +2 artırır ve ilave keşif filosu hakkı tanır.",
            PerksSummary: "+2 Filo Slotu • +1 Keşif Slotu"),

        new(
            OfficerKey: "Engineer",
            Name: "Mühendis",
            DurationDays: 30,
            CostDarkMatter: 15_000,
            Description: "Tüm kolonilerde +%10 enerji üretimi ve savunma hatlarında %50 daha az kayıp (tamir oranı %85).",
            PerksSummary: "+%10 Enerji • %85 Savunma Tamiri"),

        new(
            OfficerKey: "Geologist",
            Name: "Jeolog",
            DurationDays: 30,
            CostDarkMatter: 12_500,
            Description: "Tüm madenlerde +%10 üretim artışı ve Paletli (Crawler) verim limitini yükseltme.",
            PerksSummary: "+%10 Maden Üretimi • Yüksek Paletli Limiti"),

        new(
            OfficerKey: "Technocrat",
            Name: "Teknokrat",
            DurationDays: 30,
            CostDarkMatter: 10_000,
            Description: "Araştırma sürelerini %25 hızlandırır ve Casusluk Seviyesini +2 artırır.",
            PerksSummary: "-%25 Araştırma Süresi • +2 Casusluk"),

        new(
            OfficerKey: "Staff",
            Name: "Subay Kadrosu Paketi (Tüm Subaylar)",
            DurationDays: 30,
            CostDarkMatter: 42_500,
            Description: "5 subayın tamamını 30 gün boyunca aktif eder ve Komuta Heyeti özel set bonuslarını kazandırır.",
            PerksSummary: "5 Subayın Tamamı • Komuta Heyeti Set Bonusu")
    ];

    public static IReadOnlyList<MonthlyBoosterDef> GetMonthlyBoosters() => Boosters;

    public static MonthlyBoosterDef? FindBooster(string itemCode) =>
        Boosters.FirstOrDefault(b => b.ItemCode.Equals(itemCode, StringComparison.OrdinalIgnoreCase));

    public static IReadOnlyList<MonthlyOfficerDef> GetMonthlyOfficers() => Officers;

    public static MonthlyOfficerDef? FindOfficer(string officerKey) =>
        Officers.FirstOrDefault(o => o.OfficerKey.Equals(officerKey, StringComparison.OrdinalIgnoreCase));

    public static DateTime CalculateExtendedExpiration(DateTime currentExpiresUtc, DateTime nowUtc, int addDays = 30)
    {
        DateTime baseTime = currentExpiresUtc > nowUtc ? currentExpiresUtc : nowUtc;
        return baseTime.AddDays(addDays);
    }
}

