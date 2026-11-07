export type ResearchCategory = "basic" | "drive" | "advanced" | "combat";

export interface TechPrerequisite {
  researchType: number;
  label: string;
  requiredLevel: number;
}

export interface ResearchDefinition {
  researchType: number;
  key: string;
  category: ResearchCategory;
  name: string;
  description: string;
  baseMetal: number;
  baseCrystal: number;
  baseDeut: number;
  costFactor: number;
  minLabLevel: number;
  prerequisites: TechPrerequisite[];
  specialRequirement?: string;
}

export const RESEARCH_CATALOG: ResearchDefinition[] = [
  // A. Temel Araştırmalar (Basic Researches)
  {
    researchType: 113,
    key: "energyTech",
    category: "basic",
    name: "Enerji Tekniği",
    description: "Birçok yeni teknoloji için farklı enerji türlerine hakim olmak gerekir.",
    baseMetal: 0,
    baseCrystal: 800,
    baseDeut: 400,
    costFactor: 2.0,
    minLabLevel: 1,
    prerequisites: [],
  },
  {
    researchType: 120,
    key: "laserTech",
    category: "basic",
    name: "Lazer Tekniği",
    description: "Işığın demetlenmesi sonucu oluşan ışın, çarptığı maddeye hasar verir.",
    baseMetal: 200,
    baseCrystal: 100,
    baseDeut: 0,
    costFactor: 2.0,
    minLabLevel: 1,
    prerequisites: [
      { researchType: 113, label: "Enerji Tekniği", requiredLevel: 2 },
    ],
  },
  {
    researchType: 121,
    key: "ionTech",
    category: "basic",
    name: "İyon Tekniği",
    description:
      "İyonların yoğunlaşması, ağır hasara yol açabilen ve binaların yıkım masraflarını seviye başı %4 düşüren topların inşa edilmesini sağlar.",
    baseMetal: 1000,
    baseCrystal: 300,
    baseDeut: 100,
    costFactor: 2.0,
    minLabLevel: 4,
    prerequisites: [
      { researchType: 113, label: "Enerji Tekniği", requiredLevel: 4 },
      { researchType: 120, label: "Lazer Tekniği", requiredLevel: 5 },
    ],
  },
  {
    researchType: 114,
    key: "hyperspaceTech",
    category: "basic",
    name: "Hiperuzay Tekniği",
    description:
      "Dördüncü ve beşinci boyutları birleştirerek, artık daha ekonomik ve daha güçlü olan yeni bir iticiyi keşfetmek mümkün. Dördüncü ve beşinci boyutları kullanarak, artık gemilerinin ambarını yerden tasarruf edecek şekilde bükmek mümkün.",
    baseMetal: 0,
    baseCrystal: 4000,
    baseDeut: 2000,
    costFactor: 2.0,
    minLabLevel: 7,
    prerequisites: [
      { researchType: 113, label: "Enerji Tekniği", requiredLevel: 5 },
      { researchType: 110, label: "Kalkan Tekniği", requiredLevel: 5 },
    ],
  },

  // B. Sürüş Araştırması (Drive Researches)
  {
    researchType: 122,
    key: "plasmaTech",
    category: "drive",
    name: "Plazma Tekniği",
    description:
      "Büyük hasarlar verebilen, yüksek enerjiye sahip plazmayı hızlandıran ve ayrıca metal, kristal ve deuterium üretimini (seviye başına %1/%0.66/%0.33) optimize eden iyon tekniğinin geliştirilmesi.",
    baseMetal: 2000,
    baseCrystal: 4000,
    baseDeut: 1000,
    costFactor: 2.0,
    minLabLevel: 4,
    prerequisites: [
      { researchType: 113, label: "Enerji Tekniği", requiredLevel: 8 },
      { researchType: 120, label: "Lazer Tekniği", requiredLevel: 10 },
      { researchType: 121, label: "İyon Tekniği", requiredLevel: 5 },
    ],
  },
  {
    researchType: 115,
    key: "combustionDrive",
    category: "drive",
    name: "Yanma Motoru",
    description:
      "Bu motorların geliştirilmesi bazı gemileri daha hızlı yapar. Her seviye, hızı temel değerinin %10`u kadar artırır.",
    baseMetal: 400,
    baseCrystal: 0,
    baseDeut: 600,
    costFactor: 2.0,
    minLabLevel: 1,
    prerequisites: [
      { researchType: 113, label: "Enerji Tekniği", requiredLevel: 1 },
    ],
  },
  {
    researchType: 117,
    key: "impulseDrive",
    category: "drive",
    name: "İtki Motoru",
    description:
      "İtki motoru geri itme prensibine dayanır. Bu motorların geliştirilmesi, bazı gemilerin hızını temel değerin %20`si oranında artırır.",
    baseMetal: 2000,
    baseCrystal: 4000,
    baseDeut: 600,
    costFactor: 2.0,
    minLabLevel: 2,
    prerequisites: [
      { researchType: 113, label: "Enerji Tekniği", requiredLevel: 1 },
    ],
  },
  {
    researchType: 118,
    key: "hyperspaceDrive",
    category: "drive",
    name: "Hiperuzay İticisi",
    description:
      "Hiperuzay teknolojisi, dördüncü ve beşinci boyutların entegrasyonu aracılığıyla uzayın hedeflenen eğilmesidir. Bu teknolojinin her seviyesi, gemilerini temel değerin %30`u oranında hızlandırır.",
    baseMetal: 10000,
    baseCrystal: 20000,
    baseDeut: 6000,
    costFactor: 2.0,
    minLabLevel: 7,
    prerequisites: [
      { researchType: 114, label: "Hiperuzay Tekniği", requiredLevel: 3 },
    ],
  },

  // C. Gelişmiş Araştırmalar (Advanced Researches)
  {
    researchType: 106,
    key: "espionageTech",
    category: "advanced",
    name: "Casusluk Tekniği",
    description: "Diğer gezegenler ve aylardan bu teknoloji sayesinde bilgiler elde edilebilir.",
    baseMetal: 200,
    baseCrystal: 1000,
    baseDeut: 200,
    costFactor: 2.0,
    minLabLevel: 3,
    prerequisites: [],
  },
  {
    researchType: 108,
    key: "computerTech",
    category: "advanced",
    name: "Bilgisayar Tekniği",
    description:
      "Bilgisayar kapasitesinin artırılması ile daha fazla filo komuta edilebilir. Her bilgisayar tekniği seviyesi, maksimum filo sayısını bir oranında artırır.",
    baseMetal: 0,
    baseCrystal: 400,
    baseDeut: 600,
    costFactor: 2.0,
    minLabLevel: 1,
    prerequisites: [],
  },
  {
    researchType: 124,
    key: "astrophysics",
    category: "advanced",
    name: "Astrofizik",
    description:
      "Araştırma modülü olan gemiler yeni keşiflere çıkabilir. Bu teknolojinin iki yeni seviyesi için başka bir gezegen kolonileştirilebilir.",
    baseMetal: 4000,
    baseCrystal: 8000,
    baseDeut: 4000,
    costFactor: 1.75,
    minLabLevel: 3,
    prerequisites: [
      { researchType: 106, label: "Casusluk Tekniği", requiredLevel: 4 },
      { researchType: 117, label: "İtki Motoru", requiredLevel: 3 },
    ],
  },
  {
    researchType: 123,
    key: "irn",
    category: "advanced",
    name: "Galaksiler Arası Araştırma Ağı (IRN)",
    description: "Farklı gezegenlerden araştırmacılar birbirleriyle bu ağ üzerinden iletişim kurarlar.",
    baseMetal: 240000,
    baseCrystal: 400000,
    baseDeut: 160000,
    costFactor: 2.0,
    minLabLevel: 10,
    prerequisites: [
      { researchType: 108, label: "Bilgisayar Tekniği", requiredLevel: 8 },
      { researchType: 114, label: "Hiperuzay Tekniği", requiredLevel: 8 },
    ],
  },

  // D. Savaş Araştırması (Combat Researches)
  {
    researchType: 199,
    key: "gravitonTech",
    category: "combat",
    name: "Graviton Araştırması",
    description:
      "Yoğun graviton parçacıkları yüklü saldırılar sayesinde yapay bir yer çekimi alanı oluşturulabilir. Büyük gemileri veya ayları bile yok etme potansiyeline sahiptir.",
    baseMetal: 0,
    baseCrystal: 0,
    baseDeut: 0,
    costFactor: 3.0,
    minLabLevel: 12,
    prerequisites: [],
    specialRequirement: "300.000 Gezegen Üretilen Enerjisi",
  },
  {
    researchType: 109,
    key: "weaponsTech",
    category: "combat",
    name: "Silah Tekniği",
    description:
      "Silah tekniği, tüm silah sistemlerinin performansını artırır ve böylece seviye başına her bir birimin atış gücü, temel değerinin %10`u oranında artar.",
    baseMetal: 800,
    baseCrystal: 200,
    baseDeut: 0,
    costFactor: 2.0,
    minLabLevel: 4,
    prerequisites: [],
  },
  {
    researchType: 110,
    key: "shieldingTech",
    category: "combat",
    name: "Kalkan Tekniği",
    description:
      "Kalkan teknigi gemilerin ve savunma binalarının kalkanlarını daha verimli hale getirir. Her seviye, verimliliği temel değerinin %10`u kadar artırır.",
    baseMetal: 200,
    baseCrystal: 600,
    baseDeut: 0,
    costFactor: 2.0,
    minLabLevel: 6,
    prerequisites: [
      { researchType: 113, label: "Enerji Tekniği", requiredLevel: 3 },
    ],
  },
  {
    researchType: 111,
    key: "armourTech",
    category: "combat",
    name: "Uzay Gemisi Zırhı",
    description:
      "Özel alaşımlar uzay gemilerinin zırhını sürekli geliştirir. Zırhın etkinliği, seviye başına %10 artırılabilir.",
    baseMetal: 1000,
    baseCrystal: 0,
    baseDeut: 0,
    costFactor: 2.0,
    minLabLevel: 2,
    prerequisites: [],
  },
];

