namespace OGame.Domain.Services;

/// <summary>
/// Outcome categories for a Galaxy-view "Mor DNA" lifeform exploration mission (missionType: LIFEFORM_DISCOVERY).
/// This is intentionally distinct from the 16th-position fleet Expedition (missionType: EXPEDITION).
/// </summary>
public enum LifeformDiscoveryOutcomeType
{
    NewSpeciesDiscovered,
    ExperienceGained,
    ArtefactsFound,
    NothingFound
}

public record LifeformDiscoveryOutcome(
    LifeformDiscoveryOutcomeType Type,
    string? SpeciesId,
    int Experience,
    int Artefacts,
    string Narrative);

public record LifeformDiscoveryValidation(bool CanDispatch, string? Reason);

/// <summary>
/// Progressive lifeform unlock chain & Mor DNA exploration rules (Task 05BP).
/// Humans are the only species unlocked at game start; Rock'tal, Mechas and Kaelesh are found via
/// Galaxy-view lifeform exploration missions once Intergalactic Envoys (Humans tech slot 1) is level >= 1.
/// </summary>
public static class LifeformDiscoveryFormulas
{
    public const string MissionType = "LIFEFORM_DISCOVERY";
    public const string ExpeditionMissionType = "EXPEDITION";

    public static readonly IReadOnlyList<string> InitialUnlockedSpecies = new[] { LifeformsSpeciesFormulas.HumansId };

    public static readonly IReadOnlyList<string> DiscoverableSpecies = new[]
    {
        LifeformsSpeciesFormulas.RocktalId,
        LifeformsSpeciesFormulas.MechasId,
        LifeformsSpeciesFormulas.KaeleshId
    };

    public const int IntergalacticEnvoysSlot = 1;
    public const int RequiredEnvoysLevel = 1;
    public const int ResearchCentreRequiredLevel = 1;
    public const long Slot1RequiredPopulation = 200_000;

    public const string EnvoysMissingMessage =
        "Yeni canlı türlerini keşfetmek için gereken araştırma henüz onaylanmadı.";

    /// <summary>Chance (0..1) that a mission discovers a still-locked species, if any remain.</summary>
    public const double NewSpeciesChance = 0.35;
    /// <summary>Chance (0..1) of finding artefacts on a mission that did not discover a new species.</summary>
    public const double ArtefactChance = 0.20;
    /// <summary>Chance (0..1) of a completely empty mission.</summary>
    public const double NothingChance = 0.10;

    public static bool IsDiscoveryUnlocked(int intergalacticEnvoysLevel) =>
        intergalacticEnvoysLevel >= RequiredEnvoysLevel;

    public static bool IsSlot1Unlocked(int researchCentreLevel, long totalPopulation) =>
        researchCentreLevel >= ResearchCentreRequiredLevel && totalPopulation >= Slot1RequiredPopulation;

    public static bool IsValidTargetSlot(int slot) => slot >= 1 && slot <= 15;

    /// <summary>Flight time (seconds) for a lifeform exploration mission (no ships, fixed probe-like speed).</summary>
    public static int CalculateFlightSeconds(int originGalaxy, int originSystem, int targetGalaxy, int targetSystem)
    {
        int galaxyDist = Math.Abs(originGalaxy - targetGalaxy);
        int systemDist = Math.Abs(originSystem - targetSystem);
        int seconds = 60 + galaxyDist * 600 + systemDist * 10;
        return Math.Clamp(seconds, 60, 3600);
    }

    /// <summary>Daily flight allotment: +50 per elapsed day, accumulating (never reset).</summary>
    public static int CalculateAvailableFlights(int storedFlights, DateTime lastRefillUtc, DateTime nowUtc, out DateTime newRefillUtc)
    {
        newRefillUtc = lastRefillUtc;
        if (nowUtc <= lastRefillUtc) return storedFlights;

        int elapsedDays = (int)Math.Floor((nowUtc - lastRefillUtc).TotalDays);
        if (elapsedDays <= 0) return storedFlights;

        newRefillUtc = lastRefillUtc.AddDays(elapsedDays);
        return storedFlights + elapsedDays * LifeformsSpeciesFormulas.ExplorationDailyAllotment;
    }

    public static bool IsCoordinateOnCooldown(DateTime? lastScoutedUtc, DateTime nowUtc) =>
        lastScoutedUtc.HasValue &&
        nowUtc - lastScoutedUtc.Value < TimeSpan.FromDays(LifeformsSpeciesFormulas.ExplorationCoordinateCooldownDays);

