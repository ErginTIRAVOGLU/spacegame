namespace OGame.Domain.Services;

public record LifeformSpeciesDefinition(
    string Id,
    string Name,
    string Tagline,
    string Playstyle,
    bool IsDefaultUnlocked,
    IReadOnlyDictionary<string, string> Ratings,
    IReadOnlyList<string> CoreBonuses,
    IReadOnlyList<LifeformBuildingDefinition> Buildings,
    IReadOnlyList<LifeformTechDefinition> Technologies
);

public static class LifeformsSpeciesFormulas
{
    public const string HumansId = "humans";
    public const string RocktalId = "rocktal";
    public const string MechasId = "mechas";
    public const string KaeleshId = "kaelesh";

    // Official Sidian OGame Wiki 18 Technology Slot Population Requirements
    public static readonly IReadOnlyDictionary<int, long> TechSlotPopulationThresholds = new Dictionary<int, long>
    {
        [1] = 200_000,
        [2] = 300_000,
        [3] = 400_000,
        [4] = 500_000,
        [5] = 750_000,
        [6] = 1_000_000,
        [7] = 1_200_000,
        [8] = 3_000_000,
        [9] = 5_000_000,
        [10] = 7_000_000,
        [11] = 9_000_000,
        [12] = 11_000_000,
        [13] = 13_000_000,
        [14] = 26_000_000,
        [15] = 56_000_000,
        [16] = 112_000_000,
        [17] = 224_000_000,
        [18] = 448_000_000
    };

    // Artefact (Eser) System rules
    public const int ArtefactTier1Cost = 200;
    public const int ArtefactTier2Cost = 400;
    public const int ArtefactTier3Cost = 600;
    public const int MaxArtefactsCapacity = 3600;

    // Exploration flight rules
    public static readonly (long Metal, long Crystal, long Deuterium) ExplorationFlightCost = (5000, 1000, 500);
    public const int ExplorationDailyAllotment = 50;
    public const int ExplorationCoordinateCooldownDays = 7;
    public const int MaxSpeciesLevel = 100;
    public const double MaxSpeciesBonusPercent = 10.0;
    public const double BonusPercentPerLevel = 0.1;

    // Species switch rules
    public const int SpeciesSwitchCooldownHours = 48;

