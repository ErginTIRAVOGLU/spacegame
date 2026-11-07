import { PlanetSummary, useGameStore, API_BASE_URL } from "@/store/useGameStore";
import { useTutorialStore } from "@/store/useTutorialStore";
import { useResourceStore } from "@/store/useResourceStore";
import { DirectiveSubStep, DirectiveActiveQuest } from "@/lib/tutorialCatalog";

export interface QuestEvaluationStepResult {
  stepIndex: number;
  description: string;
  isMet: boolean;
  currentValue?: number;
  requiredValue?: number;
}

export interface QuestEvaluationResult {
  questId: number;
  isFulfilled: boolean;
  canClaim: boolean;
  steps: QuestEvaluationStepResult[];
}

/**
 * Client-side dynamic quest evaluator to ensure real-time UI synchronization
 * when planet resources tick or building upgrades complete.
 */
export function evaluateActiveQuest(
  planet: PlanetSummary,
  directiveId: number,
  questId: number,
  steps: DirectiveSubStep[] = []
): QuestEvaluationResult {
  // 1. Directive 1 / Stage 3: "Enerji İhtiyacı"
  if (directiveId === 1 && questId === 3) {
    const solarPlantLevel =
      planet.buildings.find((b) => b.key === "solarPlant" || b.buildingType === 4)?.level ?? 0;

    // Use full energy metrics from useResourceStore (includes solar satellites, fusion, officers)
    let netEnergy = 0;
    try {
      const energyMetrics = useResourceStore.getState().getEnergyMetrics(planet);
      netEnergy = energyMetrics.current;
    } catch {
      netEnergy = (planet.producedEnergy ?? 0) - (planet.consumedEnergy ?? 0);
    }

    const step1Met = solarPlantLevel >= 1;
    const step2Met = step1Met && netEnergy >= 0;
    const isFulfilled = step1Met && step2Met;

    const evaluatedSteps: QuestEvaluationStepResult[] = [
      {
        stepIndex: 0,
        description: steps[0]?.description || "Solar Enerji Santrali binasını 1. seviyeye yükselt",
        isMet: step1Met,
        currentValue: solarPlantLevel,
        requiredValue: 1,
      },
      {
        stepIndex: 1,
        description: steps[1]?.description || "Olumlu bir enerji bilançosu elde et (Enerji >= 0)",
        isMet: step2Met,
        currentValue: netEnergy,
        requiredValue: 0,
      },
    ];

    return {
      questId,
      isFulfilled,
      canClaim: isFulfilled,
      steps: evaluatedSteps,
    };
  }

  // 2. Directive 1 / Stage 5: "Kaynak ayarları" (Metal mine %90)
  if (directiveId === 1 && questId === 5) {
    const metalPercent = planet.resourceSettings?.metalMinePercent ?? 100;
    const isStepMet = metalPercent === 90;

    const evaluatedSteps: QuestEvaluationStepResult[] = [
      {
        stepIndex: 0,
        description:
          steps[0]?.description ||
          "Kaynak Ayarları menüsünde Metal Madeni gücünü %90'a ayarla",
        isMet: isStepMet,
        currentValue: metalPercent,
        requiredValue: 90,
      },
    ];

    return {
      questId,
      isFulfilled: isStepMet,
      canClaim: isStepMet,
      steps: evaluatedSteps,
    };
  }



  // 3. Directive 1 / Stage 7: "Metal madeni üretimini tekrar artır" (Metal mine %100)
  if (directiveId === 1 && questId === 7) {
    const metalPercent = planet.resourceSettings?.metalMinePercent ?? 100;
    const isStepMet = metalPercent === 100;

    const evaluatedSteps: QuestEvaluationStepResult[] = [
      {
        stepIndex: 0,
        description:
          steps[0]?.description ||
          "Metal Madeni gücünü tekrar %100'e ayarla",
        isMet: isStepMet,
        currentValue: metalPercent,
        requiredValue: 100,
      },
    ];

    return {
      questId,
      isFulfilled: isStepMet,
      canClaim: isStepMet,
      steps: evaluatedSteps,
    };
  }



  // 4. Directive 6 / Stage 1: "Canlı türlerinin temelleri" (Biyosfer Çiftliği 22, Barınma Tesisi 21)
  if (directiveId === 6 && questId === 1) {
    const lfState = useResourceStore.getState().getPlanetLifeformState(planet.id);
    const bioFarmLvl = lfState?.buildingLevels?.biosphereFarm ?? 0;
    const resLvl = lfState?.buildingLevels?.residentialSector ?? 0;
    const step0Met = bioFarmLvl >= 22;
    const step1Met = resLvl >= 21;
    const isFulfilled = step0Met && step1Met;

    const evaluatedSteps: QuestEvaluationStepResult[] = [
      {
        stepIndex: 0,
        description: steps[0]?.description || "Biyosfer Çiftliği binasını 22. seviyeye yükselt",
        isMet: step0Met,
        currentValue: bioFarmLvl,
        requiredValue: 22,
      },
      {
        stepIndex: 1,
        description: steps[1]?.description || "Barınma Tesisi binasını 21. seviyeye yükselt",
        isMet: step1Met,
        currentValue: resLvl,
        requiredValue: 21,
      },
    ];

    return {
      questId,
      isFulfilled,
      canClaim: isFulfilled,
      steps: evaluatedSteps,
    };
  }

  // 5. Directive 6 / Stage 2: "Araştırma merkezini inşa et" (Araştırma Merkezi 1)
  if (directiveId === 6 && questId === 2) {
    const lfState = useResourceStore.getState().getPlanetLifeformState(planet.id);
    const rcLvl =
      lfState?.buildingLevels?.researchCentre ??
      (lfState?.buildingLevels as Record<string, number> | undefined)?.["researchCenter"] ??
      0;
    const isStepMet = rcLvl >= 1;

    const evaluatedSteps: QuestEvaluationStepResult[] = [
      {
        stepIndex: 0,
        description: steps[0]?.description || "Araştırma Merkezi canlı türü binasını 1. seviyeye yükselt",
        isMet: isStepMet,
        currentValue: rcLvl,
        requiredValue: 1,
      },
    ];

    return {
      questId,
      isFulfilled: isStepMet,
      canClaim: isStepMet,
      steps: evaluatedSteps,
    };
  }



  // 6. Directive 6 / Stage 3: "Galaksiler arası elçileri araştır" (Slot 1 Galaksiler Arası Elçiler 1)
  if (directiveId === 6 && questId === 3) {
    const lfState = useResourceStore.getState().getPlanetLifeformState(planet.id);
    const tech1Lvl = lfState?.techLevels?.[1] ?? 0;
    const isStepMet = tech1Lvl >= 1;

    const evaluatedSteps: QuestEvaluationStepResult[] = [
      {
        stepIndex: 0,
        description: steps[0]?.description || "Galaksiler Arası Elçiler araştırmasını tamamla",
        isMet: isStepMet,
        currentValue: tech1Lvl,
        requiredValue: 1,
      },
    ];

    return {
      questId,
      isFulfilled: isStepMet,
      canClaim: isStepMet,
      steps: evaluatedSteps,
    };
  }



  // 7. Directive 6 / Stage 4: "Bilgisayar teknolojisi" (Computer Tech 108 >= 2)
  if (directiveId === 6 && questId === 4) {
    const researches = useGameStore.getState().researches;
    const compTechLvl = researches[108] ?? 0;
    const isStepMet = compTechLvl >= 2;

    const evaluatedSteps: QuestEvaluationStepResult[] = [
      {
        stepIndex: 0,
        description: steps[0]?.description || "Bilgisayar Tekniği araştırmasını 2. seviyede tamamla",
        isMet: isStepMet,
        currentValue: compTechLvl,
        requiredValue: 2,
      },
    ];

    return {
      questId,
      isFulfilled: isStepMet,
      canClaim: isStepMet,
      steps: evaluatedSteps,
    };
  }



  // 8. Directive 6 / Stage 5: "Bir keşif filosu gönder" (Lifeform discovery mission dispatched)
  if (directiveId === 6 && questId === 5) {
    const isStepMet = steps[0]?.isMet ?? false;
    const evaluatedSteps: QuestEvaluationStepResult[] = [
      {
        stepIndex: 0,
        description:
          steps[0]?.description ||
          "Galaksi haritasındaki DNA simgesi üzerinden bir canlı türü keşif görevi başlat",
        isMet: isStepMet,
      },
    ];

    return {
      questId,
      isFulfilled: isStepMet,
      canClaim: isStepMet,
      steps: evaluatedSteps,
    };
  }



  // 9. Directive 6 / Stage 6: "Bir canlı türü bul" (Lifeform species discovered via expedition)
  if (directiveId === 6 && questId === 6) {
    const isStepMet = steps[0]?.isMet ?? false;
    const evaluatedSteps: QuestEvaluationStepResult[] = [
      {
        stepIndex: 0,
        description:
          steps[0]?.description ||
          "Keşif filoları ile uzayda yeni bir canlı türü keşfet",
        isMet: isStepMet,
      },
    ];

    return {
      questId,
      isFulfilled: isStepMet,
      canClaim: isStepMet,
      steps: evaluatedSteps,
    };
  }

  // 10. Directive 6 / Stage 7: "Sömürgenin canlı türünü seç" (Bir sömürgeye bir canlı türü ata)
  if (directiveId === 6 && questId === 7) {
    const planets = useGameStore.getState().planets;
    const lifeformStates = useResourceStore.getState().lifeformStates;
    const hasColonyWithLifeform = planets.some((p) => {
      if (p.isCapital) return false;
      const st = lifeformStates[p.id];
      return (
        st &&
        st.isActive !== false &&
        Boolean(st.activeSpecies) &&
        st.activeSpecies !== "none" &&
        st.activeSpecies !== "Durduruldu"
      );
    });

    const isStepMet = hasColonyWithLifeform || (steps[0]?.isMet ?? false);
    const evaluatedSteps: QuestEvaluationStepResult[] = [
      {
        stepIndex: 0,
        description:
          steps[0]?.description || "Bir sömürgeye bir canlı türü ata",
        isMet: isStepMet,
      },
    ];

    return {
      questId,
      isFulfilled: isStepMet,
      canClaim: isStepMet,
      steps: evaluatedSteps,
    };
  }



  // Fallback for other steps: maintain existing server results
  const evaluatedSteps: QuestEvaluationStepResult[] = steps.map((s, idx) => ({
    stepIndex: idx,
    description: s.description,
    isMet: s.isMet,
  }));

  const allMet = evaluatedSteps.length > 0 && evaluatedSteps.every((s) => s.isMet);

  return {
    questId,
    isFulfilled: allMet,
    canClaim: allMet,
    steps: evaluatedSteps,
  };
}

