using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using OGame.Api.Hubs;
using OGame.Application.Common.Interfaces;
using OGame.Application.Interfaces;
using OGame.Domain.Entities;
using OGame.Domain.Services;

namespace OGame.Api.Endpoints;

public record ClaimTutorialRewardRequest(
    int DirectiveId,
    int QuestId,
    Guid? PlanetId = null,
    Guid? UserId = null);

public record ClaimFinalDirectiveRewardRequest(
    int DirectiveId,
    Guid? PlanetId = null,
    Guid? UserId = null);

public record PinTutorialQuestRequest(
    int? DirectiveId = null,
    int? QuestId = null,
    Guid? UserId = null);

public record DirectiveProgressEventRequest(
    string EventType,
    string? UnitId = null,
    Guid? PlanetId = null,
    Guid? UserId = null);

public static class TutorialEndpoints
{
    public static readonly System.Collections.Concurrent.ConcurrentDictionary<Guid, int?> PinnedQuestsStore = new();
    public static readonly System.Collections.Concurrent.ConcurrentDictionary<Guid, string?> PinnedQuestKeysStore = new();

    public static IEndpointRouteBuilder MapTutorialEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/tutorial")
            .WithTags("Tutorial");

        // ----------------------------------------------------
        // 1. GET /api/tutorial/current
        // ----------------------------------------------------
        group.MapGet("/current", async (
            int? directiveId,
            string? planetId,
            string? userId,
            bool? opened,
            IApplicationDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            Guid? parsedUserId = Guid.TryParse(userId, out var uid) ? uid : null;
            Guid? parsedPlanetId = Guid.TryParse(planetId, out var pid) ? pid : null;

            var user = parsedUserId.HasValue
                ? await dbContext.Users
                    .Include(u => u.Researches)
                    .FirstOrDefaultAsync(u => u.Id == parsedUserId.Value, cancellationToken)
                : await dbContext.Users
                    .Include(u => u.Researches)
                    .OrderBy(u => u.CreatedAtUtc)
                    .FirstOrDefaultAsync(cancellationToken);

            if (user is null)
            {
                return Results.NotFound(new { Message = "Kullanıcı bulunamadı." });
            }

            Planet? planet = null;
            if (parsedPlanetId.HasValue && parsedPlanetId.Value != Guid.Empty)
            {
                planet = await dbContext.Planets
                    .Include(p => p.Buildings)
                    .Include(p => p.Units)
                    .FirstOrDefaultAsync(p => p.Id == parsedPlanetId.Value, cancellationToken);
            }
            if (planet is null)
            {
                planet = await dbContext.Planets
                    .Include(p => p.Buildings)
                    .Include(p => p.Units)
                    .FirstOrDefaultAsync(p => p.UserId == user.Id && p.IsCapital, cancellationToken)
                    ?? await dbContext.Planets
                        .Include(p => p.Buildings)
                        .Include(p => p.Units)
                        .FirstOrDefaultAsync(p => p.UserId == user.Id, cancellationToken);
            }
            if (planet != null)
            {
                planet.User ??= user;
            }

            // Check Directive progress to know active default directive
            var progressD1 = await dbContext.UserTutorialProgresses
                .FirstOrDefaultAsync(p => p.UserId == user.Id && p.DirectiveId == 1, cancellationToken);
            var progressD2 = await dbContext.UserTutorialProgresses
                .FirstOrDefaultAsync(p => p.UserId == user.Id && p.DirectiveId == 2, cancellationToken);
            var progressD3 = await dbContext.UserTutorialProgresses
                .FirstOrDefaultAsync(p => p.UserId == user.Id && p.DirectiveId == 3, cancellationToken);
            var progressD4 = await dbContext.UserTutorialProgresses
                .FirstOrDefaultAsync(p => p.UserId == user.Id && p.DirectiveId == 4, cancellationToken);
            var progressD5 = await dbContext.UserTutorialProgresses
                .FirstOrDefaultAsync(p => p.UserId == user.Id && p.DirectiveId == 5, cancellationToken);
            var progressD6 = await dbContext.UserTutorialProgresses
                .FirstOrDefaultAsync(p => p.UserId == user.Id && p.DirectiveId == 6, cancellationToken);
            var progressD7 = await dbContext.UserTutorialProgresses
                .FirstOrDefaultAsync(p => p.UserId == user.Id && p.DirectiveId == 7, cancellationToken);

            int targetDirectiveId;
            if (directiveId.HasValue)
            {
                targetDirectiveId = directiveId.Value;
            }
            else
            {
                // Task 05BH: Priority 1 - If user explicitly pinned a quest, target that quest's directive!
                if (PinnedQuestKeysStore.TryGetValue(user.Id, out var activePinnedKey) && !string.IsNullOrEmpty(activePinnedKey))
                {
                    var parts = activePinnedKey.Split('_');
                    if (parts.Length == 2 && parts[0].StartsWith("d", StringComparison.OrdinalIgnoreCase) && int.TryParse(parts[0][1..], out var pDir))
                    {
                        bool isPinnedDirectiveDone = pDir switch
                        {
                            1 => progressD1?.CompletedAtUtc.HasValue == true && (progressD1.IsRewardClaimed || progressD1.IsDirectiveRewardClaimed),
                            2 => progressD2?.CompletedAtUtc.HasValue == true && (progressD2.IsRewardClaimed || progressD2.IsDirectiveRewardClaimed),
                            3 => progressD3?.CompletedAtUtc.HasValue == true && (progressD3.IsRewardClaimed || progressD3.IsDirectiveRewardClaimed),
                            4 => progressD4?.CompletedAtUtc.HasValue == true && (progressD4.IsRewardClaimed || progressD4.IsDirectiveRewardClaimed),
                            5 => progressD5?.CompletedAtUtc.HasValue == true && (progressD5.IsRewardClaimed || progressD5.IsDirectiveRewardClaimed),
                            6 => progressD6?.CompletedAtUtc.HasValue == true && (progressD6.IsRewardClaimed || progressD6.IsDirectiveRewardClaimed),
                            _ => false
                        };

                        if (!isPinnedDirectiveDone)
                        {
                            targetDirectiveId = pDir;
                            goto DirectiveResolved;
                        }
                    }
                }

                // Task 05BH: Priority 2 - Check highest directive user has actively started or made progress on
                int highestStartedDirective = 1;
                if (progressD7 != null && progressD7.CurrentQuestStep >= 1) highestStartedDirective = 7;
                else if (progressD6 != null && progressD6.CurrentQuestStep >= 1) highestStartedDirective = 6;
                else if (progressD5 != null && progressD5.CurrentQuestStep >= 1) highestStartedDirective = 5;
                else if (progressD4 != null && progressD4.CurrentQuestStep >= 1) highestStartedDirective = 4;
                else if (progressD3 != null && progressD3.CurrentQuestStep >= 1) highestStartedDirective = 3;
                else if (progressD2 != null && progressD2.CurrentQuestStep >= 1) highestStartedDirective = 2;

                if (highestStartedDirective > 1)
                {
                    targetDirectiveId = highestStartedDirective;
                }
                else
                {
                    bool d1Done = progressD1 != null && progressD1.CompletedAtUtc.HasValue && (progressD1.IsRewardClaimed || progressD1.IsDirectiveRewardClaimed);
                    bool d2Done = progressD2 != null && progressD2.CompletedAtUtc.HasValue && (progressD2.IsRewardClaimed || progressD2.IsDirectiveRewardClaimed);
                    bool d3Done = progressD3 != null && progressD3.CompletedAtUtc.HasValue && (progressD3.IsRewardClaimed || progressD3.IsDirectiveRewardClaimed);
                    bool d4Done = progressD4 != null && progressD4.CompletedAtUtc.HasValue && (progressD4.IsRewardClaimed || progressD4.IsDirectiveRewardClaimed);
                    bool d5Done = progressD5 != null && progressD5.CompletedAtUtc.HasValue && (progressD5.IsRewardClaimed || progressD5.IsDirectiveRewardClaimed);
                    bool d6Done = progressD6 != null && progressD6.CompletedAtUtc.HasValue && (progressD6.IsRewardClaimed || progressD6.IsDirectiveRewardClaimed);
                    if (!d1Done) targetDirectiveId = 1;
                    else if (!d2Done) targetDirectiveId = 2;
                    else if (!d3Done) targetDirectiveId = 3;
                    else if (!d4Done) targetDirectiveId = 4;
                    else if (!d5Done) targetDirectiveId = 5;
                    else if (!d6Done) targetDirectiveId = 6;
                    else targetDirectiveId = 7;
                }
            }
        DirectiveResolved:

            var progress = targetDirectiveId switch
            {
                1 => progressD1,
                2 => progressD2,
                3 => progressD3,
                4 => progressD4,
                5 => progressD5,
                6 => progressD6,
                7 => progressD7,
                _ => await dbContext.UserTutorialProgresses
                    .FirstOrDefaultAsync(p => p.UserId == user.Id && p.DirectiveId == targetDirectiveId, cancellationToken)
            };

            if (progress is null)
            {
                progress = new UserTutorialProgress
                {
                    Id = Guid.NewGuid(),
                    UserId = user.Id,
                    DirectiveId = targetDirectiveId,
                    CurrentQuestStep = 1,
                    SubStepBitmask = 0,
                    IsRewardClaimed = false,
                    IsDirectiveRewardClaimed = false,
                    CreatedAtUtc = DateTime.UtcNow,
                    UpdatedAtUtc = DateTime.UtcNow
                };
                dbContext.UserTutorialProgresses.Add(progress);
                await dbContext.SaveChangesAsync(cancellationToken);

                if (targetDirectiveId == 1) progressD1 = progress;
                else if (targetDirectiveId == 2) progressD2 = progress;
                else if (targetDirectiveId == 3) progressD3 = progress;
                else if (targetDirectiveId == 4) progressD4 = progress;
                else if (targetDirectiveId == 5) progressD5 = progress;
                else if (targetDirectiveId == 6) progressD6 = progress;
                else if (targetDirectiveId == 7) progressD7 = progress;
            }

            int metalPercentage = 100;
            if (planet != null && PlanetEndpoints.PlanetSettingsStore.TryGetValue(planet.Id, out var settings))
            {
                metalPercentage = settings.MetalMinePercent;
            }

            bool openedTutorial = opened == true;

            DirectiveEvaluationResult activeEval;
            int maxQuestsCount;
            DirectiveRewardDef finalReward;
            string directiveTitle;
            string guideIntro;

            if (targetDirectiveId == 7)
            {
                directiveTitle = DirectiveMoreTipsFormulas.DirectiveTitle;
                guideIntro = DirectiveMoreTipsFormulas.GuideIntroLore;
                finalReward = DirectiveMoreTipsFormulas.FinalDirectiveReward;
                maxQuestsCount = 4;

                activeEval = DirectiveMoreTipsFormulas.EvaluateQuest(
                    progress.CurrentQuestStep,
                    planet,
                    user,
                    progress.SubStepBitmask
                );
            }
            else if (targetDirectiveId == 6)
            {
                directiveTitle = DirectiveLifeformsFormulas.DirectiveTitle;
                guideIntro = DirectiveLifeformsFormulas.GuideIntroLore;
                finalReward = DirectiveLifeformsFormulas.FinalDirectiveReward;
                maxQuestsCount = 13;

                var maxLfBuildings = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
                var maxLfTechs = new Dictionary<int, int>();
                bool hasColonyWithLifeform = false;

                if (planet is not null)
                {
                    var pState = PlanetEndpoints.PlanetLifeformsStore.GetOrAdd(planet.Id, _ => PlanetEndpoints.CreatePlanetLifeformState(planet));
                    PlanetEndpoints.EvaluateLifeformQueueCompletion(pState, DateTime.UtcNow);
                    foreach (var (k, v) in pState.BuildingLevels) maxLfBuildings[k] = Math.Max(maxLfBuildings.GetValueOrDefault(k, 0), v);
                    foreach (var (k, v) in pState.TechLevels) maxLfTechs[k] = Math.Max(maxLfTechs.GetValueOrDefault(k, 0), v);
                    if (!planet.IsCapital && pState.IsActive && !string.IsNullOrWhiteSpace(pState.ActiveSpecies) && !pState.ActiveSpecies.Equals("none", StringComparison.OrdinalIgnoreCase) && !pState.ActiveSpecies.Equals("durduruldu", StringComparison.OrdinalIgnoreCase))
                    {
                        hasColonyWithLifeform = true;
                    }
                }

                if (user?.Planets != null)
                {
                    foreach (var p in user.Planets)
                    {
                        if (PlanetEndpoints.PlanetLifeformsStore.TryGetValue(p.Id, out var state))
                        {
                            PlanetEndpoints.EvaluateLifeformQueueCompletion(state, DateTime.UtcNow);
                            foreach (var (k, v) in state.BuildingLevels) maxLfBuildings[k] = Math.Max(maxLfBuildings.GetValueOrDefault(k, 0), v);
                            foreach (var (k, v) in state.TechLevels) maxLfTechs[k] = Math.Max(maxLfTechs.GetValueOrDefault(k, 0), v);
                            if (!p.IsCapital && state.IsActive && !string.IsNullOrWhiteSpace(state.ActiveSpecies) && !state.ActiveSpecies.Equals("none", StringComparison.OrdinalIgnoreCase) && !state.ActiveSpecies.Equals("durduruldu", StringComparison.OrdinalIgnoreCase))
                            {
                                hasColonyWithLifeform = true;
                            }
                        }
                    }
                }

                activeEval = DirectiveLifeformsFormulas.EvaluateQuest(
                    progress.CurrentQuestStep,
                    planet,
                    user,
                    progress.SubStepBitmask,
                    maxLfBuildings,
                    maxLfTechs,
                    hasColonyWithLifeform
                );
            }
            else if (targetDirectiveId == 5)
            {
                directiveTitle = DirectiveSecureBordersFormulas.DirectiveTitle;
                guideIntro = DirectiveSecureBordersFormulas.GuideIntroLore;
                finalReward = DirectiveSecureBordersFormulas.FinalDirectiveReward;
                maxQuestsCount = 11;

                activeEval = DirectiveSecureBordersFormulas.EvaluateQuest(
                    progress.CurrentQuestStep,
                    planet,
                    user,
                    progress.SubStepBitmask
                );
            }
            else if (targetDirectiveId == 4)
            {
                var allPlanets = await dbContext.Planets
                    .Include(p => p.Buildings)
                    .Include(p => p.Units)
                    .Where(p => p.UserId == user.Id)
                    .ToListAsync(cancellationToken);

                directiveTitle = DirectiveDeepSpaceFormulas.DirectiveTitle;
                guideIntro = DirectiveDeepSpaceFormulas.GuideIntroLore;
                finalReward = DirectiveDeepSpaceFormulas.FinalDirectiveReward;
                maxQuestsCount = 10;

                activeEval = DirectiveDeepSpaceFormulas.EvaluateQuest(
                    progress.CurrentQuestStep,
                    planet,
                    user,
                    progress.SubStepBitmask,
                    allPlanets
                );
            }
            else if (targetDirectiveId == 3)
            {
                directiveTitle = DirectiveKnowledgePowerFormulas.DirectiveTitle;
                guideIntro = DirectiveKnowledgePowerFormulas.GuideIntroLore;
                finalReward = DirectiveKnowledgePowerFormulas.FinalDirectiveReward;
                maxQuestsCount = 9;

                activeEval = DirectiveKnowledgePowerFormulas.EvaluateQuest(
                    progress.CurrentQuestStep,
                    planet,
                    user,
                    progress.SubStepBitmask
                );
            }
            else if (targetDirectiveId == 2)
            {
                directiveTitle = DirectiveFirstShipFormulas.DirectiveTitle;
                guideIntro = DirectiveFirstShipFormulas.GuideIntroLore;
                finalReward = DirectiveFirstShipFormulas.FinalDirectiveReward;
                maxQuestsCount = 10;

                activeEval = DirectiveFirstShipFormulas.EvaluateQuest(
                    progress.CurrentQuestStep,
                    planet,
                    user,
                    progress.SubStepBitmask
                );
            }
            else
            {
                directiveTitle = DirectiveEconomyFormulas.DirectiveTitle;
                guideIntro = DirectiveEconomyFormulas.GuideIntroLore;
                finalReward = DirectiveEconomyFormulas.FinalDirectiveReward;
                maxQuestsCount = 13;

                activeEval = DirectiveEconomyFormulas.EvaluateQuest(
                    progress.CurrentQuestStep,
                    planet,
                    metalPercentage,
                    progress.SubStepBitmask,
                    openedTutorial
                );
            }

            // If bitmask or completion state updated, persist it
            if (activeEval.ComputedBitmask != progress.SubStepBitmask)
            {
                progress.SubStepBitmask = activeEval.ComputedBitmask;
                progress.UpdatedAtUtc = DateTime.UtcNow;
                await dbContext.SaveChangesAsync(cancellationToken);
            }

            bool isAllQuestsFinished = progress.CurrentQuestStep == maxQuestsCount && progress.IsRewardClaimed;

            string nextSummary = targetDirectiveId switch
            {
                7 => DirectiveMoreTipsFormulas.GetNextDirectiveSummary(progress.CurrentQuestStep, isAllQuestsFinished, activeEval),
                6 => DirectiveLifeformsFormulas.GetNextDirectiveSummary(progress.CurrentQuestStep, isAllQuestsFinished, activeEval),
                5 => DirectiveSecureBordersFormulas.GetNextDirectiveSummary(progress.CurrentQuestStep, isAllQuestsFinished, activeEval),
                4 => DirectiveDeepSpaceFormulas.GetNextDirectiveSummary(progress.CurrentQuestStep, isAllQuestsFinished, activeEval),
                3 => DirectiveKnowledgePowerFormulas.GetNextDirectiveSummary(progress.CurrentQuestStep, isAllQuestsFinished, activeEval),
                2 => DirectiveFirstShipFormulas.GetNextDirectiveSummary(progress.CurrentQuestStep, isAllQuestsFinished, activeEval),
                _ => DirectiveEconomyFormulas.GetNextDirectiveSummary(progress.CurrentQuestStep, isAllQuestsFinished, activeEval)
            };

            var questsCatalog = targetDirectiveId switch
            {
                7 => DirectiveMoreTipsFormulas.GetAllQuests(),
                6 => DirectiveLifeformsFormulas.GetAllQuests(),
                5 => DirectiveSecureBordersFormulas.GetAllQuests(),
                4 => DirectiveDeepSpaceFormulas.GetAllQuests(),
                3 => DirectiveKnowledgePowerFormulas.GetAllQuests(),
                2 => DirectiveFirstShipFormulas.GetAllQuests(),
                _ => DirectiveEconomyFormulas.GetAllQuests()
            };

            string? currentPinnedQuestKey = null;
            int? currentPinnedQuestId = null;
            if (user != null && PinnedQuestKeysStore.TryGetValue(user.Id, out var pKey) && !string.IsNullOrEmpty(pKey))
            {
                var parts = pKey.Split('_');
                int? pinnedDirectiveNum = null;
                if (parts.Length == 2 && parts[0].StartsWith("d", StringComparison.OrdinalIgnoreCase) && int.TryParse(parts[0][1..], out var pDir))
                {
                    pinnedDirectiveNum = pDir;
                }

                bool isPinnedDirectiveCompleted = pinnedDirectiveNum switch
                {
                    1 => progressD1?.CompletedAtUtc.HasValue == true && (progressD1.IsRewardClaimed || progressD1.IsDirectiveRewardClaimed),
                    2 => progressD2?.CompletedAtUtc.HasValue == true && (progressD2.IsRewardClaimed || progressD2.IsDirectiveRewardClaimed),
                    3 => progressD3?.CompletedAtUtc.HasValue == true && (progressD3.IsRewardClaimed || progressD3.IsDirectiveRewardClaimed),
                    4 => progressD4?.CompletedAtUtc.HasValue == true && (progressD4.IsRewardClaimed || progressD4.IsDirectiveRewardClaimed),
                    5 => progressD5?.CompletedAtUtc.HasValue == true && (progressD5.IsRewardClaimed || progressD5.IsDirectiveRewardClaimed),
                    6 => progressD6?.CompletedAtUtc.HasValue == true && (progressD6.IsRewardClaimed || progressD6.IsDirectiveRewardClaimed),
                    _ => false
                };

                if (isPinnedDirectiveCompleted)
                {
                    PinnedQuestKeysStore.TryRemove(user.Id, out _);
                    PinnedQuestsStore.TryRemove(user.Id, out _);
                    pKey = null;
                }
                else if (parts.Length == 2 && parts[0] == $"d{targetDirectiveId}" && int.TryParse(parts[1].TrimStart('s'), out var stepId))
                {
                    currentPinnedQuestKey = pKey;
                    currentPinnedQuestId = stepId;
                    var pinnedQuestDef = questsCatalog.FirstOrDefault(q => q.QuestId == currentPinnedQuestId.Value);
                    if (pinnedQuestDef != null)
                    {
                        nextSummary = $"[Sabitlendi] #{pinnedQuestDef.QuestId} {pinnedQuestDef.Title}: {pinnedQuestDef.Goals.FirstOrDefault() ?? pinnedQuestDef.Title}";
                    }
                }
            }
            else if (user != null && PinnedQuestsStore.TryGetValue(user.Id, out var pinned) && pinned.HasValue && targetDirectiveId == 1 && !(progressD1?.CompletedAtUtc.HasValue == true))
            {
                currentPinnedQuestId = pinned.Value;
                currentPinnedQuestKey = $"d1_s{pinned.Value}";
                var pinnedQuestDef = questsCatalog.FirstOrDefault(q => q.QuestId == currentPinnedQuestId.Value);
                if (pinnedQuestDef != null)
                {
                    nextSummary = $"[Sabitlendi] #{pinnedQuestDef.QuestId} {pinnedQuestDef.Title}: {pinnedQuestDef.Goals.FirstOrDefault() ?? pinnedQuestDef.Title}";
                }
            }

            var allQuests = questsCatalog.Select(q =>
            {
                string status;
                bool isClaimed = false;
                int compCount = 0;
                int totalCount = q.Goals.Count;

                if (q.QuestId < progress.CurrentQuestStep)
                {
                    status = "Completed";
                    isClaimed = true;
                    compCount = totalCount;
                }
                else if (q.QuestId == progress.CurrentQuestStep)
                {
                    if (isAllQuestsFinished)
                    {
                        status = "Completed";
                        isClaimed = true;
                        compCount = totalCount;
                    }
                    else
                    {
                        status = "Active";
                        isClaimed = progress.IsRewardClaimed;
                        compCount = activeEval.CompletedCount;
                    }
                }
                else
                {
                    status = "Locked";
                    compCount = 0;
                }

                return new
                {
                    q.QuestId,
                    q.Title,
                    q.Description,
                    q.Hint,
                    q.Goals,
                    q.Reward,
                    Status = status,
                    IsClaimed = isClaimed,
                    CanClaim = status == "Active" && activeEval.IsFulfilled && !isClaimed,
                    ProgressText = $"{compCount} / {totalCount}",
                    CompletedCount = compCount,
                    TotalCount = totalCount
                };
            }).ToList();

            var availableDirectives = new[]
            {
                new
                {
                    DirectiveId = 1,
                    Title = DirectiveEconomyFormulas.DirectiveTitle,
                    TotalQuests = 13,
                    CurrentStep = progressD1?.CurrentQuestStep ?? 1,
                    IsCompleted = progressD1?.CompletedAtUtc.HasValue ?? false,
                    IsRewardClaimed = progressD1?.IsDirectiveRewardClaimed ?? false
                },
                new
                {
                    DirectiveId = 2,
                    Title = DirectiveFirstShipFormulas.DirectiveTitle,
                    TotalQuests = 10,
                    CurrentStep = progressD2?.CurrentQuestStep ?? 1,
                    IsCompleted = progressD2?.CompletedAtUtc.HasValue ?? false,
                    IsRewardClaimed = progressD2?.IsDirectiveRewardClaimed ?? false
                },
                new
                {
                    DirectiveId = 3,
                    Title = DirectiveKnowledgePowerFormulas.DirectiveTitle,
                    TotalQuests = 9,
                    CurrentStep = progressD3?.CurrentQuestStep ?? 1,
                    IsCompleted = progressD3?.CompletedAtUtc.HasValue ?? false,
                    IsRewardClaimed = progressD3?.IsDirectiveRewardClaimed ?? false
                },
                new
                {
                    DirectiveId = 4,
                    Title = DirectiveDeepSpaceFormulas.DirectiveTitle,
                    TotalQuests = 10,
                    CurrentStep = progressD4?.CurrentQuestStep ?? 1,
                    IsCompleted = progressD4?.CompletedAtUtc.HasValue ?? false,
                    IsRewardClaimed = progressD4?.IsDirectiveRewardClaimed ?? false
                },
                new
                {
                    DirectiveId = 5,
                    Title = DirectiveSecureBordersFormulas.DirectiveTitle,
                    TotalQuests = 11,
                    CurrentStep = progressD5?.CurrentQuestStep ?? 1,
                    IsCompleted = progressD5?.CompletedAtUtc.HasValue ?? false,
                    IsRewardClaimed = progressD5?.IsDirectiveRewardClaimed ?? false
                },
                new
                {
                    DirectiveId = 6,
                    Title = DirectiveLifeformsFormulas.DirectiveTitle,
                    TotalQuests = 13,
                    CurrentStep = progressD6?.CurrentQuestStep ?? 1,
                    IsCompleted = progressD6?.CompletedAtUtc.HasValue ?? false,
                    IsRewardClaimed = progressD6?.IsDirectiveRewardClaimed ?? false
                },
                new
                {
                    DirectiveId = 7,
                    Title = DirectiveMoreTipsFormulas.DirectiveTitle,
                    TotalQuests = 4,
                    CurrentStep = progressD7?.CurrentQuestStep ?? 1,
                    IsCompleted = progressD7?.CompletedAtUtc.HasValue ?? false,
                    IsRewardClaimed = progressD7?.IsDirectiveRewardClaimed ?? false
                }
            };

            return Results.Ok(new
            {
                DirectiveId = targetDirectiveId,
                Title = directiveTitle,
                Guide = new
                {
                    Name = targetDirectiveId switch
                    {
                        7 => DirectiveMoreTipsFormulas.GuideCharacterName,
                        6 => DirectiveLifeformsFormulas.GuideCharacterName,
                        5 => DirectiveSecureBordersFormulas.GuideCharacterName,
                        _ => DirectiveEconomyFormulas.GuideCharacterName
                    },
                    Role = targetDirectiveId switch
                    {
                        7 => DirectiveMoreTipsFormulas.GuideCharacterRole,
                        6 => DirectiveLifeformsFormulas.GuideCharacterRole,
                        5 => DirectiveSecureBordersFormulas.GuideCharacterRole,
                        _ => DirectiveEconomyFormulas.GuideCharacterRole
                    },
                    IntroLore = guideIntro
                },
                CurrentQuestStep = progress.CurrentQuestStep,
                SubStepBitmask = progress.SubStepBitmask,
                IsDirectiveCompleted = isAllQuestsFinished,
                IsDirectiveRewardClaimed = progress.IsDirectiveRewardClaimed,
                CanClaimDirectiveReward = isAllQuestsFinished && !progress.IsDirectiveRewardClaimed,
                FinalReward = finalReward,
                NextDirectiveSummary = nextSummary,
                PinnedQuestId = currentPinnedQuestId,
                PinnedQuestKey = currentPinnedQuestKey,
                ActiveQuest = new
                {
                    activeEval.QuestId,
                    activeEval.Title,
                    activeEval.Description,
                    activeEval.Hint,
                    activeEval.Steps,
                    activeEval.Reward,
                    activeEval.CompletedCount,
                    activeEval.TotalCount,
                    activeEval.IsFulfilled,
                    CanClaim = activeEval.IsFulfilled && !progress.IsRewardClaimed
                },
                AllQuests = allQuests,
                AvailableDirectives = availableDirectives,
                PlanetId = planet?.Id,
                UserDarkMatter = user!.DarkMatter
            });
        })
        .WithName("GetCurrentTutorialProgress");

