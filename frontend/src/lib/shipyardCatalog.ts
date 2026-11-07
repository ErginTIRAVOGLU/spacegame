export type ShipCategory = "combat" | "civil";

export interface ShipPrerequisite {
  label: string;
  requiredLevel: number;
  buildingKey?: string;
  researchType?: number;
  href: string;
}

export interface ShipDefinition {
  unitType: number;
  key: string;
  category: ShipCategory;
  name: string;
  description: string;
  metal: number;
  crystal: number;
  deuterium: number;
  prerequisites: ShipPrerequisite[];
}

export const SHIPYARD_CATALOG: ShipDefinition[] = [
  // A. Savaş Gemileri (Combat Ships)
  {
    unitType: 204,
    key: "lightFighter",
    category: "combat",
    name: "Hafif Avcı",
    description:
      "Neredeyse her gezegende karşına çıkabilecek çevik bir gemidir. Avantajı çok ucuz olması, dezavantajı ise yük taşıma kapasitesinin düşük ve de koruyucu kalkanın fazla güçlü olmaması.",
    metal: 3000,
    crystal: 1000,
    deuterium: 0,
    prerequisites: [
      { label: "Uzay Tersanesi", requiredLevel: 1, buildingKey: "shipyard", href: "/facilities" },
      { label: "Yanma Motoru", requiredLevel: 1, researchType: 115, href: "/research" },
    ],
  },
  {
    unitType: 205,
    key: "heavyFighter",
    category: "combat",
    name: "Ağır Avcı",
    description: "Hafif avcıya göre hem saldırı gücü daha yüksek hem de kalkanı daha güçlü.",
    metal: 6000,
    crystal: 4000,
    deuterium: 0,
    prerequisites: [
      { label: "Uzay Tersanesi", requiredLevel: 3, buildingKey: "shipyard", href: "/facilities" },
      { label: "Uzay Gemisi Zırhı", requiredLevel: 2, researchType: 111, href: "/research" },
      { label: "İtki Motoru", requiredLevel: 2, researchType: 117, href: "/research" },
    ],
  },
  {
    unitType: 206,
    key: "cruiser",
    category: "combat",
    name: "Kruvazör",
    description:
      "Kruvazör ağır avcıya göre 3 kat daha güçlü bir zırha, 2 kat daha güçlü vuruş gücüne sahip. Aynı zamanda çok hızlı.",
    metal: 20000,
    crystal: 7000,
    deuterium: 2000,
    prerequisites: [
      { label: "Uzay Tersanesi", requiredLevel: 5, buildingKey: "shipyard", href: "/facilities" },
      { label: "İtki Motoru", requiredLevel: 4, researchType: 117, href: "/research" },
      { label: "İyon Tekniği", requiredLevel: 2, researchType: 121, href: "/research" },
    ],
  },
  {
    unitType: 207,
    key: "battleship",
    category: "combat",
    name: "Komuta Gemisi",
    description:
      "Bir filonun sırtını dayadığı gemiler. Güçlü ve uzun menzilli silahları, çok hızlı olması ve de büyük ambarları ile bu gemi düşman için çok büyük bir sorundur.",
    metal: 45000,
    crystal: 15000,
    deuterium: 0,
    prerequisites: [
      { label: "Uzay Tersanesi", requiredLevel: 7, buildingKey: "shipyard", href: "/facilities" },
      { label: "Hiperuzay İticisi", requiredLevel: 4, researchType: 118, href: "/research" },
    ],
  },
  {
    unitType: 215,
    key: "battlecruiser",
    category: "combat",
    name: "Firkateyn",
    description: "En büyük özelliği düşman filolara karşı çok güçlü olmasıdır.",
    metal: 30000,
    crystal: 40000,
    deuterium: 15000,
    prerequisites: [
      { label: "Uzay Tersanesi", requiredLevel: 8, buildingKey: "shipyard", href: "/facilities" },
      { label: "Hiperuzay Tekniği", requiredLevel: 5, researchType: 114, href: "/research" },
      { label: "Lazer Tekniği", requiredLevel: 12, researchType: 120, href: "/research" },
      { label: "Hiperuzay İticisi", requiredLevel: 5, researchType: 118, href: "/research" },
    ],
  },
  {
    unitType: 211,
    key: "bomber",
    category: "combat",
    name: "Bombardıman Gemisi",
    description: "Bir gezegenin tüm savunma sistemini yok etmek için özellikle geliştirildiler.",
    metal: 50000,
    crystal: 25000,
    deuterium: 15000,
    prerequisites: [
      { label: "Uzay Tersanesi", requiredLevel: 8, buildingKey: "shipyard", href: "/facilities" },
      { label: "İtki Motoru", requiredLevel: 6, researchType: 117, href: "/research" },
      { label: "Plazma Tekniği", requiredLevel: 5, researchType: 122, href: "/research" },
    ],
  },
  {
    unitType: 213,
    key: "destroyer",
    category: "combat",
    name: "Muhrip",
    description: "Muhrip tüm savaş gemilerinin kralıdır.",
    metal: 60000,
    crystal: 50000,
    deuterium: 15000,
    prerequisites: [
      { label: "Uzay Tersanesi", requiredLevel: 9, buildingKey: "shipyard", href: "/facilities" },
      { label: "Hiperuzay İticisi", requiredLevel: 6, researchType: 118, href: "/research" },
      { label: "Hiperuzay Tekniği", requiredLevel: 5, researchType: 114, href: "/research" },
    ],
  },
  {
    unitType: 214,
    key: "deathstar",
    category: "combat",
    name: "Ölüm Yıldızı",
    description: "Ölüm Yıldızının yok etme gücü başka bir mekanizmada kesinlikle yoktur.",
    metal: 5000000,
    crystal: 4000000,
    deuterium: 1000000,
    prerequisites: [
      { label: "Uzay Tersanesi", requiredLevel: 12, buildingKey: "shipyard", href: "/facilities" },
      { label: "Graviton Araştırması", requiredLevel: 1, researchType: 199, href: "/research" },
      { label: "Hiperuzay İticisi", requiredLevel: 7, researchType: 118, href: "/research" },
      { label: "Hiperuzay Tekniği", requiredLevel: 6, researchType: 114, href: "/research" },
    ],
  },
  {
    unitType: 218,
    key: "reaper",
    category: "combat",
    name: "Azrail (Reaper)",
    description:
      "Bir Azrail sınıfı gemisi, savaştan hemen sonra enkaz alanlarını yağmalayabilen güçlü bir imha silahıdır.",
    metal: 85000,
    crystal: 55000,
    deuterium: 2000,
    prerequisites: [
      { label: "Uzay Tersanesi", requiredLevel: 10, buildingKey: "shipyard", href: "/facilities" },
      { label: "Hiperuzay İticisi", requiredLevel: 7, researchType: 118, href: "/research" },
      { label: "Hiperuzay Tekniği", requiredLevel: 6, researchType: 114, href: "/research" },
      { label: "Kalkan Tekniği", requiredLevel: 6, researchType: 110, href: "/research" },
    ],
  },
  {
    unitType: 219,
    key: "pathfinder",
    category: "combat",
    name: "Rehber (Pathfinder)",
    description:
      "Rehberler hızlı ve geniştir ve keşiflerde enkaz alanlarını sökebilirler. Ayrıca toplam kazanç da artar.",
    metal: 12000,
    crystal: 15000,
    deuterium: 8000,
    prerequisites: [
      { label: "Uzay Tersanesi", requiredLevel: 5, buildingKey: "shipyard", href: "/facilities" },
      { label: "Hiperuzay İticisi", requiredLevel: 2, researchType: 118, href: "/research" },
      { label: "Kalkan Tekniği", requiredLevel: 4, researchType: 110, href: "/research" },
    ],
  },

  // B. Sivil Gemiler (Civil Ships)
  {
    unitType: 202,
    key: "smallCargo",
    category: "civil",
    name: "Küçük Nakliye Gemisi",
    description: "Küçük nakliye gemisi hammaddeleri hızlıca başka gezegenlere taşıyabilen çevik gemidir.",
    metal: 2000,
    crystal: 2000,
    deuterium: 0,
    prerequisites: [
      { label: "Uzay Tersanesi", requiredLevel: 2, buildingKey: "shipyard", href: "/facilities" },
      { label: "Yanma Motoru", requiredLevel: 2, researchType: 115, href: "/research" },
    ],
  },
  {
    unitType: 203,
    key: "largeCargo",
    category: "civil",
    name: "Büyük Nakliye Gemisi",
    description:
      "Küçük Nakliye gemisinin geliştirilmiş halidir. Hem daha fazla yük taşır hem de modern ve güçlü itme sistemi sayesinde küçük nakliyeye göre çok daha hızlı hareket eder.",
    metal: 6000,
    crystal: 6000,
    deuterium: 0,
    prerequisites: [
      { label: "Uzay Tersanesi", requiredLevel: 4, buildingKey: "shipyard", href: "/facilities" },
      { label: "Yanma Motoru", requiredLevel: 6, researchType: 115, href: "/research" },
    ],
  },
  {
    unitType: 208,
    key: "colonyShip",
    category: "civil",
    name: "Koloni Gemisi",
    description: "Boş gezegenler bu gemi ile kolonileştirilebilir.",
    metal: 10000,
    crystal: 20000,
    deuterium: 10000,
    prerequisites: [
      { label: "Uzay Tersanesi", requiredLevel: 4, buildingKey: "shipyard", href: "/facilities" },
      { label: "İtki Motoru", requiredLevel: 3, researchType: 117, href: "/research" },
    ],
  },
  {
    unitType: 209,
    key: "recycler",
    category: "civil",
    name: "Geri Dönüşümcü",
    description: "Dönüşüm sayesinde enkazlardan yeniden kullanılmaya uygun ham madde kazanılır.",
    metal: 10000,
    crystal: 6000,
    deuterium: 2000,
    prerequisites: [
      { label: "Uzay Tersanesi", requiredLevel: 4, buildingKey: "shipyard", href: "/facilities" },
      { label: "Yanma Motoru", requiredLevel: 6, researchType: 115, href: "/research" },
      { label: "Kalkan Tekniği", requiredLevel: 2, researchType: 110, href: "/research" },
    ],
  },
  {
    unitType: 210,
    key: "espionageProbe",
    category: "civil",
    name: "Casus Sondası",
    description: "Çok küçük ve hareketli, uzaklardaki filo ve gezegenler hakkında bilgi sağlayan cisimler.",
    metal: 0,
    crystal: 1000,
    deuterium: 0,
    prerequisites: [
      { label: "Uzay Tersanesi", requiredLevel: 3, buildingKey: "shipyard", href: "/facilities" },
      { label: "Yanma Motoru", requiredLevel: 3, researchType: 115, href: "/research" },
      { label: "Casusluk Tekniği", requiredLevel: 2, researchType: 106, href: "/research" },
    ],
  },
  {
    unitType: 212,
    key: "solarSatellite",
    category: "civil",
    name: "Solar Uydu",
    description:
      "Solar Uydular solar hücrelerden oluşan yüksek yörüngede konuşlandırılmış platformlardır. Güneş ışığını toplar ve de lazer aracılığı ile yüzeydeki istasyona iletirler. Bu gezegen üzerinde bir solar uydu {SolarSatelliteEnergy} enerji üretiyor.",
    metal: 0,
    crystal: 2000,
    deuterium: 500,
    prerequisites: [
      { label: "Uzay Tersanesi", requiredLevel: 1, buildingKey: "shipyard", href: "/facilities" },
    ],
  },
  {
    unitType: 217,
    key: "crawler",
    category: "civil",
    name: "Paletli (Crawler)",
    description:
      "Paletli, görev gezegenlerinde metal, kristal ve deuterium üretimini parça başına %0.02, %0.02 ve %0.02 artırır. Koleksiyoncu olarak üretim de artar. Maksimum toplam bonus, maden ocaklarının toplam seviyesine bağlıdır.",
    metal: 2000,
    crystal: 2000,
    deuterium: 1000,
    prerequisites: [
      { label: "Uzay Tersanesi", requiredLevel: 5, buildingKey: "shipyard", href: "/facilities" },
      { label: "Yanma Motoru", requiredLevel: 4, researchType: 115, href: "/research" },
      { label: "Lazer Tekniği", requiredLevel: 4, researchType: 120, href: "/research" },
    ],
  },
];

export function calculateMaxAffordableUnits(
  ship: ShipDefinition,
  metal: number,
  crystal: number,
  deuterium: number
): number {
  const maxM = ship.metal > 0 ? Math.floor(metal / ship.metal) : Infinity;
  const maxC = ship.crystal > 0 ? Math.floor(crystal / ship.crystal) : Infinity;
  const maxD = ship.deuterium > 0 ? Math.floor(deuterium / ship.deuterium) : Infinity;
  const max = Math.min(maxM, maxC, maxD);
  return Number.isFinite(max) ? Math.max(0, max) : 0;
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

export interface PrerequisiteCheckResult {
  label: string;
  requiredLevel: number;
  currentLevel: number;
  met: boolean;
  type: "building" | "tech";
  href: string;
}

export function evaluateShipPrerequisites(
  ship: ShipDefinition,
  planetBuildings: { key: string; level: number }[],
  researches: Record<number, number>
): PrerequisiteCheckResult[] {
  return ship.prerequisites.map((req) => {
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