    public static readonly IReadOnlyList<LifeformSpeciesDefinition> AllSpecies = new List<LifeformSpeciesDefinition>
    {
        // 1. İnsanlar (Humans) — Sınıf Bağımsız (Dengeli)
        new(
            Id: HumansId,
            Name: "İnsanlar (Humans)",
            Tagline: "Dengeli Gelişim & Diplomasi",
            Playstyle: "Her alanda dengeli gelişmek isteyenler.",
            IsDefaultUnlocked: true,
            Ratings: new Dictionary<string, string>
            {
                ["metal"] = "İyi",
                ["crystal"] = "İyi",
                ["deuterium"] = "İyi",
                ["research"] = "Çok iyi",
                ["military"] = "Orta",
                ["expedition"] = "İyi"
            },
            CoreBonuses: new List<string>
            {
                "Araştırma sürelerini azaltma",
                "Genel kaynak üretimine katkı",
                "Bazı savaş gemilerini geliştirme",
                "Diğer üç canlı türünü keşfetme (Galaksiler Arası Elçiler)"
            },
            Buildings: LifeformsHumansFormulas.Buildings,
            Technologies: LifeformsHumansFormulas.Technologies
        ),

        // 2. Rock'tal — Koleksiyoncu (Collector) Sinerjisi
        new(
            Id: RocktalId,
            Name: "Rock'tal",
            Tagline: "Madencilik ve Kaynak Ekonomisi",
            Playstyle: "Madenlerini geliştirip sürekli kaynak biriktirenler.",
            IsDefaultUnlocked: false,
            Ratings: new Dictionary<string, string>
            {
                ["metal"] = "Çok iyi",
                ["crystal"] = "Çok iyi",
                ["deuterium"] = "Çok iyi",
                ["research"] = "Orta",
                ["military"] = "Orta",
                ["expedition"] = "Düşük"
            },
            CoreBonuses: new List<string>
            {
                "Metal, Kristal ve Deuterium üretimini artırma",
                "Enerji üretimini geliştirme ve bina maliyetlerini düşürme",
                "Savunma ve kaynak ekonomisine doğrudan katkı"
            },
            Buildings: new List<LifeformBuildingDefinition>
            {
                new("meditationEnclave", 1, "Meditasyon Bölgesi", "Meditasyon Bölgesi (Meditation Enclave): Rock'tal nüfus kapasitesi ve artış hızı sağlar.", 9, 3, 0, 0, 1.2, "population"),
                new("crystalFarm", 2, "Kristal Çiftliği", "Kristal Çiftliği (Crystal Farm): Rock'tal için besin (kristal enerji) üretir.", 7, 3, 0, 10, 1.23, "food"),
                new("runeTechnologium", 3, "Rün Teknolojisi Merkezi", "Rün Teknolojisi Merkezi (Rune Technologium): Rock'tal teknoloji ağacını açar ve araştırma maliyetlerini düşürür.", 25000, 30000, 12000, 12, 1.3, "tech"),
                new("runeForge", 4, "Rün Ocağı", "Rün Ocağı (Rune Forge): T1 nüfusu T2'ye dönüştürür.", 6000, 4000, 2000, 18, 1.4, "population"),
                new("oriktorium", 5, "Oriktoryum", "Oriktoryum (Oriktorium): T2 nüfusu T3'e dönüştürür.", 60000, 50000, 60000, 35, 1.5, "population"),
                new("magmaForge", 6, "Magma Ocağı", "Magma Ocağı (Magma Forge): Gezegendeki Metal üretimini yüksek oranda artırır.", 11000, 7000, 4000, 45, 1.5, "production"),
                new("disruptionChamber", 7, "Kesinti Odası", "Kesinti Odası (Disruption Chamber): Gezegendeki enerji üretimini artırır ve bina enerji tüketimini düşürür.", 30000, 16000, 8000, 0, 1.09, "food"),
                new("megalith", 8, "Megalit", "Megalit (Megalith): Rock'tal bina inşaat maliyetlerini ve sürelerini düşürür.", 90000, 25000, 30000, 55, 1.09, "population"),
                new("crystalRefinery", 9, "Kristal Rafinerisi", "Kristal Rafinerisi (Crystal Refinery): Gezegendeki Kristal üretimini yüksek oranda artırır.", 60000, 30000, 18000, 90, 1.5, "production"),
                new("deuteriumSynthesiserRocktal", 10, "Deuterium Sentezleyicisi (Rock'tal)", "Deuterium Sentezleyicisi (Deuterium Synthesiser): Gezegendeki Deuterium üretimini artırır.", 180000, 40000, 20000, -100, 1.12, "production"),
                new("mineralResearchCentre", 11, "Mineral Araştırma Merkezi", "Mineral Araştırma Merkezi (Mineral Research Centre): Maden binalarının (Metal, Kristal, Deut) inşaat maliyetlerini düşürür.", 95000, 45000, 70000, 100, 1.3, "production"),
                new("advancedRecyclingPlant", 12, "Gelişmiş Geri Dönüşüm Tesisi", "Gelişmiş Geri Dönüşüm Tesisi (Advanced Recycling Plant): Gezegen savunmasından oluşan harabe/geri kazanımı artırır.", 300000, 150000, 150000, 110, 1.2, "shield")
            },
            Technologies: new List<LifeformTechDefinition>
            {
                new(1, 1, "Volkanik Piller", "Volkanik Piller (Volcanic Batteries): Enerji üretimini artırır.", 200000, 5000, 2500, 500),
                new(2, 1, "Akustik Tarama", "Akustik Tarama (Acoustic Scanning): Tüm madenlerin üretimini artırır.", 300000, 7000, 10000, 5000),
                new(3, 1, "Yüksek Enerjili Pompa Sistemleri", "Yüksek Enerjili Pompa Sistemleri (High Energy Pump Systems): Deuterium üretimini artırır.", 400000, 15000, 10000, 5000),
                new(4, 1, "Kargo Kapasitesi Genişletme (Sivil Gemiler)", "Kargo Kapasitesi Genişletme (Cargo Hold Expansion): Sivil gemilerin yük kapasitesini artırır.", 500000, 20000, 15000, 7500),
                new(5, 1, "Magma Güçlü Üretim", "Magma Güçlü Üretim (Magma-Powered Production): Metal, Kristal ve Deuterium üretimini artırır.", 750000, 25000, 20000, 10000),
                new(6, 1, "Jeotermal Enerji Santralleri", "Jeotermal Enerji Santralleri (Geothermal Power Plants): Enerji üretimini artırır.", 1000000, 35000, 25000, 15000),
                new(7, 2, "Derinlik Sondajı", "Derinlik Sondajı (Depth Sounding): Metal, Kristal ve Deuterium üretimini artırır.", 1200000, 50000, 40000, 20000),
                new(8, 2, "İyon Kristal Güçlendirmesi (Ağır Avcı)", "İyon Kristal Güçlendirmesi (Ion Crystal Enhancement): Ağır Avcı istatistiklerini güçlendirir.", 3000000, 80000, 50000, 20000),
                new(9, 2, "Geliştirilmiş Stellarator", "Geliştirilmiş Stellarator (Improved Stellarator): Füzyon reaktörü maliyetini düşürür ve enerjisini artırır.", 5000000, 120000, 90000, 30000),
                new(10, 2, "Sertleştirilmiş Elmas Matkap Uçları", "Sertleştirilmiş Elmas Matkap Uçları (Hardened Diamond Drill Heads): Metal, Kristal ve Deuterium üretimini artırır.", 7000000, 160000, 120000, 50000),
                new(11, 2, "Sismik Madencilik Teknolojisi", "Sismik Madencilik Teknolojisi (Seismic Mining Technology): Tüm madenlerin üretimini artırır.", 9000000, 220000, 180000, 80000),
                new(12, 2, "Magma Güçlü Pompa Sistemleri", "Magma Güçlü Pompa Sistemleri (Magma-Powered Pump Systems): Maden üretimini ve enerji verimliliğini artırır.", 11000000, 300000, 240000, 100000),
                new(13, 3, "İyon Kristal Modülleri", "İyon Kristal Modülleri (Ion Crystal Modules): Paletli (Crawler) verimliliğini ve enerji bonusunu artırır.", 13000000, 500000, 350000, 150000),
                new(14, 3, "Optimize Silo İnşa Yöntemi", "Optimize Silo İnşa Yöntemi (Optimised Silo Construction Method): Depo ve tesis maliyetlerini düşürür.", 26000000, 650000, 500000, 250000),
                new(15, 3, "Elmas Enerji İleticisi", "Elmas Enerji İleticisi (Diamond Energy Transmitter): Enerji üretimini yükseltir.", 56000000, 850000, 650000, 30000),
                new(16, 3, "Obsidyen Kalkan Güçlendirmesi", "Obsidyen Kalkan Güçlendirmesi (Obsidian Shield Reinforcement): Gezegen savunma birimlerinin istatistiklerini güçlendirir.", 112000000, 1100000, 850000, 400000),
                new(17, 3, "Rün Kalkanları", "Rün Kalkanları (Rune Shields): Küçük ve Büyük Kalkan Kubbelerini güçlendirir.", 224000000, 1500000, 1200000, 600000),
                new(18, 3, "Rock'tal Koleksiyoncu Güçlendirmesi", "Rock'tal Koleksiyoncu Güçlendirmesi (Rock'tal Collector Enhancement): Koleksiyoncu (Collector) oyuncu sınıfı bonuslarını artırır.", 448000000, 2000000, 1600000, 800000)
            }
        ),

        // 3. Mekalar (Mechas) — General Sinerjisi
        new(
            Id: MechasId,
            Name: "Mekalar (Mechas)",
            Tagline: "Askerî Güç ve Filo Üstünlüğü",
            Playstyle: "Savaşan, filo kuran ve diğer oyunculara saldıranlar.",
            IsDefaultUnlocked: false,
            Ratings: new Dictionary<string, string>
            {
                ["metal"] = "Orta",
                ["crystal"] = "Orta",
                ["deuterium"] = "İyi",
                ["research"] = "Orta",
                ["military"] = "Çok iyi",
                ["expedition"] = "Düşük"
            },
            CoreBonuses: new List<string>
            {
                "Gemi üretim süreçlerini hızlandırma",
                "Filo uçuş Deuterium maliyetlerini azaltma",
                "Savaş gemilerinin saldırı, kalkan ve zırh özelliklerini geliştirme",
                "Savaş teknolojilerine katkı"
            },
            Buildings: new List<LifeformBuildingDefinition>
            {
                new("assemblyLine", 1, "Montaj Hattı", "Montaj Hattı (Assembly Line): Mecha nüfus kapasitesi ve hızlı üretim sağlar.", 8, 2, 0, 0, 1.2, "population"),
                new("fusionCellFactory", 2, "Füzyon Hücresi Fabrikası", "Füzyon Hücresi Fabrikası (Fusion Cell Factory): Mecha için besin (enerji hücresi) üretir.", 6, 2, 0, 9, 1.23, "food"),
                new("roboticsResearchCentre", 3, "Robotik Araştırma Merkezi", "Robotik Araştırma Merkezi (Robotics Research Centre): Mecha teknoloji ağacını açar.", 22000, 26000, 11000, 12, 1.3, "tech"),
                new("updateNetwork", 4, "Güncelleme Ağı", "Güncelleme Ağı (Update Network): T1 nüfusu T2'ye dönüştürür.", 5500, 3500, 1800, 16, 1.4, "population"),
                new("quantumComputerCentre", 5, "Kuantum Bilgisayar Merkezi", "Kuantum Bilgisayar Merkezi (Quantum Computer Centre): T2 nüfusu T3'e dönüştürür.", 55000, 45000, 55000, 32, 1.5, "population"),
                new("automatisedAssemblyCentre", 6, "Otomatik Montaj Merkezi", "Otomatik Montaj Merkezi (Automatised Assembly Centre): Gezegendeki Tersane (gemi ve savunma) üretim sürelerini kısaltır.", 10000, 6500, 3500, 42, 1.5, "production"),
                new("highPerformanceTransformer", 7, "Yüksek Performanslı Transformatör", "Yüksek Performanslı Transformatör (High-Performance Transformer): Enerji üretimini ve gezegendeki teknoloji bonuslarını artırır.", 27000, 14000, 7500, 0, 1.09, "food"),
                new("microchipAssemblyLine", 8, "Mikroçip Montaj Hattı", "Mikroçip Montaj Hattı (Microchip Assembly Line): Nüfus artış hızını ve besin verimliliğini yükseltir.", 52000, 26000, 16000, 85, 1.5, "production"),
                new("productionAssemblyHall", 9, "Üretim Montaj Salonu", "Üretim Montaj Salonu (Production Assembly Hall): Nüfus kapasitesini büyük oranda artırır.", 80000, 22000, 27000, 52, 1.09, "population"),
                new("highPerformanceSynthesiser", 10, "Yüksek Performanslı Sentezleyici", "Yüksek Performanslı Sentezleyici (High-Performance Synthesiser): Gezegendeki Deuterium üretimini artırır.", 160000, 32000, 16000, 65, 1.12, "production"),
                new("chipMassProduction", 11, "Çip Seri Üretimi", "Çip Seri Üretimi (Chip Mass Production): Gezegendeki canlı türü teknoloji bonuslarını güçlendirir.", 85000, 38000, 65000, 95, 1.3, "production"),
                new("nanoRepairBots", 12, "Nano Onarım Robotları", "Nano Onarım Robotları (Nano Repair Bots): Savaş sonrası Uzay İskelesi (Wreckfield / Enkaz) onarım oranını artırır.", 260000, 130000, 130000, 105, 1.2, "shield")
            },
            Technologies: new List<LifeformTechDefinition>
            {
                new(1, 1, "Katalizör Teknolojisi", "Katalizör Teknolojisi (Catalyser Technology): Deuterium üretimini artırır.", 200000, 5000, 2500, 500),
                new(2, 1, "Plazma İticisi", "Plazma İticisi (Plasma Drive): Keşif gemisi dışındaki savaş gemilerinin hızını artırır.", 300000, 7000, 10000, 5000),
                new(3, 1, "Verimlilik Modülü", "Verimlilik Modülü (Efficiency Module): Tüm gemilerin Deuterium (yakıt) tüketimini azaltır.", 400000, 15000, 10000, 5000),
                new(4, 1, "Depo Yapay Zekası", "Depo Yapay Zekası (Depot AI): İttifak deposu ve yakıt verimliliğini geliştirir.", 500000, 20000, 15000, 7500),
                new(5, 1, "Genel Revizyon (Hafif Avcı)", "Genel Revizyon (Hafif Avcı) (General Overhaul: Light Fighter): Hafif Avcı istatistiklerini güçlendirir.", 750000, 25000, 20000, 10000),
                new(6, 1, "Otomatik Taşıma Hatları", "Otomatik Taşıma Hatları (Automated Transport Lines): Metal, Kristal ve Deuterium üretimini artırır.", 1000000, 35000, 25000, 15000),
                new(7, 2, "Gelişmiş Dron Yapay Zekası", "Gelişmiş Dron Yapay Zekası (Improved Drone AI): Casusluk ve filo hızını iyileştirir.", 1200000, 50000, 40000, 20000),
                new(8, 2, "Deneysel Geri Dönüşüm Teknolojisi", "Deneysel Geri Dönüşüm Teknolojisi (Experimental Recycling Technology): Geri Dönüşümcü (Recycler) hız ve kapasitesini artırır.", 3000000, 80000, 50000, 20000),
                new(9, 2, "Genel Revizyon (Kruvazör)", "Genel Revizyon (Kruvazör) (General Overhaul: Cruiser): Kruvazör istatistiklerini güçlendirir.", 5000000, 120000, 90000, 30000),
                new(10, 2, "Sapan Otomatik Pilotu", "Sapan Otomatik Pilotu (Slingshot Autopilot): Geri çağrılan filolarda harcanan yakıtın bir kısmını iade eder ve dönüş hızını artırır.", 7000000, 160000, 120000, 50000),
                new(11, 2, "Yüksek Sıcaklık Süper İletkenleri", "Yüksek Sıcaklık Süper İletkenleri (High-Temperature Superconductors): Enerji üretimini artırır.", 9000000, 220000, 180000, 80000),
                new(12, 2, "Genel Revizyon (Komuta Gemisi)", "Genel Revizyon (Komuta Gemisi) (General Overhaul: Battleship): Komuta Gemisi istatistiklerini güçlendirir.", 11000000, 300000, 240000, 100000),
                new(13, 3, "Yapay Sürü Zekası", "Yapay Sürü Zekası (Artificial Swarm Intelligence): Tüm madenlerin üretimini artırır.", 13000000, 500000, 350000, 150000),
                new(14, 3, "Genel Revizyon (Fırkateyn)", "Genel Revizyon (Fırkateyn) (General Overhaul: Battlecruiser): Fırkateyn istatistiklerini güçlendirir.", 26000000, 650000, 500000, 250000),
                new(15, 3, "Genel Revizyon (Bombardıman Gemisi)", "Genel Revizyon (Bombardıman Gemisi) (General Overhaul: Bomber): Bombardıman Gemisi istatistiklerini güçlendirir.", 56000000, 850000, 650000, 30000),
                new(16, 3, "Genel Revizyon (Muhrip)", "Genel Revizyon (Muhrip) (General Overhaul: Destroyer): Muhrip istatistiklerini güçlendirir.", 112000000, 1100000, 850000, 400000),
                new(17, 3, "Deneysel Silah Teknolojisi", "Deneysel Silah Teknolojisi (Experimental Weapons Technology): Silah, Kalkan ve Zırh araştırmalarının maliyet ve süresini azaltır.", 224000000, 1500000, 1200000, 600000),
                new(18, 3, "Meka General Güçlendirmesi", "Meka General Güçlendirmesi (Mechan General Enhancement): General oyuncu sınıfı bonuslarını artırır.", 448000000, 2000000, 1600000, 800000)
            }
        ),

        // 4. Kaelesh — Kaşif (Discoverer) Sinerjisi
        new(
            Id: KaeleshId,
            Name: "Kaelesh",
            Tagline: "Keşif, Uzay-Zaman ve Araştırma",
            Playstyle: "Sürekli keşif filosu gönderen ve araştırma yapan oyuncular.",
            IsDefaultUnlocked: false,
            Ratings: new Dictionary<string, string>
            {
                ["metal"] = "Düşük",
                ["crystal"] = "Düşük",
                ["deuterium"] = "Düşük",
                ["research"] = "Çok iyi",
                ["military"] = "Düşük",
                ["expedition"] = "Çok iyi"
            },
            CoreBonuses: new List<string>
            {
                "Keşif görevlerinden elde edilen kaynak ve gemileri artırma",
                "Keşif sürelerine ve başarılarına katkı (filo kaybı riskini azaltma)",
                "Araştırma sürelerini azaltma",
                "Ay oluşumu ve gezegen alanlarıyla (ekstra slot) ilgili avantajlar"
            },
            Buildings: new List<LifeformBuildingDefinition>
            {
                new("sanctuary", 1, "Tapınak / Sığınak", "Tapınak / Sığınak (Sanctuary): Kaelesh nüfus kapasitesi ve artış hızı sağlar.", 7, 2, 0, 0, 1.2, "population"),
                new("antimatterCondenser", 2, "Antimadde Kondansatörü", "Antimadde Kondansatörü (Antimatter Condenser): Kaelesh için besin üretir.", 5, 2, 0, 8, 1.23, "food"),
                new("vortexChamber", 3, "Girdap Odası", "Girdap Odası (Vortex Chamber): Kaelesh teknoloji ağacını açar.", 20000, 24000, 10000, 10, 1.3, "tech"),
                new("hallsOfRealisation", 4, "İdrak Salonları", "İdrak Salonları (Halls of Realisation): T1 nüfusu T2'ye dönüştürür.", 5000, 3000, 1500, 15, 1.4, "population"),
                new("forumOfTranscendence", 5, "Aşkınlık Forumu", "Aşkınlık Forumu (Forum of Transcendence): T2 nüfusu T3'e dönüştürür.", 50000, 38000, 48000, 30, 1.5, "population"),
                new("antimatterConvector", 6, "Antimadde Konvektörü", "Antimadde Konvektörü (Antimatter Convector): Besin tüketimini düşürür ve dönüşüm verimliliğini artırır.", 9500, 6200, 3200, 38, 1.5, "production"),
                new("cloningLaboratory", 7, "Klonlama Laboratuvarı", "Klonlama Laboratuvarı (Cloning Laboratory): Nüfus artış hızını yükseltir.", 24000, 12500, 6800, 0, 1.09, "food"),
                new("chrysalisAccelerator", 8, "Krizalit Hızlandırıcı", "Krizalit Hızlandırıcı (Chrysalis Accelerator): Nüfus kapasitesini büyük oranda artırır.", 48000, 24000, 14000, 75, 1.5, "production"),
                new("bioModifier", 9, "Biyo Modifikatör", "Biyo Modifikatör (Bio Modifier): Gezegene ekstra Gezegen Alanı (Planet Fields) kazandırır.", 72000, 19000, 24000, 48, 1.09, "population"),
                new("psionicModulator", 10, "Psiyonik Modülatör", "Psiyonik Modülatör (Psionic Modulator): Gezegendeki Kaelesh teknoloji bonuslarını artırır.", 145000, 29000, 14000, 58, 1.12, "production"),
                new("shipManufacturingHall", 11, "Gemi Üretim Salonu", "Gemi Üretim Salonu (Ship Manufacturing Hall): Tersane üretim sürelerini kısaltır.", 78000, 34000, 58000, 88, 1.3, "production"),
                new("supraRefractor", 12, "Supra Refraktör", "Supra Refraktör (Supra Refractor): Ay oluşum şansını ve maksimum Ay boyutunu artırır.", 240000, 120000, 120000, 95, 1.2, "shield")
            },
            Technologies: new List<LifeformTechDefinition>
            {
                new(1, 1, "Isı Geri Kazanımı", "Isı Geri Kazanımı (Heat Recovery): Gemilerin Deuterium yakıt tüketimini azaltır.", 200000, 5000, 2500, 500),
                new(2, 1, "Sülfit İşlemi", "Sülfit İşlemi (Sulphide Process): Deuterium üretimini artırır.", 300000, 7000, 10000, 5000),
                new(3, 1, "Psiyonik Ağ", "Psiyonik Ağ (Psionic Network): Keşiflerde canlı türü kaybı / kara delik riskini azaltır.", 400000, 15000, 10000, 5000),
                new(4, 1, "Telekinetik Çekici Işın", "Telekinetik Çekici Işın (Telekinetic Tractor Beam): Keşif (Sefer) uçuşlarından bulunan gemi miktarını artırır.", 500000, 20000, 15000, 7500),
                new(5, 1, "Gelişmiş Sensör Teknolojisi", "Gelişmiş Sensör Teknolojisi (Enhanced Sensor Technology): Keşif uçuşlarından bulunan kaynak (Metal, Kristal, Deut) miktarını artırır.", 750000, 25000, 20000, 10000),
                new(6, 1, "Nöromodal Kompresör", "Nöromodal Kompresör (Neuromodal Compressor): Sivil ve askeri gemilerin kargo kapasitesini artırır.", 1000000, 35000, 25000, 15000),
                new(7, 2, "Nöro Arayüz", "Nöro Arayüz (Neuro-Interface): Araştırma sürelerini kısaltır.", 1200000, 50000, 40000, 20000),
                new(8, 2, "Gezegenlerarası Analiz Ağı", "Gezegenlerarası Analiz Ağı (Interplanetary Analysis Network): Ay üzerindeki Sensör Falanks (Sensor Phalanx) menzilini artırır.", 3000000, 80000, 50000, 20000),
                new(9, 2, "Hız Aşırtma (Ağır Avcı)", "Hız Aşırtma (Ağır Avcı) (Overclocking: Heavy Fighter): Ağır Avcı istatistiklerini güçlendirir.", 5000000, 120000, 90000, 30000),
                new(10, 2, "Telekinetik İtici", "Telekinetik İtici (Telekinetic Drive): Keşif (Expedition) uçuşlarında filo hızını artırır.", 7000000, 160000, 120000, 50000),
                new(11, 2, "Altıncı His", "Altıncı His (Sixth Sense): Keşif uçuşlarından bulunan kaynak miktarını artırır.", 9000000, 220000, 180000, 80000),
                new(12, 2, "Psikoharmonizör", "Psikoharmonizör (Psychoharmoniser): Metal, Kristal ve Deuterium üretimini artırır.", 11000000, 300000, 240000, 100000),
                new(13, 3, "Verimli Sürü Zekası", "Verimli Sürü Zekası (Efficient Swarm Intelligence): Araştırma sürelerini kısaltır.", 13000000, 500000, 350000, 150000),
                new(14, 3, "Hız Aşırtma (Büyük Nakliye)", "Hız Aşırtma (Büyük Nakliye) (Overclocking: Large Cargo): Büyük Nakliye Gemisi hız ve kapasitesini artırır.", 26000000, 650000, 500000, 250000),
                new(15, 3, "Kütleçekim Sensörleri", "Kütleçekim Sensörleri (Gravitation Sensors): Keşif uçuşlarından bulunan Karanlık Madde miktarını artırır.", 56000000, 850000, 650000, 30000),
                new(16, 3, "Hız Aşırtma (Komuta Gemisi)", "Hız Aşırtma (Komuta Gemisi) (Overclocking: Battleship): Komuta Gemisi istatistiklerini güçlendirir.", 112000000, 1100000, 850000, 400000),
                new(17, 3, "Psiyonik Kalkan Matrisi", "Psiyonik Kalkan Matrisi (Psionic Shield Matrix): Graviton ve kalkan araştırmalarının maliyet/süresini düşürür.", 224000000, 1500000, 1200000, 600000),
                new(18, 3, "Kaelesh Kaşif Güçlendirmesi", "Kaelesh Kaşif Güçlendirmesi (Kaelesh Discoverer Enhancement): Kaşif (Discoverer) oyuncu sınıfı bonuslarını artırır.", 448000000, 2000000, 1600000, 800000)
            }
        )
    };