        // ----------------------------------------------------
        // 2. POST /api/tutorial/directive-2/progress (Event trigger)
        // ----------------------------------------------------
        group.MapPost("/directive-2/progress", async (
            DirectiveProgressEventRequest request,
            IApplicationDbContext dbContext,
            IHubContext<GameHub> hubContext,
            CancellationToken cancellationToken) =>
        {
            var user = request.UserId.HasValue
                ? await dbContext.Users.FirstOrDefaultAsync(u => u.Id == request.UserId.Value, cancellationToken)
                : await dbContext.Users.OrderBy(u => u.CreatedAtUtc).FirstOrDefaultAsync(cancellationToken);

            if (user is null)
            {
                return Results.NotFound(new { Message = "Kullanıcı bulunamadı." });
            }

            var progress = await dbContext.UserTutorialProgresses
                .FirstOrDefaultAsync(p => p.UserId == user.Id && p.DirectiveId == 2, cancellationToken);

            if (progress is null)
            {
                progress = new UserTutorialProgress
                {
                    Id = Guid.NewGuid(),
                    UserId = user.Id,
                    DirectiveId = 2,
                    CurrentQuestStep = 1,
                    SubStepBitmask = 0,
                    IsRewardClaimed = false,
                    IsDirectiveRewardClaimed = false,
                    CreatedAtUtc = DateTime.UtcNow,
                    UpdatedAtUtc = DateTime.UtcNow
                };
                dbContext.UserTutorialProgresses.Add(progress);
            }

            bool bitmaskChanged = false;

            if (request.EventType.Equals("tech_tree_viewed", StringComparison.OrdinalIgnoreCase))
            {
                if (progress.CurrentQuestStep == 1)
                {
                    progress.SubStepBitmask |= 1;
                    bitmaskChanged = true;
                }
            }
            else if (request.EventType.Equals("friend_request_sent", StringComparison.OrdinalIgnoreCase))
            {
                if (progress.CurrentQuestStep == 10)
                {
                    progress.SubStepBitmask |= 1;
                    bitmaskChanged = true;
                }
            }
            else if (request.EventType.Equals("planet_renamed", StringComparison.OrdinalIgnoreCase))
            {
                if (progress.CurrentQuestStep == 9)
                {
                    progress.SubStepBitmask |= 1;
                    bitmaskChanged = true;
                }
            }
            else if (request.EventType.Equals("alliance_joined", StringComparison.OrdinalIgnoreCase))
            {
                if (progress.CurrentQuestStep == 8)
                {
                    progress.SubStepBitmask |= 1;
                    bitmaskChanged = true;
                }
            }
            else if (request.EventType.Equals("ship_produced", StringComparison.OrdinalIgnoreCase))
            {
                if (progress.CurrentQuestStep == 7)
                {
                    progress.SubStepBitmask |= 1;
                    bitmaskChanged = true;
                }
            }

            if (bitmaskChanged)
            {
                progress.UpdatedAtUtc = DateTime.UtcNow;
                await dbContext.SaveChangesAsync(cancellationToken);

                await hubContext.Clients.User(user.Id.ToString()).SendAsync("TutorialProgressUpdated", new
                {
                    UserId = user.Id,
                    progress.DirectiveId,
                    progress.CurrentQuestStep,
                    progress.SubStepBitmask
                }, cancellationToken);
            }

            return Results.Ok(new
            {
                Success = true,
                EventType = request.EventType,
                CurrentQuestStep = progress.CurrentQuestStep,
                SubStepBitmask = progress.SubStepBitmask
            });
        })
        .WithName("RecordDirective2ProgressEvent");

