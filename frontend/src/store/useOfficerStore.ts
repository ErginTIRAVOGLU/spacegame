"use client";

import { create } from "zustand";
import { API_BASE_URL, useGameStore } from "@/store/useGameStore";
import { OfficerKey } from "@/lib/officersCatalog";

export interface OfficerStatusState {
  isActive: boolean;
  expiresAtUtc?: string | null;
  remainingSeconds: number;
}

export interface OfficerBonuses {
  hasCommander: boolean;
  hasAdmiral: boolean;
  hasEngineer: boolean;
  hasGeologist: boolean;
  hasTechnocrat: boolean;
  hasFullCommandStaff: boolean;
  mineProductionMultiplier: number;
  energyProductionMultiplier: number;
  researchDurationMultiplier: number;
  defenseRepairRatio: number;
  extraFleetSlots: number;
  extraExpeditionSlots: number;
  extraEspionageTechLevels: number;
}

export interface FavoriteCoordinate {
  id: string;
  galaxy: number;
  system: number;
  slot: number;
  name: string;
  label?: string;
  note?: string;
  createdAt: number;
}

export interface QueuedBuildingOrder {
  id: string;
  planetId: string;
  buildingKey: string;
  targetLevel: number;
  cost: { metal: number; crystal: number; deuterium: number };
  durationSeconds: number;
}

interface OfficerStoreState {
  isLoading: boolean;
  darkMatter: number;
  activeCount: number;
  officers: Record<string, OfficerStatusState>;
  officersStatus: {
    commander: boolean;
    admiral: boolean;
    engineer: boolean;
    geologist: boolean;
    technocrat: boolean;
  };
  bonuses: OfficerBonuses;
  favoriteCoordinates: FavoriteCoordinate[];
  queuedBuildingOrders: QueuedBuildingOrder[];
  fetchOfficers: (userId?: string) => Promise<void>;
  hireOfficer: (
    officerKey: string,
    duration: "week" | "month",
    userId?: string
  ) => Promise<{ success: boolean; message: string }>;
  addFavoriteCoordinate: (
    target: {
      galaxy: number;
      system: number;
      slot: number;
      name?: string;
      label?: string;
    }
  ) => { success: boolean; message: string };
  removeFavoriteCoordinate: (
    idOrCoords: string | { galaxy: number; system: number; slot: number }
  ) => void;
  decrementTimers: () => void;
  enqueueBuildingOrder: (order: Omit<QueuedBuildingOrder, "id">) => {
    success: boolean;
    message: string;
  };
  dequeueBuildingOrder: (orderId: string) => void;
}

const DEFAULT_BONUSES: OfficerBonuses = {
  hasCommander: false,
  hasAdmiral: false,
  hasEngineer: false,
  hasGeologist: false,
  hasTechnocrat: false,
  hasFullCommandStaff: false,
  mineProductionMultiplier: 1.0,
  energyProductionMultiplier: 1.0,
  researchDurationMultiplier: 1.0,
  defenseRepairRatio: 0.70,
  extraFleetSlots: 0,
  extraExpeditionSlots: 0,
  extraEspionageTechLevels: 0,
};

const FAVORITES_STORAGE_KEY = "ogame_favorite_coordinates_v1";

function loadSavedFavorites(): FavoriteCoordinate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return [
    {
      id: "fav-1",
      galaxy: 1,
      system: 1,
      slot: 2,
      name: "Terkedilmiş Koloni",
      createdAt: Date.now(),
    },
    {
      id: "fav-2",
      galaxy: 1,
      system: 16,
      slot: 16,
      name: "Derin Keşif Alanı",
      createdAt: Date.now(),
    },
  ];
}

function saveFavorites(favs: FavoriteCoordinate[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favs));
  } catch {
    // ignore
  }
}