/**
 * Re-evaluates the active quest against the current planet and updates useTutorialStore.
 * Called reactively on resource ticks and building queue completions.
 */
export function syncActiveQuestWithLivePlanet(planet?: PlanetSummary | null) {
  if (!planet) return;

  const tutorialState = useTutorialStore.getState();
  const { activeDirectiveId, currentDirectiveStage, activeQuest, allQuests } = tutorialState;

  const isDirective1Target = activeDirectiveId === 1 && [3, 5, 7].includes(currentDirectiveStage);
  const isDirective6Target =
    activeDirectiveId === 6 && [1, 2, 3, 4, 5, 6].includes(currentDirectiveStage);

  if (!activeQuest || (!isDirective1Target && !isDirective6Target)) {
    return;
  }

  const evalResult = evaluateActiveQuest(
    planet,
    activeDirectiveId,
    currentDirectiveStage,
    activeQuest.steps
  );

  // Check if anything changed
  const stepsChanged = evalResult.steps.some(
    (st, idx) => activeQuest.steps[idx]?.isMet !== st.isMet
  );
  const canClaimChanged = activeQuest.canClaim !== evalResult.canClaim;

  if (stepsChanged || canClaimChanged) {
    const updatedSteps = activeQuest.steps.map((st, idx) => ({
      ...st,
      isMet: evalResult.steps[idx]?.isMet ?? st.isMet,
    }));

    const updatedActiveQuest = {
      ...activeQuest,
      steps: updatedSteps,
      completedCount: updatedSteps.filter((s) => s.isMet).length,
      canClaim: evalResult.canClaim,
    };

    const updatedAllQuests = allQuests.map((q) => {
      if (q.questId === currentDirectiveStage) {
        return {
          ...q,
          status: "Active" as const,
          canClaim: evalResult.canClaim,
          progressText: `${updatedActiveQuest.completedCount} / ${updatedActiveQuest.totalCount}`,
        };
      }
      return q;
    });

    useTutorialStore.setState({
      activeQuest: updatedActiveQuest,
      allQuests: updatedAllQuests,
      canClaimReward: evalResult.canClaim,
      data: tutorialState.data
        ? {
            ...tutorialState.data,
            activeQuest: updatedActiveQuest,
            allQuests: updatedAllQuests,
          }
        : null,
    });
  }
}