        // ----------------------------------------------------
        // POST /api/tutorial/directive-3/progress (Event trigger)
        // ----------------------------------------------------
        group.MapPost("/directive-3/progress", async (
            DirectiveProgressEventRequest request,
            IApplicationDbContext dbContext,
            IHubContext<GameHub> hubContext,
            CancellationToken cancellationToken) =>
        {
            var user = request.UserId.HasValue
                ? await dbContext.Users.FirstOrDefaultAsync(u => u.Id == request.UserId.Value, cancellationToken)
                : await dbContext.Users.OrderBy(u => u.CreatedAtUtc).FirstOrDefaultAsync(cancellationToken);

            if (user is null)
            {
                return Results.NotFound(new { Message = "Kullanıcı bulunamadı." });
            }

            var progress = await dbContext.UserTutorialProgresses
                .FirstOrDefaultAsync(p => p.UserId == user.Id && p.DirectiveId == 3, cancellationToken);

            if (progress is null)
            {
                progress = new UserTutorialProgress
                {
                    Id = Guid.NewGuid(),
                    UserId = user.Id,
                    DirectiveId = 3,
                    CurrentQuestStep = 1,
                    SubStepBitmask = 0,
                    IsRewardClaimed = false,
                    IsDirectiveRewardClaimed = false,
                    CreatedAtUtc = DateTime.UtcNow,
                    UpdatedAtUtc = DateTime.UtcNow
                };
                dbContext.UserTutorialProgresses.Add(progress);
            }

            int newBitmask = DirectiveKnowledgePowerFormulas.ProcessEvent(
                progress.CurrentQuestStep,
                progress.SubStepBitmask,
                request.EventType);

            if (newBitmask != progress.SubStepBitmask)
            {
                progress.SubStepBitmask = newBitmask;
                progress.UpdatedAtUtc = DateTime.UtcNow;
                await dbContext.SaveChangesAsync(cancellationToken);

                await hubContext.Clients.User(user.Id.ToString()).SendAsync("TutorialProgressUpdated", new
                {
                    UserId = user.Id,
                    progress.DirectiveId,
                    progress.CurrentQuestStep,
                    progress.SubStepBitmask
                }, cancellationToken);
            }

            return Results.Ok(new
            {
                Success = true,
                EventType = request.EventType,
                CurrentQuestStep = progress.CurrentQuestStep,
                SubStepBitmask = progress.SubStepBitmask
            });
        })
        .WithName("RecordDirective3ProgressEvent");

