import { API_BASE_URL } from "@/store/useGameStore";

export interface SpaceDockShipWreck {
  unitType: number;
  name: string;
  wreckCount: number;
  repairableCount: number;
}

export interface SpaceDockInfo {
  hasWreckField: boolean;
  spaceDockLevel: number;
  maxRepairRatio: number;
  totalRepairDurationSeconds: number;
  repairFinishTimeUtc: string | null;
  isRepairing: boolean;
  isExpired: boolean;
  expiresAtUtc: string | null;
  remainingLifeSeconds: number;
  ships: SpaceDockShipWreck[];
}

export async function fetchSpaceDockInfo(
  planetId: string
): Promise<SpaceDockInfo | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/planets/${planetId}/space-dock`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as SpaceDockInfo;
  } catch (err) {
    console.error("fetchSpaceDockInfo error:", err);
    return null;
  }
}

export async function startSpaceDockRepair(
  planetId: string
): Promise<{ success: boolean; message?: string; info?: SpaceDockInfo }> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/planets/${planetId}/space-dock/repair`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        message: data.message ?? "Onarım başlatılamadı.",
      };
    }
    return {
      success: true,
      message: data.message ?? "Savunma gemileri onarımı başlatıldı.",
      info: data.state as SpaceDockInfo,
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Ağ hatası oluştu.",
    };
  }
}

