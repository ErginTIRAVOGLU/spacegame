using OGame.Domain.Entities;
using OGame.Domain.Enums;

namespace OGame.Domain.Services;

public static class DirectiveDeepSpaceFormulas
{
    public const int DirectiveId = 4;
    public const string DirectiveTitle = "Derin Uzay";
    public const string GuideCharacterName = "Birinci Subay Nova";
    public const string GuideCharacterRole = "Birinci Subay";
    public const string GuideIntroLore =
        "Yıldızlararası sınırları aşma zamanı geldi İmparator! Astrofizik keşifleri sayesinde yeni dünyaları sömürgeleştirecek (koloni kuracak), kaynak imparatorluğumuzu genişletecek ve 16. pozisyonun derin uzay boşluğundaki bilinmeyen sefer görevlerine (keşif filosu) yelken açacağız!";

    public static readonly DirectiveRewardDef FinalDirectiveReward = new(
        Metal: 10000,
        Crystal: 5000,
        Deuterium: 2500,
        DarkMatter: 4000
    );

    private static readonly List<DirectiveQuestDef> Quests = new()
    {
        new(
            QuestId: 1,
            Title: "Astrofizik için hazırlık",
            Description: "Astrofizik araştırmasının yüksek hammadde maliyetlerini karşılamak amacıyla madenlerinizi üst kademelere yükselterek üretimi güvenceye alın.",
            Hint: "Ana gezegeninizdeki maden seviyelerini kademeli olarak yükseltin.",
            Goals: new()
            {
                "Metal Madeni: Seviye 10",
                "Kristal Madeni: Seviye 8",
                "Metal Madeni: Seviye 11",
                "Kristal Madeni: Seviye 9",
                "Metal Madeni: Seviye 12",
                "Kristal Madeni: Seviye 10",
                "Deuterium Sentezleyicisi: Seviye 7",
                "Metal Madeni: Seviye 13",
                "Kristal Madeni: Seviye 11",
                "Deuterium Sentezleyicisi: Seviye 8",
                "Metal Madeni: Seviye 14",
                "Kristal Madeni: Seviye 12",
                "Deuterium Sentezleyicisi: Seviye 10"
            },
            Reward: new(Metal: 50000, Crystal: 15000, Deuterium: 5000, DarkMatter: 0)
        ),
        new(
            QuestId: 2,
            Title: "Astrofizikte temel araştırma",
            Description: "Derin uzay astrofiziğini açabilmek için Casusluk Tekniğini 4. ve İtki Motorunu 3. seviyeye yükseltin.",
            Hint: "Araştırma sayfasından Casusluk Tekniğini 4. ve İtki Motorunu 3. seviyede araştırın.",
            Goals: new()
            {
                "Casusluk Tekniği: 4. seviyede araştır",
                "İtki Motoru: 3. seviyede araştır"
            },
            Reward: new(Metal: 12000, Crystal: 30000, Deuterium: 4000, DarkMatter: 0)
        ),
        new(
            QuestId: 3,
            Title: "Astrofiziği 1. seviyede araştır",
            Description: "Yeni koloniler kurabilmenin ve derin uzay keşiflerine çıkabilmenin kapısını aralayan Astrofizik araştırmasını tamamlayın.",
            Hint: "Araştırma sayfasından Astrofizik araştırmasını 1. seviyeye yükseltin.",
            Goals: new() { "Astrofizik araştırmasını 1. seviyede tamamla" },
            Reward: new(Metal: 2000, Crystal: 4000, Deuterium: 2000, DarkMatter: 0)
        ),
        new(
            QuestId: 4,
            Title: "Uzay tersaneni 4. seviyeye yükselt",
            Description: "Gelişmiş gemi gövdelerini ve kolonileştirme donanımlarını inşa edebilmek için tersanenizi 4. kademeye getirin.",
            Hint: "Tesisler sayfasından Uzay Tersanesi binasını 4. seviyeye yükseltin.",
            Goals: new() { "Uzay Tersanesi binasını 4. seviyeye yükselt" },
            Reward: new(Metal: 1000, Crystal: 500, Deuterium: 250, DarkMatter: 0)
        ),
        new(
            QuestId: 5,
            Title: "İlk koloni gemini inşa et",
            Description: "Gezegen çekirdeğini dölleyecek ve yeni bir dünyada yaşam başlatacak Koloni Gemisini inşa edin.",
            Hint: "Tersane sayfasına gidin ve en az 1 adet Koloni Gemisi inşa edin.",
            Goals: new() { "Tersanede 1 defa Koloni Gemisi inşa et" },
            Reward: new(Metal: 5000, Crystal: 8000, Deuterium: 2500, DarkMatter: 0)
        ),
        new(
            QuestId: 6,
            Title: "Yeni bir gezegene yerleş",
            Description: "Galaksideki boş bir koordinata koloni gemisi göndererek ikinci gezegeninizi kurun.",
            Hint: "Filo sayfasından bir Koloni Gemisi seçin ve boş bir koordinata (1-15) Kolonileştir göreviyle gönderin.",
            Goals: new() { "Koloni gemisiyle boş bir koordinata koloni kur" },
            Reward: new(Metal: 5000, Crystal: 2500, Deuterium: 1000, DarkMatter: 0)
        ),
        new(
            QuestId: 7,
            Title: "Gezegen eşittir gezegen değildir",
            Description: "Her gezegenin boyutu, sıcaklığı ve maden potansiyeli farklıdır. Yeni koloninizi kişiselleştirmek için adını değiştirin.",
            Hint: "Yeni koloninize geçin ve Genel Bakış menüsünden gezegen adını güncelleyin.",
            Goals: new() { "Sömürgeleştirilmiş yeni gezegenin adını değiştir" },
            Reward: new(Metal: 5000, Crystal: 1500, Deuterium: 500, DarkMatter: 0)
        ),
        new(
            QuestId: 8,
            Title: "Yeni gezegenlerde ekonomi",
            Description: "Yeni koloninizin kendi ayakları üzerinde durabilmesi için temel maden ve solar enerji altyapısını kurun.",
            Hint: "Yeni koloninize geçiş yapın ve belirtilen maden/enerji kademelerini tamamlayın.",
            Goals: new()
            {
                "Kolonide Metal Madeni Seviye 2",
                "Kolonide Solar Enerji Seviye 1",
                "Kolonide Metal Madeni Seviye 3",
                "Kolonide Solar Enerji Seviye 2",
                "Kolonide Metal Madeni Seviye 5",
                "Kolonide Solar Enerji Seviye 3",
                "Kolonide Kristal Madeni Seviye 2",
                "Kolonide Solar Enerji Seviye 4",
                "Kolonide Kristal Madeni Seviye 3",
                "Kolonide Solar Enerji Seviye 5"
            },
            Reward: new(Metal: 1000, Crystal: 500, Deuterium: 0, DarkMatter: 0)
        ),
        new(
            QuestId: 9,
            Title: "Bilgisayar teknolojisini 1. seviyede araştır",
            Description: "Aynı anda birden fazla filo sevk edebilmek ve derin uzay seferlerini kontrol etmek için Bilgisayar Tekniğini geliştirin.",
            Hint: "Araştırma sayfasından Bilgisayar Tekniği araştırmasını 1. seviyeye yükseltin.",
            Goals: new() { "Bilgisayar Tekniği araştırmasını 1. seviyede tamamla" },
            Reward: new(Metal: 200, Crystal: 300, Deuterium: 0, DarkMatter: 0)
        ),
        new(
            QuestId: 10,
            Title: "Bir sefer filosu gönder",
            Description: "Bilinmeyen derin uzay boşluğundaki 16. pozisyona bir keşif filosu göndererek gizemli kalıntılar veya kaynaklar arayın.",
            Hint: "Filo sayfasından hedef slot olarak 16'yı seçin, Küçük Nakliye Gemisi seçerek Keşif görevini başlatın.",
            Goals: new() { "Küçük nakliye gemisiyle 16. pozisyona keşif filosu gönder ve keşfi tamamla" },
            Reward: new(Metal: 2000, Crystal: 2000, Deuterium: 0, DarkMatter: 0)
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
        IEnumerable<Planet>? allPlanets = null)
    {
        var quest = GetQuest(questStep) ?? Quests[0];
        var steps = new List<DirectiveSubStepResult>();
        int newBitmask = existingBitmask;

        int metalMineLvl = planet?.Buildings.FirstOrDefault(b => b.BuildingType == BuildingType.MetalMine)?.Level ?? 0;
        int crystalMineLvl = planet?.Buildings.FirstOrDefault(b => b.BuildingType == BuildingType.CrystalMine)?.Level ?? 0;
        int deutSynthLvl = planet?.Buildings.FirstOrDefault(b => b.BuildingType == BuildingType.DeuteriumSynthesizer)?.Level ?? 0;
        int shipyardLvl = planet?.Buildings.FirstOrDefault(b => b.BuildingType == BuildingType.Shipyard)?.Level ?? 0;

        int espionageLvl = user?.Researches.FirstOrDefault(r => r.ResearchType == ResearchType.EspionageTechnology)?.Level ?? 0;
        int impulseDriveLvl = user?.Researches.FirstOrDefault(r => r.ResearchType == ResearchType.ImpulseDrive)?.Level ?? 0;
        int astrophysicsLvl = user?.Researches.FirstOrDefault(r => r.ResearchType == ResearchType.Astrophysics)?.Level ?? 0;
        int computerTechLvl = user?.Researches.FirstOrDefault(r => r.ResearchType == ResearchType.ComputerTechnology)?.Level ?? 0;

        int colonyShipCount = planet?.Units.FirstOrDefault(u => u.UnitType == UnitType.ColonyShip)?.Count ?? 0;

        // Colony detection: Any non-capital planet owned by user
        var colonyPlanet = allPlanets?.FirstOrDefault(p => !p.IsCapital && !p.IsMoon);
        bool hasColony = colonyPlanet != null;
        bool colonyRenamed = hasColony && !string.Equals(colonyPlanet!.Name, "Colony", StringComparison.OrdinalIgnoreCase);

        // Colony buildings for Quest 8
        int colMetalMine = colonyPlanet?.Buildings.FirstOrDefault(b => b.BuildingType == BuildingType.MetalMine)?.Level ?? 0;
        int colSolarPlant = colonyPlanet?.Buildings.FirstOrDefault(b => b.BuildingType == BuildingType.SolarPlant)?.Level ?? 0;
        int colCrystalMine = colonyPlanet?.Buildings.FirstOrDefault(b => b.BuildingType == BuildingType.CrystalMine)?.Level ?? 0;

        switch (quest.QuestId)
        {
            case 1:
                AddStep(0, quest.Goals[0], metalMineLvl >= 10);
                AddStep(1, quest.Goals[1], crystalMineLvl >= 8);
                AddStep(2, quest.Goals[2], metalMineLvl >= 11);
                AddStep(3, quest.Goals[3], crystalMineLvl >= 9);
                AddStep(4, quest.Goals[4], metalMineLvl >= 12);
                AddStep(5, quest.Goals[5], crystalMineLvl >= 10);
                AddStep(6, quest.Goals[6], deutSynthLvl >= 7);
                AddStep(7, quest.Goals[7], metalMineLvl >= 13);
                AddStep(8, quest.Goals[8], crystalMineLvl >= 11);
                AddStep(9, quest.Goals[9], deutSynthLvl >= 8);
                AddStep(10, quest.Goals[10], metalMineLvl >= 14);
                AddStep(11, quest.Goals[11], crystalMineLvl >= 12);
                AddStep(12, quest.Goals[12], deutSynthLvl >= 10);
                break;

            case 2:
                AddStep(0, quest.Goals[0], espionageLvl >= 4);
                AddStep(1, quest.Goals[1], impulseDriveLvl >= 3);
                break;

            case 3:
                AddStep(0, quest.Goals[0], astrophysicsLvl >= 1);
                break;

            case 4:
                AddStep(0, quest.Goals[0], shipyardLvl >= 4);
                break;

            case 5:
                AddStep(0, quest.Goals[0], colonyShipCount >= 1);
                break;

            case 6:
                AddStep(0, quest.Goals[0], hasColony);
                break;

            case 7:
                AddStep(0, quest.Goals[0], colonyRenamed);
                break;

            case 8:
                AddStep(0, quest.Goals[0], colMetalMine >= 2);
                AddStep(1, quest.Goals[1], colSolarPlant >= 1);
                AddStep(2, quest.Goals[2], colMetalMine >= 3);
                AddStep(3, quest.Goals[3], colSolarPlant >= 2);
                AddStep(4, quest.Goals[4], colMetalMine >= 5);
                AddStep(5, quest.Goals[5], colSolarPlant >= 3);
                AddStep(6, quest.Goals[6], colCrystalMine >= 2);
                AddStep(7, quest.Goals[7], colSolarPlant >= 4);
                AddStep(8, quest.Goals[8], colCrystalMine >= 3);
                AddStep(9, quest.Goals[9], colSolarPlant >= 5);
                break;

            case 9:
                AddStep(0, quest.Goals[0], computerTechLvl >= 1);
                break;

            case 10:
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
            return "Yönerge IV (Derin Uzay) tamamlandı!";
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
            case 5:
                if (eventType.Equals("colony_ship_produced", StringComparison.OrdinalIgnoreCase) ||
                    eventType.Equals("ship_produced", StringComparison.OrdinalIgnoreCase))
                {
                    return currentBitmask | (1 << 0);
                }
                break;

            case 6:
                if (eventType.Equals("planet_colonized", StringComparison.OrdinalIgnoreCase))
                {
                    return currentBitmask | (1 << 0);
                }
                break;

            case 7:
                if (eventType.Equals("colony_renamed", StringComparison.OrdinalIgnoreCase) ||
                    eventType.Equals("planet_renamed", StringComparison.OrdinalIgnoreCase))
                {
                    return currentBitmask | (1 << 0);
                }
                break;

            case 10:
                if (eventType.Equals("expedition_completed", StringComparison.OrdinalIgnoreCase) ||
                    eventType.Equals("expedition_dispatched", StringComparison.OrdinalIgnoreCase))
                {
                    return currentBitmask | (1 << 0);
                }
                break;
        }

        return currentBitmask;
    }
}