        // ----------------------------------------------------
        // POST /api/tutorial/directive-4/pin-quest
        // ----------------------------------------------------
        group.MapPost("/directive-4/pin-quest", async (
            PinTutorialQuestRequest request,
            IApplicationDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var user = request.UserId.HasValue
                ? await dbContext.Users.FirstOrDefaultAsync(u => u.Id == request.UserId.Value, cancellationToken)
                : await dbContext.Users.OrderBy(u => u.CreatedAtUtc).FirstOrDefaultAsync(cancellationToken);

            if (user is null)
            {
                return Results.NotFound(new { Message = "Kullanıcı bulunamadı." });
            }

            string? key = request.QuestId.HasValue ? $"d4_s{request.QuestId.Value}" : null;
            PinnedQuestKeysStore[user.Id] = key;
            PinnedQuestsStore[user.Id] = request.QuestId;

            return Results.Ok(new
            {
                Success = true,
                PinnedQuestId = request.QuestId,
                PinnedQuestKey = key,
                Message = request.QuestId.HasValue
                    ? $"Görev #{request.QuestId} takip listesine sabitlendi."
                    : "Görev sabitlemesi kaldırıldı."
            });
        })
        .WithName("PinDirective4Quest");

        // ----------------------------------------------------
        // POST /api/tutorial/pin-quest
        // ----------------------------------------------------
        group.MapPost("/pin-quest", async (
            PinTutorialQuestRequest request,
            IApplicationDbContext dbContext,
            CancellationToken cancellationToken) =>
        {
            var user = request.UserId.HasValue
                ? await dbContext.Users.FirstOrDefaultAsync(u => u.Id == request.UserId.Value, cancellationToken)
                : await dbContext.Users.OrderBy(u => u.CreatedAtUtc).FirstOrDefaultAsync(cancellationToken);

            if (user is null)
            {
                return Results.NotFound(new { Message = "Kullanıcı bulunamadı." });
            }

            int directiveId = request.DirectiveId ?? 1;
            string? key = request.QuestId.HasValue ? $"d{directiveId}_s{request.QuestId.Value}" : null;
            PinnedQuestKeysStore[user.Id] = key;
            PinnedQuestsStore[user.Id] = request.QuestId;

            return Results.Ok(new
            {
                Success = true,
                PinnedQuestId = request.QuestId,
                PinnedQuestKey = key,
                Message = request.QuestId.HasValue
                    ? $"Görev #{request.QuestId} takip listesine sabitlendi."
                    : "Görev sabitlemesi kaldırıldı."
            });
        })
        .WithName("PinTutorialQuest");