/**
 * Triggers quest evaluation for non-building events (e.g. LIFEFORM_DISCOVERY_DISPATCHED).
 * Notifies backend POST /api/tutorial/directive-X/progress and immediately marks the quest fulfilled/claimable in local state.
 */
export async function triggerQuestEvaluation(eventType: string) {
  const tutorialState = useTutorialStore.getState();
  const { activeDirectiveId, currentDirectiveStage, activeQuest, allQuests } = tutorialState;

  // 1. Directive 6 / Stage 5: Lifeform Discovery Mission
  if (
    activeDirectiveId === 6 &&
    (currentDirectiveStage === 5 || !currentDirectiveStage || activeQuest?.questId === 5) &&
    eventType === "LIFEFORM_DISCOVERY_DISPATCHED"
  ) {
    try {
      await fetch(`${API_BASE_URL}/api/tutorial/directive-6/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: "lifeform_discovery_dispatched",
        }),
      });
    } catch (err) {
      console.warn("Failed to notify directive-6 progress:", err);
    }

    // Immediately update tutorial store so claim button illuminates
    const updatedSteps: DirectiveSubStep[] =
      activeQuest && activeQuest.steps.length > 0
        ? activeQuest.steps.map((s) => ({
            ...s,
            isMet: true,
          }))
        : [
            {
              index: 0,
              description:
                "Galaksi haritasındaki DNA simgesi üzerinden bir canlı türü keşif görevi başlat",
              isMet: true,
            },
          ];

    const updatedActiveQuest: DirectiveActiveQuest | null = activeQuest
      ? {
          ...activeQuest,
          isFulfilled: true,
          canClaim: true,
          steps: updatedSteps,
          completedCount: 1,
          totalCount: 1,
        }
      : null;

    const updatedAllQuests = allQuests.map((q) => {
      if (q.questId === 5) {
        return {
          ...q,
          status: "Active" as const,
          canClaim: true,
          progressText: "1 / 1",
        };
      }
      return q;
    });

    useTutorialStore.setState({
      activeQuest: updatedActiveQuest,
      allQuests: updatedAllQuests,
      canClaimReward: true,
      data:
        tutorialState.data && updatedActiveQuest
          ? {
              ...tutorialState.data,
              activeQuest: updatedActiveQuest,
              allQuests: updatedAllQuests,
            }
          : tutorialState.data,
    });

    // Refresh tutorial data from server to keep in perfect sync
    tutorialState.fetchTutorial(null, null, 6);
  }

  // 2. Directive 6 / Stage 6: Lifeform species discovered on expedition
  if (
    activeDirectiveId === 6 &&
    (currentDirectiveStage === 6 || !currentDirectiveStage || activeQuest?.questId === 6) &&
    (eventType === "LIFEFORM_SPECIES_DISCOVERED" ||
      eventType === "species_discovered" ||
      eventType === "EXPEDITION_LIFEFORM_DISCOVERED")
  ) {
    try {
      await fetch(`${API_BASE_URL}/api/tutorial/directive-6/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: "lifeform_species_discovered",
        }),
      });
    } catch (err) {
      console.warn("Failed to notify directive-6 progress:", err);
    }

    const updatedSteps: DirectiveSubStep[] =
      activeQuest && activeQuest.steps.length > 0
        ? activeQuest.steps.map((s) => ({
            ...s,
            isMet: true,
          }))
        : [
            {
              index: 0,
              description: "Keşif filoları ile uzayda yeni bir canlı türü keşfet",
              isMet: true,
            },
          ];

    const updatedActiveQuest: DirectiveActiveQuest | null = activeQuest
      ? {
          ...activeQuest,
          isFulfilled: true,
          canClaim: true,
          steps: updatedSteps,
          completedCount: 1,
          totalCount: 1,
        }
      : null;

    const updatedAllQuests = allQuests.map((q) => {
      if (q.questId === 6) {
        return {
          ...q,
          status: "Active" as const,
          canClaim: true,
          progressText: "1 / 1",
        };
      }
      return q;
    });

    useTutorialStore.setState({
      activeQuest: updatedActiveQuest,
      allQuests: updatedAllQuests,
      canClaimReward: true,
      data:
        tutorialState.data && updatedActiveQuest
          ? {
              ...tutorialState.data,
              activeQuest: updatedActiveQuest,
              allQuests: updatedAllQuests,
            }
          : tutorialState.data,
    });

    tutorialState.fetchTutorial(null, null, 6);
  }

  // 3. Directive 6 / Stage 7: Colony lifeform assigned
  if (
    activeDirectiveId === 6 &&
    (currentDirectiveStage === 7 || !currentDirectiveStage || activeQuest?.questId === 7) &&
    (eventType === "COLONY_LIFEFORM_ASSIGNED" ||
      eventType === "SPECIES_SELECTED" ||
      eventType === "PLANET_SPECIES_CHANGED")
  ) {
    try {
      await fetch(`${API_BASE_URL}/api/tutorial/directive-6/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: "colony_species_assigned",
          directiveId: 6,
          questId: 7,
          subStepBitmask: 1,
        }),
      });
    } catch (err) {
      console.warn("Failed to notify directive-6 progress:", err);
    }

    const updatedSteps: DirectiveSubStep[] =
      activeQuest && activeQuest.steps.length > 0
        ? activeQuest.steps.map((s) => ({
            ...s,
            isMet: true,
          }))
        : [
            {
              index: 0,
              description: "Bir sömürgeye bir canlı türü ata",
              isMet: true,
            },
          ];

    const updatedActiveQuest: DirectiveActiveQuest | null = activeQuest
      ? {
          ...activeQuest,
          isFulfilled: true,
          canClaim: true,
          steps: updatedSteps,
          completedCount: 1,
          totalCount: 1,
        }
      : null;

    const updatedAllQuests = allQuests.map((q) => {
      if (q.questId === 7) {
        return {
          ...q,
          status: "Active" as const,
          canClaim: true,
          progressText: "1 / 1",
        };
      }
      return q;
    });

    useTutorialStore.setState({
      activeQuest: updatedActiveQuest,
      allQuests: updatedAllQuests,
      canClaimReward: true,
      data:
        tutorialState.data && updatedActiveQuest
          ? {
              ...tutorialState.data,
              activeQuest: updatedActiveQuest,
              allQuests: updatedAllQuests,
            }
          : tutorialState.data,
    });

    tutorialState.fetchTutorial(null, null, 6);
  }
}

export const handleTutorialEvent = triggerQuestEvaluation;
