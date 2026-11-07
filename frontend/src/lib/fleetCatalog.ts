export interface FleetShipMeta {
  unitType: number;
  key: string;
  name: string;
  category: "combat" | "civil";
  baseSpeed: number;
  fuelUsage: number;
  cargoCapacity: number;
  isMobile: boolean;
}

export const FLEET_SHIPS: FleetShipMeta[] = [
  // Savaş Gemileri (Combat Ships)
  {
    unitType: 204,
    key: "lightFighter",
    name: "Hafif Avcı",
    category: "combat",
    baseSpeed: 12500,
    fuelUsage: 20,
    cargoCapacity: 50,
    isMobile: true,
  },
  {
    unitType: 205,
    key: "heavyFighter",
    name: "Ağır Avcı",
    category: "combat",
    baseSpeed: 10000,
    fuelUsage: 75,
    cargoCapacity: 100,
    isMobile: true,
  },
  {
    unitType: 206,
    key: "cruiser",
    name: "Kruvazör",
    category: "combat",
    baseSpeed: 15000,
    fuelUsage: 300,
    cargoCapacity: 800,
    isMobile: true,
  },
  {
    unitType: 207,
    key: "battleship",
    name: "Komuta Gemisi",
    category: "combat",
    baseSpeed: 10000,
    fuelUsage: 500,
    cargoCapacity: 1500,
    isMobile: true,
  },
  {
    unitType: 215,
    key: "battlecruiser",
    name: "Firkateyn",
    category: "combat",
    baseSpeed: 10000,
    fuelUsage: 250,
    cargoCapacity: 750,
    isMobile: true,
  },
  {
    unitType: 211,
    key: "bomber",
    name: "Bombardıman Gemisi",
    category: "combat",
    baseSpeed: 4000,
    fuelUsage: 700,
    cargoCapacity: 500,
    isMobile: true,
  },
  {
    unitType: 213,
    key: "destroyer",
    name: "Muhrip",
    category: "combat",
    baseSpeed: 5000,
    fuelUsage: 1000,
    cargoCapacity: 2000,
    isMobile: true,
  },
  {
    unitType: 214,
    key: "deathstar",
    name: "Ölüm Yıldızı",
    category: "combat",
    baseSpeed: 100,
    fuelUsage: 1,
    cargoCapacity: 1000000,
    isMobile: true,
  },
  {
    unitType: 218,
    key: "reaper",
    name: "Azrail",
    category: "combat",
    baseSpeed: 7000,
    fuelUsage: 1100,
    cargoCapacity: 10000,
    isMobile: true,
  },
  {
    unitType: 219,
    key: "pathfinder",
    name: "Öncü",
    category: "combat",
    baseSpeed: 12000,
    fuelUsage: 300,
    cargoCapacity: 10000,
    isMobile: true,
  },

  // Sivil Gemiler (Civil Ships)
  {
    unitType: 202,
    key: "smallCargo",
    name: "Küçük Nakliye",
    category: "civil",
    baseSpeed: 5000,
    fuelUsage: 10,
    cargoCapacity: 5000,
    isMobile: true,
  },
  {
    unitType: 203,
    key: "largeCargo",
    name: "Büyük Nakliye",
    category: "civil",
    baseSpeed: 7500,
    fuelUsage: 50,
    cargoCapacity: 25000,
    isMobile: true,
  },
  {
    unitType: 208,
    key: "colonyShip",
    name: "Koloni Gemisi",
    category: "civil",
    baseSpeed: 2500,
    fuelUsage: 1000,
    cargoCapacity: 7500,
    isMobile: true,
  },
  {
    unitType: 209,
    key: "recycler",
    name: "Geri Dönüşümcü",
    category: "civil",
    baseSpeed: 2000,
    fuelUsage: 300,
    cargoCapacity: 20000,
    isMobile: true,
  },
  {
    unitType: 210,
    key: "espionageProbe",
    name: "Casus Sondası",
    category: "civil",
    baseSpeed: 100000000,
    fuelUsage: 1,
    cargoCapacity: 0,
    isMobile: true,
  },
];

export enum CoordinateType {
  Planet = 1,
  Debris = 2,
  Moon = 3,
}

export enum FleetMissionType {
  Attack = 1,
  AcsAttack = 2,
  Transport = 3,
  Deploy = 4,
  AcsDefend = 5,
  Espionage = 6,
  Colonize = 7,
  Recycle = 8,
  MoonDestruction = 9,
  Expedition = 15,
}