    public static int GetArtefactCostForSlot(int slot)
    {
        if (slot >= 1 && slot <= 6) return ArtefactTier1Cost;
        if (slot >= 7 && slot <= 12) return ArtefactTier2Cost;
        return ArtefactTier3Cost;
    }

    public static LifeformSpeciesDefinition GetSpecies(string speciesId)
    {
        return AllSpecies.FirstOrDefault(s => s.Id.Equals(speciesId, StringComparison.OrdinalIgnoreCase) ||
                                              s.Name.StartsWith(speciesId, StringComparison.OrdinalIgnoreCase))
               ?? AllSpecies[0];
    }

    public static LifeformBuildingDefinition? GetBuilding(string speciesId, string buildingKey)
    {
        var sp = GetSpecies(speciesId);
        var norm = buildingKey.Replace("-", "").ToLowerInvariant();

        return sp.Buildings.FirstOrDefault(b =>
            b.Key.Equals(buildingKey, StringComparison.OrdinalIgnoreCase) ||
            b.Key.Replace("-", "").Equals(norm, StringComparison.OrdinalIgnoreCase) ||
            MatchesBuildingAlias(b.Key, norm));
    }

    private static bool MatchesBuildingAlias(string canonicalKey, string queryKey)
    {
        return canonicalKey switch
        {
            "runeTechnologium" => queryKey is "runetechnologicalinstitute" or "runetechnologium",
            "runeForge" => queryKey is "runicauditorium" or "runeforge",
            "oriktorium" => queryKey is "meltchamber" or "oriktorium",
            "disruptionChamber" => queryKey is "ioniccrystalchamber" or "disruptionchamber",
            "megalith" => queryKey is "megalithstructures" or "megalith",
            "crystalRefinery" => queryKey is "mineralconverter" or "crystalrefinery",
            "deuteriumSynthesiserRocktal" => queryKey is "magmapowerreactor" or "deuteriumsynthesiserrocktal",
            "mineralResearchCentre" => queryKey is "geothermalcentre" or "mineralresearchcentre",
            "advancedRecyclingPlant" => queryKey is "titaniumbulwark" or "advancedrecyclingplant",
            "assemblyLine" => queryKey is "productionline" or "assemblyline",
            "fusionCellFactory" => queryKey is "bioconverter" or "fusioncellfactory",
            "roboticsResearchCentre" => queryKey is "corematrix" or "roboticsresearchcentre",
            "updateNetwork" => queryKey is "algorithmhub" or "updatenetwork",
            "quantumComputerCentre" => queryKey is "quantumchamber" or "quantumcomputercentre",
            "automatisedAssemblyCentre" => queryKey is "nanoassemblyline" or "automatisedassemblycentre",
            "highPerformanceTransformer" => queryKey is "backuppowercell" or "highperformancetransformer",
            "microchipAssemblyLine" => queryKey is "advancedrecycler" or "microchipassemblyline",
            "productionAssemblyHall" => queryKey is "factorycity" or "productionassemblyhall",
            "highPerformanceSynthesiser" => queryKey is "superconductingdistributor" or "highperformancesynthesiser",
            "chipMassProduction" => queryKey is "automatedshipyardnetwork" or "chipmassproduction",
            "nanoRepairBots" => queryKey is "magneticdefensedome" or "nanorepairbots",
            "antimatterCondenser" => queryKey is "luminescentgarden" or "antimattercondenser",
            "vortexChamber" => queryKey is "cosmicresonator" or "vortexchamber",
            "hallsOfRealisation" => queryKey is "hightemple" or "hallsofrealisation",
            "forumOfTranscendence" => queryKey is "divinationchamber" or "forumoftranscendence",
            "antimatterConvector" => queryKey is "interdimensionalmine" or "antimatterconvector",
            "cloningLaboratory" => queryKey is "psionicenergycrystal" or "cloninglaboratory",
            "chrysalisAccelerator" => queryKey is "terraforminglab" or "chrysalisaccelerator",
            "bioModifier" => queryKey is "floatingcities" or "biomodifier",
            "psionicModulator" => queryKey is "vortexreactor" or "psionicmodulator",
            "shipManufacturingHall" => queryKey is "spatiotemporalcrystal" or "shipmanufacturinghall",
            "supraRefractor" => queryKey is "auricprotectionnetwork" or "suprarefractor",
            _ => false
        };
    }

