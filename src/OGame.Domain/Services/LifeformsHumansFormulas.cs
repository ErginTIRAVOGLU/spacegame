namespace OGame.Domain.Services;

public record LifeformBuildingDefinition(
    string Key,
    int Index,
    string Name,
    string Description,
    long BaseMetal,
    long BaseCrystal,
    long BaseDeuterium,
    long BaseEnergy,
    double CostFactor,
    string CapacityType
);

public record LifeformTechDefinition(
    int Slot,
    int Tier,
    string Name,
    string Description,
    long RequiredPopulation,
    long BaseMetal,
    long BaseCrystal,
    long BaseDeuterium,
    double CostFactor = 1.3
);

public record LifeformCostResult(
    long Metal,
    long Crystal,
    long Deuterium,
    long EnergyDelta,
    int DurationSeconds
);

public static class LifeformsHumansFormulas
{
    public const string SpeciesName = "İnsanlar";
    public const string CanonicalLore =
        "İnsanlar çok yönlü yeteneklere sahip bir canlı türüdür. Diğer canlı türlerini bulabilen tek türdür. Besin üretimleri ve halkının nüfus artışı dengelidir ayrıca tüm gezegenlerdeki kaynak üretimini artırırlar. Sınıf bonusunu güçlendirmezler.";

    public static readonly IReadOnlyList<LifeformBuildingDefinition> Buildings = new List<LifeformBuildingDefinition>
    {
        new("residentialSector", 1, "Barınma Tesisi", "Barınma Tesisi T1 İnsanlarına barınma alanı sağlar. Her seviye gezegendeki barınma kapasitesini ve büyüme oranını artırır.", 7, 2, 0, 0, 1.2, "population"),
        new("biosphereFarm", 2, "Biyosfer Çiftliği", "Biyosfer Çiftliği geliştirmesi her seviyeyle depolama kapasitesini ve saniye başı üretilen besinin miktarını artırır.", 5, 2, 0, 8, 1.23, "food"),
        new("researchCentre", 3, "Araştırma Merkezi", "Araştırma Merkezi İnsanların teknoloji ağacını kullanıma açar ve yükselen her seviyeyle yeni teknoloji araştırmasının maliyet ve süresini düşürür.", 20000, 25000, 10000, 10, 1.3, "tech"),
        new("academyOfSciences", 4, "Bilim Akademisi", "Akademi'de T1 İnsanları gelişerek T2 İnsanlarına dönüşür. Her seviye gelişen İnsanların sayısını artırır.", 5000, 3200, 1500, 15, 1.4, "population"),
        new("neuroCalibrationCentre", 5, "Nöro Kalibrasyon Merkezi", "Nöro Kalibrasyon Merkezi'nde T2 İnsanları gelişerek T3 İnsanlarına dönüşür. Her seviye gelişen İnsanların sayısını artırır.", 50000, 40000, 50000, 30, 1.5, "population"),
        new("highEnergySmelting", 6, "Yüksek Enerji Potası", "Yüksek Enerji Potası her seviyeyle gezegendeki metal üretimini artırır.", 9000, 6000, 3000, 40, 1.5, "production"),
        new("foodSilo", 7, "Besin Deposu", "Besin Deposu besin dağıtımının daha iyi yapılabilmesini sağlar. Her seviyeyle maksimum besin miktarı artar, T1 İnsanlarının besin tüketim miktarı düşer ve çoğalma hızı artar.", 25000, 13000, 7000, 0, 1.09, "food"),
        new("fusionPoweredProduction", 8, "Füzyonla Yapılan Madencilik", "Füzyonla yapılan madencilik her basamakta gezegendeki kristal ve Deuterium üretimini artırır.", 50000, 25000, 15000, 80, 1.5, "production"),
        new("skyscraper", 9, "Gökdelen", "Gökdelen birçok İnsana barınma imkanı sağlar. Her seviyeyle bu gezegendeki maksimum İnsan sayısı yükselir ve çoğalma hızı artar.", 75000, 20000, 25000, 50, 1.09, "population"),
        new("biotechLab", 10, "Biyotek Laboratuvarı", "Biyotek Laboratuvarı her seviyeyle gezegendeki besin üretimini çarpan etkisiyle artırır.", 150000, 30000, 15000, 60, 1.12, "production"),
        new("metropolis", 11, "Metropol", "Metropol bu gezegendeki tüm teknolojileri geliştirir ve araştırma verimliliğini çarpan etkisiyle güçlendirir.", 80000, 35000, 60000, 90, 1.3, "production"),
        new("planetaryShield", 12, "Gezegen Kalkanı", "Gezegen kalkanı bir saldırı durumunda gezegendeki İnsanların bir bölümünü korur.", 250000, 125000, 125000, 100, 1.2, "shield")
    };

