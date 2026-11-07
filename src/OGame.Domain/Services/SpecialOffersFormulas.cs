namespace OGame.Domain.Services;

public record SpecialOfferDiscountDef(
    string OfferId,
    string Title,
    string Category, // "booster", "class", "relocation", "resource", "speedup", "bundle"
    int BaseCostDarkMatter,
    int DiscountPercent,
    int SaleCostDarkMatter,
    string Description,
    string BadgeText);

public record CompositeBundleDef(
    string BundleId,
    string Name,
    int OriginalValueDarkMatter,
    int BundlePriceDarkMatter,
    int DiscountPercent,
    string Description,
    IReadOnlyList<string> ItemsIncluded);

public static class SpecialOffersFormulas
{
    public const string EventTitle = "Platin İtem Haftası & Gezegen Taşıma Şenliği";
    public const string EventPromoBadge = "%10 ila %50 İndirim";
    public const int EventDurationDays = 7;

    // Fixed promotional rates
    public const int ClassChangeBasePrice = 500_000;
    public const int ClassChangeSalePrice = 400_000; // 20% discount
    public const int ClassChangeDiscountPercent = 20;

    public const int RelocationBasePrice = 240_000;
    public const int RelocationSalePrice = 120_000; // 50% discount
    public const int RelocationDiscountPercent = 50;

    public const int ResourcePackBasePrice = 120_000;
    public const int ResourcePackSalePrice = 84_000; // 30% discount
    public const int ResourcePackDiscountPercent = 30;

    public const int SpeedupMinBasePrice = 750;
    public const int SpeedupMinSalePrice = 562; // 25% discount
    public const int SpeedupDiscountPercent = 25;

    public static int CalculateDiscountPrice(int basePrice, int discountPercent)
    {
        if (discountPercent <= 0) return basePrice;
        if (discountPercent >= 100) return 0;
        decimal multiplier = 1.0m - (discountPercent / 100.0m);
        return (int)Math.Floor(basePrice * multiplier);
    }

    private static readonly List<CompositeBundleDef> Bundles =
    [
        new(
            BundleId: "bundle_explorer",
            Name: "Keşifçi Paketi (Explorer Bundle)",
            OriginalValueDarkMatter: 170_000,
            BundlePriceDarkMatter: 125_000,
            DiscountPercent: 26,
            Description: "Derin uzay keşiflerinde maksimum kaynak bulma şansı ve filo güvenliği sağlayan kombine paket.",
            ItemsIncluded:
            [
                "Keşif Bilgisayarı (30 Gün)",
                "Keşif Hızlandırıcısı (Expedition Turbo)",
                "30 Günlük Platin Kristal Güçlendirici (+%40)"
            ]
        ),
        new(
            BundleId: "bundle_industrialist",
            Name: "Sanayici Paketi (Industrialist Bundle)",
            OriginalValueDarkMatter: 390_000,
            BundlePriceDarkMatter: 290_000,
            DiscountPercent: 25,
            Description: "Tüm kaynak madenlerinin platin güçlendiricileri, anlık inşaat Kraken ve hurdacı bonuslarını birleştiren dev sanayi paketi.",
            ItemsIncluded:
            [
                "30 Günlük Platin Metal Güçlendirici (+%40)",
                "30 Günlük Platin Kristal Güçlendirici (+%40)",
                "30 Günlük Platin Döteryum Güçlendirici (+%40)",
                "Altın Kraken İnşa Hızlandırıcı (6 Saat Kısaltma)",
                "Hurdacı Özel Teklif İndirimi"
            ]
        ),
        new(
            BundleId: "bundle_lifeform",
            Name: "Yaşam Formu Paketi (Lifeform Starter Bundle)",
            OriginalValueDarkMatter: 110_000,
            BundlePriceDarkMatter: 75_000,
            DiscountPercent: 32,
            Description: "Yeni kolonilerde canlı türü gelişimini ışık hızına çıkaran Newtron, Detroid ve Deneyim hızlandırıcıları.",
            ItemsIncluded:
            [
                "Canlı Türü Newtron Hızlandırıcı",
                "Canlı Türü Detroid Tersane Hızlandırıcı",
                "Yaşam Formu Deneyim (XP) Çarpanı"
            ]
        )
    ];

    public static IReadOnlyList<CompositeBundleDef> GetBundles() => Bundles;

    public static CompositeBundleDef? FindBundle(string bundleId) =>
        Bundles.FirstOrDefault(b => b.BundleId.Equals(bundleId, StringComparison.OrdinalIgnoreCase));
}

