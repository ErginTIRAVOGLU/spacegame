using OGame.Domain.Enums;

namespace OGame.Domain.Services;

public record PlayerClassPerks(
    PlayerClass PlayerClass,
    string Name,
    string TargetAudience,
    int BaseCostDarkMatter,
    int DiscountCostDarkMatter,
    bool IsDiscountActive,
    double MineProductionMultiplier,
    double EnergyProductionMultiplier,
    double TransportSpeedMultiplier,
    double CombatSpeedMultiplier,
    double RecyclerSpeedMultiplier,
    int ExtraFleetSlots,
    int ExtraExpeditionSlots,
    double ExpeditionYieldMultiplier,
    double InactivePlunderRatio,
    double ResearchDurationMultiplier,
    IReadOnlyList<string> LorePerks);

public static class PlayerClassFormulas
{
    public const int BaseClassChangeCost = 500_000;
    public const int DiscountedClassChangeCost = 400_000;

    // Kolektör (Collector) constants
    public const double CollectorMineMultiplier = 1.25;
    public const double CollectorEnergyMultiplier = 1.10;
    public const double CollectorTransportSpeedMultiplier = 2.0;

    // General constants
    public const double GeneralCombatSpeedMultiplier = 1.10;
    public const double GeneralRecyclerSpeedMultiplier = 1.25;
    public const int GeneralExtraFleetSlots = 2;

    // Kaşif (Discoverer) constants
    public const double DiscovererExpeditionYieldMultiplier = 1.5;
    public const int DiscovererExtraExpeditionSlots = 2;
    public const double DiscovererInactivePlunderRatio = 0.75;
    public const double DiscovererResearchDurationMultiplier = 0.75;

    public const double StandardInactivePlunderRatio = 0.50;

    // Specialized unit constants & formulas
    public const double BaseCrawlerBoostPerUnit = 0.0002; // 0.02%
    public const double CollectorCrawlerBoostPerUnit = 0.0003; // 0.03% (50% boost)
    public const double GeneralDeathstarOneShotChancePerLightFighter = 0.00001; // 1 in 100,000
    public const double GeneralScrapRecoveryRatio = 0.10; // 10% scrap recovered

    public static int CalculateMaxCrawlers(int metalMineLvl, int crystalMineLvl, int deutSynthLvl, bool hasGeologist = false)
    {
        int sumLevels = Math.Max(0, metalMineLvl) + Math.Max(0, crystalMineLvl) + Math.Max(0, deutSynthLvl);
        double geologistMultiplier = hasGeologist ? 1.10 : 1.0;
        return (int)Math.Floor(sumLevels * 8 * geologistMultiplier);
    }

    // Crawler overload (Task 15)
    public const int CrawlerBaseEnergyPerUnit = 50;
    public const int CrawlerMaxEnergyPerUnit = 100;
    public const int StandardMaxCrawlerPercent = 100;
    public const int CollectorMaxCrawlerPercent = 150;

    /// <summary>
    /// MaxActiveCrawlers = floor((Metal + Crystal + Deut) * 8 * (1 + GeologistBonus)).
    /// GeologistBonus = 0.10 only for the Collector class with an active Geologist officer.
    /// </summary>
    public static int CalculateMaxActiveCrawlers(
        int metalMineLvl, int crystalMineLvl, int deutSynthLvl, PlayerClass playerClass, bool hasGeologist)
    {
        bool bonusApplies = playerClass == PlayerClass.Collector && hasGeologist;
        return CalculateMaxCrawlers(metalMineLvl, crystalMineLvl, deutSynthLvl, bonusApplies);
    }

    /// <summary>Selectable crawler percentages: 0..100 (step 10); Collector additionally 110..150.</summary>
    public static IReadOnlyList<int> GetAllowedCrawlerPercents(PlayerClass playerClass)
    {
        int max = playerClass == PlayerClass.Collector ? CollectorMaxCrawlerPercent : StandardMaxCrawlerPercent;
        return Enumerable.Range(0, max / 10 + 1).Select(i => i * 10).ToList();
    }