    public static readonly IReadOnlyList<LifeformTechDefinition> Technologies = new List<LifeformTechDefinition>
    {
        // Tier 1 (T1 Humans - Slot 1..6)
        new(1, 1, "Galaksiler Arası Elçiler", "Galaksiler Arası Elçiler (Intergalactic Envoys): Galakside diğer canlı türlerini keşfetmeyi sağlar ve keşif süresini kısaltır.", 200000, 5000, 2500, 500),
        new(2, 1, "Yüksek Performanslı Ekstraktörler", "Yüksek Performanslı Ekstraktörler (High-Performance Extractors): Metal, Kristal ve Deuterium üretimini artırır.", 300000, 7000, 10000, 5000),
        new(3, 1, "Füzyon İticileri", "Füzyon İticileri (Fusion Drives): Sivil gemilerin hızını artırır.", 400000, 15000, 10000, 5000),
        new(4, 1, "Gizlilik Alanı Jeneratörü", "Gizlilik Alanı Jeneratörü (Stealth Field Generator): Casusluk araştırması ve karşı casusluk avantajı sağlar.", 500000, 20000, 15000, 7500),
        new(5, 1, "Yörünge İni", "Yörünge İni (Orbital Den): Kaynak sığınağı kapasitesini artırır.", 750000, 25000, 20000, 10000),
        new(6, 1, "Araştırma Yapay Zekası", "Araştırma Yapay Zekası (Research AI): Standart araştırmaların süresini kısaltır.", 1000000, 35000, 25000, 15000),

        // Tier 2 (T2 Humans - Slot 7..12)
        new(7, 2, "Yüksek Performanslı Terraformer", "Yüksek Performanslı Terraformer (High-Performance Terraformer): Terraformer maliyetini düşürür ve süresini kısaltır.", 1200000, 50000, 40000, 20000),
        new(8, 2, "Gelişmiş Üretim Teknolojileri", "Gelişmiş Üretim Teknolojileri (Enhanced Production Technologies): Maden üretimini artırır.", 3000000, 80000, 50000, 20000),
        new(9, 2, "Hafif Avcı Mk II", "Hafif Avcı Mk II (Light Fighter Mk II): Hafif Avcı saldırı, kalkan, zırh ve hızını artırır.", 5000000, 120000, 90000, 30000),
        new(10, 2, "Kruvazör Mk II", "Kruvazör Mk II (Cruiser Mk II): Kruvazör istatistiklerini güçlendirir.", 7000000, 160000, 120000, 50000),
        new(11, 2, "Gelişmiş Laboratuvar Teknolojisi", "Gelişmiş Laboratuvar Teknolojisi (Improved Lab Technology): Araştırma sürelerini kısaltır.", 9000000, 220000, 180000, 80000),
        new(12, 2, "Plazma Terraformer", "Plazma Terraformer (Plasma Terraformer): Terraformer bina maliyetlerini ve süresini azaltır.", 11000000, 300000, 240000, 100000),

        // Tier 3 (T3 Humans - Slot 13..18)
        new(13, 3, "Düşük Sıcaklık İticileri", "Düşük Sıcaklık İticileri (Low-Temperature Drives): Casus sondası ve sivil filo hızlarını iyileştirir.", 13000000, 500000, 350000, 150000),
        new(14, 3, "Bombardıman Gemisi Mk II", "Bombardıman Gemisi Mk II (Bomber Mk II): Bombardıman Gemisi istatistiklerini güçlendirir.", 26000000, 650000, 500000, 250000),
        new(15, 3, "Muhrip Mk II", "Muhrip Mk II (Destroyer Mk II): Muhrip istatistiklerini güçlendirir.", 56000000, 850000, 650000, 300000),
        new(16, 3, "Fırkateyn Mk II", "Fırkateyn Mk II (Battlecruiser Mk II): Fırkateyn istatistiklerini güçlendirir.", 112000000, 1100000, 850000, 400000),
        new(17, 3, "Robot Asistanlar", "Robot Asistanlar (Robot Assistants): Araştırma sürelerini kısaltır.", 224000000, 1500000, 1200000, 600000),
        new(18, 3, "Süper Bilgisayar", "Süper Bilgisayar (Supercomputer): Tüm standart araştırmaların maliyetini ve süresini düşürür.", 448000000, 2000000, 1600000, 800000)
    };

    /// <summary>
    /// Population State Machine:
    /// NetGrowth = (BaseGrowthRate + HousingBonus) * min(1.0, FoodReserve / FoodConsumption)
    /// If FoodReserve <= 0, population enters starvation: growth stops (0) and degrades.
    /// </summary>
    public static double CalculateNetGrowthRate(
        double baseGrowthRate,
        double housingBonus,
        double foodReserve,
        double foodConsumption,
        double currentPopulation = 100)
    {
        if (foodReserve <= 0)
        {
            // Starvation: pop growth stops and population degrades by -2% of current pop per cycle
            return -Math.Max(1.0, currentPopulation * 0.02);
        }

        double foodFactor = foodConsumption > 0
            ? Math.Min(1.0, foodReserve / foodConsumption)
            : 1.0;

        return (baseGrowthRate + housingBonus) * foodFactor;
    }

