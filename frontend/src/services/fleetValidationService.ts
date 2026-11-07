import {
  FleetMissionType,
  calculateTotalCargoCapacity,
  FLEET_SHIPS,
} from "@/lib/fleetCatalog";

export interface FleetValidationParams {
  missionType:
    | "attack"
    | "transport"
    | "deploy"
    | "espionage"
    | "colonize"
    | "recycle"
    | "expedition"
    | FleetMissionType
    | string
    | number;
  ships: Record<string | number, number>;
  cargo: { metal: number; crystal: number; deuterium: number };
  fuelRequired: number;
}

/**
 * Normalizes ship identifier into probe check.
 * Handles: 210, "210", "espionage-probe", "espionageProbe", "probe", etc.
 */
export function isEspionageProbeShip(shipKey: string | number): boolean {
  if (shipKey === 210 || shipKey === "210") return true;
  const normalized = String(shipKey).toLowerCase().replace(/[-_]/g, "");
  return (
    normalized === "espionageprobe" ||
    normalized === "probe" ||
    normalized === "casussondasi" ||
    normalized === "casussondası"
  );
}

/**
 * Calculates total cargo capacity from ship dictionary supporting both string keys and unitType numbers.
 */
export function calculateFleetCargoCapacity(
  ships: Record<string | number, number>
): number {
  let total = 0;
  for (const [key, count] of Object.entries(ships)) {
    if (count <= 0) continue;
    const num = Number(key);
    let meta = !isNaN(num)
      ? FLEET_SHIPS.find((s) => s.unitType === num)
      : undefined;

    if (!meta) {
      const normalizedKey = key.toLowerCase().replace(/[-_]/g, "");
      meta = FLEET_SHIPS.find(
        (s) =>
          s.key.toLowerCase().replace(/[-_]/g, "") === normalizedKey ||
          s.name.toLowerCase().replace(/[-_]/g, "") === normalizedKey
      );
    }

    if (meta) {
      total += meta.cargoCapacity * count;
    }
  }
  return total;
}

/**
 * Validates fleet cargo against cargo hold capacity and mission-specific rules.
 * Espionage missions with hybrid fleets (e.g. probes + cargo ships) CAN carry resources.
 * Only probe-only fleets are restricted from carrying resource cargo.
 */
export function validateFleetCargo(params: FleetValidationParams): {
  isValid: boolean;
  error?: string;
} {
  const { missionType, ships, cargo, fuelRequired } = params;

  // Toplam filo yük kapasitesi hesabı
  const totalCargoCapacity = calculateFleetCargoCapacity(ships);
  const totalResourceWeight =
    (cargo.metal || 0) + (cargo.crystal || 0) + (cargo.deuterium || 0);

  const isEspionage =
    missionType === "espionage" ||
    missionType === FleetMissionType.Espionage ||
    missionType === 6;

  // Sadece casus sondası var mı kontrolü
  const hasOnlyProbes = Object.entries(ships).every(
    ([shipId, count]) => count <= 0 || isEspionageProbeShip(shipId)
  );

  // 2. Casusluk görevi yük kontrolü (DÜZELTME)
  if (isEspionage) {
    // Sadece casus sondası varsa ve kargo taşınmaya çalışılıyorsa engelle
    if (hasOnlyProbes && totalResourceWeight > 0) {
      return {
        isValid: false,
        error: "Casus sondaları tek başına hammadde taşıyamaz.",
      };
    }

    // Sadece casus sondası varsa ve kargo 0 ise izin ver
    if (hasOnlyProbes && totalResourceWeight === 0) {
      return { isValid: true };
    }

    // Filoda nakliye/kargo taşıyabilen gemi varsa yük taşınmasına izin verilir
  }

  // 1. Kapasite aşım kontrolü
  if (totalResourceWeight > totalCargoCapacity) {
    return { isValid: false, error: "Filo kargo kapasitesi aşıldı." };
  }

  return { isValid: true };
}

