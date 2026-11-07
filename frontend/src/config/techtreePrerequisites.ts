export interface TechRequirement {
  id: string;
  name: string;
  requiredLevel: number;
}

export interface TechTreeNode {
  id: string;
  name: string;
  category: "buildings" | "research" | "ships" | "defense" | "missiles";
  requirements: TechRequirement[];
}

export interface EvaluatedRequirement {
  id: string;
  name: string;
  requiredLevel: number;
  currentLevel: number;
  isMet: boolean;
  href: string;
}

export interface EvaluatedTechNode extends TechTreeNode {
  currentLevel: number;
  isUnlocked: boolean;
  evaluatedRequirements: EvaluatedRequirement[];
  href: string;
}

export const TECH_ID_TO_METADATA: Record<
  string,
  {
    type: "building" | "research" | "ship" | "defense" | "missile";
    buildingKey?: string;
    buildingType?: number;
    researchId?: number;
    unitType?: number;
    href: string;
  }
> = {
  // ==================== BİNALAR & TESİSLER ====================
  "metal-mine": { type: "building", buildingKey: "metalMine", buildingType: 1, href: "/resources?focus=metalMine" },
  "crystal-mine": { type: "building", buildingKey: "crystalMine", buildingType: 2, href: "/resources?focus=crystalMine" },
  "deut-synth": { type: "building", buildingKey: "deuteriumSynthesizer", buildingType: 3, href: "/resources?focus=deuteriumSynthesizer" },
  "solar-plant": { type: "building", buildingKey: "solarPlant", buildingType: 4, href: "/resources?focus=solarPlant" },
  "fusion-reactor": { type: "building", buildingKey: "fusionReactor", buildingType: 5, href: "/resources?focus=fusionReactor" },
  "robot-factory": { type: "building", buildingKey: "roboticsFactory", buildingType: 14, href: "/facilities?focus=roboticsFactory" },
  "nano-factory": { type: "building", buildingKey: "naniteFactory", buildingType: 15, href: "/facilities?focus=naniteFactory" },
  "shipyard": { type: "building", buildingKey: "shipyard", buildingType: 21, href: "/facilities?focus=shipyard" },
  "metal-storage": { type: "building", buildingKey: "metalStorage", buildingType: 22, href: "/resources?focus=metalStorage" },
  "crystal-storage": { type: "building", buildingKey: "crystalStorage", buildingType: 23, href: "/resources?focus=crystalStorage" },
  "deut-tank": { type: "building", buildingKey: "deuteriumTank", buildingType: 24, href: "/resources?focus=deuteriumTank" },
  "research-lab": { type: "building", buildingKey: "researchLab", buildingType: 31, href: "/facilities?focus=researchLab" },
  "terraformer": { type: "building", buildingKey: "terraformer", buildingType: 33, href: "/facilities?focus=terraformer" },
  "alliance-depot": { type: "building", buildingKey: "allianceDepot", buildingType: 34, href: "/facilities?focus=allianceDepot" },
  "space-dock": { type: "building", buildingKey: "spaceDock", buildingType: 36, href: "/facilities?focus=spaceDock" },
  "lunar-base": { type: "building", buildingKey: "lunarBase", buildingType: 41, href: "/facilities?focus=lunarBase" },
  "sensor-phalanx": { type: "building", buildingKey: "sensorPhalanx", buildingType: 42, href: "/facilities?focus=sensorPhalanx" },
  "jump-gate": { type: "building", buildingKey: "jumpGate", buildingType: 43, href: "/facilities?focus=jumpGate" },
  "missile-silo": { type: "building", buildingKey: "missileSilo", buildingType: 44, href: "/facilities?focus=missileSilo" },

  // ==================== ARAŞTIRMA ====================
  "espionage-tech": { type: "research", researchId: 106, href: "/research?focus=espionageTechnology" },
  "computer-tech": { type: "research", researchId: 108, href: "/research?focus=computerTechnology" },
  "weapons-tech": { type: "research", researchId: 109, href: "/research?focus=weaponsTechnology" },
  "shield-tech": { type: "research", researchId: 110, href: "/research?focus=shieldingTechnology" },
  "armor-tech": { type: "research", researchId: 111, href: "/research?focus=armorTechnology" },
  "energy-tech": { type: "research", researchId: 113, href: "/research?focus=energyTechnology" },
  "hyperspace-tech": { type: "research", researchId: 114, href: "/research?focus=hyperspaceTechnology" },
  "combustion-drive": { type: "research", researchId: 115, href: "/research?focus=combustionDrive" },
  "impulse-drive": { type: "research", researchId: 117, href: "/research?focus=impulseDrive" },
  "hyperspace-drive": { type: "research", researchId: 118, href: "/research?focus=hyperspaceDrive" },
  "laser-tech": { type: "research", researchId: 120, href: "/research?focus=laserTechnology" },
  "ion-tech": { type: "research", researchId: 121, href: "/research?focus=ionTechnology" },
  "plasma-tech": { type: "research", researchId: 122, href: "/research?focus=plasmaTechnology" },
  "irn-tech": { type: "research", researchId: 123, href: "/research?focus=intergalacticResearchNetwork" },
  "astrophysics": { type: "research", researchId: 124, href: "/research?focus=astrophysics" },
  "graviton-tech": { type: "research", researchId: 199, href: "/research?focus=gravitonTechnology" },

  // ==================== GEMİLER ====================
  "small-cargo": { type: "ship", unitType: 202, href: "/shipyard?focus=smallCargo" },
  "large-cargo": { type: "ship", unitType: 203, href: "/shipyard?focus=largeCargo" },
  "light-fighter": { type: "ship", unitType: 204, href: "/shipyard?focus=lightFighter" },
  "heavy-fighter": { type: "ship", unitType: 205, href: "/shipyard?focus=heavyFighter" },
  "cruiser": { type: "ship", unitType: 206, href: "/shipyard?focus=cruiser" },
  "battleship": { type: "ship", unitType: 207, href: "/shipyard?focus=battleship" },
  "colony-ship": { type: "ship", unitType: 208, href: "/shipyard?focus=colonyShip" },
  "recycler": { type: "ship", unitType: 209, href: "/shipyard?focus=recycler" },
  "espionage-probe": { type: "ship", unitType: 210, href: "/shipyard?focus=espionageProbe" },
  "bomber": { type: "ship", unitType: 211, href: "/shipyard?focus=bomber" },
  "solar-satellite": { type: "ship", unitType: 212, href: "/shipyard?focus=solarSatellite" },
  "destroyer": { type: "ship", unitType: 213, href: "/shipyard?focus=destroyer" },
  "deathstar": { type: "ship", unitType: 214, href: "/shipyard?focus=deathstar" },
  "battlecruiser": { type: "ship", unitType: 215, href: "/shipyard?focus=battlecruiser" },
  "crawler": { type: "ship", unitType: 217, href: "/shipyard?focus=crawler" },
  "reaper": { type: "ship", unitType: 218, href: "/shipyard?focus=reaper" },
  "pathfinder": { type: "ship", unitType: 219, href: "/shipyard?focus=pathfinder" },

  // ==================== SAVUNMA ====================
  "rocket-launcher": { type: "defense", unitType: 401, href: "/defenses?focus=rocketLauncher" },
  "light-laser": { type: "defense", unitType: 402, href: "/defenses?focus=lightLaser" },
  "heavy-laser": { type: "defense", unitType: 403, href: "/defenses?focus=heavyLaser" },
  "gauss-cannon": { type: "defense", unitType: 404, href: "/defenses?focus=gaussCannon" },
  "ion-cannon": { type: "defense", unitType: 405, href: "/defenses?focus=ionCannon" },
  "plasma-turret": { type: "defense", unitType: 406, href: "/defenses?focus=plasmaTurret" },
  "small-shield-dome": { type: "defense", unitType: 407, href: "/defenses?focus=smallShieldDome" },
  "large-shield-dome": { type: "defense", unitType: 408, href: "/defenses?focus=largeShieldDome" },

  // ==================== ROKETLER ====================
  "anti-ballistic-missile": { type: "missile", unitType: 502, href: "/defenses?focus=antiBallisticMissile" },
  "interplanetary-missile": { type: "missile", unitType: 503, href: "/defenses?focus=interplanetaryMissile" },
};