export function calculateResearchCost(def: ResearchDefinition, currentLevel: number) {
  const targetLevel = currentLevel + 1;
  const multiplier = Math.pow(def.costFactor, targetLevel - 1);
  const metal = Math.floor(def.baseMetal * multiplier);
  const crystal = Math.floor(def.baseCrystal * multiplier);
  const deuterium = Math.floor(def.baseDeut * multiplier);
  return { targetLevel, metal, crystal, deuterium };
}

export function calculateEffectiveLabLevel(
  originLabLevel: number,
  otherPlanetLabs: number[],
  irnLevel: number,
  minLabLevel: number
): number {
  if (originLabLevel < minLabLevel) {
    return 0;
  }
  const eligibleOthers = (otherPlanetLabs || [])
    .filter((lvl) => lvl >= minLabLevel)
    .sort((a, b) => b - a)
    .slice(0, Math.max(0, irnLevel));

  const totalOther = eligibleOthers.reduce((sum, lvl) => sum + lvl, 0);
  return originLabLevel + totalOther;
}

export function calculateResearchDurationSeconds(
  metalCost: number,
  crystalCost: number,
  effectiveLabLevel: number,
  universeResearchSpeed = 5,
  researchDurationMultiplier = 1.0
): number {
  const denominator = 1000.0 * (1.0 + Math.max(0, effectiveLabLevel));
  const rawHours = (metalCost + crystalCost) / denominator;
  const totalSeconds =
    ((rawHours * 3600.0) / Math.max(1, universeResearchSpeed)) *
    researchDurationMultiplier;
  return Math.max(1, Math.floor(totalSeconds));
}

