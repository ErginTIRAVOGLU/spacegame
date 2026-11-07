import { create } from "zustand";
import { API_BASE_URL } from "@/store/useGameStore";
import {
  TutorialCurrentResponse,
  DirectiveActiveQuest,
  DirectiveQuestSummary,
} from "@/lib/tutorialCatalog";

export interface TutorialState {
  data: TutorialCurrentResponse | null;
  activeDirectiveId: number;
  currentDirectiveId: number; // Task 05AX: Current active directive being worked on
  currentStepId: number; // Task 05AX: Current step in active directive
  currentDirectiveStage: number; // The actual sequential stage awaiting reward/completion
  currentUncompletedStep: number; // Backward compatibility alias
  pinnedQuestKey: string | null; // Composite key: d{directiveId}_s{stepId}
  pinnedQuestId: number | null; // Backward compatibility alias for current directive
  inspectedQuestId: number; // The quest currently viewed in the main detail card
  completedDirectiveIds: number[]; // Task 05AX: Completed directive IDs (e.g. [1])
  completedQuestKeys: string[]; // Task 05BH: Completed quest keys (e.g. ["d1_s1", "d4_s1", ...])
  activeQuest: DirectiveActiveQuest | null;
  allQuests: DirectiveQuestSummary[];
  nextDirectiveSummary: string;
  canClaimReward: boolean;
  isDirectiveCompleted: boolean;
  isLoading: boolean;
  lastFetchedAt: number | null;

  // Actions
  fetchTutorial: (
    planetId?: string | null,
    userId?: string | null,
    directiveId?: number
  ) => Promise<TutorialCurrentResponse | null>;
  pinQuest: (
    directiveIdOrQuestIdOrKey: number | string | null,
    stepIdOrPlanetId?: number | string | null,
    planetIdOrUserId?: string | null,
    userId?: string | null
  ) => Promise<{ success: boolean; message?: string }>;
  unpinQuest: (
    planetId?: string | null,
    userId?: string | null
  ) => Promise<{ success: boolean; message?: string }>;
  getActiveTrackedQuest: () => DirectiveQuestSummary | DirectiveActiveQuest | null;
  isQuestPinned: (directiveId: number, stepId: number) => boolean;
  setInspectedQuestId: (questId: number) => void;
  claimReward: (
    questId: number,
    planetId?: string | null,
    userId?: string | null
  ) => Promise<{ success: boolean; message?: string }>;
  claimFinalReward: (
    directiveId: number,
    planetId?: string | null,
    userId?: string | null
  ) => Promise<{ success: boolean; message?: string }>;
  selectDirective: (targetDirectiveId: number) => void;
  advanceToNextDirective: () => void;
  setActiveDirectiveId: (directiveId: number) => void;
  completeDirective: (directiveId: number) => void;
  checkAndPruneStalePins: () => void;
}

