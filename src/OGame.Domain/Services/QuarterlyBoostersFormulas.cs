namespace OGame.Domain.Services;

public record QuarterlyBoosterDef(
    string ItemCode,
    string Name,
    string ResourceType, // "Metal", "Crystal", "Deuterium"
    string Tier,         // "Silver", "Gold", "Platinum"
    double Multiplier,   // 0.20, 0.30, 0.40
    int DurationDays,    // 90
    int CostDarkMatter,
    int SavingsDarkMatter,
    string Description,
    string TargetSummary);

public record QuarterlyOfficerDef(
    string OfficerKey,   // "Commander", "Admiral", "Engineer", "Geologist", "Technocrat", "Staff"
    string Name,
    int DurationDays,    // 90
    int CostDarkMatter,
    string Description,
    string PerksSummary);

public static class QuarterlyBoostersFormulas
{
    private static readonly List<QuarterlyBoosterDef> Boosters =
    [
        // Metal
        new(
            ItemCode: "BOOSTER_METAL_SILVER_90D",
            Name: "Gümüş Metal Güçlendirici (90 Gün)",
            ResourceType: "Metal",
            Tier: "Silver",
            Multiplier: 0.20,
            DurationDays: 90,
            CostDarkMatter: 80_000,
            SavingsDarkMatter: 4_000,
            Description: "Metal Madeninin temel üretimini 90 gün boyunca +%20 artırır. 3x 30 Günlük alıma kıyasla 4.000 KM tasarruf sağlar.",
            TargetSummary: "+%20 Metal Üretimi (90 Gün)"),

        new(
            ItemCode: "BOOSTER_METAL_GOLD_90D",
            Name: "Altın Metal Güçlendirici (90 Gün)",
            ResourceType: "Metal",
            Tier: "Gold",
            Multiplier: 0.30,
            DurationDays: 90,
            CostDarkMatter: 200_000,
            SavingsDarkMatter: 25_000,
            Description: "Metal Madeninin temel üretimini 90 gün boyunca +%30 artırır. 3x 30 Günlük alıma kıyasla 25.000 KM tasarruf sağlar.",
            TargetSummary: "+%30 Metal Üretimi (90 Gün)"),

        new(
            ItemCode: "BOOSTER_METAL_PLATINUM_90D",
            Name: "Platin Metal Güçlendirici (90 Gün)",
            ResourceType: "Metal",
            Tier: "Platinum",
            Multiplier: 0.40,
            DurationDays: 90,
            CostDarkMatter: 300_000,
            SavingsDarkMatter: 30_000,
            Description: "Metal Madeninin temel üretimini 90 gün boyunca +%40 artırır. 3x 30 Günlük alıma kıyasla 30.000 KM tasarruf sağlar.",
            TargetSummary: "+%40 Metal Üretimi (90 Gün)"),

        // Crystal
        new(
            ItemCode: "BOOSTER_CRYSTAL_SILVER_90D",
            Name: "Gümüş Kristal Güçlendirici (90 Gün)",
            ResourceType: "Crystal",
            Tier: "Silver",
            Multiplier: 0.20,
            DurationDays: 90,
            CostDarkMatter: 80_000,
            SavingsDarkMatter: 4_000,
            Description: "Kristal Madeninin temel üretimini 90 gün boyunca +%20 artırır. 3x 30 Günlük alıma kıyasla 4.000 KM tasarruf sağlar.",
            TargetSummary: "+%20 Kristal Üretimi (90 Gün)"),

        new(
            ItemCode: "BOOSTER_CRYSTAL_GOLD_90D",
            Name: "Altın Kristal Güçlendirici (90 Gün)",
            ResourceType: "Crystal",
            Tier: "Gold",
            Multiplier: 0.30,
            DurationDays: 90,
            CostDarkMatter: 200_000,
            SavingsDarkMatter: 25_000,
            Description: "Kristal Madeninin temel üretimini 90 gün boyunca +%30 artırır. 3x 30 Günlük alıma kıyasla 25.000 KM tasarruf sağlar.",
            TargetSummary: "+%30 Kristal Üretimi (90 Gün)"),

        new(
            ItemCode: "BOOSTER_CRYSTAL_PLATINUM_90D",
            Name: "Platin Kristal Güçlendirici (90 Gün)",
            ResourceType: "Crystal",
            Tier: "Platinum",
            Multiplier: 0.40,
            DurationDays: 90,
            CostDarkMatter: 300_000,
            SavingsDarkMatter: 30_000,
            Description: "Kristal Madeninin temel üretimini 90 gün boyunca +%40 artırır. 3x 30 Günlük alıma kıyasla 30.000 KM tasarruf sağlar.",
            TargetSummary: "+%40 Kristal Üretimi (90 Gün)"),

        // Deuterium
        new(
            ItemCode: "BOOSTER_DEUT_SILVER_90D",
            Name: "Gümüş Döteryum Güçlendirici (90 Gün)",
            ResourceType: "Deuterium",
            Tier: "Silver",
            Multiplier: 0.20,
            DurationDays: 90,
            CostDarkMatter: 80_000,
            SavingsDarkMatter: 4_000,
            Description: "Döteryum Sentezleyicisinin temel üretimini 90 gün boyunca +%20 artırır. 3x 30 Günlük alıma kıyasla 4.000 KM tasarruf sağlar.",
            TargetSummary: "+%20 Döteryum Üretimi (90 Gün)"),

        new(
            ItemCode: "BOOSTER_DEUT_GOLD_90D",
            Name: "Altın Döteryum Güçlendirici (90 Gün)",
            ResourceType: "Deuterium",
            Tier: "Gold",
            Multiplier: 0.30,
            DurationDays: 90,
            CostDarkMatter: 200_000,
            SavingsDarkMatter: 25_000,
            Description: "Döteryum Sentezleyicisinin temel üretimini 90 gün boyunca +%30 artırır. 3x 30 Günlük alıma kıyasla 25.000 KM tasarruf sağlar.",
            TargetSummary: "+%30 Döteryum Üretimi (90 Gün)"),

        new(
            ItemCode: "BOOSTER_DEUT_PLATINUM_90D",
            Name: "Platin Döteryum Güçlendirici (90 Gün)",
            ResourceType: "Deuterium",
            Tier: "Platinum",
            Multiplier: 0.40,
            DurationDays: 90,
            CostDarkMatter: 300_000,
            SavingsDarkMatter: 30_000,
            Description: "Döteryum Sentezleyicisinin temel üretimini 90 gün boyunca +%40 artırır. 3x 30 Günlük alıma kıyasla 30.000 KM tasarruf sağlar.",
            TargetSummary: "+%40 Döteryum Üretimi (90 Gün)")
    ];