export const useOfficerStore = create<OfficerStoreState>((set, get) => ({
  isLoading: false,
  darkMatter: 0,
  activeCount: 0,
  officers: {
    commander: { isActive: false, remainingSeconds: 0 },
    admiral: { isActive: false, remainingSeconds: 0 },
    engineer: { isActive: false, remainingSeconds: 0 },
    geologist: { isActive: false, remainingSeconds: 0 },
    technocrat: { isActive: false, remainingSeconds: 0 },
  },
  officersStatus: {
    commander: false,
    admiral: false,
    engineer: false,
    geologist: false,
    technocrat: false,
  },
  bonuses: DEFAULT_BONUSES,
  favoriteCoordinates: loadSavedFavorites(),
  queuedBuildingOrders: [],

  fetchOfficers: async (userId?: string) => {
    try {
      set({ isLoading: true });
      let targetUserId = userId || useGameStore.getState().userId || undefined;
      if (!targetUserId && typeof window !== "undefined") {
        const u = localStorage.getItem("ogame_user");
        if (u) {
          try {
            targetUserId = JSON.parse(u).id;
          } catch {
            // ignore
          }
        }
      }

      const query = targetUserId ? `?userId=${targetUserId}` : "";
      const res = await fetch(`${API_BASE_URL}/api/officers/status${query}`, {
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();
        const hasCmd = Boolean(data?.bonuses?.hasCommander);
        const hasAdm = Boolean(data?.bonuses?.hasAdmiral);
        const hasEng = Boolean(data?.bonuses?.hasEngineer);
        const hasGeo = Boolean(data?.bonuses?.hasGeologist);
        const hasTech = Boolean(data?.bonuses?.hasTechnocrat);
        const hasFullStaff = hasCmd && hasAdm && hasEng && hasGeo && hasTech;

        // Recalculate canonical multipliers
        let mineBonus = 1.0;
        if (hasGeo) mineBonus += 0.10;
        if (hasFullStaff) mineBonus += 0.02;

        let energyBonus = 1.0;
        if (hasEng) energyBonus += 0.10;
        if (hasFullStaff) energyBonus += 0.02;

        const researchMultiplier = hasTech ? 0.75 : 1.0;
        const defenseRepairRatio = hasEng ? 0.85 : 0.70;
        const extraFleets = (hasAdm ? 2 : 0) + (hasFullStaff ? 1 : 0);
        const extraExpeditions = hasAdm ? 1 : 0;
        const extraEspionage = (hasTech ? 2 : 0) + (hasFullStaff ? 1 : 0);

        const evaluatedBonuses: OfficerBonuses = {
          hasCommander: hasCmd,
          hasAdmiral: hasAdm,
          hasEngineer: hasEng,
          hasGeologist: hasGeo,
          hasTechnocrat: hasTech,
          hasFullCommandStaff: hasFullStaff,
          mineProductionMultiplier: mineBonus,
          energyProductionMultiplier: energyBonus,
          researchDurationMultiplier: researchMultiplier,
          defenseRepairRatio,
          extraFleetSlots: extraFleets,
          extraExpeditionSlots: extraExpeditions,
          extraEspionageTechLevels: extraEspionage,
        };

        set({
          darkMatter: data.darkMatter ?? 0,
          activeCount: data.activeCount ?? 0,
          officers: {
            commander: data.officers?.commander ?? { isActive: false, remainingSeconds: 0 },
            admiral: data.officers?.admiral ?? { isActive: false, remainingSeconds: 0 },
            engineer: data.officers?.engineer ?? { isActive: false, remainingSeconds: 0 },
            geologist: data.officers?.geologist ?? { isActive: false, remainingSeconds: 0 },
            technocrat: data.officers?.technocrat ?? { isActive: false, remainingSeconds: 0 },
          },
          officersStatus: {
            commander: hasCmd,
            admiral: hasAdm,
            engineer: hasEng,
            geologist: hasGeo,
            technocrat: hasTech,
          },
          bonuses: evaluatedBonuses,
          isLoading: false,
        });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  hireOfficer: async (officerKey, duration, userId) => {
    try {
      let targetUserId = userId || useGameStore.getState().userId || undefined;
      if (!targetUserId && typeof window !== "undefined") {
        const u = localStorage.getItem("ogame_user");
        if (u) {
          try {
            targetUserId = JSON.parse(u).id;
          } catch {
            // ignore
          }
        }
      }

      const res = await fetch(`${API_BASE_URL}/api/officers/hire`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: targetUserId,
          officerKey,
          duration,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        await get().fetchOfficers(targetUserId);
        return { success: true, message: json.message || "Subay başarıyla görevlendirildi!" };
      } else {
        return { success: false, message: json.message || "Görevlendirme başarısız." };
      }
    } catch (err: unknown) {
      return { success: false, message: (err as Error).message || "Sunucu bağlantı hatası." };
    }
  },

  addFavoriteCoordinate: (target) => {
    const list = get().favoriteCoordinates;
    if (list.length >= 40) {
      return { success: false, message: "Maksimum 40 favori hedef sınırına ulaşıldı." };
    }

    const exists = list.some(
      (f) =>
        f.galaxy === target.galaxy &&
        f.system === target.system &&
        f.slot === target.slot
    );
    if (exists) {
      return { success: false, message: "Bu koordinat zaten favorilerinizde mevcut." };
    }

    const newFav: FavoriteCoordinate = {
      id: `fav-${Date.now()}`,
      galaxy: target.galaxy,
      system: target.system,
      slot: target.slot,
      name: target.name || target.label || `Hedef [${target.galaxy}:${target.system}:${target.slot}]`,
      label: target.label || target.name,
      createdAt: Date.now(),
    };

    const updated = [newFav, ...list];
    set({ favoriteCoordinates: updated });
    saveFavorites(updated);
    return {
      success: true,
      message: `[${target.galaxy}:${target.system}:${target.slot}] favorilere kaydedildi!`,
    };
  },

  removeFavoriteCoordinate: (idOrCoords) => {
    let filterFn: (f: FavoriteCoordinate) => boolean;
    if (typeof idOrCoords === "string") {
      filterFn = (f) =>
        f.id !== idOrCoords &&
        `[${f.galaxy}:${f.system}:${f.slot}]` !== idOrCoords;
    } else {
      filterFn = (f) =>
        !(
          f.galaxy === idOrCoords.galaxy &&
          f.system === idOrCoords.system &&
          f.slot === idOrCoords.slot
        );
    }
    const updated = get().favoriteCoordinates.filter(filterFn);
    set({ favoriteCoordinates: updated });
    saveFavorites(updated);
  },

  decrementTimers: () => {
    const prev = get().officers;
    let hasChanges = false;
    const next = { ...prev };
    for (const key of Object.keys(next)) {
      if (next[key].isActive && next[key].remainingSeconds > 0) {
        const nextSec = next[key].remainingSeconds - 1;
        next[key] = {
          ...next[key],
          remainingSeconds: Math.max(0, nextSec),
          isActive: nextSec > 0,
        };
        hasChanges = true;
      }
    }
    if (hasChanges) {
      set({
        officers: next,
        officersStatus: {
          commander: Boolean(next.commander?.isActive),
          admiral: Boolean(next.admiral?.isActive),
          engineer: Boolean(next.engineer?.isActive),
          geologist: Boolean(next.geologist?.isActive),
          technocrat: Boolean(next.technocrat?.isActive),
        },
      });
    }
  },

  enqueueBuildingOrder: (order) => {
    const bonuses = get().bonuses;
    if (!bonuses.hasCommander) {
      return {
        success: false,
        message: "Çoklu inşaat kuyruğu için Commander (Komutan) aktif olmalıdır.",
      };
    }

    const currentQueued = get().queuedBuildingOrders;
    if (currentQueued.length >= 5) {
      return {
        success: false,
        message: "Maksimum 5 inşaat emri sıraya dizilebilir.",
      };
    }

    const newOrder: QueuedBuildingOrder = {
      ...order,
      id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };

    set({ queuedBuildingOrders: [...currentQueued, newOrder] });
    return {
      success: true,
      message: `${order.buildingKey} Kademe ${order.targetLevel} inşaat sırasına eklendi!`,
    };
  },

  dequeueBuildingOrder: (orderId) => {
    set((state) => ({
      queuedBuildingOrders: state.queuedBuildingOrders.filter((o) => o.id !== orderId),
    }));
  },
}));