    public static int ClampCrawlerPercent(int percent, PlayerClass playerClass)
    {
        int max = playerClass == PlayerClass.Collector ? CollectorMaxCrawlerPercent : StandardMaxCrawlerPercent;
        return (int)Math.Round(Math.Clamp(percent, 0, max) / 10.0) * 10;
    }

    /// <summary>
    /// Per-crawler production bonus: standard 0.02%; Collector 100% = 0.03% (+50% class bonus);
    /// Collector 150% overload = 0.02% x 1.5 x 1.5 = 0.045%.
    /// </summary>
    public static double CalculateCrawlerBoostPerUnit(PlayerClass playerClass, int percent)
    {
        double ratio = Math.Max(0, percent) / 100.0;
        if (playerClass != PlayerClass.Collector)
        {
            return BaseCrawlerBoostPerUnit * Math.Min(1.0, ratio);
        }

        return BaseCrawlerBoostPerUnit * ratio * 1.5;
    }

    /// <summary>
    /// Energy per active crawler: 50 at <=100%, rising linearly with every +10% over 100% to 100 at 150% (2x).
    /// </summary>
    public static double CalculateCrawlerEnergyPerUnit(int percent)
    {
        if (percent <= 100) return CrawlerBaseEnergyPerUnit;
        int steps = Math.Min(5, (percent - 100) / 10);
        return CrawlerBaseEnergyPerUnit + steps * 10.0;
    }

    public static double CalculateCrawlerEnergyConsumption(int activeCrawlers, int percent)
    {
        return Math.Max(0, activeCrawlers) * CalculateCrawlerEnergyPerUnit(percent);
    }

    public static double CalculateCrawlerBoost(
        int crawlerCount,
        PlayerClass playerClass,
        int metalMineLvl,
        int crystalMineLvl,
        int deutSynthLvl,
        bool hasGeologist = false,
        bool overloadEnabled = false)
    {
        if (crawlerCount <= 0) return 0.0;

        int baseCap = CalculateMaxCrawlers(metalMineLvl, crystalMineLvl, deutSynthLvl, hasGeologist);
        int effectiveCap = (playerClass == PlayerClass.Collector && overloadEnabled)
            ? (int)Math.Floor(baseCap * 1.50)
            : baseCap;

        int activeCrawlers = Math.Clamp(crawlerCount, 0, effectiveCap);
        double boostPerCrawler = playerClass == PlayerClass.Collector
            ? CollectorCrawlerBoostPerUnit
            : BaseCrawlerBoostPerUnit;

        return activeCrawlers * boostPerCrawler;
    }