export interface MissionDefinition {
  type: FleetMissionType;
  key: string;
  label: string;
  description: string;
  iconName: string;
}

export const FLEET_MISSIONS: MissionDefinition[] = [
  {
    type: FleetMissionType.Attack,
    key: "attack",
    label: "Saldır",
    description: "Rakibinin filosuna ve savunmasına saldırarak kaynaklarını yağmala.",
    iconName: "crosshair",
  },
  {
    type: FleetMissionType.Transport,
    key: "transport",
    label: "Nakliye",
    description: "Hedef gezegene kargo ambarındaki kaynakları güvenle taşı.",
    iconName: "truck",
  },
  {
    type: FleetMissionType.Deploy,
    key: "deploy",
    label: "Konuşlanma",
    description: "Filoyu ve ambarındaki kaynakları kalıcı olarak kendi hedef üssüne naklet.",
    iconName: "anchor",
  },
  {
    type: FleetMissionType.Espionage,
    key: "espionage",
    label: "Casusluk",
    description: "Hedef koordinattaki binalar, savunma ve filolar hakkında anlık istihbarat topla.",
    iconName: "eye",
  },
  {
    type: FleetMissionType.Recycle,
    key: "recycle",
    label: "Geri Dönüşüm",
    description: "Uzay muharebelerinden geriye kalan enkaz alanını toplayarak kaynak elde et.",
    iconName: "recycle",
  },
  {
    type: FleetMissionType.Expedition,
    key: "expedition",
    label: "Keşif",
    description: "Bilinmeyen derin uzayı keşfetmek üzere 16. yuvaya araştırma filosu gönder.",
    iconName: "compass",
  },
  {
    type: FleetMissionType.AcsAttack,
    key: "acsAttack",
    label: "Ortaklaşa Saldırı",
    description: "Müttefik filolarla birleşerek hedefe eşzamanlı müşterek taarruz düzenle.",
    iconName: "swords",
  },
  {
    type: FleetMissionType.AcsDefend,
    key: "acsDefend",
    label: "Dur",
    description: "Müttefik gezegenin yörüngesinde savunma desteği sağlamak üzere beklemede kal.",
    iconName: "shieldCheck",
  },
  {
    type: FleetMissionType.Colonize,
    key: "colonize",
    label: "Sömürgeleştir",
    description: "Boş bir gezegen yuvasına yeni bir koloni kurmak üzere koloni gemisi sevk et.",
    iconName: "globe",
  },
  {
    type: FleetMissionType.MoonDestruction,
    key: "moonDestruction",
    label: "Yok Etmek",
    description: "Ölüm Yıldızının graviton ışını ile düşman ayını tamamen parçala.",
    iconName: "skull",
  },
];

export function calculateSpatialDistance(
  galaxy1: number,
  system1: number,
  slot1: number,
  galaxy2: number,
  system2: number,
  slot2: number
): number {
  if (galaxy1 !== galaxy2) {
    return Math.abs(galaxy1 - galaxy2) * 20000;
  }
  if (system1 !== system2) {
    return Math.abs(system1 - system2) * 95 + 2700;
  }
  if (slot1 !== slot2) {
    return Math.abs(slot1 - slot2) * 5 + 1000;
  }
  return 5;
}

export function calculateFlightDurationSeconds(
  distance: number,
  slowestSpeed: number,
  speedFactor: number = 1.0
): number {
  if (slowestSpeed <= 0) return 0;
  const factor = speedFactor > 1.0 ? speedFactor / 100.0 : speedFactor;
  if (factor <= 0) return 0;
  return Math.round(10.0 + (3500.0 / factor) * Math.sqrt((distance * 10.0) / slowestSpeed));
}

export function calculateSlowestSpeed(ships: Record<number, number>): number {
  let slowest: number | null = null;
  for (const [unitTypeStr, count] of Object.entries(ships)) {
    const unitType = Number(unitTypeStr);
    if (count <= 0) continue;
    const meta = FLEET_SHIPS.find((s) => s.unitType === unitType);
    if (!meta) continue;
    if (slowest === null || meta.baseSpeed < slowest) {
      slowest = meta.baseSpeed;
    }
  }
  return slowest ?? 0;
}

