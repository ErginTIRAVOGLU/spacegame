export interface DefensePrerequisite {
  label: string;
  requiredLevel: number;
  buildingKey?: string;
  researchType?: number;
  href: string;
}

export interface DefenseDefinition {
  unitType: number;
  key: string;
  name: string;
  description: string;
  metal: number;
  crystal: number;
  deuterium: number;
  prerequisites: DefensePrerequisite[];
  isShieldDome?: boolean;
  isMissile?: boolean;
  missileSlotCost?: number;
}

export const DEFENSE_CATALOG: DefenseDefinition[] = [
  {
    unitType: 401,
    key: "rocketLauncher",
    name: "Roketatar",
    description: "Roketatar hem ucuz hem de çok basit bir savunma mekanizmasidir.",
    metal: 2000,
    crystal: 0,
    deuterium: 0,
    prerequisites: [
      { label: "Uzay Tersanesi", requiredLevel: 1, buildingKey: "shipyard", href: "/facilities" },
    ],
  },
  {
    unitType: 402,
    key: "lightLaser",
    name: "Hafif Lazer Topu",
    description:
      "Hedefin alisila geldik balistik silahlar yerine güdümlenmis olarak, fotonlar ile vurulmasi çok daha agir darbeler verir.",
    metal: 1500,
    crystal: 500,
    deuterium: 0,
    prerequisites: [
      { label: "Uzay Tersanesi", requiredLevel: 2, buildingKey: "shipyard", href: "/facilities" },
      { label: "Lazer Tekniği", requiredLevel: 3, researchType: 120, href: "/research" },
    ],
  },
  {
    unitType: 403,
    key: "heavyLaser",
    name: "Ağır Lazer Topu",
    description: "Hafif Lazer Topunun tutarli ve kararli bir çalisma sonucu ortaya çikan devami.",
    metal: 6000,
    crystal: 2000,
    deuterium: 0,
    prerequisites: [
      { label: "Uzay Tersanesi", requiredLevel: 4, buildingKey: "shipyard", href: "/facilities" },
      { label: "Enerji Tekniği", requiredLevel: 3, researchType: 113, href: "/research" },
      { label: "Lazer Tekniği", requiredLevel: 6, researchType: 120, href: "/research" },
    ],
  },
  {
    unitType: 404,
    key: "gaussCannon",
    name: "Gaus Topu",
    description: "Gaus topu tonlarca ağırlıktaki top mermilerini muazzam bir elektrik harcaması ile hızlandırır.",
    metal: 20000,
    crystal: 15000,
    deuterium: 2000,
    prerequisites: [
      { label: "Uzay Tersanesi", requiredLevel: 6, buildingKey: "shipyard", href: "/facilities" },
      { label: "Enerji Tekniği", requiredLevel: 6, researchType: 113, href: "/research" },
      { label: "Silah Tekniği", requiredLevel: 3, researchType: 109, href: "/research" },
      { label: "Kalkan Tekniği", requiredLevel: 1, researchType: 110, href: "/research" },
    ],
  },
  {
    unitType: 405,
    key: "ionCannon",
    name: "İyon Topu",
    description: "Iyon Topu elektronige zarar veren ve koruyucu kalkanlari destabilize eden iyon dalgalarini hizlandirir.",
    metal: 2000,
    crystal: 6000,
    deuterium: 0,
    prerequisites: [
      { label: "Uzay Tersanesi", requiredLevel: 4, buildingKey: "shipyard", href: "/facilities" },
      { label: "İyon Tekniği", requiredLevel: 4, researchType: 121, href: "/research" },
    ],
  },
  {
    unitType: 406,
    key: "plasmaTurret",
    name: "Plazma Atıcı",
    description:
      "Plazma toplari günes püskürmesi gücünü açiga çikarirlar ve bu toplarin yok edici gücü Muhriplerinkinden bile fazladir.",
    metal: 50000,
    crystal: 50000,
    deuterium: 30000,
    prerequisites: [
      { label: "Uzay Tersanesi", requiredLevel: 8, buildingKey: "shipyard", href: "/facilities" },
      { label: "Enerji Tekniği", requiredLevel: 8, researchType: 113, href: "/research" },
      { label: "Plazma Tekniği", requiredLevel: 7, researchType: 122, href: "/research" },
    ],
  },
  {
    unitType: 407,
    key: "smallShieldDome",
    name: "Küçük Kalkan Kubbesi",
    description: "Küçük kalkan kubbesi gezegenin çevresini, inanılmaz miktarlarda enerji emebilen bir alanla kaplar.",
    metal: 10000,
    crystal: 10000,
    deuterium: 0,
    isShieldDome: true,
    prerequisites: [
      { label: "Uzay Tersanesi", requiredLevel: 1, buildingKey: "shipyard", href: "/facilities" },
      { label: "Kalkan Tekniği", requiredLevel: 2, researchType: 110, href: "/research" },
    ],
  },
  {
    unitType: 408,
    key: "largeShieldDome",
    name: "Büyük Kalkan Kubbesi",
    description: "Büyük kalkan kubbesi saldırılara karşı koyabilmek için daha fazla enerji kullanabilir.",
    metal: 50000,
    crystal: 50000,
    deuterium: 0,
    isShieldDome: true,
    prerequisites: [
      { label: "Uzay Tersanesi", requiredLevel: 6, buildingKey: "shipyard", href: "/facilities" },
      { label: "Kalkan Tekniği", requiredLevel: 6, researchType: 110, href: "/research" },
    ],
  },
  {
    unitType: 502,
    key: "antiBallisticMissile",
    name: "Yakalayıcı Roketler (ABM)",
    description: "Yakalayıcı roketler saldırıya geçen gezegenler arası roketleri yok eder.",
    metal: 8000,
    crystal: 0,
    deuterium: 2000,
    isMissile: true,
    missileSlotCost: 1,
    prerequisites: [
      { label: "Roket Silosu", requiredLevel: 2, buildingKey: "missileSilo", href: "/facilities" },
    ],
  },
  {
    unitType: 503,
    key: "interplanetaryMissile",
    name: "Gezegenlerarası Roketler (IPM)",
    description:
      "Gezegenlerarasi Roketler rakip savunmayi yokederler. Gezegenler-arası sistemlerinizin {Range} menzil alanına sahiptir.",
    metal: 12500,
    crystal: 2500,
    deuterium: 10000,
    isMissile: true,
    missileSlotCost: 2,
    prerequisites: [
      { label: "Roket Silosu", requiredLevel: 4, buildingKey: "missileSilo", href: "/facilities" },
      { label: "İtki Motoru", requiredLevel: 1, researchType: 117, href: "/research" },
    ],
  },
];