    public static LifeformTechDefinition? GetTech(string speciesId, int slot)
    {
        var sp = GetSpecies(speciesId);
        return sp.Technologies.FirstOrDefault(t => t.Slot == slot);
    }

    public static bool IsTechUnlocked(int slot, long currentTotalPopulation)
    {
        if (!TechSlotPopulationThresholds.TryGetValue(slot, out long requiredPop))
        {
            var tech = LifeformsHumansFormulas.Technologies.FirstOrDefault(t => t.Slot == slot);
            if (tech == null) return false;
            requiredPop = tech.RequiredPopulation;
        }

        return currentTotalPopulation >= requiredPop;
    }

    public static LifeformCostResult CalculateBuildingUpgrade(
        string speciesId,
        string buildingKey,
        int currentLevel,
        double costReductionBonus = 0.0,
        int roboticsLevel = 0,
        int naniteLevel = 0,
        double ecoSpeed = 1.0)
    {
        var building = GetBuilding(speciesId, buildingKey) ?? LifeformsHumansFormulas.Buildings[0];

        int targetLevel = currentLevel + 1;
        long metal = CalculateBuildingCost(building.BaseMetal, building.CostFactor, targetLevel, costReductionBonus);
        long crystal = CalculateBuildingCost(building.BaseCrystal, building.CostFactor, targetLevel, costReductionBonus);
        long deut = CalculateBuildingCost(building.BaseDeuterium, building.CostFactor, targetLevel, costReductionBonus);

        long energyDelta = building.BaseEnergy > 0
            ? CalculateBuildingEnergy(building.BaseEnergy, 1.05, targetLevel)
            : 0;

        int durationSeconds = CalculateBuildingDuration(targetLevel, 12.0, 1.22, roboticsLevel, naniteLevel, ecoSpeed);

        return new LifeformCostResult(metal, crystal, deut, energyDelta, durationSeconds);
    }

