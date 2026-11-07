using OGame.Domain.Entities;
using OGame.Domain.Enums;

namespace OGame.Domain.Services;

public static class DirectiveLifeformsFormulas
{
    public const int DirectiveId = 6;
    public const string DirectiveTitle = "Dünya Dışı Yaşam";
    public const string GuideCharacterName = "Birinci Subay Nova";
    public const string GuideCharacterRole = "Birinci Subay";
    public const string GuideIntroLore =
        "Kozmosun derinliklerinde yalnız değiliz İmparator! Kadim ırkların izlerini sürecek, Barınma Tesisleri ve Biyosfer Çiftlikleri ile nüfus patlamasını yönetecek, DNA keşif filolarıyla yabancı medeniyetleri kolonilerimize entegre edeceğiz. Antik eserleri toplayarak imparatorluğumuzun bilimsel sınırlarını sonsuza dek genişletme vakti!";

    public static readonly DirectiveRewardDef FinalDirectiveReward = new(
        Metal: 15000,
        Crystal: 7500,
        Deuterium: 1500,
        DarkMatter: 6000
    );

    private static readonly List<DirectiveQuestDef> Quests = new()
    {
        new(
            QuestId: 1,
            Title: "Canlı türlerinin temelleri",
            Description: "Gezegen yüzeyindeki nüfus artışını desteklemek ve besin dengesini kurmak için temel yaşam formu binalarını inşa edin.",
            Hint: "Canlı Türü binaları sayfasına giderek Biyosfer Çiftliğini 22. seviyeye, Barınma Tesisini 21. seviyeye yükseltin.",
            Goals: new()
            {
                "Biyosfer Çiftliği binasını 22. seviyeye yükselt",
                "Barınma Tesisi binasını 21. seviyeye yükselt"
            },
            Reward: new(Metal: 35000, Crystal: 10000, Deuterium: 0, DarkMatter: 0)
        ),
        new(
            QuestId: 2,
            Title: "Araştırma merkezini inşa et",
            Description: "Canlı türlerinin teknoloji ağacını kullanıma açmak ve araştırma sürelerini optimize etmek için Araştırma Merkezini faaliyete geçirin.",
            Hint: "Canlı Türü binalarından Araştırma Merkezini 1. seviyeye inşa edin.",
            Goals: new() { "Araştırma Merkezi canlı türü binasını 1. seviyeye yükselt" },
            Reward: new(Metal: 10000, Crystal: 12500, Deuterium: 5000, DarkMatter: 0)
        ),
        new(
            QuestId: 3,
            Title: "Galaksiler arası elçileri araştır",
            Description: "Diğer galaktik türlerle ilk teması sağlayacak Galaksiler Arası Elçiler projesini başlatın.",
            Hint: "Canlı Türü Gelişimi sayfasından 1. slotta Galaksiler Arası Elçiler araştırmasını tamamlayın.",
            Goals: new() { "Galaksiler Arası Elçiler araştırmasını tamamla" },
            Reward: new(Metal: 2500, Crystal: 1250, Deuterium: 250, DarkMatter: 0)
        ),
        new(
            QuestId: 4,
            Title: "Bilgisayar teknolojisini 2. seviyede araştır",
            Description: "Eşzamanlı canlı türü keşif filolarını yönetebilmek ve filo slotlarını artırmak için Bilgisayar Tekniğini geliştirin.",
            Hint: "Araştırma sayfasından Bilgisayar Tekniği araştırmasını 2. seviyeye yükseltin.",
            Goals: new() { "Bilgisayar Tekniği araştırmasını 2. seviyede tamamla" },
            Reward: new(Metal: 400, Crystal: 600, Deuterium: 0, DarkMatter: 0)
        ),
        new(
            QuestId: 5,
            Title: "Bir keşif filosu gönder",
            Description: "Galaksi haritasındaki DNA ikonlarını kullanarak bilinmeyen sektörlerde canlı türü arama görevi başlatın.",
            Hint: "Galaksi menüsündeki DNA simgesi üzerinden canlı türü keşif görevi sevk edin.",
            Goals: new() { "Galaksi haritasındaki DNA simgesi üzerinden bir canlı türü keşif görevi başlat" },
            Reward: new(Metal: 2500, Crystal: 500, Deuterium: 250, DarkMatter: 0)
        ),
        new(
            QuestId: 6,
            Title: "Bir canlı türü bul",
            Description: "Keşif filolarınızın derin uzay taramaları sonucunda yeni bir yabancı medeniyet (Roktal, Mecha veya Kaelesh) keşfetmesini sağlayın.",
            Hint: "Canlı türü keşif filolarınızın raporlarını inceleyin ve yeni bir türün kilidini açın.",
            Goals: new() { "Keşif filoları ile uzayda yeni bir canlı türü keşfet" },
            Reward: new(Metal: 2500, Crystal: 5000, Deuterium: 2500, DarkMatter: 0)
        ),
        new(
            QuestId: 7,
            Title: "Sömürgenin canlı türünü seç",
            Description: "Bir gezegeni sömürgeleştirdiğinde, keşfettiğin canlı türlerinden hangisinin onu yurt bileceğini seçebilirsin. Farklı canlı türleri bazı alanlarda diğerlerinden daha iyidir. Bu yüzden her zaman koloninle neyi başarmak istediğini düşün ve ona uygun canlı türünü seç.",
            Hint: "Canlı Türü Yönetimi sayfasına gidin ve bir sömürgenize istediğiniz canlı türünü yerleştirin.",
            Goals: new() { "Bir sömürgeye bir canlı türü ata" },
            Reward: new(Metal: 5000, Crystal: 2000, Deuterium: 500, DarkMatter: 0)
        ),
        new(
            QuestId: 8,
            Title: "Biyosfer çiftliği ve barınma tesisini yükselt",
            Description: "İkinci teknoloji yuvası için gereken nüfus artışını desteklemek amacıyla altyapı tesislerini bir kademe daha büyütün.",
            Hint: "Biyosfer Çiftliğini 23. seviyeye, Barınma Tesisini ise 22. seviyeye yükseltin.",
            Goals: new()
            {
                "Biyosfer Çiftliği binasını 23. seviyeye yükselt",
                "Barınma Tesisi binasını 22. seviyeye yükselt"
            },
            Reward: new(Metal: 9000, Crystal: 3000, Deuterium: 0, DarkMatter: 0)
        ),
        new(
            QuestId: 9,
            Title: "T1 teknolojisinin 2. slotunun kilidini aç",
            Description: "Gezegen nüfusu kritik eşiği aştığında canlı türü teknoloji ağacındaki 2. yuvanın mührünü çözün.",
            Hint: "Yeterli nüfus sağlayarak Canlı Türü Araştırması sayfasında 2. slotun kilidini açın.",
            Goals: new() { "Canlı türü araştırması için 2. teknoloji slotunun kilidini aç" },
            Reward: new(Metal: 2000, Crystal: 1000, Deuterium: 0, DarkMatter: 0)
        ),
        new(
            QuestId: 10,
            Title: "İkinci bir teknoloji seç",
            Description: "Açılan 2. yuvaya imparatorluğunuzun vizyonuna uygun bir canlı türü araştırma yeteneği atayın.",
            Hint: "Canlı Türü teknoloji ağacında 2. slota tıklayarak uygun bir araştırma seçin.",
            Goals: new() { "Açılan 2. yuva için bir canlı türü teknolojisi seç" },
            Reward: new(Metal: 500, Crystal: 500, Deuterium: 500, DarkMatter: 0)
        ),
        new(
            QuestId: 11,
            Title: "200 eser bul",
            Description: "Keşif filolarınızın antik kalıntılardan topladığı paha biçilmez teknolojik Eserleri (Artifacts) biriktirin.",
            Hint: "Derin uzay ve DNA keşiflerinden toplamda en az 200 eser toplayın.",
            Goals: new() { "Keşif görevlerinde kümülatif olarak toplam 200 antik eser bul" },
            Reward: new(Metal: 62500, Crystal: 12500, Deuterium: 6250, DarkMatter: 0)
        ),
        new(
            QuestId: 12,
            Title: "T1 teknolojisinin 3. slotunun kilidini aç",
            Description: "Altyapıyı zirveye taşıyın ve T1 teknolojilerinin son yuvası olan 3. slotun kilidini açın.",
            Hint: "Biyosfer Çiftliğini 24, Barınma Tesisini 23. seviyeye ulaştırıp 3. teknoloji slotunu açın.",
            Goals: new()
            {
                "Biyosfer Çiftliği binasını 24. seviyeye yükselt",
                "Barınma Tesisi binasını 23. seviyeye yükselt",
                "Canlı türü araştırması için 3. teknoloji slotunun kilidini aç"
            },
            Reward: new(Metal: 10000, Crystal: 3500, Deuterium: 0, DarkMatter: 0)
        ),
        new(
            QuestId: 13,
            Title: "Eserlerle bir teknoloji satın al",
            Description: "Toplanan antik eserleri takas ederek teknoloji ağacında istediğiniz özel bir teknolojiyi anında etkinleştirin.",
            Hint: "Canlı türü teknoloji sayfasında eser bakiyenizi kullanarak bir teknoloji satın alın veya değiştirin.",
            Goals: new() { "Toplanan eserleri harcayarak teknoloji ağacında bir teknoloji satın al veya değiştir" },
            Reward: new(Metal: 5000, Crystal: 2500, Deuterium: 0, DarkMatter: 0)
        )
    };

