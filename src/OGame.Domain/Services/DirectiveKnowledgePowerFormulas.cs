using OGame.Domain.Entities;
using OGame.Domain.Enums;

namespace OGame.Domain.Services;

public static class DirectiveKnowledgePowerFormulas
{
    public const int DirectiveId = 3;
    public const string DirectiveTitle = "Bilgi Güçtür";
    public const string GuideCharacterName = "Birinci Subay Nova";
    public const string GuideCharacterRole = "Birinci Subay";
    public const string GuideIntroLore =
        "Bilgi, galaksideki en ölümcül silahtır İmparator! Gelişmiş enerji kaynaklarını, bina yıkımını, casusluk ağlarını ve filolarımızı koruma (Fleet Save) manevralarını öğrenerek imparatorluğumuzu yenilmez kılacağız.";

    public static readonly DirectiveRewardDef FinalDirectiveReward = new(
        Metal: 4000,
        Crystal: 1500,
        Deuterium: 1000,
        DarkMatter: 3000
    );

    private static readonly List<DirectiveQuestDef> Quests = new()
    {
        new(
            QuestId: 1,
            Title: "Enerji tekniğini 3. seviyede araştır",
            Description: "Yüksek güç gerektiren füzyon santralleri ve gelişmiş silahlar için Enerji Tekniğini 3. seviyeye yükseltin.",
            Hint: "Araştırma sayfasından Enerji Tekniğini 3. seviyeye yükseltin.",
            Goals: new() { "Enerji Tekniği araştırmasını 3. seviyede tamamla" },
            Reward: new(Metal: 2500, Crystal: 1500, Deuterium: 0, DarkMatter: 0)
        ),
        new(
            QuestId: 2,
            Title: "Bir füzyoenerji santrali inşa et",
            Description: "Güneş ışığının yetersiz olduğu soğuk gezegenlerde ağır hidrojeni (Döteryum) yakarak devasa enerji üreten Füzyoenerji Santrali kurun.",
            Hint: "Kaynaklar sayfasından Füzyoenerji Santrali binasını 1. seviyeye yükseltin.",
            Goals: new() { "Füzyoenerji Santrali binasını 1. seviyeye yükselt" },
            Reward: new(Metal: 500, Crystal: 250, Deuterium: 100, DarkMatter: 0)
        ),
        new(
            QuestId: 3,
            Title: "Bir bina yık",
            Description: "Gezegen alanları dolduğunda veya stratejinizi değiştirdiğinizde binalarınızı yıkabilirsiniz. Füzyoenerji santralinin seviyesini 0'a düşürün.",
            Hint: "Kaynaklar sayfasında Füzyoenerji Santralinin yıkım simgesine tıklayarak binayı yıkın.",
            Goals: new() { "Füzyoenerji Santrali binasını yık (kademesini 0'a düşür)" },
            Reward: new(Metal: 300, Crystal: 200, Deuterium: 100, DarkMatter: 0)
        ),
        new(
            QuestId: 4,
            Title: "Solar uydular inşa et",
            Description: "Gezegen yüzeyindeki alanı tasarruf etmek için yörüngeye Solar Uydular yerleştirin ve madencilik altyapınızı büyütün.",
            Hint: "Maden seviyelerinizi belirtilen kademelere çıkarın ve tersanede en az 2 adet Solar Uydu üretin.",
            Goals: new()
            {
                "Metal Madeni Seviye 8",
                "Solar Enerji Santrali Seviye 10",
                "Metal Madeni Seviye 9",
                "Kristal Madeni Seviye 7",
                "2 defa Solar Uydu inşa et",
                "Deuterium Sentezleyicisi Seviye 6"
            },
            Reward: new(Metal: 5000, Crystal: 2500, Deuterium: 0, DarkMatter: 0)
        ),
        new(
            QuestId: 5,
            Title: "Casusluğun temelleri",
            Description: "İstihbarat ağını kurmak için laboratuvar, casusluk tekniği, tersane ve yanma motoru seviyelerinizi yükseltin.",
            Hint: "Gereken araştırma ve tesis binalarını belirtilen seviyelere yükseltin.",
            Goals: new()
            {
                "Bilimsel Araştırma Laboratuvarı Seviye 3",
                "Casusluk Tekniği 2. seviyede araştır",
                "Uzay Tersanesi Seviye 3",
                "Yanma Motoru 3. seviyede araştır"
            },
            Reward: new(Metal: 3500, Crystal: 4500, Deuterium: 2500, DarkMatter: 0)
        ),
        new(
            QuestId: 6,
            Title: "İlk casusluk sondan",
            Description: "Düşman gezegenlerin maden, filo ve savunma durumlarını uzaktan gözetlemek için ilk Casus Sondanızı üretin.",
            Hint: "Tersane sayfasına gidin ve en az 1 adet Casus Sondası inşa edin.",
            Goals: new() { "Tersanede 1 defa Casus Sondası inşa et" },
            Reward: new(Metal: 0, Crystal: 1000, Deuterium: 0, DarkMatter: 0)
        ),
        new(
            QuestId: 7,
            Title: "Bir imparatorluğu gözetlemek",
            Description: "Galaksi haritasından veya filo menüsünden başka bir oyuncunun koordinatına Casus Sondası fırlatarak istihbarat raporu elde edin.",
            Hint: "Galaksi haritasında bir gezegene casusluk sondası gönderin veya casusluk raporu alın.",
            Goals: new() { "Başka bir oyuncuya casusluk sondası fırlatarak istihbarat raporu elde et" },
            Reward: new(Metal: 0, Crystal: 500, Deuterium: 0, DarkMatter: 0)
        ),
        new(
            QuestId: 8,
            Title: "Ham maddeleri olan bir filo gönder",
            Description: "Geceleri veya saldırı altındayken kaynaklarınızı yağmadan korumak için (Fleet Save), 16. slota kaynak yüklü casusluk filosu gönderin.",
            Hint: "Filo sayfasından hedef slot olarak 16'yı seçin, Casus Sondası ve kaynak yükleyerek görevi başlatın.",
            Goals: new() { "16. pozisyona en az 1 Casus Sondası ve kaynak yükü ile casusluk görevi gönder" },
            Reward: new(Metal: 1500, Crystal: 500, Deuterium: 250, DarkMatter: 0)
        ),
        new(
            QuestId: 9,
            Title: "Filonun geri çağrılması",
            Description: "Havada hareket halindeki bir filoyu tehlike anında veya manevra bittiğinde güvenle geri çağırın.",
            Hint: "Filo Hareketi şeridinden havadaki görevinizin yanındaki 'Geri Çağır' butonuna tıklayın.",
            Goals: new() { "Havada hareket halinde olan filoyu geri çağır" },
            Reward: new(Metal: 500, Crystal: 500, Deuterium: 500, DarkMatter: 0)
        )
    };