        // ----------------------------------------------------
        // POST /api/tutorial/directive-4/progress (Event trigger)
        // ----------------------------------------------------
        group.MapPost("/directive-4/progress", async (
            DirectiveProgressEventRequest request,
            IApplicationDbContext dbContext,
            IHubContext<GameHub> hubContext,
            CancellationToken cancellationToken) =>
        {
            var user = request.UserId.HasValue
                ? await dbContext.Users.FirstOrDefaultAsync(u => u.Id == request.UserId.Value, cancellationToken)
                : await dbContext.Users.OrderBy(u => u.CreatedAtUtc).FirstOrDefaultAsync(cancellationToken);

            if (user is null)
            {
                return Results.NotFound(new { Message = "Kullanıcı bulunamadı." });
            }

            var progress = await dbContext.UserTutorialProgresses
                .FirstOrDefaultAsync(p => p.UserId == user.Id && p.DirectiveId == 4, cancellationToken);

            if (progress is null)
            {
                progress = new UserTutorialProgress
                {
                    Id = Guid.NewGuid(),
                    UserId = user.Id,
                    DirectiveId = 4,
                    CurrentQuestStep = 1,
                    SubStepBitmask = 0,
                    IsRewardClaimed = false,
                    IsDirectiveRewardClaimed = false,
                    CreatedAtUtc = DateTime.UtcNow,
                    UpdatedAtUtc = DateTime.UtcNow
                };
                dbContext.UserTutorialProgresses.Add(progress);
            }

            int newBitmask = DirectiveDeepSpaceFormulas.ProcessEvent(
                progress.CurrentQuestStep,
                progress.SubStepBitmask,
                request.EventType);

            if (newBitmask != progress.SubStepBitmask)
            {
                progress.SubStepBitmask = newBitmask;
                progress.UpdatedAtUtc = DateTime.UtcNow;
                await dbContext.SaveChangesAsync(cancellationToken);

                await hubContext.Clients.User(user.Id.ToString()).SendAsync("TutorialProgressUpdated", new
                {
                    UserId = user.Id,
                    progress.DirectiveId,
                    progress.CurrentQuestStep,
                    progress.SubStepBitmask
                }, cancellationToken);
            }

            return Results.Ok(new
            {
                Success = true,
                EventType = request.EventType,
                CurrentQuestStep = progress.CurrentQuestStep,
                SubStepBitmask = progress.SubStepBitmask
            });
        })
        .WithName("RecordDirective4ProgressEvent");