    public static IReadOnlyList<DirectiveQuestDef> GetAllQuests() => Quests;

    public static DirectiveQuestDef? GetQuest(int questId) =>
        Quests.FirstOrDefault(q => q.QuestId == questId);

    public static DirectiveEvaluationResult EvaluateQuest(
        int questStep,
        Planet? planet,
        User? user,
        int existingBitmask,
        IReadOnlyDictionary<string, int>? lifeformBuildingLevels = null,
        IReadOnlyDictionary<int, int>? lifeformTechLevels = null,
        bool hasColonyWithLifeform = false)
    {
        var quest = GetQuest(questStep) ?? Quests[0];
        var steps = new List<DirectiveSubStepResult>();
        int newBitmask = existingBitmask;

        int computerTechLvl = user?.Researches.FirstOrDefault(r => r.ResearchType == ResearchType.ComputerTechnology)?.Level ?? 0;

        int bioFarmLvl = 0;
        int resLvl = 0;
        int researchCentreLvl = 0;

        if (lifeformBuildingLevels != null)
        {
            if (lifeformBuildingLevels.TryGetValue("biosphereFarm", out var bfVal)) bioFarmLvl = bfVal;
            if (lifeformBuildingLevels.TryGetValue("residentialSector", out var rsVal)) resLvl = rsVal;
            if (lifeformBuildingLevels.TryGetValue("researchCentre", out var rcVal)) researchCentreLvl = rcVal;
            else if (lifeformBuildingLevels.TryGetValue("researchCenter", out var rcVal2)) researchCentreLvl = rcVal2;
        }

        int tech1Lvl = 0;
        int tech2Lvl = 0;
        int tech3Lvl = 0;
        if (lifeformTechLevels != null)
        {
            if (lifeformTechLevels.TryGetValue(1, out var t1)) tech1Lvl = t1;
            if (lifeformTechLevels.TryGetValue(2, out var t2)) tech2Lvl = t2;
            if (lifeformTechLevels.TryGetValue(3, out var t3)) tech3Lvl = t3;
        }

        switch (quest.QuestId)
        {
            case 1:
                // Strict check: Biyosfer Çiftliği >= 22 & Barınma Tesisi >= 21
                AddStepBuilding(0, quest.Goals[0], bioFarmLvl >= 22);
                AddStepBuilding(1, quest.Goals[1], resLvl >= 21);
                break;

            case 2:
                // Strict check: Araştırma Merkezi >= 1
                AddStepBuilding(0, quest.Goals[0], researchCentreLvl >= 1);
                break;

            case 3:
                // Galaksiler Arası Elçiler (Slot 1) >= 1
                AddStep(0, quest.Goals[0], tech1Lvl >= 1);
                break;

            case 4:
                // Bilgisayar Tekniği >= 2
                AddStep(0, quest.Goals[0], computerTechLvl >= 2);
                break;

            case 5:
                AddStep(0, quest.Goals[0], false);
                break;

            case 6:
                AddStep(0, quest.Goals[0], false);
                break;

            case 7:
                AddStep(0, quest.Goals[0], hasColonyWithLifeform || (existingBitmask & 1) != 0);
                break;

            case 8:
                // Biyosfer Çiftliği >= 23 & Barınma Tesisi >= 22
                AddStepBuilding(0, quest.Goals[0], bioFarmLvl >= 23);
                AddStepBuilding(1, quest.Goals[1], resLvl >= 22);
                break;

            case 9:
                AddStep(0, quest.Goals[0], tech2Lvl >= 1);
                break;

            case 10:
                AddStep(0, quest.Goals[0], false);
                break;

            case 11:
                AddStep(0, quest.Goals[0], false);
                break;

            case 12:
                // Biyosfer Çiftliği >= 24, Barınma Tesisi >= 23, Slot 3
                AddStepBuilding(0, quest.Goals[0], bioFarmLvl >= 24);
                AddStepBuilding(1, quest.Goals[1], resLvl >= 23);
                AddStep(2, quest.Goals[2], tech3Lvl >= 1);
                break;

            case 13:
                AddStep(0, quest.Goals[0], false);
                break;

            default:
                break;
        }

        int completedCount = steps.Count(s => s.IsMet);
        bool isFulfilled = completedCount == steps.Count && steps.Count > 0;

        return new DirectiveEvaluationResult(
            QuestId: quest.QuestId,
            Title: quest.Title,
            Description: quest.Description,
            Hint: quest.Hint,
            Steps: steps,
            Reward: quest.Reward,
            CompletedCount: completedCount,
            TotalCount: steps.Count,
            IsFulfilled: isFulfilled,
            ComputedBitmask: newBitmask
        );

        void AddStep(int index, string description, bool isCurrentlyMet)
        {
            bool wasMet = (existingBitmask & (1 << index)) != 0;
            bool met = isCurrentlyMet || wasMet;
            if (met)
            {
                newBitmask |= (1 << index);
            }
            steps.Add(new DirectiveSubStepResult(index, description, met));
        }

        void AddStepBuilding(int index, string description, bool isCurrentlyMet)
        {
            if (lifeformBuildingLevels != null)
            {
                // When actual live building levels are provided, trust the real level and clear corrupted bitmasks
                bool met = isCurrentlyMet;
                if (met)
                {
                    newBitmask |= (1 << index);
                }
                else
                {
                    newBitmask &= ~(1 << index);
                }
                steps.Add(new DirectiveSubStepResult(index, description, met));
            }
            else
            {
                // Unit-test / offline fallback: honor existing bitmask
                AddStep(index, description, isCurrentlyMet);
            }
        }
    }