export interface PrerequisiteCheckResult {
  label: string;
  requiredLevel: number;
  currentLevel: number;
  met: boolean;
  type: "lab" | "tech" | "energy";
}

export function evaluateResearchPrerequisites(
  def: ResearchDefinition,
  originLabLevel: number,
  researches: Record<number, number>,
  producedEnergy = 0
): PrerequisiteCheckResult[] {
  const results: PrerequisiteCheckResult[] = [];

  // 1. Origin Planet Lab Check
  results.push({
    label: "Bilimsel Araştırma Laboratuvarı",
    requiredLevel: def.minLabLevel,
    currentLevel: originLabLevel,
    met: originLabLevel >= def.minLabLevel,
    type: "lab",
  });

  // 2. Parent Tech Checks
  for (const req of def.prerequisites) {
    const cur = researches[req.researchType] ?? 0;
    results.push({
      label: req.label,
      requiredLevel: req.requiredLevel,
      currentLevel: cur,
      met: cur >= req.requiredLevel,
      type: "tech",
    });
  }

  // 3. Special Requirement (Graviton)
  if (def.researchType === 199) {
    results.push({
      label: "Gezegen Enerji Üretimi (300.000)",
      requiredLevel: 300000,
      currentLevel: Math.floor(producedEnergy),
      met: producedEnergy >= 300000,
      type: "energy",
    });
  }

  return results;
}