        // ----------------------------------------------------
        // POST /api/tutorial/directive-5/progress (Event trigger)
        // ----------------------------------------------------
        group.MapPost("/directive-5/progress", async (
            DirectiveProgressEventRequest request,
            IApplicationDbContext dbContext,
            IHubContext<GameHub> hubContext,
            CancellationToken cancellationToken) =>
        {
            var user = request.UserId.HasValue
                ? await dbContext.Users.FirstOrDefaultAsync(u => u.Id == request.UserId.Value, cancellationToken)
                : await dbContext.Users.OrderBy(u => u.CreatedAtUtc).FirstOrDefaultAsync(cancellationToken);

            if (user is null)
            {
                return Results.NotFound(new { Message = "Kullanıcı bulunamadı." });
            }

            var progress = await dbContext.UserTutorialProgresses
                .FirstOrDefaultAsync(p => p.UserId == user.Id && p.DirectiveId == 5, cancellationToken);

            if (progress is null)
            {
                progress = new UserTutorialProgress
                {
                    Id = Guid.NewGuid(),
                    UserId = user.Id,
                    DirectiveId = 5,
                    CurrentQuestStep = 1,
                    SubStepBitmask = 0,
                    IsRewardClaimed = false,
                    IsDirectiveRewardClaimed = false,
                    CreatedAtUtc = DateTime.UtcNow,
                    UpdatedAtUtc = DateTime.UtcNow
                };
                dbContext.UserTutorialProgresses.Add(progress);
            }

            int newBitmask = DirectiveSecureBordersFormulas.ProcessEvent(
                progress.CurrentQuestStep,
                progress.SubStepBitmask,
                request.EventType);

            if (newBitmask != progress.SubStepBitmask)
            {
                progress.SubStepBitmask = newBitmask;
                progress.UpdatedAtUtc = DateTime.UtcNow;
                await dbContext.SaveChangesAsync(cancellationToken);

                await hubContext.Clients.User(user.Id.ToString()).SendAsync("TutorialProgressUpdated", new
                {
                    UserId = user.Id,
                    progress.DirectiveId,
                    progress.CurrentQuestStep,
                    progress.SubStepBitmask
                }, cancellationToken);
            }

            return Results.Ok(new
            {
                Success = true,
                EventType = request.EventType,
                CurrentQuestStep = progress.CurrentQuestStep,
                SubStepBitmask = progress.SubStepBitmask
            });
        })
        .WithName("RecordDirective5ProgressEvent");

        // ----------------------------------------------------
        // POST /api/tutorial/directive-6/progress (Event trigger)
        // ----------------------------------------------------
        group.MapPost("/directive-6/progress", async (
            DirectiveProgressEventRequest request,
            IApplicationDbContext dbContext,
            IHubContext<GameHub> hubContext,
            CancellationToken cancellationToken) =>
        {
            var user = request.UserId.HasValue
                ? await dbContext.Users.FirstOrDefaultAsync(u => u.Id == request.UserId.Value, cancellationToken)
                : await dbContext.Users.OrderBy(u => u.CreatedAtUtc).FirstOrDefaultAsync(cancellationToken);

            if (user is null)
            {
                return Results.NotFound(new { Message = "Kullanıcı bulunamadı." });
            }

            var progress = await dbContext.UserTutorialProgresses
                .FirstOrDefaultAsync(p => p.UserId == user.Id && p.DirectiveId == 6, cancellationToken);

            if (progress is null)
            {
                progress = new UserTutorialProgress
                {
                    Id = Guid.NewGuid(),
                    UserId = user.Id,
                    DirectiveId = 6,
                    CurrentQuestStep = 1,
                    SubStepBitmask = 0,
                    IsRewardClaimed = false,
                    IsDirectiveRewardClaimed = false,
                    CreatedAtUtc = DateTime.UtcNow,
                    UpdatedAtUtc = DateTime.UtcNow
                };
                dbContext.UserTutorialProgresses.Add(progress);
            }

            int newBitmask = DirectiveLifeformsFormulas.ProcessEvent(
                progress.CurrentQuestStep,
                progress.SubStepBitmask,
                request.EventType);

            if (newBitmask != progress.SubStepBitmask)
            {
                progress.SubStepBitmask = newBitmask;
                progress.UpdatedAtUtc = DateTime.UtcNow;
                await dbContext.SaveChangesAsync(cancellationToken);

                await hubContext.Clients.User(user.Id.ToString()).SendAsync("TutorialProgressUpdated", new
                {
                    UserId = user.Id,
                    progress.DirectiveId,
                    progress.CurrentQuestStep,
                    progress.SubStepBitmask
                }, cancellationToken);
            }

            return Results.Ok(new
            {
                Success = true,
                EventType = request.EventType,
                CurrentQuestStep = progress.CurrentQuestStep,
                SubStepBitmask = progress.SubStepBitmask
            });
        })
        .WithName("RecordDirective6ProgressEvent");

        // ----------------------------------------------------
        // POST /api/tutorial/directive-7/progress (Event trigger)
        // ----------------------------------------------------
        group.MapPost("/directive-7/progress", async (
            DirectiveProgressEventRequest request,
            IApplicationDbContext dbContext,
            IHubContext<GameHub> hubContext,
            CancellationToken cancellationToken) =>
        {
            var user = request.UserId.HasValue
                ? await dbContext.Users.FirstOrDefaultAsync(u => u.Id == request.UserId.Value, cancellationToken)
                : await dbContext.Users.OrderBy(u => u.CreatedAtUtc).FirstOrDefaultAsync(cancellationToken);

            if (user is null)
            {
                return Results.NotFound(new { Message = "Kullanıcı bulunamadı." });
            }

            var progress = await dbContext.UserTutorialProgresses
                .FirstOrDefaultAsync(p => p.UserId == user.Id && p.DirectiveId == 7, cancellationToken);

            if (progress is null)
            {
                progress = new UserTutorialProgress
                {
                    Id = Guid.NewGuid(),
                    UserId = user.Id,
                    DirectiveId = 7,
                    CurrentQuestStep = 1,
                    SubStepBitmask = 0,
                    IsRewardClaimed = false,
                    IsDirectiveRewardClaimed = false,
                    CreatedAtUtc = DateTime.UtcNow,
                    UpdatedAtUtc = DateTime.UtcNow
                };
                dbContext.UserTutorialProgresses.Add(progress);
            }

            int newBitmask = DirectiveMoreTipsFormulas.ProcessEvent(
                progress.CurrentQuestStep,
                progress.SubStepBitmask,
                request.EventType);

            if (newBitmask != progress.SubStepBitmask)
            {
                progress.SubStepBitmask = newBitmask;
                progress.UpdatedAtUtc = DateTime.UtcNow;
                await dbContext.SaveChangesAsync(cancellationToken);

                await hubContext.Clients.User(user.Id.ToString()).SendAsync("TutorialProgressUpdated", new
                {
                    UserId = user.Id,
                    progress.DirectiveId,
                    progress.CurrentQuestStep,
                    progress.SubStepBitmask
                }, cancellationToken);
            }

            return Results.Ok(new
            {
                Success = true,
                EventType = request.EventType,
                CurrentQuestStep = progress.CurrentQuestStep,
                SubStepBitmask = progress.SubStepBitmask
            });
        })
        .WithName("RecordDirective7ProgressEvent");

