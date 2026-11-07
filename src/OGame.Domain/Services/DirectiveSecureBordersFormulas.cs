using OGame.Domain.Entities;
using OGame.Domain.Enums;

namespace OGame.Domain.Services;

public static class DirectiveSecureBordersFormulas
{
    public const int DirectiveId = 5;
    public const string DirectiveTitle = "Sınırları güven altına al";
    public const string GuideCharacterName = "Birinci Subay Nova";
    public const string GuideCharacterRole = "Birinci Subay";
    public const string GuideIntroLore =
        "Sınırlarımızı güvenceye alma vakti geldi İmparator! Barış ve zenginlik ancak caydırıcı bir savunmayla korunabilir. Roketatarlardan ölümcül lazer tabyalarına uzanan savunma hattımızı kuracak, askeri üçlü araştırmayı (zırh, silah ve kalkan) tamamlayacak ve sivil nakliye filolarımıza refakat edecek ilk Ağır Avcı filomuzu göreve başlatacağız!";

    public static readonly DirectiveRewardDef FinalDirectiveReward = new(
        Metal: 15000,
        Crystal: 7500,
        Deuterium: 1500,
        DarkMatter: 5000
    );

    private static readonly List<DirectiveQuestDef> Quests = new()
    {
        new(
            QuestId: 1,
            Title: "Bir roketatar yap",
            Description: "Gezegen yüzeyindeki madenleri ve depoları yağmacılara karşı korumak için en temel balistik savunma birimi olan Roketatarı inşa edin.",
            Hint: "Savunma sayfasına gidin ve en az 1 adet Roketatar inşa edin.",
            Goals: new() { "Savunma menüsünde 1 defa Roketatar inşa et" },
            Reward: new(Metal: 1000, Crystal: 0, Deuterium: 0, DarkMatter: 0)
        ),
        new(
            QuestId: 2,
            Title: "Lazer tekniğini 3. seviyede araştır",
            Description: "Optik enerji silahlarının temelini oluşturan Lazer Tekniğini geliştirerek gelişmiş savunma kulelerinin önünü açın.",
            Hint: "Araştırma sayfasından Lazer Tekniğini 3. seviyeye yükseltin.",
            Goals: new() { "Lazer Tekniği araştırmasını 3. seviyede tamamla" },
            Reward: new(Metal: 700, Crystal: 350, Deuterium: 0, DarkMatter: 0)
        ),
        new(
            QuestId: 3,
            Title: "Bir hafif lazer topu yap",
            Description: "Hızlı hedefleme mekanizmasıyla avcı gemilerine karşı etkili olan Hafif Lazer Topunu savunma hattınıza ekleyin.",
            Hint: "Savunma sayfasına gidin ve en az 1 adet Hafif Lazer Topu inşa edin.",
            Goals: new() { "Savunma menüsünde 1 defa Hafif Lazer Topu inşa et" },
            Reward: new(Metal: 750, Crystal: 250, Deuterium: 0, DarkMatter: 0)
        ),
        new(
            QuestId: 4,
            Title: "Lazer tekniğini 6. seviyede araştır",
            Description: "Daha yoğunlaştırılmış ışık hüzmeleriyle zırhları eritebilecek Ağır Lazer sistemleri için Lazer Tekniğini 6. kademeye taşıyın.",
            Hint: "Araştırma sayfasından Lazer Tekniğini 6. seviyeye yükseltin.",
            Goals: new() { "Lazer Tekniği araştırmasını 6. seviyede tamamla" },
            Reward: new(Metal: 5600, Crystal: 2800, Deuterium: 0, DarkMatter: 0)
        ),
        new(
            QuestId: 5,
            Title: "Bir ağır lazer topu yap",
            Description: "Ağır zırhlı kruvazörlere dahi ciddi hasar verebilen güçlü Ağır Lazer Topunu savunma üssünüze konuşlandırın.",
            Hint: "Savunma sayfasına gidin ve en az 1 adet Ağır Lazer Topu inşa edin.",
            Goals: new() { "Savunma menüsünde 1 defa Ağır Lazer Topu inşa et" },
            Reward: new(Metal: 3000, Crystal: 1000, Deuterium: 0, DarkMatter: 0)
        ),
        new(
            QuestId: 6,
            Title: "Uzay gemisi zırhını 2. seviyede araştır",
            Description: "Askeri üçlünün ilk sacayağı: Tüm filo ve savunma birimlerinin gövde dayanıklılığını artırmak için Uzay Gemisi Zırhını geliştirin.",
            Hint: "Araştırma sayfasından Uzay Gemisi Zırhı araştırmasını 2. seviyeye yükseltin.",
            Goals: new() { "Uzay Gemisi Zırhı araştırmasını 2. seviyede tamamla" },
            Reward: new(Metal: 1500, Crystal: 0, Deuterium: 0, DarkMatter: 0)
        ),
        new(
            QuestId: 7,
            Title: "Bilimsel araştırma laboratuvarını 4. seviyeye yükselt",
            Description: "Karmaşık askeri algoritmaları ve kuantum silah simülasyonlarını çalıştırabilmek için laboratuvarınızı büyütün.",
            Hint: "Tesisler sayfasından Bilimsel Araştırma Laboratuvarını 4. seviyeye yükseltin.",
            Goals: new() { "Bilimsel Araştırma Laboratuvarı binasını 4. seviyeye yükselt" },
            Reward: new(Metal: 800, Crystal: 1600, Deuterium: 800, DarkMatter: 0)
        ),
        new(
            QuestId: 8,
            Title: "Silah tekniğini 1. seviyede araştır",
            Description: "Askeri üçlünün ikinci sacayağı: Tüm birimlerinizin atış gücünü ve tahribat kapasitesini her kademede %10 artıran Silah Tekniğini tamamlayın.",
            Hint: "Araştırma sayfasından Silah Tekniği araştırmasını 1. seviyeye yükseltin.",
            Goals: new() { "Silah Tekniği araştırmasını 1. seviyede tamamla" },
            Reward: new(Metal: 400, Crystal: 100, Deuterium: 0, DarkMatter: 0)
        ),
        new(
            QuestId: 9,
            Title: "Bir kalkan kubbesine ihtiyacımız var",
            Description: "Helius Omega kazasından çıkarılan güvenlik protokolleri gereği; plazma kalkanlarının kararlı çalışabilmesi için laboratuvarınızı 6. seviyeye yükseltin.",
            Hint: "Tesisler sayfasından Bilimsel Araştırma Laboratuvarını 6. seviyeye yükseltin.",
            Goals: new() { "Bilimsel Araştırma Laboratuvarı binasını 6. seviyeye yükselt" },
            Reward: new(Metal: 4800, Crystal: 9600, Deuterium: 4800, DarkMatter: 0)
        ),
        new(
            QuestId: 10,
            Title: "Kalkan tekniğini 1. seviyede araştır",
            Description: "Askeri üçlünün üçüncü sacayağı: Gelen lazer ve kinetik darbeleri emerek gövdeyi koruyan deflektör kalkan teknolojisini devreye alın.",
            Hint: "Araştırma sayfasından Kalkan Tekniği araştırmasını 1. seviyeye yükseltin.",
            Goals: new() { "Kalkan Tekniği araştırmasını 1. seviyede tamamla" },
            Reward: new(Metal: 100, Crystal: 300, Deuterium: 0, DarkMatter: 0)
        ),
        new(
            QuestId: 11,
            Title: "Ağır savaşçılara ihtiyacımız var",
            Description: "Sivil nakliye konvoylarına refakat edecek, üstün manevra ve lazer silahlarıyla donatılmış ilk Ağır Avcı filonuzu üretin.",
            Hint: "Tersane sayfasına gidin ve en az 1 adet Ağır Avcı inşa edin.",
            Goals: new() { "Uzay tersanesinde 1 defa Ağır Avcı inşa et" },
            Reward: new(Metal: 3000, Crystal: 2000, Deuterium: 0, DarkMatter: 0)
        )
    };