    public static LifeformCostResult CalculateTechUpgrade(
        string speciesId,
        int slot,
        int currentLevel,
        int researchCentreLevel = 1,
        double researchCentreCostReduction = 0.0,
        double researchCentreTimeReduction = 0.0)
    {
        var tech = GetTech(speciesId, slot) ?? LifeformsHumansFormulas.Technologies[0];
        int targetLevel = currentLevel + 1;

        double effectiveCostDiscount = Math.Max(researchCentreCostReduction, Math.Min(0.25, researchCentreLevel * 0.02));
        double effectiveTimeDiscount = Math.Max(researchCentreTimeReduction, Math.Min(0.99, researchCentreLevel * 0.03));

        long metal = CalculateTechCost(tech.BaseMetal, tech.CostFactor, targetLevel, effectiveCostDiscount);
        long crystal = CalculateTechCost(tech.BaseCrystal, tech.CostFactor, targetLevel, effectiveCostDiscount);
        long deut = CalculateTechCost(tech.BaseDeuterium, tech.CostFactor, targetLevel, effectiveCostDiscount);

        int durationSeconds = CalculateTechDuration(targetLevel, 30.0, 1.25, effectiveTimeDiscount);

        return new LifeformCostResult(metal, crystal, deut, 0, durationSeconds);
    }