        // ----------------------------------------------------
        // 3. POST /api/tutorial/claim-reward
        // ----------------------------------------------------
        group.MapPost("/claim-reward", async (
            ClaimTutorialRewardRequest request,
            IApplicationDbContext dbContext,
            IDistributedLockService lockService,
            IHubContext<GameHub> hubContext,
            CancellationToken cancellationToken) =>
        {
            var user = request.UserId.HasValue
                ? await dbContext.Users
                    .Include(u => u.Researches)
                    .FirstOrDefaultAsync(u => u.Id == request.UserId.Value, cancellationToken)
                : await dbContext.Users
                    .Include(u => u.Researches)
                    .OrderBy(u => u.CreatedAtUtc)
                    .FirstOrDefaultAsync(cancellationToken);

            if (user is null)
            {
                return Results.NotFound(new { Message = "Kullanıcı bulunamadı." });
            }

            Planet? planet = null;
            if (request.PlanetId.HasValue && request.PlanetId.Value != Guid.Empty)
            {
                planet = await dbContext.Planets
                    .Include(p => p.Buildings)
                    .Include(p => p.Units)
                    .FirstOrDefaultAsync(p => p.Id == request.PlanetId.Value, cancellationToken);
            }
            if (planet is null)
            {
                planet = await dbContext.Planets
                    .Include(p => p.Buildings)
                    .Include(p => p.Units)
                    .FirstOrDefaultAsync(p => p.UserId == user.Id && p.IsCapital, cancellationToken)
                    ?? await dbContext.Planets
                        .Include(p => p.Buildings)
                        .Include(p => p.Units)
                        .FirstOrDefaultAsync(p => p.UserId == user.Id, cancellationToken);
            }
            if (planet != null)
            {
                planet.User ??= user;
            }

            if (planet is null)
            {
                return Results.NotFound(new { Message = "Ödülün aktarılacağı hedef gezegen bulunamadı." });
            }

            string lockKey = $"lock:tutorial:{user.Id}";
            await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

            var progress = await dbContext.UserTutorialProgresses
                .FirstOrDefaultAsync(p => p.UserId == user.Id && p.DirectiveId == request.DirectiveId, cancellationToken);

            if (progress is null)
            {
                return Results.NotFound(new { Message = "Yönerge ilerleme kaydı bulunamadı." });
            }

            if (progress.CurrentQuestStep != request.QuestId)
            {
                return Results.BadRequest(new { Message = $"Talep edilen görev ({request.QuestId}) mevcut aktif görevle ({progress.CurrentQuestStep}) uyuşmuyor." });
            }

            int maxSteps = request.DirectiveId switch
            {
                7 => 4,
                6 => 13,
                5 => 11,
                4 => 10,
                3 => 9,
                2 => 10,
                _ => 13
            };

            if (progress.IsRewardClaimed && progress.CurrentQuestStep == maxSteps)
            {
                return Results.BadRequest(new { Message = "Bu görevin ödülü zaten alındı." });
            }

            DirectiveEvaluationResult eval;

            if (request.DirectiveId == 7)
            {
                eval = DirectiveMoreTipsFormulas.EvaluateQuest(
                    progress.CurrentQuestStep,
                    planet,
                    user,
                    progress.SubStepBitmask
                );
            }
            else if (request.DirectiveId == 6)
            {
                var maxLfBuildings = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
                var maxLfTechs = new Dictionary<int, int>();
                bool hasColonyWithLifeform = false;

                if (planet is not null)
                {
                    var pState = PlanetEndpoints.PlanetLifeformsStore.GetOrAdd(planet.Id, _ => PlanetEndpoints.CreatePlanetLifeformState(planet));
                    PlanetEndpoints.EvaluateLifeformQueueCompletion(pState, DateTime.UtcNow);
                    foreach (var (k, v) in pState.BuildingLevels) maxLfBuildings[k] = Math.Max(maxLfBuildings.GetValueOrDefault(k, 0), v);
                    foreach (var (k, v) in pState.TechLevels) maxLfTechs[k] = Math.Max(maxLfTechs.GetValueOrDefault(k, 0), v);
                    if (!planet.IsCapital && pState.IsActive && !string.IsNullOrWhiteSpace(pState.ActiveSpecies) && !pState.ActiveSpecies.Equals("none", StringComparison.OrdinalIgnoreCase) && !pState.ActiveSpecies.Equals("durduruldu", StringComparison.OrdinalIgnoreCase))
                    {
                        hasColonyWithLifeform = true;
                    }
                }

                if (user?.Planets != null)
                {
                    foreach (var p in user.Planets)
                    {
                        if (PlanetEndpoints.PlanetLifeformsStore.TryGetValue(p.Id, out var state))
                        {
                            PlanetEndpoints.EvaluateLifeformQueueCompletion(state, DateTime.UtcNow);
                            foreach (var (k, v) in state.BuildingLevels) maxLfBuildings[k] = Math.Max(maxLfBuildings.GetValueOrDefault(k, 0), v);
                            foreach (var (k, v) in state.TechLevels) maxLfTechs[k] = Math.Max(maxLfTechs.GetValueOrDefault(k, 0), v);
                            if (!p.IsCapital && state.IsActive && !string.IsNullOrWhiteSpace(state.ActiveSpecies) && !state.ActiveSpecies.Equals("none", StringComparison.OrdinalIgnoreCase) && !state.ActiveSpecies.Equals("durduruldu", StringComparison.OrdinalIgnoreCase))
                            {
                                hasColonyWithLifeform = true;
                            }
                        }
                    }
                }

                eval = DirectiveLifeformsFormulas.EvaluateQuest(
                    progress.CurrentQuestStep,
                    planet,
                    user,
                    progress.SubStepBitmask,
                    maxLfBuildings,
                    maxLfTechs,
                    hasColonyWithLifeform
                );
            }
            else if (request.DirectiveId == 5)
            {
                eval = DirectiveSecureBordersFormulas.EvaluateQuest(
                    progress.CurrentQuestStep,
                    planet,
                    user,
                    progress.SubStepBitmask
                );
            }
            else if (request.DirectiveId == 4)
            {
                var allPlanets = await dbContext.Planets
                    .Include(p => p.Buildings)
                    .Include(p => p.Units)
                    .Where(p => p.UserId == user.Id)
                    .ToListAsync(cancellationToken);

                eval = DirectiveDeepSpaceFormulas.EvaluateQuest(
                    progress.CurrentQuestStep,
                    planet,
                    user,
                    progress.SubStepBitmask,
                    allPlanets
                );
            }
            else if (request.DirectiveId == 3)
            {
                eval = DirectiveKnowledgePowerFormulas.EvaluateQuest(
                    progress.CurrentQuestStep,
                    planet,
                    user,
                    progress.SubStepBitmask
                );
            }
            else if (request.DirectiveId == 2)
            {
                eval = DirectiveFirstShipFormulas.EvaluateQuest(
                    progress.CurrentQuestStep,
                    planet,
                    user,
                    progress.SubStepBitmask
                );
            }
            else
            {
                int metalPercentage = 100;
                if (PlanetEndpoints.PlanetSettingsStore.TryGetValue(planet.Id, out var settings))
                {
                    metalPercentage = settings.MetalMinePercent;
                }

                eval = DirectiveEconomyFormulas.EvaluateQuest(
                    progress.CurrentQuestStep,
                    planet,
                    metalPercentage,
                    progress.SubStepBitmask,
                    openedTutorialPage: true
                );
            }

            if (!eval.IsFulfilled)
            {
                return Results.BadRequest(new { Message = "Görevin tüm koşulları henüz tamamlanmadı." });
            }

            var reward = eval.Reward;
            planet!.Metal += reward.Metal;
            planet.Crystal += reward.Crystal;
            planet.Deuterium += reward.Deuterium;
            user!.DarkMatter += reward.DarkMatter;

            // Directive 4 Quest 6 (New colony established) rewards 1x Silver Metal Booster to inventory
            if (request.DirectiveId == 4 && request.QuestId == 6)
            {
                var silverBooster = await dbContext.UserInventoryItems
                    .FirstOrDefaultAsync(i => i.UserId == user.Id && i.ItemKey == "booster_metal_silver", cancellationToken);
                if (silverBooster != null)
                {
                    silverBooster.Quantity += 1;
                }
                else
                {
                    dbContext.UserInventoryItems.Add(new UserInventoryItem
                    {
                        Id = Guid.NewGuid(),
                        UserId = user.Id,
                        ItemKey = "booster_metal_silver",
                        Name = "Gümüş Maden Güçlendirici",
                        Category = "resource",
                        Tier = "Silver",
                        EffectValue = 20,
                        Quantity = 1,
                        CreatedAtUtc = DateTime.UtcNow
                    });
                }
            }

            string questTitle = eval.Title;

            if (progress.CurrentQuestStep < maxSteps)
            {
                progress.CurrentQuestStep += 1;
                progress.SubStepBitmask = 0;
                progress.IsRewardClaimed = false;
                progress.UpdatedAtUtc = DateTime.UtcNow;
            }
            else
            {
                // Last step claimed
                progress.IsRewardClaimed = true;
                progress.CompletedAtUtc = DateTime.UtcNow;
                progress.UpdatedAtUtc = DateTime.UtcNow;

                // Task 05AX: Prune pinned quest if it belonged to this completed directive
                if (PinnedQuestKeysStore.TryGetValue(user.Id, out var pKey) && !string.IsNullOrEmpty(pKey))
                {
                    if (pKey.StartsWith($"d{progress.DirectiveId}_", StringComparison.OrdinalIgnoreCase))
                    {
                        PinnedQuestKeysStore.TryRemove(user.Id, out _);
                        PinnedQuestsStore.TryRemove(user.Id, out _);
                    }
                }
            }

            await dbContext.SaveChangesAsync(cancellationToken);

            // Real-time broadcasts
            await hubContext.Clients.User(user.Id.ToString()).SendAsync("TutorialProgressUpdated", new
            {
                UserId = user.Id,
                progress.DirectiveId,
                progress.CurrentQuestStep,
                progress.IsRewardClaimed,
                IsCompleted = progress.CompletedAtUtc.HasValue
            }, cancellationToken);

            await hubContext.Clients.User(user.Id.ToString()).SendAsync("PlanetResourcesUpdated", new
            {
                PlanetId = planet.Id,
                planet.Metal,
                planet.Crystal,
                planet.Deuterium,
                user.DarkMatter
            }, cancellationToken);

            return Results.Ok(new
            {
                Success = true,
                DirectiveId = request.DirectiveId,
                QuestId = request.QuestId,
                Title = questTitle,
                ClaimedReward = reward,
                NextQuestStep = progress.CurrentQuestStep,
                IsDirectiveCompleted = progress.CompletedAtUtc.HasValue,
                Message = $"'{questTitle}' tamamlandı! Ödülünüz ({reward.Metal:N0} Metal, {reward.Crystal:N0} Kristal, {reward.Deuterium:N0} Döteryum) deponuza aktarıldı."
            });
        })
        .WithName("ClaimTutorialReward");