export const TECH_TREE_DATA: TechTreeNode[] = [
  // ==================== İNŞA (BİNALAR & TESİSLER) ====================
  { id: "metal-mine", name: "Metal Madeni", category: "buildings", requirements: [] },
  { id: "crystal-mine", name: "Kristal Madeni", category: "buildings", requirements: [] },
  { id: "deut-synth", name: "Deuterium Sentezleyicisi", category: "buildings", requirements: [] },
  { id: "solar-plant", name: "Solar Enerji Santrali", category: "buildings", requirements: [] },
  {
    id: "fusion-reactor",
    name: "Füzyoenerji Santrali",
    category: "buildings",
    requirements: [
      { id: "deut-synth", name: "Deuterium Sentezleyicisi", requiredLevel: 5 },
      { id: "energy-tech", name: "Enerji tekniği", requiredLevel: 3 },
    ],
  },
  { id: "robot-factory", name: "Robot Fabrikası", category: "buildings", requirements: [] },
  {
    id: "nano-factory",
    name: "Nanit Fabrikasi",
    category: "buildings",
    requirements: [
      { id: "robot-factory", name: "Robot Fabrikası", requiredLevel: 10 },
      { id: "computer-tech", name: "Bilgisayar Tekniği", requiredLevel: 10 },
    ],
  },
  {
    id: "shipyard",
    name: "Uzay Tersanesi",
    category: "buildings",
    requirements: [
      { id: "robot-factory", name: "Robot Fabrikası", requiredLevel: 2 },
    ],
  },
  { id: "metal-storage", name: "Metal Deposu", category: "buildings", requirements: [] },
  { id: "crystal-storage", name: "Kristal Deposu", category: "buildings", requirements: [] },
  { id: "deut-tank", name: "Deuterium Tankeri", category: "buildings", requirements: [] },
  { id: "research-lab", name: "Bilimsel Araştırma Laboratuvarı", category: "buildings", requirements: [] },
  {
    id: "terraformer",
    name: "Terraformer",
    category: "buildings",
    requirements: [
      { id: "nano-factory", name: "Nanit Fabrikasi", requiredLevel: 1 },
      { id: "energy-tech", name: "Enerji tekniği", requiredLevel: 12 },
    ],
  },
  { id: "alliance-depot", name: "Ittifak Deposu", category: "buildings", requirements: [] },
  {
    id: "space-dock",
    name: "Uzay İskelesi",
    category: "buildings",
    requirements: [
      { id: "shipyard", name: "Uzay Tersanesi", requiredLevel: 2 },
    ],
  },
  { id: "lunar-base", name: "Ay Merkez Istasyonu", category: "buildings", requirements: [] },
  {
    id: "sensor-phalanx",
    name: "Radar Istasyonu",
    category: "buildings",
    requirements: [
      { id: "lunar-base", name: "Ay Merkez Istasyonu", requiredLevel: 1 },
    ],
  },
  {
    id: "jump-gate",
    name: "Siçrama Geçidi",
    category: "buildings",
    requirements: [
      { id: "lunar-base", name: "Ay Merkez Istasyonu", requiredLevel: 1 },
      { id: "hyperspace-tech", name: "Hiperuzay tekniği", requiredLevel: 7 },
    ],
  },
  {
    id: "missile-silo",
    name: "Roket Silosu",
    category: "buildings",
    requirements: [
      { id: "shipyard", name: "Uzay Tersanesi", requiredLevel: 1 },
    ],
  },

  // ==================== ARAŞTIRMA ====================
  {
    id: "espionage-tech",
    name: "Casusluk tekniği",
    category: "research",
    requirements: [
      { id: "research-lab", name: "Bilimsel Araştırma Laboratuvarı", requiredLevel: 3 },
    ],
  },
  {
    id: "computer-tech",
    name: "Bilgisayar Tekniği",
    category: "research",
    requirements: [
      { id: "research-lab", name: "Bilimsel Araştırma Laboratuvarı", requiredLevel: 1 },
    ],
  },
  {
    id: "weapons-tech",
    name: "Silah tekniği",
    category: "research",
    requirements: [
      { id: "research-lab", name: "Bilimsel Araştırma Laboratuvarı", requiredLevel: 4 },
    ],
  },
  {
    id: "shield-tech",
    name: "Kalkan tekniği",
    category: "research",
    requirements: [
      { id: "research-lab", name: "Bilimsel Araştırma Laboratuvarı", requiredLevel: 6 },
      { id: "energy-tech", name: "Enerji tekniği", requiredLevel: 3 },
    ],
  },
  {
    id: "armor-tech",
    name: "Uzay gemisi zırhı",
    category: "research",
    requirements: [
      { id: "research-lab", name: "Bilimsel Araştırma Laboratuvarı", requiredLevel: 2 },
    ],
  },
  {
    id: "energy-tech",
    name: "Enerji tekniği",
    category: "research",
    requirements: [
      { id: "research-lab", name: "Bilimsel Araştırma Laboratuvarı", requiredLevel: 1 },
    ],
  },
  {
    id: "hyperspace-tech",
    name: "Hiperuzay tekniği",
    category: "research",
    requirements: [
      { id: "research-lab", name: "Bilimsel Araştırma Laboratuvarı", requiredLevel: 7 },
      { id: "energy-tech", name: "Enerji tekniği", requiredLevel: 5 },
      { id: "shield-tech", name: "Kalkan tekniği", requiredLevel: 5 },
    ],
  },
  {
    id: "combustion-drive",
    name: "Yanma motoru",
    category: "research",
    requirements: [
      { id: "research-lab", name: "Bilimsel Araştırma Laboratuvarı", requiredLevel: 1 },
      { id: "energy-tech", name: "Enerji tekniği", requiredLevel: 1 },
    ],
  },
  {
    id: "impulse-drive",
    name: "İtki motoru",
    category: "research",
    requirements: [
      { id: "research-lab", name: "Bilimsel Araştırma Laboratuvarı", requiredLevel: 2 },
      { id: "energy-tech", name: "Enerji tekniği", requiredLevel: 1 },
    ],
  },
  {
    id: "hyperspace-drive",
    name: "Hiperuzay iticisi",
    category: "research",
    requirements: [
      { id: "research-lab", name: "Bilimsel Araştırma Laboratuvarı", requiredLevel: 7 },
      { id: "hyperspace-tech", name: "Hiperuzay tekniği", requiredLevel: 3 },
    ],
  },
  {
    id: "laser-tech",
    name: "Lazer tekniği",
    category: "research",
    requirements: [
      { id: "research-lab", name: "Bilimsel Araştırma Laboratuvarı", requiredLevel: 1 },
      { id: "energy-tech", name: "Enerji tekniği", requiredLevel: 2 },
    ],
  },
  {
    id: "ion-tech",
    name: "İyon Tekniği",
    category: "research",
    requirements: [
      { id: "research-lab", name: "Bilimsel Araştırma Laboratuvarı", requiredLevel: 4 },
      { id: "energy-tech", name: "Enerji tekniği", requiredLevel: 4 },
      { id: "laser-tech", name: "Lazer tekniği", requiredLevel: 5 },
    ],
  },
  {
    id: "plasma-tech",
    name: "Plazma tekniği",
    category: "research",
    requirements: [
      { id: "research-lab", name: "Bilimsel Araştırma Laboratuvarı", requiredLevel: 4 },
      { id: "energy-tech", name: "Enerji tekniği", requiredLevel: 8 },
      { id: "laser-tech", name: "Lazer tekniği", requiredLevel: 10 },
      { id: "ion-tech", name: "İyon Tekniği", requiredLevel: 5 },
    ],
  },
  {
    id: "irn-tech",
    name: "Galaksiler arasi arastirma agi",
    category: "research",
    requirements: [
      { id: "research-lab", name: "Bilimsel Araştırma Laboratuvarı", requiredLevel: 10 },
      { id: "computer-tech", name: "Bilgisayar Tekniği", requiredLevel: 8 },
      { id: "hyperspace-tech", name: "Hiperuzay tekniği", requiredLevel: 8 },
    ],
  },
  {
    id: "astrophysics",
    name: "Astrofizik",
    category: "research",
    requirements: [
      { id: "research-lab", name: "Bilimsel Araştırma Laboratuvarı", requiredLevel: 3 },
      { id: "espionage-tech", name: "Casusluk tekniği", requiredLevel: 4 },
      { id: "impulse-drive", name: "İtki motoru", requiredLevel: 3 },
    ],
  },
  {
    id: "graviton-tech",
    name: "Graviton araştırması",
    category: "research",
    requirements: [
      { id: "research-lab", name: "Bilimsel Araştırma Laboratuvarı", requiredLevel: 12 },
    ],
  },

  // ==================== GEMİLER ====================
  {
    id: "small-cargo",
    name: "Küçük Nakliye Gemisi",
    category: "ships",
    requirements: [
      { id: "shipyard", name: "Uzay Tersanesi", requiredLevel: 2 },
      { id: "combustion-drive", name: "Yanma motoru", requiredLevel: 2 },
    ],
  },
  {
    id: "large-cargo",
    name: "Büyük Nakliye Gemisi",
    category: "ships",
    requirements: [
      { id: "shipyard", name: "Uzay Tersanesi", requiredLevel: 4 },
      { id: "combustion-drive", name: "Yanma motoru", requiredLevel: 6 },
    ],
  },
  {
    id: "light-fighter",
    name: "Hafif Avcı",
    category: "ships",
    requirements: [
      { id: "shipyard", name: "Uzay Tersanesi", requiredLevel: 1 },
      { id: "combustion-drive", name: "Yanma motoru", requiredLevel: 1 },
    ],
  },
  {
    id: "heavy-fighter",
    name: "Ağır Avcı",
    category: "ships",
    requirements: [
      { id: "shipyard", name: "Uzay Tersanesi", requiredLevel: 3 },
      { id: "armor-tech", name: "Uzay gemisi zırhı", requiredLevel: 2 },
      { id: "impulse-drive", name: "İtki motoru", requiredLevel: 2 },
    ],
  },
  {
    id: "cruiser",
    name: "Kruvazör",
    category: "ships",
    requirements: [
      { id: "shipyard", name: "Uzay Tersanesi", requiredLevel: 5 },
      { id: "impulse-drive", name: "İtki motoru", requiredLevel: 4 },
      { id: "ion-tech", name: "İyon Tekniği", requiredLevel: 2 },
    ],
  },
  {
    id: "battleship",
    name: "Komuta Gemisi",
    category: "ships",
    requirements: [
      { id: "shipyard", name: "Uzay Tersanesi", requiredLevel: 7 },
      { id: "hyperspace-drive", name: "Hiperuzay iticisi", requiredLevel: 4 },
    ],
  },
  {
    id: "colony-ship",
    name: "Koloni Gemisi",
    category: "ships",
    requirements: [
      { id: "shipyard", name: "Uzay Tersanesi", requiredLevel: 4 },
      { id: "impulse-drive", name: "İtki motoru", requiredLevel: 3 },
    ],
  },
  {
    id: "recycler",
    name: "Geri Dönüsümcü",
    category: "ships",
    requirements: [
      { id: "shipyard", name: "Uzay Tersanesi", requiredLevel: 4 },
      { id: "combustion-drive", name: "Yanma motoru", requiredLevel: 6 },
      { id: "shield-tech", name: "Kalkan tekniği", requiredLevel: 2 },
    ],
  },
  {
    id: "espionage-probe",
    name: "Casus Sondasi",
    category: "ships",
    requirements: [
      { id: "shipyard", name: "Uzay Tersanesi", requiredLevel: 3 },
      { id: "combustion-drive", name: "Yanma motoru", requiredLevel: 3 },
      { id: "espionage-tech", name: "Casusluk tekniği", requiredLevel: 2 },
    ],
  },
  {
    id: "bomber",
    name: "Bombardıman Gemisi",
    category: "ships",
    requirements: [
      { id: "shipyard", name: "Uzay Tersanesi", requiredLevel: 8 },
      { id: "impulse-drive", name: "İtki motoru", requiredLevel: 6 },
      { id: "plasma-tech", name: "Plazma tekniği", requiredLevel: 5 },
    ],
  },
  {
    id: "solar-satellite",
    name: "Solar Uydu",
    category: "ships",
    requirements: [
      { id: "shipyard", name: "Uzay Tersanesi", requiredLevel: 1 },
    ],
  },
  {
    id: "destroyer",
    name: "Muhrip",
    category: "ships",
    requirements: [
      { id: "shipyard", name: "Uzay Tersanesi", requiredLevel: 9 },
      { id: "hyperspace-tech", name: "Hiperuzay tekniği", requiredLevel: 5 },
      { id: "hyperspace-drive", name: "Hiperuzay iticisi", requiredLevel: 6 },
    ],
  },
  {
    id: "deathstar",
    name: "Ölüm Yildizi",
    category: "ships",
    requirements: [
      { id: "shipyard", name: "Uzay Tersanesi", requiredLevel: 12 },
      { id: "hyperspace-tech", name: "Hiperuzay tekniği", requiredLevel: 6 },
      { id: "hyperspace-drive", name: "Hiperuzay iticisi", requiredLevel: 7 },
      { id: "graviton-tech", name: "Graviton araştırması", requiredLevel: 1 },
    ],
  },
  {
    id: "battlecruiser",
    name: "Firkateyn",
    category: "ships",
    requirements: [
      { id: "shipyard", name: "Uzay Tersanesi", requiredLevel: 8 },
      { id: "hyperspace-tech", name: "Hiperuzay tekniği", requiredLevel: 5 },
      { id: "hyperspace-drive", name: "Hiperuzay iticisi", requiredLevel: 5 },
      { id: "laser-tech", name: "Lazer tekniği", requiredLevel: 12 },
    ],
  },
  {
    id: "crawler",
    name: "Paletli",
    category: "ships",
    requirements: [
      { id: "shipyard", name: "Uzay Tersanesi", requiredLevel: 5 },
      { id: "combustion-drive", name: "Yanma motoru", requiredLevel: 4 },
      { id: "armor-tech", name: "Uzay gemisi zırhı", requiredLevel: 4 },
      { id: "laser-tech", name: "Lazer tekniği", requiredLevel: 4 },
    ],
  },
  {
    id: "reaper",
    name: "Azrail",
    category: "ships",
    requirements: [
      { id: "shipyard", name: "Uzay Tersanesi", requiredLevel: 10 },
      { id: "hyperspace-tech", name: "Hiperuzay tekniği", requiredLevel: 6 },
      { id: "hyperspace-drive", name: "Hiperuzay iticisi", requiredLevel: 7 },
      { id: "shield-tech", name: "Kalkan tekniği", requiredLevel: 6 },
    ],
  },
  {
    id: "pathfinder",
    name: "Rehber",
    category: "ships",
    requirements: [
      { id: "shipyard", name: "Uzay Tersanesi", requiredLevel: 5 },
      { id: "shield-tech", name: "Kalkan tekniği", requiredLevel: 5 },
      { id: "energy-tech", name: "Enerji tekniği", requiredLevel: 5 },
      { id: "hyperspace-tech", name: "Hiperuzay tekniği", requiredLevel: 3 },
      { id: "hyperspace-drive", name: "Hiperuzay iticisi", requiredLevel: 2 },
    ],
  },

  // ==================== SAVUNMA ====================
  {
    id: "rocket-launcher",
    name: "Roketatar",
    category: "defense",
    requirements: [
      { id: "shipyard", name: "Uzay Tersanesi", requiredLevel: 1 },
    ],
  },
  {
    id: "light-laser",
    name: "Hafif Lazer Topu",
    category: "defense",
    requirements: [
      { id: "shipyard", name: "Uzay Tersanesi", requiredLevel: 2 },
      { id: "energy-tech", name: "Enerji tekniği", requiredLevel: 1 },
      { id: "laser-tech", name: "Lazer tekniği", requiredLevel: 3 },
    ],
  },
  {
    id: "heavy-laser",
    name: "Ağır Lazer Topu",
    category: "defense",
    requirements: [
      { id: "shipyard", name: "Uzay Tersanesi", requiredLevel: 4 },
      { id: "energy-tech", name: "Enerji tekniği", requiredLevel: 3 },
      { id: "laser-tech", name: "Lazer tekniği", requiredLevel: 6 },
    ],
  },
  {
    id: "gauss-cannon",
    name: "Gaus Topu",
    category: "defense",
    requirements: [
      { id: "shipyard", name: "Uzay Tersanesi", requiredLevel: 6 },
      { id: "energy-tech", name: "Enerji tekniği", requiredLevel: 6 },
      { id: "weapons-tech", name: "Silah tekniği", requiredLevel: 3 },
      { id: "shield-tech", name: "Kalkan tekniği", requiredLevel: 1 },
    ],
  },
  {
    id: "ion-cannon",
    name: "Iyon Topu",
    category: "defense",
    requirements: [
      { id: "shipyard", name: "Uzay Tersanesi", requiredLevel: 4 },
      { id: "ion-tech", name: "İyon Tekniği", requiredLevel: 4 },
    ],
  },
  {
    id: "plasma-turret",
    name: "Plazma Atıcı",
    category: "defense",
    requirements: [
      { id: "shipyard", name: "Uzay Tersanesi", requiredLevel: 8 },
      { id: "plasma-tech", name: "Plazma tekniği", requiredLevel: 7 },
    ],
  },
  {
    id: "small-shield-dome",
    name: "Küçük Kalkan Kubbesi",
    category: "defense",
    requirements: [
      { id: "shipyard", name: "Uzay Tersanesi", requiredLevel: 1 },
      { id: "shield-tech", name: "Kalkan tekniği", requiredLevel: 2 },
    ],
  },
  {
    id: "large-shield-dome",
    name: "Büyük Kalkan Kubbesi",
    category: "defense",
    requirements: [
      { id: "shipyard", name: "Uzay Tersanesi", requiredLevel: 6 },
      { id: "shield-tech", name: "Kalkan tekniği", requiredLevel: 6 },
    ],
  },

  // ==================== ROKETLER ====================
  {
    id: "anti-ballistic-missile",
    name: "Yakalıyıcı Roketler",
    category: "missiles",
    requirements: [
      { id: "shipyard", name: "Uzay Tersanesi", requiredLevel: 1 },
      { id: "missile-silo", name: "Roket Silosu", requiredLevel: 2 },
    ],
  },
  {
    id: "interplanetary-missile",
    name: "Gezegenlerarasi Roketler",
    category: "missiles",
    requirements: [
      { id: "shipyard", name: "Uzay Tersanesi", requiredLevel: 1 },
      { id: "missile-silo", name: "Roket Silosu", requiredLevel: 4 },
      { id: "impulse-drive", name: "İtki motoru", requiredLevel: 1 },
    ],
  },
];