export function calculateIpmRange(impulseDriveLevel: number): number {
  if (impulseDriveLevel <= 0) return 0;
  return impulseDriveLevel * 2 - 1;
}

export function calculateUnitDurationSeconds(
  metalCost: number,
  crystalCost: number,
  shipyardLevel: number,
  naniteLevel: number
): number {
  const denominator = 2500.0 * (1.0 + Math.max(0, shipyardLevel)) * Math.pow(2.0, Math.max(0, naniteLevel));
  return Math.max(1, Math.floor(((metalCost + crystalCost) / denominator) * 3600.0));
}

export interface MissileSiloStatus {
  siloLevel: number;
  totalCapacitySlots: number;
  usedSlots: number;
  remainingSlots: number;
  currentAbm: number;
  currentIpm: number;
}

export function calculateMissileSiloStatus(
  siloLevel: number,
  stationedUnits: { unitType: number; count: number }[],
  queuedBatches: { unitType: number; totalCount: number; completedCount: number }[]
): MissileSiloStatus {
  const currentAbmStationed = stationedUnits.find((u) => u.unitType === 502)?.count ?? 0;
  const currentIpmStationed = stationedUnits.find((u) => u.unitType === 503)?.count ?? 0;

  const abmQueued = queuedBatches
    .filter((q) => q.unitType === 502)
    .reduce((sum, q) => sum + Math.max(0, q.totalCount - q.completedCount), 0);

  const ipmQueued = queuedBatches
    .filter((q) => q.unitType === 503)
    .reduce((sum, q) => sum + Math.max(0, q.totalCount - q.completedCount), 0);

  const currentAbm = currentAbmStationed + abmQueued;
  const currentIpm = currentIpmStationed + ipmQueued;

  const totalCapacitySlots = Math.max(0, siloLevel) * 10;
  const usedSlots = currentAbm * 1 + currentIpm * 2;
  const remainingSlots = Math.max(0, totalCapacitySlots - usedSlots);

  return {
    siloLevel,
    totalCapacitySlots,
    usedSlots,
    remainingSlots,
    currentAbm,
    currentIpm,
  };
}

