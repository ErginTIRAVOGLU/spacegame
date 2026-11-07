using System.Collections.Concurrent;
using OGame.Domain.Entities;
using OGame.Domain.Enums;

namespace OGame.Domain.Services;

public record DirectiveSubStepResult(
    int Index,
    string Description,
    bool IsMet
);

public record DirectiveRewardDef(
    int Metal,
    int Crystal,
    int Deuterium,
    int DarkMatter
);

public record DirectiveQuestDef(
    int QuestId,
    string Title,
    string Description,
    string Hint,
    List<string> Goals,
    DirectiveRewardDef Reward
);

public record DirectiveEvaluationResult(
    int QuestId,
    string Title,
    string Description,
    string Hint,
    List<DirectiveSubStepResult> Steps,
    DirectiveRewardDef Reward,
    int CompletedCount,
    int TotalCount,
    bool IsFulfilled,
    int ComputedBitmask
);

public static class DirectiveEconomyFormulas
{
    public const int DirectiveId = 1;
    public const string DirectiveTitle = "Sağlam Bir Ekonomi";
    public const string GuideCharacterName = "Birinci Subay Nova";
    public const string GuideCharacterRole = "Birinci Subay";
    public const string GuideIntroLore =
        "Hoş geldin Harbiyeli! Ben birinci subay Nova ve yetenekli bir galaksiler arası imparator olman için gereken her şeyi sana öğreteceğim. Güzel bir başlangıç yapman için sana tüm yönergeler boyunca eşlik edeceğim. Haydi başlayalım!";

    public static readonly DirectiveRewardDef FinalDirectiveReward = new(
        Metal: 5000,
        Crystal: 2500,
        Deuterium: 500,
        DarkMatter: 1000
    );