    public static IReadOnlyList<DirectiveQuestDef> GetAllQuests() => Quests;

    public static DirectiveQuestDef? GetQuest(int questId) =>
        Quests.FirstOrDefault(q => q.QuestId == questId);

    public static DirectiveEvaluationResult EvaluateQuest(
        int questStep,
        Planet? planet,
        User? user,
        int existingBitmask)
    {
        var quest = GetQuest(questStep) ?? Quests[0];
        var steps = new List<DirectiveSubStepResult>();
        int newBitmask = existingBitmask;

        int researchLabLvl = planet?.Buildings.FirstOrDefault(b => b.BuildingType == BuildingType.ResearchLab)?.Level ?? 0;

        int laserTechLvl = user?.Researches.FirstOrDefault(r => r.ResearchType == ResearchType.LaserTechnology)?.Level ?? 0;
        int armourTechLvl = user?.Researches.FirstOrDefault(r => r.ResearchType == ResearchType.ArmourTechnology)?.Level ?? 0;
        int weaponsTechLvl = user?.Researches.FirstOrDefault(r => r.ResearchType == ResearchType.WeaponsTechnology)?.Level ?? 0;
        int shieldTechLvl = user?.Researches.FirstOrDefault(r => r.ResearchType == ResearchType.ShieldingTechnology)?.Level ?? 0;

        int rocketLauncherCount = planet?.Units.FirstOrDefault(u => u.UnitType == UnitType.RocketLauncher)?.Count ?? 0;
        int lightLaserCount = planet?.Units.FirstOrDefault(u => u.UnitType == UnitType.LightLaser)?.Count ?? 0;
        int heavyLaserCount = planet?.Units.FirstOrDefault(u => u.UnitType == UnitType.HeavyLaser)?.Count ?? 0;
        int heavyFighterCount = planet?.Units.FirstOrDefault(u => u.UnitType == UnitType.HeavyFighter)?.Count ?? 0;

        switch (quest.QuestId)
        {
            case 1:
                AddStep(0, quest.Goals[0], rocketLauncherCount >= 1);
                break;

            case 2:
                AddStep(0, quest.Goals[0], laserTechLvl >= 3);
                break;

            case 3:
                AddStep(0, quest.Goals[0], lightLaserCount >= 1);
                break;

            case 4:
                AddStep(0, quest.Goals[0], laserTechLvl >= 6);
                break;

            case 5:
                AddStep(0, quest.Goals[0], heavyLaserCount >= 1);
                break;

            case 6:
                AddStep(0, quest.Goals[0], armourTechLvl >= 2);
                break;

            case 7:
                AddStep(0, quest.Goals[0], researchLabLvl >= 4);
                break;

            case 8:
                AddStep(0, quest.Goals[0], weaponsTechLvl >= 1);
                break;

            case 9:
                AddStep(0, quest.Goals[0], researchLabLvl >= 6);
                break;

            case 10:
                AddStep(0, quest.Goals[0], shieldTechLvl >= 1);
                break;

            case 11:
                AddStep(0, quest.Goals[0], heavyFighterCount >= 1);
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
            return "Yönerge V (Sınırları güven altına al) tamamlandı!";
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
                if (eventType.Equals("rocket_launcher_produced", StringComparison.OrdinalIgnoreCase) ||
                    eventType.Equals("defense_produced:RocketLauncher", StringComparison.OrdinalIgnoreCase) ||
                    eventType.Equals("defense_produced", StringComparison.OrdinalIgnoreCase))
                {
                    return currentBitmask | (1 << 0);
                }
                break;

            case 3:
                if (eventType.Equals("light_laser_produced", StringComparison.OrdinalIgnoreCase) ||
                    eventType.Equals("defense_produced:LightLaser", StringComparison.OrdinalIgnoreCase))
                {
                    return currentBitmask | (1 << 0);
                }
                break;

            case 5:
                if (eventType.Equals("heavy_laser_produced", StringComparison.OrdinalIgnoreCase) ||
                    eventType.Equals("defense_produced:HeavyLaser", StringComparison.OrdinalIgnoreCase))
                {
                    return currentBitmask | (1 << 0);
                }
                break;

            case 11:
                if (eventType.Equals("heavy_fighter_produced", StringComparison.OrdinalIgnoreCase) ||
                    eventType.Equals("ship_produced:HeavyFighter", StringComparison.OrdinalIgnoreCase) ||
                    eventType.Equals("ship_produced", StringComparison.OrdinalIgnoreCase))
                {
                    return currentBitmask | (1 << 0);
                }
                break;
        }

        return currentBitmask;
    }
}

