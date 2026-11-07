using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using OGame.Application.Common.Interfaces;
using OGame.Application.Interfaces;
using OGame.Domain.Combat;
using OGame.Domain.Entities;
using OGame.Domain.Enums;
using OGame.Domain.Services;

namespace OGame.Application.Services;

public class ExpeditionEngine(
    IApplicationDbContext dbContext,
    ICombatEngine combatEngine,
    IRealtimeNotificationService notificationService) : IExpeditionEngine
{
    public async Task<ExpeditionResolutionResult> ResolveExpeditionAsync(
        FleetMission mission,
        int? seed = null,
        double universeAgeMultiplier = 1.0,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(mission);

        var rng = seed.HasValue ? new Random(seed.Value) : new Random();
        double rollPercentile = rng.NextDouble() * 100.0;
        var now = DateTime.UtcNow;

        // 1. System Depletion Counter & Status
        var (effDepletion, depletionLevel, depletionMsg) = SystemDepletionStore.RecordExpedition(
            mission.TargetGalaxy,
            mission.TargetSystem,
            now);

        var initialShips = mission.Ships
            .Where(s => s.Count > 0)
            .ToDictionary(s => s.UnitType, s => s.Count);

        // 2. Pathfinder (2.0x) & Probe check
        double pathfinderMultiplier = ExpeditionFormulas.GetPathfinderMultiplier(initialShips);
        bool hasProbe = initialShips.TryGetValue(UnitType.EspionageProbe, out int pCount) && pCount > 0;
        double fleetExpeditionPoints = ExpeditionFormulas.CalculateFleetExpeditionPoints(initialShips);

        // 3. Top Player Score for BaseCap scaling
        long topPlayerScore = await dbContext.HighscoreSnapshots
            .Select(s => (long?)s.Points)
            .MaxAsync(cancellationToken) ?? 50_000_000;

        double baseCap = ExpeditionFormulas.CalculateBaseCapByTopPlayerScore(topPlayerScore, fleetExpeditionPoints);

        var d6Progress = await dbContext.UserTutorialProgresses
            .FirstOrDefaultAsync(p => p.UserId == mission.UserId && p.DirectiveId == 6, cancellationToken);
        bool isDirective6Step6Active = d6Progress != null && d6Progress.CurrentQuestStep == 6;

        ExpeditionOutcomeType outcome;
        if (isDirective6Step6Active && rng.NextDouble() < 0.75)
        {
            outcome = ExpeditionOutcomeType.FindLifeform;
        }
        else
        {
            outcome = ExpeditionFormulas.ResolveOutcomeByPercentile(
                rollPercentile,
                depletionLevel,
                psionicNetworkReduction: 0.0,
                allowLifeformDiscovery: isDirective6Step6Active);
        }

        var survivingShips = new Dictionary<UnitType, int>(initialShips);
        var addedShips = new Dictionary<UnitType, int>();
        double addedMetal = 0.0;
        double addedCrystal = 0.0;
        double addedDeuterium = 0.0;
        int addedDarkMatter = 0;
        double returnDurationMultiplier = 1.0;
        string? discoveredLifeform = null;
        string narrativeText;

        double totalCapacity = FleetNavigationFormulas.CalculateTotalCargoCapacity(initialShips);
        double availableCapacity = Math.Max(0.0, totalCapacity - (mission.MetalCargo + mission.CrystalCargo + mission.DeuteriumCargo));

        var user = await dbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == mission.UserId, cancellationToken);
        double classYieldMultiplier = user?.PlayerClass == PlayerClass.Discoverer
            ? PlayerClassFormulas.DiscovererExpeditionYieldMultiplier
            : 1.0;

        var userResearches = await dbContext.UserResearches
            .AsNoTracking()
            .Where(r => r.UserId == mission.UserId)
            .ToListAsync(cancellationToken);

        var playerTech = new CombatTechLevels(
            WeaponsLevel: userResearches.FirstOrDefault(r => r.ResearchType == ResearchType.WeaponsTechnology)?.Level ?? 0,
            ShieldingLevel: userResearches.FirstOrDefault(r => r.ResearchType == ResearchType.ShieldingTechnology)?.Level ?? 0,
            ArmourLevel: userResearches.FirstOrDefault(r => r.ResearchType == ResearchType.ArmourTechnology)?.Level ?? 0);

        switch (outcome)
        {
            case ExpeditionOutcomeType.FindResources:
            {
                int resourceChoice = rng.Next(3);
                var (resMetal, resCrystal, resDeut) = ExpeditionFormulas.CalculateFoundResources(
                    resourceChoice,
                    0.10 + rng.NextDouble() * 0.90,
                    baseCap,
                    universeAgeMultiplier,
                    classYieldMultiplier,
                    pathfinderMultiplier);

                double totalFound = resMetal + resCrystal + resDeut;
                if (totalFound > availableCapacity && totalFound > 0)
                {
                    double ratio = availableCapacity / totalFound;
                    resMetal = Math.Floor(resMetal * ratio);
                    resCrystal = Math.Floor(resCrystal * ratio);
                    resDeut = Math.Floor(resDeut * ratio);
                }

                addedMetal = resMetal;
                addedCrystal = resCrystal;
                addedDeuterium = resDeut;

                if (addedMetal > 0)
                {
                    narrativeText = $"Keşif filonuz mineral zengini bir asteroit kuşağı keşfetti ve {addedMetal:N0} Metal çıkardı.";
                }
                else if (addedCrystal > 0)
                {
                    narrativeText = $"Keşif filonuz devasa bir kristal kuyruklu yıldız buldu ve {addedCrystal:N0} Kristal topladı.";
                }
                else
                {
                    narrativeText = $"Keşif filonuz yoğun bir gaz devinden {addedDeuterium:N0} Deuterium rafine etti.";
                }
                break;
            }

            case ExpeditionOutcomeType.FindShips:
            {
                UnitType[] discoverableTypes =
                [
                    UnitType.LightFighter,
                    UnitType.HeavyFighter,
                    UnitType.Cruiser,
                    UnitType.Battleship,
                    UnitType.SmallCargo,
                    UnitType.LargeCargo,
                    UnitType.EspionageProbe,
                    UnitType.Pathfinder
                ];

                var chosenType = discoverableTypes[rng.Next(discoverableTypes.Length)];
                var stats = CombatCatalog.GetStats(chosenType);
                double shipCost = Math.Max(1000.0, stats.MetalCost + stats.CrystalCost);

                double shipPool = (baseCap * 0.50 * (0.10 + rng.NextDouble() * 0.90)) * classYieldMultiplier * pathfinderMultiplier;
                int count = Math.Max(1, (int)Math.Floor(shipPool / shipCost));

                addedShips[chosenType] = count;
                survivingShips[chosenType] = (survivingShips.TryGetValue(chosenType, out int existing) ? existing : 0) + count;
                narrativeText = $"Mürettebatınız terk edilmiş kadim bir uzay tersanesine rastladı ve {count}x {chosenType} gemisini onararak filoya kattı.";
                break;
            }

            case ExpeditionOutcomeType.FindDarkMatter:
            {
                addedDarkMatter = ExpeditionFormulas.CalculateFoundDarkMatter(rng.NextDouble(), 0.0, rng.NextDouble());
                narrativeText = $"Sensör dizilimleri egzotik karanlık madde cepleri tespit etti ve {addedDarkMatter:N0} Karanlık Madde toplandı!";
                break;
            }

            case ExpeditionOutcomeType.Pirates:
            case ExpeditionOutcomeType.CombatEncounter:
            {
                var (pirateFleet, pirateTech) = ExpeditionFormulas.GeneratePiratesOrAliensFleet(
                    initialShips,
                    isAlien: false,
                    playerTech,
                    rng.NextDouble());

                var combatResult = combatEngine.SimulateCombat(
                    new CombatFleetInput(initialShips, playerTech),
                    new CombatFleetInput(pirateFleet, pirateTech),
                    seed: rng.Next());

                survivingShips = new Dictionary<UnitType, int>(combatResult.AttackerRemainingUnits);
                narrativeText = $"Keşif filonuz uzay korsanları tarafından pusuya düşürüldü! Çatışma sonucu: {combatResult.Winner}.";
                break;
            }

            case ExpeditionOutcomeType.Aliens:
            {
                var (alienFleet, alienTech) = ExpeditionFormulas.GeneratePiratesOrAliensFleet(
                    initialShips,
                    isAlien: true,
                    playerTech,
                    rng.NextDouble());

                var combatResult = combatEngine.SimulateCombat(
                    new CombatFleetInput(initialShips, playerTech),
                    new CombatFleetInput(alienFleet, alienTech),
                    seed: rng.Next());

                survivingShips = new Dictionary<UnitType, int>(combatResult.AttackerRemainingUnits);
                narrativeText = $"Bilinmeyen yabancı bir uzaylı ırkı filonuza saldırdı! Çatışma sonucu: {combatResult.Winner}.";
                break;
            }

            case ExpeditionOutcomeType.Delay:
            {
                double roll = rng.NextDouble();
                returnDurationMultiplier = roll < 0.5 ? 2.0 : (roll < 0.85 ? 3.0 : 5.0);
                narrativeText = $"Yerçekimsel dalgalanmalar ve manyetik fırtınalar filonun rotasını şaşırttı. Dönüş süresi {returnDurationMultiplier:0} katına çıktı.";
                break;
            }

            case ExpeditionOutcomeType.EarlyReturn:
            {
                returnDurationMultiplier = 0.5;
                narrativeText = "Lehte bir alt-uzay akıntısı keşif filosunun motorlarına ivme kazandırdı. Dönüş süresi yarıya indi.";
                break;
            }

            case ExpeditionOutcomeType.NavigationAnomaly:
            {
                bool early = rng.Next(2) == 0;
                returnDurationMultiplier = early ? 0.5 : 2.0;
                narrativeText = early
                    ? "Lehte bir alt-uzay akıntısı keşif filosunun motorlarına ivme kazandırdı. Dönüş süresi yarıya indi."
                    : "Gravitasyonel girdaplar filonun navigasyon bilgisayarlarını kilitledi. Dönüş süresi iki katına çıktı.";
                break;
            }

            case ExpeditionOutcomeType.FindMerchant:
            {
                narrativeText = "Keşif filonuz derin uzayda mahsur kalmış bir Tüccar Birliği kargo gemisiyle karşılaştı. Tüccar minnettarlık nişanesi olarak gezegeninize ücretsiz hammadde takas hizmeti sundu.";
                break;
            }

            case ExpeditionOutcomeType.TotalBlackHoleLoss:
            {
                survivingShips.Clear();
                narrativeText = "KRİTİK HATA: Sonsuz Uzaklar sektöründe aniden çöken bir mikro-tekillik (Kara Delik) tüm keşif filosunu yuttu.";
                break;
            }

            case ExpeditionOutcomeType.FindLifeform:
            {
                string[] speciesList = ["Roktal", "Mecha", "Kaelesh"];
                var species = speciesList[rng.Next(speciesList.Length)];
                discoveredLifeform = species;
                narrativeText = $"Keşif filonuz derin uzay taramalarında kadim ve gelişmiş bir yabancı ırk olan {species} medeniyeti ile ilk teması sağladı! Yeni bir canlı türü keşfedildi.";
                break;
            }

            case ExpeditionOutcomeType.NothingHappens:
            default:
            {
                narrativeText = "Filo sektördeki bir nebulanın fotoğraflarını çekti ancak maddi değeri olan hiçbir bulguya rastlanmadı.";
                break;
            }
        }

        // 4. Espionage Probe Telemetry Attachment
        if (hasProbe)
        {
            narrativeText += $" [Sonda Raporu]: {depletionMsg} (Sistemdeki keşif yükü: {effDepletion}).";
        }

        // Check Directive 6 Quest 6 progress: Bir canlı türü bul
        if (outcome == ExpeditionOutcomeType.FindLifeform || !string.IsNullOrEmpty(discoveredLifeform))
        {
            if (d6Progress != null && d6Progress.CurrentQuestStep == 6)
            {
                d6Progress.SubStepBitmask = DirectiveLifeformsFormulas.ProcessEvent(6, d6Progress.SubStepBitmask, "lifeform_species_discovered");
                d6Progress.UpdatedAtUtc = DateTime.UtcNow;
                await dbContext.SaveChangesAsync(cancellationToken);

                await notificationService.SendToUserAsync(
                    mission.UserId,
                    "TutorialProgressUpdated",
                    new
                    {
                        UserId = mission.UserId,
                        d6Progress.DirectiveId,
                        d6Progress.CurrentQuestStep,
                        d6Progress.SubStepBitmask
                    },
                    cancellationToken);
            }
        }

        var lootPayload = new
        {
            Outcome = outcome.ToString(),
            Metal = addedMetal,
            Crystal = addedCrystal,
            Deuterium = addedDeuterium,
            DarkMatter = addedDarkMatter,
            DiscoveredShips = addedShips,
            SurvivingShips = survivingShips,
            DiscoveredLifeform = discoveredLifeform,
            ReturnDurationMultiplier = returnDurationMultiplier
        };

        var report = new ExpeditionReport
        {
            Id = Guid.NewGuid(),
            UserId = mission.UserId,
            FleetMissionId = mission.Id,
            Coordinates = $"[{mission.TargetGalaxy}:{mission.TargetSystem}:{mission.TargetSlot}]",
            OutcomeType = outcome,
            NarrativeText = narrativeText,
            LootJson = JsonSerializer.Serialize(lootPayload),
            CreatedAtUtc = DateTime.UtcNow
        };

        dbContext.ExpeditionReports.Add(report);

        await notificationService.SendToUserAsync(
            mission.UserId,
            "ExpeditionReportReceived",
            new
            {
                report.Id,
                report.Coordinates,
                Outcome = outcome.ToString(),
                report.NarrativeText,
                DiscoveredLifeform = discoveredLifeform,
                report.CreatedAtUtc
            },
            cancellationToken);

        return new ExpeditionResolutionResult(
            OutcomeType: outcome,
            NarrativeText: narrativeText,
            AddedMetal: addedMetal,
            AddedCrystal: addedCrystal,
            AddedDeuterium: addedDeuterium,
            AddedDarkMatter: addedDarkMatter,
            AddedShips: addedShips,
            SurvivingShips: survivingShips,
            ReturnDurationMultiplier: returnDurationMultiplier,
            Report: report,
            DiscoveredLifeform: discoveredLifeform);
    }
}