    private static readonly List<DirectiveQuestDef> Quests = new()
    {
        new(
            QuestId: 1,
            Title: "Hoş geldin Harbiyeli!",
            Description: "Yıldızlararası imparatorluğunuza ilk adımı atın ve yönergeler penceresini inceleyin.",
            Hint: "Görevler menüsünü inceleyerek yönergeler hakkında bilgi edinin.",
            Goals: new() { "Görevler - Genel Bakış penceresini aç" },
            Reward: new(Metal: 500, Crystal: 0, Deuterium: 0, DarkMatter: 0)
        ),
        new(
            QuestId: 2,
            Title: "Önemli kaynaklar",
            Description: "Gezegeninizin en temel yapı taşı Metaldir. Madencilik faaliyetlerini başlatın.",
            Hint: "Kaynaklar sekmesinden Metal Madeni binasını 1. seviyeye yükseltin.",
            Goals: new() { "Metal Madeni binasını 1. seviyeye yükselt" },
            Reward: new(Metal: 50, Crystal: 0, Deuterium: 0, DarkMatter: 0)
        ),
        new(
            QuestId: 3,
            Title: "Enerji İhtiyacı",
            Description: "Madenlerin tam verimle çalışması için güvenilir bir enerji santraline ihtiyaç vardır.",
            Hint: "Solar Enerji Santrali kurarak pozitif bir enerji bilançosu elde edin.",
            Goals: new()
            {
                "Solar Enerji Santrali binasını 1. seviyeye yükselt",
                "Olumlu bir enerji bilançosu elde et (Enerji >= 0)"
            },
            Reward: new(Metal: 0, Crystal: 50, Deuterium: 0, DarkMatter: 0)
        ),
        new(
            QuestId: 4,
            Title: "Güçlü maden ocakları",
            Description: "Gelişimi hızlandırmak için Metal Madenini bir kademe daha güçlendirin.",
            Hint: "Metal Madenini 2. seviyeye yükseltin.",
            Goals: new() { "Metal Madeni binasını 2. seviyeye yükselt" },
            Reward: new(Metal: 50, Crystal: 0, Deuterium: 0, DarkMatter: 0)
        ),
        new(
            QuestId: 5,
            Title: "Kaynak ayarları",
            Description: "Enerji krizlerinde veya stratejik durumlarda madenlerin üretim yüzdesini ayarlayabilirsiniz.",
            Hint: "Kaynak Ayarları menüsünde Metal Madeni gücünü %90'a ayarlayın ve kaydedin.",
            Goals: new() { "Kaynak Ayarları menüsünde Metal Madeni gücünü %90'a ayarla" },
            Reward: new(Metal: 50, Crystal: 0, Deuterium: 0, DarkMatter: 0)
        ),
        new(
            QuestId: 6,
            Title: "Solar enerji santralinin genişlemesi",
            Description: "Artan maden tüketimini karşılamak için enerji altyapınızı güçlendirin.",
            Hint: "Solar Enerji Santrali binasını 2. seviyeye yükseltin.",
            Goals: new() { "Solar Enerji Santrali binasını 2. seviyeye yükselt" },
            Reward: new(Metal: 50, Crystal: 30, Deuterium: 0, DarkMatter: 0)
        ),
        new(
            QuestId: 7,
            Title: "Metal madeni üretimini tekrar artır",
            Description: "Yeterli enerji sağlandıktan sonra madeninizi tekrar tam kapasiteye alın.",
            Hint: "Metal Madeni gücünü Kaynak Ayarlarından tekrar %100'e ayarlayın.",
            Goals: new() { "Metal Madeni gücünü tekrar %100'e ayarla" },
            Reward: new(Metal: 50, Crystal: 0, Deuterium: 0, DarkMatter: 0)
        ),
        new(
            QuestId: 8,
            Title: "Metal madenini genişletmeye devam et",
            Description: "Altyapıyı sağlamlaştırmak için sırasıyla metal ve enerji seviyelerinizi artırın.",
            Hint: "Sırasıyla Metal Madeni Sv.3, Solar Enerji Santrali Sv.3 ve Metal Madeni Sv.4 inşa edin.",
            Goals: new()
            {
                "Metal Madeni Seviye 3",
                "Solar Enerji Santrali Seviye 3",
                "Metal Madeni Seviye 4"
            },
            Reward: new(Metal: 150, Crystal: 50, Deuterium: 0, DarkMatter: 0)
        ),
        new(
            QuestId: 9,
            Title: "Bir kristal madeni inşa et",
            Description: "Elektronik devreler, gemiler ve araştırmalar için vazgeçilmez olan Kristali üretmeye başlayın.",
            Hint: "Kristal Madeni binasını 1. seviyeye yükseltin.",
            Goals: new() { "Kristal Madeni binasını 1. seviyeye yükselt" },
            Reward: new(Metal: 50, Crystal: 30, Deuterium: 0, DarkMatter: 0)
        ),
        new(
            QuestId: 10,
            Title: "Kaynak üretimini artırmaya devam et",
            Description: "Metal ve kristal dengesini kurarak üretiminizi istikrarlı biçimde büyütün.",
            Hint: "Gereken maden ve enerji binalarını belirtilen seviyelere yükseltin.",
            Goals: new()
            {
                "Solar Enerji Santrali Seviye 4",
                "Metal Madeni Seviye 5",
                "Kristal Madeni Seviye 2",
                "Solar Enerji Santrali Seviye 5",
                "Kristal Madeni Seviye 3"
            },
            Reward: new(Metal: 400, Crystal: 200, Deuterium: 0, DarkMatter: 0)
        ),
        new(
            QuestId: 11,
            Title: "Deuterium",
            Description: "Yıldız gemilerinin yakıtı ve füzyon reaktörlerinin kalbi olan ağır hidrojeni elde edin.",
            Hint: "Deuterium Sentezleyicisi binasını 1. seviyeye yükseltin.",
            Goals: new() { "Deuterium Sentezleyicisi binasını 1. seviyeye yükselt" },
            Reward: new(Metal: 0, Crystal: 200, Deuterium: 100, DarkMatter: 0)
        ),
        new(
            QuestId: 12,
            Title: "Yeterli kaynaklar",
            Description: "Gelişmiş kolonizasyon ve filo projeleri için dev bir hammadde havzası inşa edin.",
            Hint: "Enerji, metal, kristal ve döteryum madenlerinizi üst basamaklara taşıyın.",
            Goals: new()
            {
                "Solar Enerji Santrali Seviye 6",
                "Metal Madeni Seviye 7",
                "Solar Enerji Santrali Seviye 7",
                "Kristal Madeni Seviye 5",
                "Deuterium Sentezleyicisi Seviye 2",
                "Solar Enerji Santrali Seviye 8",
                "Deuterium Sentezleyicisi Seviye 4",
                "Solar Enerji Santrali Seviye 9",
                "Deuterium Sentezleyicisi Seviye 5"
            },
            Reward: new(Metal: 3000, Crystal: 1000, Deuterium: 0, DarkMatter: 0)
        ),
        new(
            QuestId: 13,
            Title: "Depo ve depo kapasitesi",
            Description: "Madenleriniz durmaksızın üretirken kaynak taşmasını önlemek için modern depolar kurun.",
            Hint: "Metal Deposu, Kristal Deposu ve Deuterium Tankeri binalarını 1. seviyeye yükseltin.",
            Goals: new()
            {
                "Metal Deposu Seviye 1",
                "Kristal Deposu Seviye 1",
                "Deuterium Tankeri Seviye 1"
            },
            Reward: new(Metal: 3000, Crystal: 1500, Deuterium: 0, DarkMatter: 0)
        )
    };

    public static IReadOnlyList<DirectiveQuestDef> GetAllQuests() => Quests;

    public static DirectiveQuestDef? GetQuest(int questId) =>
        Quests.FirstOrDefault(q => q.QuestId == questId);