    private static readonly List<QuarterlyOfficerDef> Officers =
    [
        new(
            OfficerKey: "Commander",
            Name: "OGame Komutanı",
            DurationDays: 90,
            CostDarkMatter: 100_000,
            Description: "+İnşaat listesi sıralaması, reklamsız arayüz, mesaj filtreleri ve imparatorluk genel görünümü.",
            PerksSummary: "İnşaat Sırası • İmparatorluk Görünümü"),

        new(
            OfficerKey: "Admiral",
            Name: "Amiral (Fleet Admiral)",
            DurationDays: 90,
            CostDarkMatter: 75_000,
            Description: "Maksimum filo slotunu +2 artırır ve ilave keşif filosu hakkı tanır.",
            PerksSummary: "+2 Filo Slotu • +1 Keşif Slotu"),

        new(
            OfficerKey: "Engineer",
            Name: "Mühendis",
            DurationDays: 90,
            CostDarkMatter: 75_000,
            Description: "Tüm kolonilerde +%10 enerji üretimi ve savunma hatlarında %50 daha az kayıp (tamir oranı %85).",
            PerksSummary: "+%10 Enerji • %85 Savunma Tamiri"),

        new(
            OfficerKey: "Geologist",
            Name: "Jeolog",
            DurationDays: 90,
            CostDarkMatter: 62_500,
            Description: "Tüm madenlerde +%10 üretim artışı ve Paletli (Crawler) verim limitini yükseltme.",
            PerksSummary: "+%10 Maden Üretimi • Yüksek Paletli Limiti"),

        new(
            OfficerKey: "Technocrat",
            Name: "Teknokrat",
            DurationDays: 90,
            CostDarkMatter: 50_000,
            Description: "Araştırma sürelerini %25 hızlandırır ve Casusluk Seviyesini +2 artırır.",
            PerksSummary: "-%25 Araştırma Süresi • +2 Casusluk"),

        new(
            OfficerKey: "Staff",
            Name: "Subay Kadrosu Paketi (Tüm Subaylar)",
            DurationDays: 90,
            CostDarkMatter: 212_500,
            Description: "5 subayın tamamını 90 gün boyunca tek seferde aktif eder (Komuta Heyeti set bonusları dahil).",
            PerksSummary: "5 Subayın Tamamı • Komuta Heyeti Set Bonusu")
    ];

    public static IReadOnlyList<QuarterlyBoosterDef> GetQuarterlyBoosters() => Boosters;

    public static QuarterlyBoosterDef? FindBooster(string itemCode) =>
        Boosters.FirstOrDefault(b => b.ItemCode.Equals(itemCode, StringComparison.OrdinalIgnoreCase));

    public static IReadOnlyList<QuarterlyOfficerDef> GetQuarterlyOfficers() => Officers;

    public static QuarterlyOfficerDef? FindOfficer(string officerKey) =>
        Officers.FirstOrDefault(o => o.OfficerKey.Equals(officerKey, StringComparison.OrdinalIgnoreCase));

    public static DateTime CalculateExtendedExpiration(DateTime currentExpiresUtc, DateTime nowUtc, int addDays = 90)
    {
        DateTime baseTime = currentExpiresUtc > nowUtc ? currentExpiresUtc : nowUtc;
        return baseTime.AddDays(addDays);
    }
}