    // ==========================================
    // Task 19: Mathematical Formulas & Superlinear Equations
    // ==========================================

    /// <summary>
    /// Building Resource Cost Formula:
    /// Cost(L) = floor(baseCost * factor^(L-1) * L * (1 - CostReductionBonus))
    /// Multiplied by target level L (distinct from standard buildings).
    /// </summary>
    public static long CalculateBuildingCost(long baseCost, double factor, int targetLevel, double costReductionBonus = 0.0)
    {
        if (baseCost <= 0 || targetLevel <= 0) return 0;
        double reduction = Math.Clamp(costReductionBonus, 0.0, 0.99);
        double cost = baseCost * Math.Pow(factor, targetLevel - 1) * targetLevel * (1.0 - reduction);
        return Math.Max(1, (long)Math.Floor(cost));
    }

    /// <summary>
    /// Building Energy Consumption:
    /// Energy(L) = floor(L * energyBase * factor^L)
    /// </summary>
    public static long CalculateBuildingEnergy(long baseEnergy, double factor, int targetLevel)
    {
        if (baseEnergy <= 0 || targetLevel <= 0) return 0;
        double energy = targetLevel * baseEnergy * Math.Pow(factor, targetLevel);
        return (long)Math.Floor(energy);
    }

    /// <summary>
    /// Building Construction Duration (seconds):
    /// T_building(L) = floor(L * durationBase * durationFactor^L / ((1 + RoboticsLvl) * 2^NaniteLvl * EcoSpeed))
    /// </summary>
    public static int CalculateBuildingDuration(
        int targetLevel,
        double durationBase = 12.0,
        double durationFactor = 1.22,
        int roboticsLevel = 0,
        int naniteLevel = 0,
        double ecoSpeed = 1.0)
    {
        if (targetLevel <= 0) return 1;
        double speed = Math.Max(1.0, ecoSpeed);
        double denom = (1.0 + Math.Max(0, roboticsLevel)) * Math.Pow(2.0, Math.Max(0, naniteLevel)) * speed;
        double rawSeconds = (targetLevel * durationBase * Math.Pow(durationFactor, targetLevel)) / denom;
        return Math.Max(1, (int)Math.Floor(rawSeconds));
    }