export const useTutorialStore = create<TutorialState>((set, get) => ({
  data: null,
  activeDirectiveId: 1,
  currentDirectiveId: 1,
  currentStepId: 1,
  currentDirectiveStage: 1,
  currentUncompletedStep: 1,
  pinnedQuestKey: null,
  pinnedQuestId: null,
  inspectedQuestId: 1,
  completedDirectiveIds: [],
  completedQuestKeys: [],
  activeQuest: null,
  allQuests: [],
  nextDirectiveSummary: "",
  canClaimReward: false,
  isDirectiveCompleted: false,
  isLoading: false,
  lastFetchedAt: null,

  selectDirective: (targetDirectiveId: number) => {
    set({
      activeDirectiveId: targetDirectiveId,
      currentDirectiveId: targetDirectiveId,
      currentStepId: 1,
      inspectedQuestId: 1,
    });
  },

  advanceToNextDirective: () => {
    const nextId = get().activeDirectiveId + 1;
    get().selectDirective(nextId);
  },

  setActiveDirectiveId: (directiveId: number) => {
    get().selectDirective(directiveId);
  },

  setInspectedQuestId: (questId: number) => {
    set({ inspectedQuestId: questId });
  },

  isQuestPinned: (directiveId: number, stepId: number) => {
    return get().pinnedQuestKey === `d${directiveId}_s${stepId}`;
  },

  completeDirective: (directiveId: number) => {
    set((state) => {
      const updatedCompleted = Array.from(
        new Set([...state.completedDirectiveIds, directiveId])
      );

      // If the pinned quest belongs to the completed directive, clear it
      let nextPinnedKey = state.pinnedQuestKey;
      let nextPinnedId = state.pinnedQuestId;
      if (nextPinnedKey && nextPinnedKey.startsWith(`d${directiveId}_`)) {
        nextPinnedKey = null;
        nextPinnedId = null;
      }

      const nextDirectiveId = directiveId + 1;

      return {
        completedDirectiveIds: updatedCompleted,
        currentDirectiveId: nextDirectiveId,
        activeDirectiveId: nextDirectiveId,
        currentStepId: 1,
        inspectedQuestId: 1,
        pinnedQuestKey: nextPinnedKey,
        pinnedQuestId: nextPinnedId,
      };
    });
  },

  checkAndPruneStalePins: () => {
    const { pinnedQuestKey, completedDirectiveIds, completedQuestKeys } = get();
    if (!pinnedQuestKey) return;

    // Format: "d1_s3" -> directiveId: 1
    const match = pinnedQuestKey.match(/^d(\d+)_/);
    if (match) {
      const pinnedDirectiveId = parseInt(match[1], 10);
      if (
        completedDirectiveIds.includes(pinnedDirectiveId) ||
        completedQuestKeys.includes(pinnedQuestKey)
      ) {
        set({ pinnedQuestKey: null, pinnedQuestId: null });
      }
    }
  },

  getActiveTrackedQuest: () => {
    const {
      pinnedQuestKey,
      currentDirectiveId,
      activeDirectiveId,
      allQuests,
      activeQuest,
      completedQuestKeys,
    } = get();

    const effectiveDir = currentDirectiveId || activeDirectiveId || 1;

    // 1. ÖNCELİK: Kullanıcı açıkça bir görevi takip etmeyi seçtiyse (Manuel Pin)
    if (pinnedQuestKey) {
      if (!completedQuestKeys.includes(pinnedQuestKey)) {
        const match = pinnedQuestKey.match(/^d(\d+)_s(\d+)$/);
        if (match) {
          const pDir = parseInt(match[1], 10);
          const pStep = parseInt(match[2], 10);
          if (pDir === effectiveDir) {
            const found = allQuests.find((q) => q.questId === pStep);
            if (found) return found;
          }
        }
      }
    }

    // 2. ÖNCELİK: Bulunulan güncel yönergenin (currentDirectiveId) tamamlanmamış ilk görevi
    const nextInCurrentDirective = allQuests.find(
      (q) =>
        !completedQuestKeys.includes(`d${effectiveDir}_s${q.questId}`) &&
        !q.isClaimed &&
        q.status !== "Completed"
    );
    if (nextInCurrentDirective) {
      return nextInCurrentDirective;
    }

    // If activeQuest belongs to current directive and is not yet claimed
    if (
      activeQuest &&
      !activeQuest.canClaim &&
      !completedQuestKeys.includes(`d${effectiveDir}_s${activeQuest.questId}`)
    ) {
      return activeQuest;
    }

    // 3. ÖNCELİK: Hiçbiri yoksa güncel yönergenin ilk/son görevi (Asla eski yönergeye zorla kilitleme!)
    return allQuests[allQuests.length - 1] ?? activeQuest ?? null;
  },

  fetchTutorial: async (planetId, userId, directiveId) => {
    try {
      set({ isLoading: true });
      const query = new URLSearchParams();

      // Task 05BH: Prioritize explicit directiveId > pinned quest's directive > currentDirectiveId
      let resolvedDirectiveId = directiveId;
      if (typeof resolvedDirectiveId !== "number") {
        const pinnedKey = get().pinnedQuestKey;
        if (pinnedKey) {
          const match = pinnedKey.match(/^d(\d+)_/);
          if (match) {
            resolvedDirectiveId = parseInt(match[1], 10);
          }
        }
      }
      if (typeof resolvedDirectiveId !== "number") {
        resolvedDirectiveId = get().currentDirectiveId || get().activeDirectiveId;
      }
      if (typeof resolvedDirectiveId === "number" && resolvedDirectiveId > 0) {
        query.append("directiveId", resolvedDirectiveId.toString());
      }
      if (planetId) query.append("planetId", planetId);
      if (userId) query.append("userId", userId);
      query.append("opened", "true");

      const res = await fetch(`${API_BASE_URL}/api/tutorial/current?${query}`);
      if (res.ok) {
        const json = (await res.json()) as TutorialCurrentResponse;

        const prevDirectiveId = get().activeDirectiveId;
        const isDifferentDirective = prevDirectiveId !== json.directiveId;

        // Collect all completed directive IDs
        const completedFromSummary = (json.availableDirectives || [])
          .filter((d) => d.isCompleted || d.isRewardClaimed)
          .map((d) => d.directiveId);
        if (json.isDirectiveCompleted && !completedFromSummary.includes(json.directiveId)) {
          completedFromSummary.push(json.directiveId);
        }
        const completedDirectiveIds = Array.from(
          new Set([...get().completedDirectiveIds, ...completedFromSummary])
        );

        // Task 05BH: Collect completed quest keys to prevent stale locks
        const newCompletedQuestKeys = new Set(get().completedQuestKeys);
        for (const cDir of completedDirectiveIds) {
          for (let i = 1; i <= 20; i++) {
            newCompletedQuestKeys.add(`d${cDir}_s${i}`);
          }
        }
        for (const q of json.allQuests) {
          if (q.status === "Completed" || q.isClaimed) {
            newCompletedQuestKeys.add(`d${json.directiveId}_s${q.questId}`);
          }
        }
        const completedQuestKeys = Array.from(newCompletedQuestKeys);

        const currentDirectiveStage = json.currentQuestStep;
        const canClaim = Boolean(
          json.activeQuest?.canClaim || json.canClaimDirectiveReward
        );

        // Task 05AM & 05AX & 05BH: Resolve composite pinned key & ghost pin pruning
        let serverPinnedKey = json.pinnedQuestKey ?? get().pinnedQuestKey ?? null;
        let effectivePinnedId: number | null = null;

        if (serverPinnedKey) {
          const match = serverPinnedKey.match(/^d(\d+)_s(\d+)$/);
          if (match) {
            const pDir = parseInt(match[1], 10);
            const pStep = parseInt(match[2], 10);
            if (completedDirectiveIds.includes(pDir) || completedQuestKeys.includes(serverPinnedKey)) {
              // Ghost pin from a completed directive or completed quest -> prune
              serverPinnedKey = null;
              effectivePinnedId = null;
            } else if (pDir === json.directiveId) {
              effectivePinnedId = pStep;
            }
          }
        } else if (
          json.pinnedQuestId &&
          !completedDirectiveIds.includes(json.directiveId)
        ) {
          const candidateKey = `d${json.directiveId}_s${json.pinnedQuestId}`;
          if (!completedQuestKeys.includes(candidateKey)) {
            effectivePinnedId = json.pinnedQuestId;
            serverPinnedKey = candidateKey;
          }
        }

        // Task 05BJ: Priority-based inspected quest resolution
        // 1. Preserve user's manual inspection choice when staying within the same directive
        // 2. Fall back to pinned quest if directive changed or no valid selection
        // 3. Fall back to first uncompleted quest
        // 4. Fall back to current directive stage or quest 1
        const firstUncompletedQuest = json.allQuests.find(
          (q) => !q.isClaimed && q.status !== "Completed"
        );
        const currentInspected = get().inspectedQuestId;

        let inspectedQuestId: number;
        if (
          !isDifferentDirective &&
          currentInspected &&
          json.allQuests.some((q) => q.questId === currentInspected)
        ) {
          inspectedQuestId = currentInspected;
        } else if (effectivePinnedId) {
          inspectedQuestId = effectivePinnedId;
        } else if (firstUncompletedQuest) {
          inspectedQuestId = firstUncompletedQuest.questId;
        } else {
          inspectedQuestId = currentDirectiveStage ?? 1;
        }

        set({
          data: json,
          activeDirectiveId: json.directiveId,
          currentDirectiveId: json.directiveId,
          currentStepId: currentDirectiveStage,
          currentDirectiveStage,
          currentUncompletedStep: currentDirectiveStage,
          completedDirectiveIds,
          completedQuestKeys,
          pinnedQuestKey: serverPinnedKey,
          pinnedQuestId: effectivePinnedId,
          inspectedQuestId,
          activeQuest: json.activeQuest,
          allQuests: json.allQuests,
          nextDirectiveSummary: json.nextDirectiveSummary || "",
          canClaimReward: canClaim,
          isDirectiveCompleted: json.isDirectiveCompleted,
          isLoading: false,
          lastFetchedAt: Date.now(),
        });

        get().checkAndPruneStalePins();
        return json;
      }
    } catch {
      // ignore network errors
    } finally {
      set({ isLoading: false });
    }
    return null;
  },

  unpinQuest: async (planetId, userId) => {
    try {
      const activeDirectiveId = get().activeDirectiveId;
      const res = await fetch(`${API_BASE_URL}/api/tutorial/pin-quest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          directiveId: activeDirectiveId,
          questId: null,
          userId: userId || undefined,
        }),
      });

      const resData = await res.json();
      if (res.ok) {
        set({ pinnedQuestKey: null, pinnedQuestId: null });
        await get().fetchTutorial(planetId, userId, activeDirectiveId);
        return {
          success: true,
          message: resData.message || "Sabitleme kaldırıldı.",
        };
      }
      return { success: false, message: resData.message || "İşlem başarısız." };
    } catch {
      return { success: false, message: "Bağlantı hatası oluştu." };
    }
  },

  pinQuest: async (arg1, arg2, arg3, arg4) => {
    try {
      let directiveId: number;
      let stepId: number | null;
      let planetId: string | null | undefined;
      let userId: string | null | undefined;

      if (typeof arg1 === "string" && arg1.includes("_")) {
        const match = arg1.match(/^d(\d+)_s(\d+)$/);
        if (match) {
          directiveId = parseInt(match[1], 10);
          stepId = parseInt(match[2], 10);
          planetId = arg2 as string | null | undefined;
          userId = arg3 as string | null | undefined;
        } else {
          directiveId = get().currentDirectiveId || get().activeDirectiveId;
          stepId = null;
          planetId = arg2 as string | null | undefined;
          userId = arg3 as string | null | undefined;
        }
      } else if (typeof arg2 === "number") {
        directiveId = arg1 as number;
        stepId = arg2;
        planetId = arg3 as string | null | undefined;
        userId = arg4 as string | null | undefined;
      } else {
        directiveId = get().currentDirectiveId || get().activeDirectiveId;
        stepId = arg1 as number | null;
        planetId = arg2 as string | null | undefined;
        userId = arg3 as string | null | undefined;
      }

      if (stepId === null) {
        return get().unpinQuest(planetId, userId);
      }

      // Check if directive is already completed
      if (get().completedDirectiveIds.includes(directiveId)) {
        return {
          success: false,
          message: "Tamamlanmış bir yönergedeki görevler takip listesine sabitlenemez.",
        };
      }

      const compositeKey = `d${directiveId}_s${stepId}`;

      // Immediately set in client store to prevent race conditions or UI lag
      set({
        pinnedQuestKey: compositeKey,
        pinnedQuestId: stepId,
        currentDirectiveId: directiveId,
        activeDirectiveId: directiveId,
        inspectedQuestId: stepId,
      });

      const res = await fetch(`${API_BASE_URL}/api/tutorial/pin-quest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          directiveId,
          questId: stepId,
          userId: userId || undefined,
        }),
      });

      const resData = await res.json();
      if (res.ok) {
        await get().fetchTutorial(planetId, userId, directiveId);
        return { success: true, message: resData.message };
      }
      return {
        success: false,
        message: resData.message || "Sabitleme başarısız.",
      };
    } catch {
      return { success: false, message: "Bağlantı hatası oluştu." };
    }
  },

  claimReward: async (questId, planetId, userId) => {
    try {
      const activeDirectiveId = get().activeDirectiveId;
      const res = await fetch(`${API_BASE_URL}/api/tutorial/claim-reward`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          directiveId: activeDirectiveId,
          questId,
          planetId: planetId || undefined,
          userId: userId || undefined,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        return { success: false, message: resData.message || "Ödül alınamadı." };
      }

      // If the claimed quest was pinned, clear it so widget tracks new currentDirectiveStage
      const claimedKey = `d${activeDirectiveId}_s${questId}`;
      const nextCompletedKeys = Array.from(new Set([...get().completedQuestKeys, claimedKey]));
      set({ completedQuestKeys: nextCompletedKeys });

      if (
        get().pinnedQuestId === questId ||
        get().pinnedQuestKey === claimedKey
      ) {
        set({ pinnedQuestKey: null, pinnedQuestId: null });
        try {
          await fetch(`${API_BASE_URL}/api/tutorial/pin-quest`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              directiveId: activeDirectiveId,
              questId: null,
              userId: userId || undefined,
            }),
          });
        } catch {
          // ignore
        }
      }

      // Auto-advance inspected quest if it was the one claimed
      if (get().inspectedQuestId === questId) {
        set({ inspectedQuestId: questId + 1 });
      }

      await get().fetchTutorial(planetId, userId, activeDirectiveId);
      return { success: true, message: resData.message };
    } catch {
      return { success: false, message: "Bağlantı hatası oluştu." };
    }
  },

  claimFinalReward: async (directiveId, planetId, userId) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/tutorial/claim-final-reward`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            directiveId,
            planetId: planetId || undefined,
            userId: userId || undefined,
          }),
        }
      );

      const resData = await res.json();
      if (!res.ok) {
        return {
          success: false,
          message: resData.message || "Final ödülü alınamadı.",
        };
      }

      // Mark completed & prune stale pins in store
      get().completeDirective(directiveId);

      // Auto-fetch next directive
      await get().fetchTutorial(planetId, userId, directiveId + 1);
      return { success: true, message: resData.message };
    } catch {
      return { success: false, message: "Bağlantı hatası oluştu." };
    }
  },
}));
