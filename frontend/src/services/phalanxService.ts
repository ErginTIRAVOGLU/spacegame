import { API_BASE_URL } from "@/store/useGameStore";

export const PHALANX_SCAN_DEUTERIUM_COST = 5000;

export interface PhalanxFleetShipItem {
  unitType: number;
  count: number;
}

export interface PhalanxFleetMovement {
  fleetMissionId: string;
  missionType: number;
  status: number;
  originCoordinates: string;
  originType: number;
  targetCoordinates: string;
  targetType: number;
  departureUtc: string;
  arrivalUtc: string;
  returnUtc?: string | null;
  ships: Record<number, number>;
}

export interface PhalanxScanResponse {
  targetCoordinates: string;
  deuteriumConsumed: number;
  movements: PhalanxFleetMovement[];
  message?: string;
}

export function calculatePhalanxRange(
  phalanxLevel: number,
  discovererBonus: number = 0.0,
  kaeleshBonus: number = 0.0
): number {
  if (phalanxLevel <= 1) return 0;
  const base = phalanxLevel * phalanxLevel - 1;
  const bonus = Math.max(0, discovererBonus) + Math.max(0, kaeleshBonus);
  return Math.floor(base * (1 + bonus));
}

export function isTargetWithinPhalanxRange(
  moonGalaxy: number,
  moonSystem: number,
  phalanxLevel: number,
  targetGalaxy: number,
  targetSystem: number,
  discovererBonus: number = 0.0,
  kaeleshBonus: number = 0.0
): boolean {
  if (moonGalaxy !== targetGalaxy || phalanxLevel <= 1) return false;
  const range = calculatePhalanxRange(phalanxLevel, discovererBonus, kaeleshBonus);
  return Math.abs(moonSystem - targetSystem) <= range;
}

export function isFleetVisibleOnPhalanx(params: {
  scannedGalaxy: number;
  scannedSystem: number;
  scannedSlot: number;
  originGalaxy: number;
  originSystem: number;
  originSlot: number;
  originType: number; // 1 = Planet, 2 = Debris, 3 = Moon
  targetGalaxy: number;
  targetSystem: number;
  targetSlot: number;
  targetType: number; // 1 = Planet, 2 = Debris, 3 = Moon
  missionType: number; // 1=Attack, 2=ACS, 3=Transport, 4=Deploy, 5=Defend, 6=Espionage, 7=Colonize, 8=Recycle, 9=Destroy
  status: number; // 1=Outbound, 2=Holding, 3=Returning, 6=Recalled
}): boolean {
  const {
    scannedGalaxy,
    scannedSystem,
    scannedSlot,
    originGalaxy,
    originSystem,
    originSlot,
    originType,
    targetGalaxy,
    targetSystem,
    targetSlot,
    targetType,
    missionType,
    status,
  } = params;

  // Rule 1: Moon Invisibility - all fleets to or from a Moon are completely hidden
  if (originType === 3 || targetType === 3) {
    return false;
  }

  const isOriginScanned =
    originGalaxy === scannedGalaxy &&
    originSystem === scannedSystem &&
    originSlot === scannedSlot &&
    originType === 1;

  const isTargetScanned =
    targetGalaxy === scannedGalaxy &&
    targetSystem === scannedSystem &&
    targetSlot === scannedSlot &&
    targetType === 1;

  // Origin Planet Scanned
  if (isOriginScanned) {
    // Deploy (4): outbound and recalled deploy are completely hidden on origin!
    if (missionType === 4) {
      return false;
    }
    // Outgoing or returning movements of other missions are visible
    return status === 1 || status === 2 || status === 3 || status === 6;
  }

  // Target Planet Scanned
  if (isTargetScanned) {
    // Only outbound flights heading towards this target planet are visible
    if (status === 1) {
      // Incoming Deploy (4), Attack (1), ACS (2), Transport (3), Espionage (6), Hold/Defend (5)
      return (
        missionType === 4 ||
        missionType === 1 ||
        missionType === 2 ||
        missionType === 3 ||
        missionType === 6 ||
        missionType === 5
      );
    }
    return false;
  }

  return false;
}

export async function scanWithSensorPhalanx(params: {
  scannerUserId: string;
  originMoonId: string;
  targetGalaxy: number;
  targetSystem: number;
  targetSlot: number;
}): Promise<{ success: boolean; data?: PhalanxScanResponse; message?: string }> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/moons/phalanx/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        success: false,
        message: data.message ?? "Sensör Falanks taraması başarısız oldu.",
      };
    }

    return {
      success: true,
      data: data as PhalanxScanResponse,
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Ağ bağlantı hatası oluştu.",
    };
  }
}