    public static PlayerClassPerks GetPerks(PlayerClass playerClass, bool isDiscountActive = false)
    {
        int effectiveCost = isDiscountActive ? DiscountedClassChangeCost : BaseClassChangeCost;

        return playerClass switch
        {
            PlayerClass.Collector => new PlayerClassPerks(
                PlayerClass: PlayerClass.Collector,
                Name: "Kolektör (Collector)",
                TargetAudience: "Madenci (Miner)",
                BaseCostDarkMatter: BaseClassChangeCost,
                DiscountCostDarkMatter: DiscountedClassChangeCost,
                IsDiscountActive: isDiscountActive,
                MineProductionMultiplier: CollectorMineMultiplier,
                EnergyProductionMultiplier: CollectorEnergyMultiplier,
                TransportSpeedMultiplier: CollectorTransportSpeedMultiplier,
                CombatSpeedMultiplier: 1.0,
                RecyclerSpeedMultiplier: 1.0,
                ExtraFleetSlots: 0,
                ExtraExpeditionSlots: 0,
                ExpeditionYieldMultiplier: 1.0,
                InactivePlunderRatio: StandardInactivePlunderRatio,
                ResearchDurationMultiplier: 1.0,
                LorePerks:
                [
                    "+%25 Maden üretimi (Metal, Kristal, Deuterium)",
                    "+%10 Enerji üretimi (Güneş Santrali ve Füzyon)",
                    "Daha yüksek Paletli (Crawler) verim limiti",
                    "+%100 daha hızlı Nakliye gemileri (Küçük ve Büyük Nakliye)",
                    "Aşırı yüklenme koruması: Enerji yetersizliğinde daha az verim kaybı"
                ]),

            PlayerClass.General => new PlayerClassPerks(
                PlayerClass: PlayerClass.General,
                Name: "General",
                TargetAudience: "Savaşçı / Yağmacı (Fleeter)",
                BaseCostDarkMatter: BaseClassChangeCost,
                DiscountCostDarkMatter: DiscountedClassChangeCost,
                IsDiscountActive: isDiscountActive,
                MineProductionMultiplier: 1.0,
                EnergyProductionMultiplier: 1.0,
                TransportSpeedMultiplier: 1.0,
                CombatSpeedMultiplier: GeneralCombatSpeedMultiplier,
                RecyclerSpeedMultiplier: GeneralRecyclerSpeedMultiplier,
                ExtraFleetSlots: GeneralExtraFleetSlots,
                ExtraExpeditionSlots: 0,
                ExpeditionYieldMultiplier: 1.0,
                InactivePlunderRatio: StandardInactivePlunderRatio,
                ResearchDurationMultiplier: 1.0,
                LorePerks:
                [
                    "Savaş filoları için +%10 hız bonusu",
                    "Geri Dönüşümcüler ve Azrail için +%25 uçuş hızı",
                    "Savaşlarda +1 ek zırh ve silah teknolojisi kademesi etkisi",
                    "+2 Maksimum filo slotu (Filo sınırını genişletir)",
                    "Savaş sonrasında enkaz alanından enkaz toplama önceliği (Azrail enkaz yağması)"
                ]),

            PlayerClass.Discoverer => new PlayerClassPerks(
                PlayerClass: PlayerClass.Discoverer,
                Name: "Kaşif (Discoverer)",
                TargetAudience: "Keşifçi (Explorer)",
                BaseCostDarkMatter: BaseClassChangeCost,
                DiscountCostDarkMatter: DiscountedClassChangeCost,
                IsDiscountActive: isDiscountActive,
                MineProductionMultiplier: 1.0,
                EnergyProductionMultiplier: 1.0,
                TransportSpeedMultiplier: 1.0,
                CombatSpeedMultiplier: 1.0,
                RecyclerSpeedMultiplier: 1.0,
                ExtraFleetSlots: 0,
                ExtraExpeditionSlots: DiscovererExtraExpeditionSlots,
                ExpeditionYieldMultiplier: DiscovererExpeditionYieldMultiplier,
                InactivePlunderRatio: DiscovererInactivePlunderRatio,
                ResearchDurationMultiplier: DiscovererResearchDurationMultiplier,
                LorePerks:
                [
                    "Keşif görevlerinden (16. Slot) çarpanlı hammadde, gemi ve Karanlık Madde bulma şansı",
                    "İnaktif oyunculardan %75 yağmalama kapasitesi (%50 yerine %75 taban ganimet)",
                    "+2 Ek keşif slotu",
                    "+%25 Daha hızlı araştırma laboratuvarı tamamlama süresi",
                    "Rehber (Pathfinder) gemisi ile keşif enkazlarını anında toplama yeteneği"
                ]),

            _ => new PlayerClassPerks(
                PlayerClass: PlayerClass.None,
                Name: "Sınıfsız",
                TargetAudience: "Standart Komutan",
                BaseCostDarkMatter: 0,
                DiscountCostDarkMatter: 0,
                IsDiscountActive: false,
                MineProductionMultiplier: 1.0,
                EnergyProductionMultiplier: 1.0,
                TransportSpeedMultiplier: 1.0,
                CombatSpeedMultiplier: 1.0,
                RecyclerSpeedMultiplier: 1.0,
                ExtraFleetSlots: 0,
                ExtraExpeditionSlots: 0,
                ExpeditionYieldMultiplier: 1.0,
                InactivePlunderRatio: StandardInactivePlunderRatio,
                ResearchDurationMultiplier: 1.0,
                LorePerks: [])
        };
    }
}