    public static string GetNextDirectiveSummary(
        int currentStep,
        bool isDirectiveCompleted,
        DirectiveEvaluationResult currentEval)
    {
        if (isDirectiveCompleted)
        {
            return "Yönerge VI (Dünya Dışı Yaşam) tamamlandı!";
        }

        if (currentEval.IsFulfilled)
        {
            return $"{currentEval.Title} tamamlandı! Ödülü al.";
        }

        var uncompleted = currentEval.Steps.FirstOrDefault(s => !s.IsMet);
        if (uncompleted != null)
        {
            return uncompleted.Description;
        }

        return currentEval.Title;
    }

    public static int ProcessEvent(int questId, int currentBitmask, string eventType)
    {
        switch (questId)
        {
            case 1:
                if (eventType.Equals("biosphere_farm_22", StringComparison.OrdinalIgnoreCase) ||
                    eventType.Equals("lifeform_building:BiosphereFarm:22", StringComparison.OrdinalIgnoreCase))
                {
                    currentBitmask |= (1 << 0);
                }
                if (eventType.Equals("housing_21", StringComparison.OrdinalIgnoreCase) ||
                    eventType.Equals("lifeform_building:Housing:21", StringComparison.OrdinalIgnoreCase) ||
                    eventType.Equals("lifeform_building:residentialSector:21", StringComparison.OrdinalIgnoreCase))
                {
                    currentBitmask |= (1 << 1);
                }
                if (eventType.Equals("lifeform_buildings_q1_completed", StringComparison.OrdinalIgnoreCase))
                {
                    currentBitmask |= (1 << 0) | (1 << 1);
                }
                break;

            case 2:
                if (eventType.Equals("research_center_built", StringComparison.OrdinalIgnoreCase) ||
                    eventType.Equals("lifeform_building:ResearchCenter", StringComparison.OrdinalIgnoreCase) ||
                    eventType.Equals("lifeform_building:researchCentre", StringComparison.OrdinalIgnoreCase))
                {
                    return currentBitmask | (1 << 0);
                }
                break;

            case 3:
                if (eventType.Equals("intergalactic_envoys_researched", StringComparison.OrdinalIgnoreCase) ||
                    eventType.Equals("lifeform_tech:IntergalacticEnvoys", StringComparison.OrdinalIgnoreCase) ||
                    eventType.Equals("lifeform_tech_researched", StringComparison.OrdinalIgnoreCase))
                {
                    return currentBitmask | (1 << 0);
                }
                break;

            case 4:
                if (eventType.Equals("computer_tech_researched", StringComparison.OrdinalIgnoreCase) ||
                    eventType.Equals("research_completed:ComputerTechnology", StringComparison.OrdinalIgnoreCase) ||
                    eventType.Equals("computer_technology_2", StringComparison.OrdinalIgnoreCase))
                {
                    return currentBitmask | (1 << 0);
                }
                break;

            case 5:
                if (eventType.Equals("lifeform_discovery_dispatched", StringComparison.OrdinalIgnoreCase) ||
                    eventType.Equals("mission_dispatched:LifeformDiscovery", StringComparison.OrdinalIgnoreCase) ||
                    eventType.Equals("mission_dispatched:LIFEFORM_DISCOVERY", StringComparison.OrdinalIgnoreCase))
                // NOTE (Task 05BP): generic "fleet_dispatched" / 16th-position EXPEDITION dispatches must NOT
                // complete Quest 5 — only Galaxy-view Mor DNA lifeform exploration missions do.
                {
                    return currentBitmask | (1 << 0);
                }
                break;

            case 6:
                if (eventType.Equals("lifeform_species_discovered", StringComparison.OrdinalIgnoreCase) ||
                    eventType.Equals("species_discovered", StringComparison.OrdinalIgnoreCase))
                {
                    return currentBitmask | (1 << 0);
                }
                break;

            case 7:
                if (eventType.Equals("lifeform_species_assigned", StringComparison.OrdinalIgnoreCase) ||
                    eventType.Equals("species_assigned", StringComparison.OrdinalIgnoreCase))
                {
                    return currentBitmask | (1 << 0);
                }
                break;

            case 8:
                if (eventType.Equals("biosphere_farm_23", StringComparison.OrdinalIgnoreCase) ||
                    eventType.Equals("lifeform_building:BiosphereFarm:23", StringComparison.OrdinalIgnoreCase))
                {
                    currentBitmask |= (1 << 0);
                }
                if (eventType.Equals("housing_22", StringComparison.OrdinalIgnoreCase) ||
                    eventType.Equals("lifeform_building:Housing:22", StringComparison.OrdinalIgnoreCase))
                {
                    currentBitmask |= (1 << 1);
                }
                if (eventType.Equals("lifeform_buildings_q8_completed", StringComparison.OrdinalIgnoreCase) ||
                    eventType.Equals("lifeform_building", StringComparison.OrdinalIgnoreCase))
                {
                    currentBitmask |= (1 << 0) | (1 << 1);
                }
                break;

            case 9:
                if (eventType.Equals("lifeform_slot2_unlocked", StringComparison.OrdinalIgnoreCase) ||
                    eventType.Equals("slot_unlocked:2", StringComparison.OrdinalIgnoreCase))
                {
                    return currentBitmask | (1 << 0);
                }
                break;

            case 10:
                if (eventType.Equals("lifeform_tech_selected", StringComparison.OrdinalIgnoreCase) ||
                    eventType.Equals("tech_selected:2", StringComparison.OrdinalIgnoreCase))
                {
                    return currentBitmask | (1 << 0);
                }
                break;

            case 11:
                if (eventType.Equals("artifacts_found_200", StringComparison.OrdinalIgnoreCase) ||
                    eventType.Equals("artifacts_found", StringComparison.OrdinalIgnoreCase))
                {
                    return currentBitmask | (1 << 0);
                }
                break;

            case 12:
                if (eventType.Equals("biosphere_farm_24", StringComparison.OrdinalIgnoreCase) ||
                    eventType.Equals("lifeform_building:BiosphereFarm:24", StringComparison.OrdinalIgnoreCase))
                {
                    currentBitmask |= (1 << 0);
                }
                if (eventType.Equals("housing_23", StringComparison.OrdinalIgnoreCase) ||
                    eventType.Equals("lifeform_building:Housing:23", StringComparison.OrdinalIgnoreCase))
                {
                    currentBitmask |= (1 << 1);
                }
                if (eventType.Equals("lifeform_slot3_unlocked", StringComparison.OrdinalIgnoreCase) ||
                    eventType.Equals("slot_unlocked:3", StringComparison.OrdinalIgnoreCase))
                {
                    currentBitmask |= (1 << 2);
                }
                if (eventType.Equals("lifeform_q12_all_met", StringComparison.OrdinalIgnoreCase))
                {
                    currentBitmask |= (1 << 0) | (1 << 1) | (1 << 2);
                }
                break;

            case 13:
                if (eventType.Equals("artifacts_spent", StringComparison.OrdinalIgnoreCase) ||
                    eventType.Equals("artifact_tech_purchased", StringComparison.OrdinalIgnoreCase))
                {
                    return currentBitmask | (1 << 0);
                }
                break;
        }

        return currentBitmask;
    }
}

