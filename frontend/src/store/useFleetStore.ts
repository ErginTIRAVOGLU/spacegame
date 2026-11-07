import { create } from "zustand";
import { API_BASE_URL, useGameStore } from "@/store/useGameStore";
import { useTutorialStore } from "@/store/useTutorialStore";

export interface FleetMovement {
  id: string;
  originPlanetId?: string;
  mission: string;
  origin: string;
  destination: string;
  shipCount: number;
  departureTime: number;
  arrivalTime: number;
  returnTime: number | null;
  isReturning: boolean;
  status?: number;
  statusName?: string;
  ships?: { unitType: number; count: number }[];
}

export interface FleetStoreState {
  activeMovements: FleetMovement[];
  isLoading: boolean;
  recallingFleetId: string | null;
  setActiveMovements: (movements: FleetMovement[]) => void;
  recallFleet: (fleetId: string) => Promise<{ success: boolean; message: string }>;
}

export const useFleetStore = create<FleetStoreState>((set, get) => ({
  activeMovements: [],
  isLoading: false,
  recallingFleetId: null,

  setActiveMovements: (movements) => {
    set({ activeMovements: movements });
  },

  recallFleet: async (fleetId: string) => {
    set({ recallingFleetId: fleetId });
    const now = Date.now();

    // Optimistic store update per Task 05BB specification
    set((state) => {
      const updatedMovements = state.activeMovements.map((fleet) => {
        if (fleet.id !== fleetId || fleet.isReturning) return fleet;

        // Kat edilen süreyi hesapla ve dönüş süresi olarak ayarla
        const elapsedTime = now - fleet.departureTime;
        const newReturnTime = now + Math.max(0, elapsedTime);

        return {
          ...fleet,
          isReturning: true,
          arrivalTime: newReturnTime,
          returnTime: newReturnTime,
          status: 6, // FleetMissionStatus.Recalled
          statusName: "Geri Dönüyor",
        };
      });

      return { activeMovements: updatedMovements };
    });

    try {
      // Backend recall invocation
      const result = await useGameStore.getState().recallFleet(fleetId);

      // Yönerge 3 - Görev 9 / Tutorial tetikleyicisi
      const userId = useGameStore.getState().userId;
      const planetId = useGameStore.getState().selectedPlanetId;
      useTutorialStore.getState().fetchTutorial(planetId, userId, 3);

      set({ recallingFleetId: null });
      return result;
    } catch {
      set({ recallingFleetId: null });
      return {
        success: false,
        message: "Filo geri çağrılırken bir hata oluştu.",
      };
    }
  },
}));

