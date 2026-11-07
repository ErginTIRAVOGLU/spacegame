using OGame.Domain.Entities;
using OGame.Domain.Enums;

namespace OGame.Domain.Services;

public static class DirectiveFirstShipFormulas
{
    public const int DirectiveId = 2;
    public const string DirectiveTitle = "İlk Gemi";
    public const string GuideCharacterName = "Birinci Subay Nova";
    public const string GuideCharacterRole = "Birinci Subay";
    public const string GuideIntroLore =
        "Tebrikler İmparator! Sağlam bir ekonomi kurarak temellerimizi attık. Şimdi sıra yıldızlararası filomuzun ilk gemisini inşa etmekte ve galaktik diplomaside yerimizi almakta. Tersane ve araştırma altyapısını kurup ilk Küçük Nakliye Gemimizi uzaya fırlatalım!";

    public static readonly DirectiveRewardDef FinalDirectiveReward = new(
        Metal: 1500,
        Crystal: 750,
        Deuterium: 250,
        DarkMatter: 2000
    );

    private static readonly List<DirectiveQuestDef> Quests = new()
    {
        new(
            QuestId: 1,
            Title: "Sivil gemiler",
            Description: "Küçük nakliye gemisinin üretim şartlarını ve gereksinimlerini öğrenmek için teknoloji ağacını inceleyin.",
            Hint: "Tersane veya Teknoloji menüsünden Küçük Nakliye Gemisi kartındaki 'Teknoloji Ağacı' (Teknoloji A.) butonuna tıklayın.",
            Goals: new() { "Küçük nakliye gemileri için teknoloji ağacını aç (Teknoloji A. modalı)" },
            Reward: new(Metal: 0, Crystal: 300, Deuterium: 0, DarkMatter: 0)
        ),
        new(
            QuestId: 2,
            Title: "Bilimsel araştırma laboratuvarı",
            Description: "Yeni teknolojileri ve motor sistemlerini geliştirebilmek için Araştırma Laboratuvarı kurun.",
            Hint: "Tesisler sayfasından Bilimsel Araştırma Laboratuvarını 1. seviyeye yükseltin.",
            Goals: new() { "Bilimsel Araştırma Laboratuvarı binasını 1. seviyeye yükselt" },
            Reward: new(Metal: 100, Crystal: 200, Deuterium: 100, DarkMatter: 0)
        ),
        new(
            QuestId: 3,
            Title: "Enerji tekniği",
            Description: "Motor ve tersane sistemlerini beslemek için temel enerji araştırmasını gerçekleştirin.",
            Hint: "Araştırma sayfasından Enerji Tekniğini 1. seviyeye yükseltin.",
            Goals: new() { "Enerji Tekniği araştırmasını 1. seviyede tamamla" },
            Reward: new(Metal: 500, Crystal: 250, Deuterium: 0, DarkMatter: 0)
        ),
        new(
            QuestId: 4,
            Title: "Yanma motorları",
            Description: "Sivil nakliye gemilerini itecek standart kimyasal yanma motoru teknolojisini geliştirin.",
            Hint: "Araştırma sayfasından Yanma Motoru araştırmasını 2. seviyeye yükseltin.",
            Goals: new() { "Yanma Motoru araştırmasını 2. seviyede tamamla" },
            Reward: new(Metal: 500, Crystal: 250, Deuterium: 0, DarkMatter: 0)
        ),
        new(
            QuestId: 5,
            Title: "Robot fabrikası",
            Description: "Gemi tersanesinin inşasını mümkün kılmak ve inşaat sürelerini hızlandırmak için Robot Fabrikasını geliştirin.",
            Hint: "Tesisler sayfasından Robot Fabrikası binasını 2. seviyeye yükseltin.",
            Goals: new() { "Robot Fabrikası binasını 2. seviyeye yükselt" },
            Reward: new(Metal: 500, Crystal: 250, Deuterium: 400, DarkMatter: 0)
        ),
        new(
            QuestId: 6,
            Title: "Uzay tersanesi",
            Description: "Gemi gövdelerini birleştirmek ve sivil filoları üretmek için Uzay Tersanesini kurun.",
            Hint: "Tesisler sayfasından Uzay Tersanesi binasını 2. seviyeye yükseltin.",
            Goals: new() { "Uzay Tersanesi binasını 2. seviyeye yükselt" },
            Reward: new(Metal: 500, Crystal: 250, Deuterium: 400, DarkMatter: 0)
        ),
        new(
            QuestId: 7,
            Title: "Küçük nakliye gemisi",
            Description: "Hammadde taşımacılığı ve yağma filolarının omurgası olan ilk nakliye geminizi üretin.",
            Hint: "Tersane sayfasına gidin ve en az 1 adet Küçük Nakliye Gemisi inşa edin.",
            Goals: new() { "Tersanede 1 defa Küçük Nakliye Gemisi inşa et" },
            Reward: new(Metal: 500, Crystal: 250, Deuterium: 100, DarkMatter: 0)
        ),
        new(
            QuestId: 8,
            Title: "Bir ittifakın parçası ol",
            Description: "Tek başına hayatta kalmak zordur; galaktik ittifaklardan birine katılın ya da kendi ittifakınızı kurun.",
            Hint: "İttifak sayfasına giderek bir ittifaka katılın veya yeni bir ittifak kurun.",
            Goals: new() { "Bir ittifaka katıl veya yeni bir ittifak kur" },
            Reward: new(Metal: 0, Crystal: 300, Deuterium: 150, DarkMatter: 0)
        ),
        new(
            QuestId: 9,
            Title: "Gezegeni yeniden adlandır",
            Description: "İmparatorluğunuzun başkentine kişisel bir kimlik kazandırmak için gezegeninize yeni bir isim verin.",
            Hint: "Genel Bakış veya Dükkan/Profil sayfasından ana gezegeninizin adını değiştirin.",
            Goals: new() { "Ana gezegenin adını değiştir" },
            Reward: new(Metal: 0, Crystal: 300, Deuterium: 150, DarkMatter: 0)
        ),
        new(
            QuestId: 10,
            Title: "Bir arkadaşlık isteği gönder",
            Description: "Diğer komutanlarla iletişim kurmak ve müttefikler edinmek için arkadaşlık teklifi gönderin.",
            Hint: "Galaksi veya Sohbet sayfasından başka bir oyuncuya arkadaşlık isteği gönderin.",
            Goals: new() { "Başka bir imparatora arkadaşlık isteği oluştur" },
            Reward: new(Metal: 0, Crystal: 300, Deuterium: 150, DarkMatter: 0)
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

        int researchLabLvl = planet?.Buildings.FirstOrDefault(b => b.BuildingType == BuildingType.ResearchLab)?.Level ?? 0;
        int roboticsLvl = planet?.Buildings.FirstOrDefault(b => b.BuildingType == BuildingType.RoboticsFactory)?.Level ?? 0;
        int shipyardLvl = planet?.Buildings.FirstOrDefault(b => b.BuildingType == BuildingType.Shipyard)?.Level ?? 0;

        int energyTechLvl = user?.Researches.FirstOrDefault(r => r.ResearchType == ResearchType.EnergyTechnology)?.Level ?? 0;
        int combustionLvl = user?.Researches.FirstOrDefault(r => r.ResearchType == ResearchType.CombustionDrive)?.Level ?? 0;

        bool hasSmallCargo = planet?.Units.Any(u => u.UnitType == UnitType.SmallCargo && u.Count >= 1) ?? false;
        bool hasAlliance = !string.IsNullOrWhiteSpace(user?.AllianceTag);

        string planetName = planet?.Name ?? "";
        bool hasCustomPlanetName = !string.IsNullOrWhiteSpace(planetName)
                                   && !planetName.Equals("Homeworld", StringComparison.OrdinalIgnoreCase)
                                   && !planetName.Equals("Ana Gezegen", StringComparison.OrdinalIgnoreCase)
                                   && !planetName.Equals("Aethelgard Prime", StringComparison.OrdinalIgnoreCase);

        switch (quest.QuestId)
        {
            case 1:
                // Tech tree modal viewed (recorded in bit 0)
                AddStep(0, quest.Goals[0], false);
                break;

            case 2:
                AddStep(0, quest.Goals[0], researchLabLvl >= 1);
                break;

            case 3:
                AddStep(0, quest.Goals[0], energyTechLvl >= 1);
                break;

            case 4:
                AddStep(0, quest.Goals[0], combustionLvl >= 2);
                break;

            case 5:
                AddStep(0, quest.Goals[0], roboticsLvl >= 2);
                break;

            case 6:
                AddStep(0, quest.Goals[0], shipyardLvl >= 2);
                break;

            case 7:
                AddStep(0, quest.Goals[0], hasSmallCargo);
                break;

            case 8:
                AddStep(0, quest.Goals[0], hasAlliance);
                break;

            case 9:
                AddStep(0, quest.Goals[0], hasCustomPlanetName);
                break;

            case 10:
                // Friend request sent (recorded in bit 0)
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
            return "Yönerge II (İlk Gemi) tamamlandı!";
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

