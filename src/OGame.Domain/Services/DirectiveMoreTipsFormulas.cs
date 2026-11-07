using OGame.Domain.Entities;
using OGame.Domain.Enums;

namespace OGame.Domain.Services;

public static class DirectiveMoreTipsFormulas
{
    public const int DirectiveId = 7;
    public const string DirectiveTitle = "Daha Fazla İpucu";
    public const string GuideCharacterName = "Birinci Subay Nova";
    public const string GuideCharacterRole = "Birinci Subay";
    public const string GuideIntroLore =
        "Tebrikler İmparator! İmparatorluğunuz artık galaksinin en kudretli güçlerinden biri olmaya aday. Şimdi enkaz geri dönüşümü, karakter sınıfları ve tüccar mekanikleri gibi ileri düzey taktikleri öğrenerek hakimiyetinizi pekiştirme ve tüm eğitim serisini tamamlama zamanı!";

    public static readonly DirectiveRewardDef FinalDirectiveReward = new(
        Metal: 5000,
        Crystal: 2500,
        Deuterium: 1500,
        DarkMatter: 3000
    );

    private static readonly List<DirectiveQuestDef> Quests = new()
    {
        new(
            QuestId: 1,
            Title: "Bir geri dönüşümcü inşa et",
            Description: "Uzay muharebelerinden geriye kalan devasa metal ve kristal enkazlarını gezegeninize kazandırmak için Geri Dönüşümcü gemisi üretin.",
            Hint: "Tersane sayfasına giderek en az 1 adet Geri Dönüşümcü inşa edin.",
            Goals: new() { "Tersanede 1 defa Geri Dönüşümcü inşa et" },
            Reward: new(Metal: 5000, Crystal: 2500, Deuterium: 1000, DarkMatter: 0)
        ),
        new(
            QuestId: 2,
            Title: "Bir enkaz alanını başarıyla sök",
            Description: "Geri Dönüşümcü filonuzu galaksi haritasındaki veya muharebe alanındaki bir enkaz bölgesine göndererek değerli hammaddeleri toplayın.",
            Hint: "Galaksi menüsünden veya filo sevk ekranından bir enkaz alanına Geri Dönüşüm (Söküm) görevi gönderin.",
            Goals: new() { "Bir enkaz alanını sökerek kaynak topla" },
            Reward: new(Metal: 10000, Crystal: 5000, Deuterium: 0, DarkMatter: 0)
        ),
        new(
            QuestId: 3,
            Title: "Karakter sınıfını seç",
            Description: "İmparatorluk vizyonunuza uygun bir karakter sınıfı (Kolektör, General veya Kaşif) seçerek kalıcı üretim, filo veya sefer bonusları kazanın.",
            Hint: "Dükkan veya Profil üzerinden ilk ücretsiz karakter sınıfınızı belirleyin.",
            Goals: new() { "Karakter sınıfı menüsünden bir sınıf seç" },
            Reward: new(Metal: 2500, Crystal: 1000, Deuterium: 500, DarkMatter: 0)
        ),
        new(
            QuestId: 4,
            Title: "Tüccarı çağır",
            Description: "Acil hammadde takasları için Gezgin Tüccarı çağırarak pazar dinamiklerini lehinize çevirin.",
            Hint: "Tüccar menüsünden hammadde tüccarını çağırın veya takas oranlarını yenileyin.",
            Goals: new() { "Tüccar menüsünden hammadde tüccarını çağır" },
            Reward: new(Metal: 0, Crystal: 0, Deuterium: 0, DarkMatter: 2500)
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

        int recyclerCount = planet?.Units.FirstOrDefault(u => u.UnitType == UnitType.Recycler)?.Count ?? 0;
        bool hasPlayerClass = user != null && user.PlayerClass != PlayerClass.None;

        switch (quest.QuestId)
        {
            case 1:
                AddStep(0, quest.Goals[0], recyclerCount >= 1);
                break;

            case 2:
                AddStep(0, quest.Goals[0], false);
                break;

            case 3:
                AddStep(0, quest.Goals[0], hasPlayerClass);
                break;

            case 4:
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
            return "Yönerge VII (Daha Fazla İpucu) tamamlandı! Tüm Harbiyeli Eğitimleri başarıyla bitti.";
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
                if (eventType.Equals("recycler_produced", StringComparison.OrdinalIgnoreCase) ||
                    eventType.Equals("ship_produced:Recycler", StringComparison.OrdinalIgnoreCase) ||
                    eventType.Equals("ship_produced", StringComparison.OrdinalIgnoreCase))
                {
                    return currentBitmask | (1 << 0);
                }
                break;

            case 2:
                if (eventType.Equals("debris_harvested", StringComparison.OrdinalIgnoreCase) ||
                    eventType.Equals("debris_recycled", StringComparison.OrdinalIgnoreCase) ||
                    eventType.Equals("harvest_completed", StringComparison.OrdinalIgnoreCase) ||
                    eventType.Equals("fleet_harvested", StringComparison.OrdinalIgnoreCase))
                {
                    return currentBitmask | (1 << 0);
                }
                break;

            case 3:
                if (eventType.Equals("character_class_selected", StringComparison.OrdinalIgnoreCase) ||
                    eventType.Equals("player_class_selected", StringComparison.OrdinalIgnoreCase) ||
                    eventType.Equals("class_selected", StringComparison.OrdinalIgnoreCase))
                {
                    return currentBitmask | (1 << 0);
                }
                break;

            case 4:
                if (eventType.Equals("merchant_summoned", StringComparison.OrdinalIgnoreCase) ||
                    eventType.Equals("merchant_called", StringComparison.OrdinalIgnoreCase) ||
                    eventType.Equals("merchant_trade", StringComparison.OrdinalIgnoreCase))
                {
                    return currentBitmask | (1 << 0);
                }
                break;
        }

        return currentBitmask;
    }
}