export function calculateTotalCargoCapacity(ships: Record<number, number>): number {
  let total = 0;
  for (const [unitTypeStr, count] of Object.entries(ships)) {
    const unitType = Number(unitTypeStr);
    if (count <= 0) continue;
    const meta = FLEET_SHIPS.find((s) => s.unitType === unitType);
    if (!meta) continue;
    total += meta.cargoCapacity * count;
  }
  return total;
}

export function calculateFuelConsumption(
  ships: Record<number, number>,
  distance: number
): number {
  let totalFuel = 0;
  for (const [unitTypeStr, count] of Object.entries(ships)) {
    const unitType = Number(unitTypeStr);
    if (count <= 0) continue;
    const meta = FLEET_SHIPS.find((s) => s.unitType === unitType);
    if (!meta) continue;
    totalFuel += 1.0 + Math.round(meta.fuelUsage * count * (distance / 35000.0));
  }
  return Math.max(1, totalFuel);
}

export function isMissionAvailable(
  mission: FleetMissionType,
  targetType: CoordinateType,
  targetSlot: number,
  ships: Record<number, number>,
  isTargetOwnPlanet: boolean,
  astroLevel: number
): { available: boolean; reason?: string } {
  const totalShips = Object.values(ships).reduce((sum, c) => sum + Math.max(0, c), 0);
  if (totalShips <= 0) {
    return { available: false, reason: "Filo seçilmedi." };
  }

  const probeCount = ships[210] ?? 0;
  const recyclerCount = (ships[209] ?? 0) + (ships[218] ?? 0);
  const colonyCount = ships[208] ?? 0;
  const deathstarCount = ships[214] ?? 0;

  switch (mission) {
    case FleetMissionType.Expedition:
      if (targetSlot !== 16) {
        return { available: false, reason: "Keşif yalnızca 16. yuvaya gönderilebilir." };
      }
      if (astroLevel <= 0) {
        return { available: false, reason: "Astrofizik araştırması gereklidir." };
      }
      return { available: true };

    case FleetMissionType.Espionage:
      if (probeCount <= 0) {
        return { available: false, reason: "Casusluk için en az 1 Casus Sondası gerekir." };
      }
      return { available: true };

    case FleetMissionType.Recycle:
      if (targetType !== CoordinateType.Debris) {
        return { available: false, reason: "Yalnızca Harabe Alanı hedeflenebilir." };
      }
      if (recyclerCount <= 0) {
        return { available: false, reason: "En az 1 Geri Dönüşümcü veya Azrail gerekir." };
      }
      return { available: true };

    case FleetMissionType.Deploy:
      if (!isTargetOwnPlanet) {
        return { available: false, reason: "Yalnızca kendi gezegen ve aylarınıza konuşlanabilirsiniz." };
      }
      return { available: true };

    case FleetMissionType.Transport:
      return { available: true };

    case FleetMissionType.Attack:
    case FleetMissionType.AcsAttack:
      if (targetSlot === 16) {
        return { available: false, reason: "16. yuvaya saldırı düzenlenemez." };
      }
      if (targetType === CoordinateType.Debris) {
        return { available: false, reason: "Harabe alanına saldırı düzenlenemez." };
      }
      return { available: true };

    case FleetMissionType.AcsDefend:
      if (targetSlot === 16 || targetType === CoordinateType.Debris) {
        return { available: false, reason: "Geçersiz hedef." };
      }
      return { available: true };

    case FleetMissionType.Colonize:
      if (colonyCount <= 0) {
        return { available: false, reason: "En az 1 Koloni Gemisi gerekir." };
      }
      if (targetSlot < 1 || targetSlot > 15 || targetType !== CoordinateType.Planet) {
        return { available: false, reason: "Yalnızca 1-15 arası boş gezegen yuvaları hedeflenebilir." };
      }
      return { available: true };

    case FleetMissionType.MoonDestruction:
      if (targetType !== CoordinateType.Moon) {
        return { available: false, reason: "Yalnızca Aylar yok edilebilir." };
      }
      if (deathstarCount <= 0) {
        return { available: false, reason: "Ay imhası için en az 1 Ölüm Yıldızı gerekir." };
      }
      return { available: true };

    default:
      return { available: true };
  }
}

export function formatFlightDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")} h`;
}

export function formatFlightDate(date: Date): string {
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();
  const h = String(date.getUTCHours()).padStart(2, "0");
  const m = String(date.getUTCMinutes()).padStart(2, "0");
  const s = String(date.getUTCSeconds()).padStart(2, "0");
  return `${day}.${month}.${year} ${h}:${m}:${s} Saat`;
}