    public static IReadOnlyList<DirectiveQuestDef> GetAllQuests() => Quests;

    public static DirectiveQuestDef? GetQuest(int questId) =>
        Quests.FirstOrDefault(q => q.QuestId == questId);

    public static DirectiveEvaluationResult EvaluateQuest(
        int questId,
        Planet? planet,
        User? user,
        int existingBitmask)
    {
        var quest = GetQuest(questId) ?? Quests[0];
        var steps = new List<DirectiveSubStepResult>();
        int newBitmask = existingBitmask;

        int metalLvl = planet?.Buildings.FirstOrDefault(b => b.BuildingType == BuildingType.MetalMine)?.Level ?? 0;
        int crystalLvl = planet?.Buildings.FirstOrDefault(b => b.BuildingType == BuildingType.CrystalMine)?.Level ?? 0;
        int deutLvl = planet?.Buildings.FirstOrDefault(b => b.BuildingType == BuildingType.DeuteriumSynthesizer)?.Level ?? 0;
        int solarLvl = planet?.Buildings.FirstOrDefault(b => b.BuildingType == BuildingType.SolarPlant)?.Level ?? 0;
        int fusionLvl = planet?.Buildings.FirstOrDefault(b => b.BuildingType == BuildingType.FusionReactor)?.Level ?? 0;
        int researchLabLvl = planet?.Buildings.FirstOrDefault(b => b.BuildingType == BuildingType.ResearchLab)?.Level ?? 0;
        int shipyardLvl = planet?.Buildings.FirstOrDefault(b => b.BuildingType == BuildingType.Shipyard)?.Level ?? 0;

        int energyTechLvl = user?.Researches.FirstOrDefault(r => r.ResearchType == ResearchType.EnergyTechnology)?.Level ?? 0;
        int espionageTechLvl = user?.Researches.FirstOrDefault(r => r.ResearchType == ResearchType.EspionageTechnology)?.Level ?? 0;
        int combustionLvl = user?.Researches.FirstOrDefault(r => r.ResearchType == ResearchType.CombustionDrive)?.Level ?? 0;

        int solarSatelliteCount = planet?.Units.FirstOrDefault(u => u.UnitType == UnitType.SolarSatellite)?.Count ?? 0;
        int espionageProbeCount = planet?.Units.FirstOrDefault(u => u.UnitType == UnitType.EspionageProbe)?.Count ?? 0;

        switch (quest.QuestId)
        {
            case 1:
                AddStep(0, quest.Goals[0], energyTechLvl >= 3);
                break;

            case 2:
                AddStep(0, quest.Goals[0], fusionLvl >= 1);
                break;

            case 3:
                // Building demolished (recorded in bit 0)
                AddStep(0, quest.Goals[0], false);
                break;

            case 4:
                AddStep(0, quest.Goals[0], metalLvl >= 8);
                AddStep(1, quest.Goals[1], solarLvl >= 10);
                AddStep(2, quest.Goals[2], metalLvl >= 9);
                AddStep(3, quest.Goals[3], crystalLvl >= 7);
                AddStep(4, quest.Goals[4], solarSatelliteCount >= 2);
                AddStep(5, quest.Goals[5], deutLvl >= 6);
                break;

            case 5:
                AddStep(0, quest.Goals[0], researchLabLvl >= 3);
                AddStep(1, quest.Goals[1], espionageTechLvl >= 2);
                AddStep(2, quest.Goals[2], shipyardLvl >= 3);
                AddStep(3, quest.Goals[3], combustionLvl >= 3);
                break;

            case 6:
                AddStep(0, quest.Goals[0], espionageProbeCount >= 1);
                break;

            case 7:
                // Espionage performed on other empire (recorded in bit 0)
                AddStep(0, quest.Goals[0], false);
                break;

            case 8:
                // Fleet save with resources to slot 16 (recorded in bit 0)
                AddStep(0, quest.Goals[0], false);
                break;

            case 9:
                // Fleet recalled (recorded in bit 0)
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
    }

    public static string GetNextDirectiveSummary(
        int currentStep,
        bool isDirectiveCompleted,
        DirectiveEvaluationResult currentEval)
    {
        if (isDirectiveCompleted)
        {
            return "Yönerge III (Bilgi Güçtür) tamamlandı!";
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
            case 2:
                if (eventType.Equals("fusion_built", StringComparison.OrdinalIgnoreCase))
                {
                    return currentBitmask | (1 << 0);
                }
                break;

            case 3:
                if (eventType.Equals("building_demolished", StringComparison.OrdinalIgnoreCase))
                {
                    return currentBitmask | (1 << 0);
                }
                break;

            case 4:
                if (eventType.Equals("satellite_produced", StringComparison.OrdinalIgnoreCase))
                {
                    return currentBitmask | (1 << 4);
                }
                break;

            case 6:
                if (eventType.Equals("probe_produced", StringComparison.OrdinalIgnoreCase))
                {
                    return currentBitmask | (1 << 0);
                }
                break;

            case 7:
                if (eventType.Equals("espionage_performed", StringComparison.OrdinalIgnoreCase))
                {
                    return currentBitmask | (1 << 0);
                }
                break;

            case 8:
                if (eventType.Equals("fleet_dispatched_slot16", StringComparison.OrdinalIgnoreCase))
                {
                    return currentBitmask | (1 << 0);
                }
                break;

            case 9:
                if (eventType.Equals("fleet_recalled", StringComparison.OrdinalIgnoreCase))
                {
                    return currentBitmask | (1 << 0);
                }
                break;
        }

        return currentBitmask;
    }
}