/**
 * Helper to retrieve the current level of a technology node on a given planet or user research profile.
 */
export function getNodeCurrentLevel(
  nodeId: string,
  planet?: {
    buildings: { key: string; level: number; buildingType?: number; isUnit?: boolean; unitType?: number }[];
    units?: { unitType: number; count: number }[];
  },
  researches: Record<number, number> = {}
): number {
  const meta = TECH_ID_TO_METADATA[nodeId];
  if (!meta) return 0;

  if (meta.type === "building") {
    const b = planet?.buildings?.find(
      (item) => item.key === meta.buildingKey || item.buildingType === meta.buildingType
    );
    return b?.level ?? 0;
  }

  if (meta.type === "research") {
    return researches[meta.researchId ?? 0] ?? 0;
  }

  if (meta.type === "ship" || meta.type === "defense" || meta.type === "missile") {
    const u = planet?.units?.find((item) => item.unitType === meta.unitType);
    return u?.count ?? 0;
  }

  return 0;
}

/**
 * Checks all prerequisites for a given tech tree node.
 */
export function evaluateNodePrerequisites(
  node: TechTreeNode,
  planet?: {
    buildings: { key: string; level: number; buildingType?: number; isUnit?: boolean; unitType?: number }[];
    units?: { unitType: number; count: number }[];
  },
  researches: Record<number, number> = {}
): EvaluatedTechNode {
  const meta = TECH_ID_TO_METADATA[node.id];
  const currentLevel = getNodeCurrentLevel(node.id, planet, researches);

  const evaluatedRequirements: EvaluatedRequirement[] = node.requirements.map((req) => {
    const reqMeta = TECH_ID_TO_METADATA[req.id];
    const cur = getNodeCurrentLevel(req.id, planet, researches);
    return {
      id: req.id,
      name: req.name,
      requiredLevel: req.requiredLevel,
      currentLevel: cur,
      isMet: cur >= req.requiredLevel,
      href: reqMeta?.href ?? "/overview",
    };
  });

  const isUnlocked = evaluatedRequirements.every((r) => r.isMet);

  return {
    ...node,
    currentLevel,
    isUnlocked,
    evaluatedRequirements,
    href: meta?.href ?? "/overview",
  };
}

/**
 * Returns all nodes that require `nodeId` as a direct prerequisite.
 */
export function getDependentNodes(nodeId: string): TechTreeNode[] {
  return TECH_TREE_DATA.filter((node) =>
    node.requirements.some((req) => req.id === nodeId)
  );
}