    public static int CalculateMaxPopulation(int residentialLevel, int skyscraperLevel)
    {
        if (residentialLevel <= 0) return 0;
        if (residentialLevel <= 2 && skyscraperLevel <= 0)
        {
            return residentialLevel * 125;
        }

        // Exponential population curve aligned with OGame Wiki (e.g. Level 21 reaches ~207k for Slot 1 unlock)
        double basePop = 250.0 * Math.Pow(1.425, residentialLevel - 2);
        double skyscraperPop = skyscraperLevel > 0
            ? skyscraperLevel * 500_000.0 * Math.Pow(1.3, Math.Min(10, skyscraperLevel))
            : 0;
        return (int)Math.Min(int.MaxValue, Math.Floor(basePop + skyscraperPop));
    }

    public static (int T1, int T2, int T3) CalculatePopulationTiers(
        int residentialLevel,
        int skyscraperLevel,
        int academyLevel,
        int neuroLevel)
    {
        int maxPop = CalculateMaxPopulation(residentialLevel, skyscraperLevel);
        if (residentialLevel <= 0)
        {
            return (0, 0, 0);
        }

        int totalPotential = residentialLevel <= 2 && skyscraperLevel <= 0
            ? residentialLevel * 125
            : maxPop;
        int t1Raw = Math.Min(maxPop, totalPotential);

        int t2 = academyLevel > 0 ? Math.Min(t1Raw / 2, academyLevel * 80) : 0;
        int t3 = neuroLevel > 0 ? Math.Min(t2 / 2, neuroLevel * 40) : 0;
        int t1 = Math.Max(0, t1Raw - t2 - t3);

        return (t1, t2, t3);
    }

    public static (int MaxFood, int FoodBalance, int FoodPerSecond) CalculateFoodMetrics(
        int biosphereFarmLevel,
        int foodSiloLevel,
        int biotechLabLevel)
    {
        int maxFood = 1000 + biosphereFarmLevel * 800 + foodSiloLevel * 2500;
        double labMultiplier = 1.0 + (biotechLabLevel * 0.08);
        int foodPerSec = biosphereFarmLevel > 0
            ? (int)Math.Round(biosphereFarmLevel * 12 * labMultiplier)
            : 0;
        int foodBalance = biosphereFarmLevel > 0
            ? Math.Min(maxFood, (int)Math.Round(biosphereFarmLevel * 420 * labMultiplier))
            : 0;

        return (maxFood, foodBalance, foodPerSec);
    }

    public static bool IsTechUnlocked(int slot, long currentTotalPopulation)
    {
        var tech = Technologies.FirstOrDefault(t => t.Slot == slot);
        if (tech == null) return false;
        return currentTotalPopulation >= tech.RequiredPopulation;
    }

    public static LifeformCostResult CalculateBuildingUpgrade(string buildingKey, int currentLevel)
    {
        var meta = Buildings.FirstOrDefault(b => b.Key.Equals(buildingKey, StringComparison.OrdinalIgnoreCase))
            ?? Buildings[0];

        int targetLevel = currentLevel + 1;
        double multiplier = Math.Pow(meta.CostFactor, targetLevel - 1) * targetLevel;

        long metal = Math.Max(1, (long)Math.Floor(meta.BaseMetal * multiplier));
        long crystal = Math.Max(1, (long)Math.Floor(meta.BaseCrystal * multiplier));
        long deut = (long)Math.Floor(meta.BaseDeuterium * multiplier);
        long energyDelta = meta.BaseEnergy > 0
            ? Math.Max(1, (long)Math.Ceiling(meta.BaseEnergy * targetLevel * Math.Pow(1.05, targetLevel)))
            : 0;

        int durationSeconds = Math.Max(6, Math.Min(7200, (int)Math.Floor(12 * Math.Pow(1.22, targetLevel))));

        return new LifeformCostResult(metal, crystal, deut, energyDelta, durationSeconds);
    }

    public static LifeformCostResult CalculateTechUpgrade(int slot, int currentLevel, int researchCentreLevel = 1)
    {
        var meta = Technologies.FirstOrDefault(t => t.Slot == slot) ?? Technologies[0];
        int targetLevel = currentLevel + 1;

        double discount = Math.Max(0.5, 1.0 - (researchCentreLevel * 0.02));
        double multiplier = Math.Pow(meta.CostFactor, targetLevel - 1) * targetLevel * discount;

        long metal = Math.Max(1, (long)Math.Floor(meta.BaseMetal * multiplier));
        long crystal = Math.Max(1, (long)Math.Floor(meta.BaseCrystal * multiplier));
        long deut = Math.Max(0, (long)Math.Floor(meta.BaseDeuterium * multiplier));

        int durationSeconds = Math.Max(10, (int)Math.Floor(30 * Math.Pow(1.25, targetLevel) * discount));

        return new LifeformCostResult(metal, crystal, deut, 0, durationSeconds);
    }
}