    public static LifeformDiscoveryValidation ValidateDispatch(
        int intergalacticEnvoysLevel,
        int targetSlot,
        int activeFleets,
        int maxFleets,
        int availableFlights,
        double metal,
        double crystal,
        double deuterium,
        DateTime? lastScoutedUtc,
        DateTime nowUtc)
    {
        if (!IsDiscoveryUnlocked(intergalacticEnvoysLevel))
            return new(false, EnvoysMissingMessage);

        if (!IsValidTargetSlot(targetSlot))
            return new(false, "Canlı türü keşfi yalnızca 1-15 arası gezegen pozisyonlarına gönderilebilir.");

        if (activeFleets >= maxFleets)
            return new(false, "Keşif uçuşu için en az 1 boş filo slotu gereklidir.");

        if (availableFlights <= 0)
            return new(false, "Günlük canlı türü keşif hakkınız tükendi.");

        var cost = LifeformsSpeciesFormulas.ExplorationFlightCost;
        if (metal < cost.Metal || crystal < cost.Crystal || deuterium < cost.Deuterium)
            return new(false, "Yetersiz hammadde (Gereken: 5.000 Metal, 1.000 Kristal, 500 Deuterium).");

        if (IsCoordinateOnCooldown(lastScoutedUtc, nowUtc))
            return new(false, "Bu koordinat son 7 gün içinde zaten tarandı.");

        return new(true, null);
    }

    /// <summary>
    /// Resolves a completed Mor DNA mission. Locked species can be found in random order (not all at once);
    /// already-unlocked species yield experience or artefacts instead.
    /// </summary>
    public static LifeformDiscoveryOutcome ResolveOutcome(
        IReadOnlyCollection<string> unlockedSpecies,
        Random rng,
        int currentArtefacts = 0)
    {
        ArgumentNullException.ThrowIfNull(unlockedSpecies);
        ArgumentNullException.ThrowIfNull(rng);

        var locked = DiscoverableSpecies
            .Where(s => !unlockedSpecies.Any(u => u.Equals(s, StringComparison.OrdinalIgnoreCase)))
            .ToList();

        if (locked.Count > 0 && rng.NextDouble() < NewSpeciesChance)
        {
            var species = locked[rng.Next(locked.Count)];
            return new(LifeformDiscoveryOutcomeType.NewSpeciesDiscovered, species, 0, 0,
                $"Keşif sondası yeni bir canlı türüyle temas kurdu: {GetSpeciesDisplayName(species)}! Tür artık gezegenlerine atanabilir.");
        }

        double roll = rng.NextDouble();
        if (roll < NothingChance)
        {
            return new(LifeformDiscoveryOutcomeType.NothingFound, null, 0, 0,
                "Taranan sektörde herhangi bir yaşam izine rastlanmadı.");
        }

        if (roll < NothingChance + ArtefactChance && currentArtefacts < LifeformsSpeciesFormulas.MaxArtefactsCapacity)
        {
            int artefacts = rng.Next(1, 6) * 10;
            return new(LifeformDiscoveryOutcomeType.ArtefactsFound, null, 0, artefacts,
                $"Antik bir yerleşim kalıntısında {artefacts} Eser (Artefact) bulundu.");
        }

        var known = unlockedSpecies.Count > 0 ? unlockedSpecies.ToList() : new List<string> { LifeformsSpeciesFormulas.HumansId };
        var xpSpecies = known[rng.Next(known.Count)];
        int xp = rng.Next(5, 21);
        return new(LifeformDiscoveryOutcomeType.ExperienceGained, xpSpecies, xp, 0,
            $"Bilinen bir canlı türünün ({GetSpeciesDisplayName(xpSpecies)}) izleri incelendi: +{xp} Deneyim.");
    }

    /// <summary>Artefact award respecting the 3,600 storage cap (a single overflowing find is credited fully).</summary>
    public static int ApplyArtefactAward(int currentArtefacts, int found) =>
        currentArtefacts >= LifeformsSpeciesFormulas.MaxArtefactsCapacity ? currentArtefacts : currentArtefacts + found;

    public static string GetSpeciesDisplayName(string speciesId) => speciesId.ToLowerInvariant() switch
    {
        "rocktal" => "Rock'tal",
        "mechas" => "Mekalar",
        "kaelesh" => "Kaelesh",
        _ => "İnsanlar"
    };
}