export function calculateMaxAffordableDefenses(
  defense: DefenseDefinition,
  metal: number,
  crystal: number,
  deuterium: number,
  stationedUnits: { unitType: number; count: number }[],
  queuedBatches: { unitType: number; totalCount: number; completedCount: number }[],
  siloLevel: number
): number {
  // 1. Resource limits
  const metalCap = defense.metal > 0 ? Math.floor(metal / defense.metal) : Infinity;
  const crystalCap = defense.crystal > 0 ? Math.floor(crystal / defense.crystal) : Infinity;
  const deutCap = defense.deuterium > 0 ? Math.floor(deuterium / defense.deuterium) : Infinity;
  const resourceMax = Math.min(metalCap, crystalCap, deutCap);

  if (resourceMax <= 0) return 0;

  // 2. Shield Dome limit (max 1 per planet across stationed + queued)
  if (defense.isShieldDome) {
    const stationed = stationedUnits.find((u) => u.unitType === defense.unitType)?.count ?? 0;
    const queued = queuedBatches
      .filter((q) => q.unitType === defense.unitType)
      .reduce((sum, q) => sum + Math.max(0, q.totalCount - q.completedCount), 0);

    if (stationed + queued >= 1) {
      return 0;
    }
    return Math.min(1, resourceMax);
  }

  // 3. Missile Silo slots limit
  if (defense.isMissile) {
    const silo = calculateMissileSiloStatus(siloLevel, stationedUnits, queuedBatches);
    const slotCost = defense.missileSlotCost ?? 1;
    const siloAllowed = Math.floor(silo.remainingSlots / slotCost);
    return Math.max(0, Math.min(resourceMax, siloAllowed));
  }

  return Math.max(0, resourceMax);
}

export interface DefensePrerequisiteCheckResult {
  label: string;
  requiredLevel: number;
  currentLevel: number;
  met: boolean;
  type: "building" | "tech";
  href: string;
}

export function evaluateDefensePrerequisites(
  defense: DefenseDefinition,
  planetBuildings: { key: string; level: number }[],
  researches: Record<number, number>
): DefensePrerequisiteCheckResult[] {
  return defense.prerequisites.map((req) => {
    if (req.buildingKey) {
      const cur = planetBuildings.find((b) => b.key === req.buildingKey)?.level ?? 0;
      const isFacility = [
        "roboticsFactory",
        "shipyard",
        "researchLab",
        "allianceDepot",
        "missileSilo",
        "naniteFactory",
        "terraformer",
        "spaceDock",
      ].includes(req.buildingKey);
      const targetPage = isFacility ? "/facilities" : "/resources";
      const href = req.href && req.href.includes("?")
        ? req.href
        : `${targetPage}?building=${req.buildingKey}`;
      return {
        label: req.label,
        requiredLevel: req.requiredLevel,
        currentLevel: cur,
        met: cur >= req.requiredLevel,
        type: "building",
        href,
      };
    }
    const cur = req.researchType ? researches[req.researchType] ?? 0 : 0;
    const href = req.researchType
      ? `/research?tech=${req.researchType}`
      : req.href ?? "/research";
    return {
      label: req.label,
      requiredLevel: req.requiredLevel,
      currentLevel: cur,
      met: cur >= req.requiredLevel,
      type: "tech",
      href,
    };
  });
}