    public static DirectiveEvaluationResult EvaluateQuest(
        int questId,
        Planet? planet,
        int metalPercentage,
        int existingBitmask,
        bool openedTutorialPage)
    {
        var quest = GetQuest(questId) ?? Quests[0];
        var steps = new List<DirectiveSubStepResult>();
        int newBitmask = existingBitmask;

        int metalLvl = planet?.Buildings.FirstOrDefault(b => b.BuildingType == BuildingType.MetalMine)?.Level ?? 0;
        int crystalLvl = planet?.Buildings.FirstOrDefault(b => b.BuildingType == BuildingType.CrystalMine)?.Level ?? 0;
        int deutLvl = planet?.Buildings.FirstOrDefault(b => b.BuildingType == BuildingType.DeuteriumSynthesizer)?.Level ?? 0;
        int solarLvl = planet?.Buildings.FirstOrDefault(b => b.BuildingType == BuildingType.SolarPlant)?.Level ?? 0;
        int metalStoreLvl = planet?.Buildings.FirstOrDefault(b => b.BuildingType == BuildingType.MetalStorage)?.Level ?? 0;
        int crystalStoreLvl = planet?.Buildings.FirstOrDefault(b => b.BuildingType == BuildingType.CrystalStorage)?.Level ?? 0;
        int deutTankLvl = planet?.Buildings.FirstOrDefault(b => b.BuildingType == BuildingType.DeuteriumTank)?.Level ?? 0;

        double producedEnergy = 0;
        double consumedEnergy = 0;
        if (planet != null)
        {
            var prod = ResourceFormulas.CalculatePlanetProduction(planet);
            producedEnergy = prod.ProducedEnergy;
            consumedEnergy = prod.ConsumedEnergy;
        }
        else
        {
            producedEnergy = ResourceFormulas.CalculateSolarPlantEnergy(solarLvl);
            consumedEnergy = ResourceFormulas.CalculateMetalMineEnergyConsumption(metalLvl)
                + ResourceFormulas.CalculateCrystalMineEnergyConsumption(crystalLvl)
                + ResourceFormulas.CalculateDeuteriumSynthesizerEnergyConsumption(deutLvl);
        }
        bool positiveEnergy = (producedEnergy - consumedEnergy) >= 0;

        switch (quest.QuestId)
        {
            case 1:
                AddStep(0, quest.Goals[0], openedTutorialPage);
                break;

            case 2:
                AddStep(0, quest.Goals[0], metalLvl >= 1);
                break;

            case 3:
                AddStep(0, quest.Goals[0], solarLvl >= 1);
                AddStep(1, quest.Goals[1], positiveEnergy);
                break;

            case 4:
                AddStep(0, quest.Goals[0], metalLvl >= 2);
                break;

            case 5:
                AddStep(0, quest.Goals[0], metalPercentage == 90);
                break;

            case 6:
                AddStep(0, quest.Goals[0], solarLvl >= 2);
                break;

            case 7:
                AddStep(0, quest.Goals[0], metalPercentage == 100);
                break;

            case 8:
                AddStep(0, quest.Goals[0], metalLvl >= 3);
                AddStep(1, quest.Goals[1], solarLvl >= 3);
                AddStep(2, quest.Goals[2], metalLvl >= 4);
                break;

            case 9:
                AddStep(0, quest.Goals[0], crystalLvl >= 1);
                break;

            case 10:
                AddStep(0, quest.Goals[0], solarLvl >= 4);
                AddStep(1, quest.Goals[1], metalLvl >= 5);
                AddStep(2, quest.Goals[2], crystalLvl >= 2);
                AddStep(3, quest.Goals[3], solarLvl >= 5);
                AddStep(4, quest.Goals[4], crystalLvl >= 3);
                break;

            case 11:
                AddStep(0, quest.Goals[0], deutLvl >= 1);
                break;

            case 12:
                AddStep(0, quest.Goals[0], solarLvl >= 6);
                AddStep(1, quest.Goals[1], metalLvl >= 7);
                AddStep(2, quest.Goals[2], solarLvl >= 7);
                AddStep(3, quest.Goals[3], crystalLvl >= 5);
                AddStep(4, quest.Goals[4], deutLvl >= 2);
                AddStep(5, quest.Goals[5], solarLvl >= 8);
                AddStep(6, quest.Goals[6], deutLvl >= 4);
                AddStep(7, quest.Goals[7], solarLvl >= 9);
                AddStep(8, quest.Goals[8], deutLvl >= 5);
                break;

            case 13:
                AddStep(0, quest.Goals[0], metalStoreLvl >= 1);
                AddStep(1, quest.Goals[1], crystalStoreLvl >= 1);
                AddStep(2, quest.Goals[2], deutTankLvl >= 1);
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
            return "Yönerge I (Sağlam Bir Ekonomi) tamamlandı!";
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
}