    /// <summary>
    /// Superlinear Building Bonus:
    /// Bonus_building(L) = L^increaseFactor * (baseValue / 100)
    /// </summary>
    public static double CalculateBuildingBonus(int level, double increaseFactor = 1.05, double baseValue = 1.0)
    {
        if (level <= 0) return 0.0;
        return Math.Pow(level, increaseFactor) * (baseValue / 100.0);
    }

    /// <summary>
    /// Tech Research Cost:
    /// TechCost(L) = floor(baseCost * factor^(L-1) * L * (1 - ResearchCenterCostReduction))
    /// </summary>
    public static long CalculateTechCost(long baseCost, double factor, int targetLevel, double researchCenterCostReduction = 0.0)
    {
        if (baseCost <= 0 || targetLevel <= 0) return 0;
        double reduction = Math.Clamp(researchCenterCostReduction, 0.0, 0.99);
        double cost = baseCost * Math.Pow(factor, targetLevel - 1) * targetLevel * (1.0 - reduction);
        return Math.Max(1, (long)Math.Floor(cost));
    }

    /// <summary>
    /// Tech Research Duration (seconds):
    /// T_tech(L) = floor(L * durationBase * durationFactor^L * (1 - ResearchCenterTimeReduction))
    /// </summary>
    public static int CalculateTechDuration(
        int targetLevel,
        double durationBase = 30.0,
        double durationFactor = 1.25,
        double researchCenterTimeReduction = 0.0)
    {
        if (targetLevel <= 0) return 1;
        double reduction = Math.Clamp(researchCenterTimeReduction, 0.0, 0.99);
        double rawSeconds = (targetLevel * durationBase * Math.Pow(durationFactor, targetLevel)) * (1.0 - reduction);
        return Math.Max(1, (int)Math.Floor(rawSeconds));
    }