        // ----------------------------------------------------
        // 4. POST /api/tutorial/claim-final-reward
        // ----------------------------------------------------
        group.MapPost("/claim-final-reward", async (
            ClaimFinalDirectiveRewardRequest request,
            IApplicationDbContext dbContext,
            IDistributedLockService lockService,
            IHubContext<GameHub> hubContext,
            CancellationToken cancellationToken) =>
        {
            var user = request.UserId.HasValue
                ? await dbContext.Users.FirstOrDefaultAsync(u => u.Id == request.UserId.Value, cancellationToken)
                : await dbContext.Users.OrderBy(u => u.CreatedAtUtc).FirstOrDefaultAsync(cancellationToken);

            if (user is null)
            {
                return Results.NotFound(new { Message = "Kullanıcı bulunamadı." });
            }

            Planet? planet = null;
            if (request.PlanetId.HasValue && request.PlanetId.Value != Guid.Empty)
            {
                planet = await dbContext.Planets
                    .Include(p => p.Buildings)
                    .FirstOrDefaultAsync(p => p.Id == request.PlanetId.Value, cancellationToken);
            }
            if (planet is null)
            {
                planet = await dbContext.Planets
                    .Include(p => p.Buildings)
                    .FirstOrDefaultAsync(p => p.UserId == user.Id && p.IsCapital, cancellationToken)
                    ?? await dbContext.Planets
                        .Include(p => p.Buildings)
                        .FirstOrDefaultAsync(p => p.UserId == user.Id, cancellationToken);
            }

            if (planet is null)
            {
                return Results.NotFound(new { Message = "Hedef gezegen bulunamadı." });
            }

            string lockKey = $"lock:tutorial:{user.Id}";
            await using var lockHandle = await lockService.AcquireLockAsync(lockKey, cancellationToken: cancellationToken);

            var progress = await dbContext.UserTutorialProgresses
                .FirstOrDefaultAsync(p => p.UserId == user.Id && p.DirectiveId == request.DirectiveId, cancellationToken);

            int totalQuests = request.DirectiveId switch
            {
                7 => 4,
                6 => 13,
                5 => 11,
                4 => 10,
                3 => 9,
                2 => 10,
                _ => 13
            };

            if (progress is null || !progress.CompletedAtUtc.HasValue || !progress.IsRewardClaimed)
            {
                return Results.BadRequest(new { Message = $"Yönergedeki {totalQuests} görevin tümü tamamlanmadan final tamamlama ödülü alınamaz." });
            }

            if (progress.IsDirectiveRewardClaimed)
            {
                return Results.BadRequest(new { Message = "Yönerge tamamlama ödülü daha önce zaten alındı." });
            }

            var finalReward = request.DirectiveId switch
            {
                7 => DirectiveMoreTipsFormulas.FinalDirectiveReward,
                6 => DirectiveLifeformsFormulas.FinalDirectiveReward,
                5 => DirectiveSecureBordersFormulas.FinalDirectiveReward,
                4 => DirectiveDeepSpaceFormulas.FinalDirectiveReward,
                3 => DirectiveKnowledgePowerFormulas.FinalDirectiveReward,
                2 => DirectiveFirstShipFormulas.FinalDirectiveReward,
                _ => DirectiveEconomyFormulas.FinalDirectiveReward
            };

            string title = request.DirectiveId switch
            {
                7 => DirectiveMoreTipsFormulas.DirectiveTitle,
                6 => DirectiveLifeformsFormulas.DirectiveTitle,
                5 => DirectiveSecureBordersFormulas.DirectiveTitle,
                4 => DirectiveDeepSpaceFormulas.DirectiveTitle,
                3 => DirectiveKnowledgePowerFormulas.DirectiveTitle,
                2 => DirectiveFirstShipFormulas.DirectiveTitle,
                _ => DirectiveEconomyFormulas.DirectiveTitle
            };

            planet!.Metal += finalReward.Metal;
            planet.Crystal += finalReward.Crystal;
            planet.Deuterium += finalReward.Deuterium;
            user!.DarkMatter += finalReward.DarkMatter;

            progress.IsDirectiveRewardClaimed = true;
            progress.UpdatedAtUtc = DateTime.UtcNow;

            // Task 05AX: Prune pinned quest if it belonged to this completed directive
            if (PinnedQuestKeysStore.TryGetValue(user.Id, out var pKey) && !string.IsNullOrEmpty(pKey))
            {
                if (pKey.StartsWith($"d{progress.DirectiveId}_", StringComparison.OrdinalIgnoreCase))
                {
                    PinnedQuestKeysStore.TryRemove(user.Id, out _);
                    PinnedQuestsStore.TryRemove(user.Id, out _);
                }
            }

            await dbContext.SaveChangesAsync(cancellationToken);

            await hubContext.Clients.User(user.Id.ToString()).SendAsync("TutorialProgressUpdated", new
            {
                UserId = user.Id,
                progress.DirectiveId,
                progress.IsDirectiveRewardClaimed,
                IsCompleted = true
            }, cancellationToken);

            await hubContext.Clients.User(user.Id.ToString()).SendAsync("PlanetResourcesUpdated", new
            {
                PlanetId = planet.Id,
                planet.Metal,
                planet.Crystal,
                planet.Deuterium,
                user.DarkMatter
            }, cancellationToken);

            return Results.Ok(new
            {
                Success = true,
                DirectiveId = progress.DirectiveId,
                FinalReward = finalReward,
                Message = $"Tebrikler İmparator! Yönerge {progress.DirectiveId} ('{title}') başarıyla tamamlandı. Final ödülünüz (+{finalReward.Metal:N0} Metal, +{finalReward.Crystal:N0} Kristal, +{finalReward.Deuterium:N0} Döteryum, +{finalReward.DarkMatter:N0} KM) hesabınıza tanımlandı!"
            });
        })
        .WithName("ClaimFinalDirectiveReward");

        return app;
    }
}
