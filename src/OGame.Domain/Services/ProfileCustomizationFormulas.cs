using System.Text.RegularExpressions;

namespace OGame.Domain.Services;

public record CosmeticItemDef(
    string Id,
    string Name,
    string Type, // "avatar" or "title"
    int CostDarkMatter,
    bool IsDefault,
    string Description,
    string IconKey);

public static class ProfileCustomizationFormulas
{
    public const int RelocationCostDarkMatter = 240_000;
    public const int RelocationPreparationHours = 24;
    public const int RelocationCooldownHours = 48;

    public const int NameChangeCostDarkMatter = 25_000;
    public const int MinUsernameLength = 3;
    public const int MaxUsernameLength = 20;

    private static readonly Regex ValidUsernameRegex = new(@"^[a-zA-Z0-9_\-]{3,20}$", RegexOptions.Compiled);

    private static readonly List<CosmeticItemDef> Avatars =
    [
        new("avatar_cadet", "Acemi Komutan", "avatar", 0, true, "Her imparatorluğun ilk adımını atan cesur liderler için standart portre.", "User"),
        new("avatar_pilot", "Uzay Pilotu", "avatar", 0, true, "Yıldızlararası filoların tecrübeli kokpit subayı.", "Compass"),
        new("avatar_miner", "Yıldız Madencisi", "avatar", 10_000, false, "Asteroit madenciliği ve kaynak çıkarma operasyonlarında uzmanlaşmış kıdemli madenci.", "Pickaxe"),
        new("avatar_fleet_admiral", "Savaş Filosu Komutanı", "avatar", 15_000, false, "Devasa armada manevralarını yöneten stratejik savaş dehası.", "Shield"),
        new("avatar_cyborg", "Sayborg Savaşçı", "avatar", 20_000, false, "Sibernetik geliştirmelerle donatılmış yüksek refleksli savaş makinesi.", "Cpu"),
        new("avatar_diplomat", "Uzaylı Diplomat", "avatar", 25_000, false, "Gelişmiş galaktik ittifaklar kuran ve barış antlaşmalarını mühürleyen diplomat.", "Globe"),
        new("avatar_pirate", "Galaksi Korsanı", "avatar", 20_000, false, "Ticaret rotalarını yağmalayan ve karanlık madde kaçakçılığı yapan korkusuz korsan.", "Skull"),
        new("avatar_general", "İmparatorluk Generali", "avatar", 30_000, false, "Gezegen fetihlerini ve karargah savunmalarını bizzat sevk ve idare eden en üst rütbe.", "Crown")
    ];

    private static readonly List<CosmeticItemDef> Titles =
    [
        new("title_commander", "Komutan", "title", 0, true, "Galaksiye yeni adım atan her oyuncunun başlangıç unvanı.", "Shield"),
        new("title_stellar_miner", "Yıldızlararası Madenci", "title", 10_000, false, "Kaynak üretiminde eşsiz zirvelere ulaşan oyuncular için saygın unvan.", "Pickaxe"),
        new("title_hyperspace_voyager", "Hiperuzay Seyyahı", "title", 15_000, false, "Bilinmeyen galaksilere ve tehlikeli keşiflere gözü kapalı atılan seyyah.", "Compass"),
        new("title_darkmatter_merchant", "Karanlık Madde Tüccarı", "title", 25_000, false, "Evrenin en nadir maddesini elinde tutan galaktik tüccar.", "Coins"),
        new("title_galaxy_conqueror", "Galaksi Fatihi", "title", 30_000, false, "Savaş meydanlarında ve güneş sistemlerinde nam salmış kudretli fatih.", "Flame"),
        new("title_fleet_legend", "Filo Efsanesi", "title", 35_000, false, "Düşman filolarını tek bir sortide yok eden efsanevi armada lideri.", "Zap")
    ];

    public static IReadOnlyList<CosmeticItemDef> GetAvatars() => Avatars;
    public static IReadOnlyList<CosmeticItemDef> GetTitles() => Titles;

    public static CosmeticItemDef? FindCosmetic(string type, string id)
    {
        if (type.Equals("avatar", StringComparison.OrdinalIgnoreCase))
        {
            return Avatars.FirstOrDefault(a => a.Id.Equals(id, StringComparison.OrdinalIgnoreCase));
        }
        if (type.Equals("title", StringComparison.OrdinalIgnoreCase))
        {
            return Titles.FirstOrDefault(t => t.Id.Equals(id, StringComparison.OrdinalIgnoreCase));
        }
        return null;
    }

    public static bool ValidateUsername(string? username, out string errorMessage)
    {
        if (string.IsNullOrWhiteSpace(username))
        {
            errorMessage = "Kullanıcı adı boş bırakılamaz.";
            return false;
        }

        string trimmed = username.Trim();
        if (trimmed.Length < MinUsernameLength || trimmed.Length > MaxUsernameLength)
        {
            errorMessage = $"Kullanıcı adı {MinUsernameLength} ile {MaxUsernameLength} karakter arasında olmalıdır.";
            return false;
        }

        if (!ValidUsernameRegex.IsMatch(trimmed))
        {
            errorMessage = "Kullanıcı adı yalnızca harf, rakam, alt çizgi (_) ve tire (-) içerebilir.";
            return false;
        }

        errorMessage = string.Empty;
        return true;
    }

    public static (bool IsValid, string ErrorMessage) ValidateRelocationTarget(int galaxy, int system, int slot)
    {
        if (galaxy < 1 || galaxy > 9)
        {
            return (false, "Hedef galaksi 1 ile 9 arasında olmalıdır.");
        }

        if (system < 1 || system > 499)
        {
            return (false, "Hedef sistem 1 ile 499 arasında olmalıdır.");
        }

        if (slot < 1 || slot > 15)
        {
            return (false, "Hedef yörünge pozisyonu 1 ile 15 arasında olmalıdır.");
        }

        return (true, string.Empty);
    }

    public static (int TempMin, int TempMax) CalculateNewTemperature(int slot)
    {
        return ColonizationFormulas.GetSlotTemperatureBand(slot);
    }
}