    /// <summary>
    /// Total Empire Lifeform Tech Bonus:
    /// TotalTechBonus = BaseTechBonus(L) * (1 + SpeciesLevelBonus + PlanetMetropolisBonus)
    /// </summary>
    public static double CalculateTotalTechBonus(double baseTechBonus, double speciesLevelBonus, double planetMetropolisBonus)
    {
        double multiplier = 1.0 + Math.Max(0.0, speciesLevelBonus) + Math.Max(0.0, planetMetropolisBonus);
        return baseTechBonus * multiplier;
    }

    /// <summary>
    /// Species Experience Level Bonus:
    /// Max Level 100. +0.1% per level (+10% max at Level 100).
    /// Returns fractional bonus (e.g. 0.001 per level, up to 0.10).
    /// </summary>
    public static double CalculateSpeciesLevelBonus(int level)
    {
        int clampedLevel = Math.Clamp(level, 0, MaxSpeciesLevel);
        return (clampedLevel * BonusPercentPerLevel) / 100.0;
    }

    /// <summary>
    /// Experience award rule:
    /// Once species reaches Level 100, subsequent discoveries award 0 XP (retaining Artefacts/Highscore).
    /// </summary>
    public static int CalculateAwardedXp(int currentLevel, int earnedXp)
    {
        if (currentLevel >= MaxSpeciesLevel) return 0;
        return Math.Max(0, earnedXp);
    }

    // ==========================================
    // Task 19: Building Caps (Hard Caps) & Rules
    // ==========================================

    /// <summary>
    /// Rock'tal Rune Technologium: Max -25% research cost reduction.
    /// </summary>
    public static double CapRuneTechnologiumCostReduction(double rawReduction) =>
        Math.Min(0.25, Math.Max(0.0, rawReduction));

    /// <summary>
    /// Rock'tal Rune Technologium: Max -99% research duration reduction.
    /// </summary>
    public static double CapRuneTechnologiumTimeReduction(double rawReduction) =>
        Math.Min(0.99, Math.Max(0.0, rawReduction));

    /// <summary>
    /// Rock'tal Rune Forge, Deuterium Synthesiser, and Advanced Recycling Plant: Max 50% bonus.
    /// </summary>
    public static double CapRocktalBonus(double rawBonus) =>
        Math.Min(0.50, Math.Max(0.0, rawBonus));

    /// <summary>
    /// Kaelesh Psionic Modulator: Reduces population threshold for the 18 tech slots by up to -25%.
    /// </summary>
    public static double CapPsionicModulatorReduction(double rawReduction) =>
        Math.Min(0.25, Math.Max(0.0, rawReduction));

    /// <summary>
    /// Computes the effective population requirement for a tech slot with Psionic Modulator reduction.
    /// </summary>
    public static long CalculateEffectivePopulationThreshold(long baseThreshold, double psionicModulatorReduction)
    {
        double reduction = CapPsionicModulatorReduction(psionicModulatorReduction);
        return (long)Math.Floor(baseThreshold * (1.0 - reduction));
    }

    /// <summary>
    /// Kaelesh Ship Manufacturing Hall: Shortens shipyard build time by up to -70%.
    /// </summary>
    public static double CapShipManufacturingHallReduction(double rawReduction) =>
        Math.Min(0.70, Math.Max(0.0, rawReduction));

    /// <summary>
    /// Kaelesh Supra Refractor: Increases max Moon creation chance up to 30% and max Moon diameter up to 9,400 km.
    /// </summary>
    public static (double MaxMoonChance, int MaxMoonDiameter) CalculateSupraRefractorMoonBonus(
        double baseMaxChance = 20.0,
        int baseMaxDiameter = 8944,
        double supraRefractorChanceBonus = 0.0,
        int supraRefractorDiameterBonus = 0)
    {
        double effectiveChance = Math.Min(30.0, baseMaxChance + Math.Max(0.0, supraRefractorChanceBonus));
        int effectiveDiameter = Math.Min(9400, baseMaxDiameter + Math.Max(0, supraRefractorDiameterBonus));
        return (effectiveChance, effectiveDiameter);
    }

    /// <summary>
    /// Kaelesh Bio Modifier gives extra planet fields (+1 per level).
    /// </summary>
    public static int CalculateBioModifierFields(int bioModifierLevel) => Math.Max(0, bioModifierLevel);

    /// <summary>
    /// Planet building construction restriction rule:
    /// When switching away from Kaelesh, Bio Modifier extra fields are removed.
    /// If UsedFields > MaxFields, existing buildings are NOT dismantled,
    /// but constructing NEW standard buildings is blocked until UsedFields < MaxFields.
    /// </summary>
    public static bool CanConstructStandardBuilding(int usedFields, int maxFields) =>
        usedFields < maxFields;

    /// <summary>
    /// Tier Pause Rule:
    /// If Tier 1 or Tier 2 is reset, upper tier bonuses are temporarily paused
    /// until all 6 slots in that tier are selected again!
    /// (Tier 1 is always active. Tier 2 active if tier1Filled == 6. Tier 3 active if tier1Filled == 6 && tier2Filled == 6).
    /// </summary>
    public static bool IsTierActive(int tier, int tier1FilledSlots, int tier2FilledSlots)
    {
        return tier switch
        {
            1 => true,
            2 => tier1FilledSlots >= 6,
            3 => tier1FilledSlots >= 6 && tier2FilledSlots >= 6,
            _ => false
        };
    }
}
