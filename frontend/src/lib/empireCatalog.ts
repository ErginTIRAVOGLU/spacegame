export interface EmpirePlanetDto {
  id: string;
  name: string;
  coords: string;
  galaxy: number;
  system: number;
  slot: number;
  isMoon: boolean;
  fieldsUsed: number;
  maxFields: number;
  tempMin: number;
  tempMax: number;
  diameter: number;
  activeMissionsCount: number;
  resources: {
    metal: number;
    crystal: number;
    deuterium: number;
    producedEnergy: number;
    consumedEnergy: number;
    netEnergy: number;
    metalPerHour: number;
    crystalPerHour: number;
    deuteriumPerHour: number;
  };
  storages: {
    metalCapacity: number;
    crystalCapacity: number;
    deuteriumCapacity: number;
  };
  buildings: Record<number, number>; // BuildingType -> Level
  units: Record<number, number>;     // UnitType -> Count
}

export interface EmpireSummaryDto {
  user: {
    id: string;
    username: string;
    darkMatter: number;
    totalPoints: number;
  };
  researches: Record<number, number>;
  planets: EmpirePlanetDto[];
  serverTimeUtc: string;
}

export interface EmpireRowItem {
  id: string;
  name: string;
  category: string;
  typeId?: number;
  href?: (planetId: string) => string;
}

// 1. Production Buildings & Storages (Mines)
export const EMPIRE_MINES: EmpireRowItem[] = [
  { id: "metalMine", name: "Metal Madeni", category: "mines", typeId: 1, href: () => "/resources" },
  { id: "crystalMine", name: "Kristal Madeni", category: "mines", typeId: 2, href: () => "/resources" },
  { id: "deuteriumSynthesizer", name: "Döteryum Sentezleyici", category: "mines", typeId: 3, href: () => "/resources" },
  { id: "solarPlant", name: "Güneş Enerji Santrali", category: "mines", typeId: 4, href: () => "/resources" },
  { id: "fusionReactor", name: "Füzyon Santrali", category: "mines", typeId: 5, href: () => "/resources" },
  { id: "metalStorage", name: "Metal Deposu", category: "storages", typeId: 22, href: () => "/resources" },
  { id: "crystalStorage", name: "Kristal Deposu", category: "storages", typeId: 23, href: () => "/resources" },
  { id: "deuteriumTank", name: "Döteryum Tankı", category: "storages", typeId: 24, href: () => "/resources" },
];

// 2. Facilities
export const EMPIRE_FACILITIES: EmpireRowItem[] = [
  { id: "roboticsFactory", name: "Robot Fabrikası", category: "facilities", typeId: 14, href: () => "/facilities" },
  { id: "shipyard", name: "Uzay Tersanesi", category: "facilities", typeId: 21, href: () => "/facilities" },
  { id: "researchLab", name: "Araştırma Laboratuvarı", category: "facilities", typeId: 31, href: () => "/facilities" },
  { id: "allianceDepot", name: "İttifak Deposu", category: "facilities", typeId: 34, href: () => "/facilities" },
  { id: "missileSilo", name: "Roket Silosu", category: "facilities", typeId: 44, href: () => "/facilities" },
  { id: "naniteFactory", name: "Nanit Fabrikası", category: "facilities", typeId: 15, href: () => "/facilities" },
  { id: "terraformer", name: "Terrafikasyon", category: "facilities", typeId: 33, href: () => "/facilities" },
  { id: "spaceDock", name: "Uzay İskelesi", category: "facilities", typeId: 36, href: () => "/facilities" },
];

// 3. Stationed Defenses
export const EMPIRE_DEFENSES: EmpireRowItem[] = [
  { id: "rocketLauncher", name: "Roketatar", category: "defenses", typeId: 401, href: () => "/defenses" },
  { id: "lightLaser", name: "Hafif Lazer Topu", category: "defenses", typeId: 402, href: () => "/defenses" },
  { id: "heavyLaser", name: "Ağır Lazer Topu", category: "defenses", typeId: 403, href: () => "/defenses" },
  { id: "gaussCannon", name: "Gaus Topu", category: "defenses", typeId: 404, href: () => "/defenses" },
  { id: "ionCannon", name: "İyon Topu", category: "defenses", typeId: 405, href: () => "/defenses" },
  { id: "plasmaTurret", name: "Plazma Atıcı", category: "defenses", typeId: 406, href: () => "/defenses" },
  { id: "smallShieldDome", name: "Küçük Kalkan Kubbesi", category: "defenses", typeId: 407, href: () => "/defenses" },
  { id: "largeShieldDome", name: "Büyük Kalkan Kubbesi", category: "defenses", typeId: 408, href: () => "/defenses" },
  { id: "abm", name: "Yakalayıcı Roketler (ABM)", category: "defenses", typeId: 502, href: () => "/defenses" },
  { id: "ipm", name: "Gezegenlerarası Roketler (IPM)", category: "defenses", typeId: 503, href: () => "/defenses" },
];

// 4. Stationed Fleets
export const EMPIRE_SHIPS: EmpireRowItem[] = [
  { id: "smallCargo", name: "Küçük Nakliye", category: "ships", typeId: 202, href: () => "/shipyard" },
  { id: "largeCargo", name: "Büyük Nakliye", category: "ships", typeId: 203, href: () => "/shipyard" },
  { id: "lightFighter", name: "Hafif Avcı", category: "ships", typeId: 204, href: () => "/shipyard" },
  { id: "heavyFighter", name: "Ağır Avcı", category: "ships", typeId: 205, href: () => "/shipyard" },
  { id: "cruiser", name: "Kruvazör", category: "ships", typeId: 206, href: () => "/shipyard" },
  { id: "battleship", name: "Komuta Gemisi", category: "ships", typeId: 207, href: () => "/shipyard" },
  { id: "colonyShip", name: "Koloni Gemisi", category: "ships", typeId: 208, href: () => "/shipyard" },
  { id: "recycler", name: "Geri Dönüşümcü", category: "ships", typeId: 209, href: () => "/shipyard" },
  { id: "espionageProbe", name: "Casus Sondası", category: "ships", typeId: 210, href: () => "/shipyard" },
  { id: "bomber", name: "Bombardıman Gemisi", category: "ships", typeId: 211, href: () => "/shipyard" },
  { id: "solarSatellite", name: "Güneş Uydusu", category: "ships", typeId: 212, href: () => "/shipyard" },
  { id: "destroyer", name: "Muhrip", category: "ships", typeId: 213, href: () => "/shipyard" },
  { id: "deathstar", name: "Ölüm Yıldızı", category: "ships", typeId: 214, href: () => "/shipyard" },
  { id: "battlecruiser", name: "Firkateyn", category: "ships", typeId: 215, href: () => "/shipyard" },
  { id: "crawler", name: "Paletli", category: "ships", typeId: 217, href: () => "/shipyard" },
  { id: "reaper", name: "Azrail", category: "ships", typeId: 218, href: () => "/shipyard" },
  { id: "pathfinder", name: "Öncü", category: "ships", typeId: 219, href: () => "/shipyard" },
];

// 5. Account-wide Researches (16 technologies)
export const EMPIRE_RESEARCHES: EmpireRowItem[] = [
  { id: "energyTech", name: "Enerji Tekniği", category: "research", typeId: 113, href: () => "/research" },
  { id: "laserTech", name: "Lazer Tekniği", category: "research", typeId: 120, href: () => "/research" },
  { id: "ionTech", name: "İyon Tekniği", category: "research", typeId: 121, href: () => "/research" },
  { id: "hyperspaceTech", name: "Hiperuzay Tekniği", category: "research", typeId: 114, href: () => "/research" },
  { id: "plasmaTech", name: "Plazma Tekniği", category: "research", typeId: 122, href: () => "/research" },
  { id: "combustionDrive", name: "Yanma Motoru", category: "research", typeId: 115, href: () => "/research" },
  { id: "impulseDrive", name: "İtki Motoru", category: "research", typeId: 117, href: () => "/research" },
  { id: "hyperspaceDrive", name: "Hiperuzay İticisi", category: "research", typeId: 118, href: () => "/research" },
  { id: "espionageTech", name: "Casusluk Tekniği", category: "research", typeId: 106, href: () => "/research" },
  { id: "computerTech", name: "Bilgisayar Tekniği", category: "research", typeId: 108, href: () => "/research" },
  { id: "astrophysics", name: "Astrofizik", category: "research", typeId: 124, href: () => "/research" },
  { id: "irn", name: "Gezegenlerarası Araştırma Ağı (IRN)", category: "research", typeId: 123, href: () => "/research" },
  { id: "gravitonTech", name: "Graviton Tekniği", category: "research", typeId: 199, href: () => "/research" },
  { id: "weaponsTech", name: "Silah Tekniği", category: "research", typeId: 109, href: () => "/research" },
  { id: "shieldingTech", name: "Kalkan Tekniği", category: "research", typeId: 110, href: () => "/research" },
  { id: "armourTech", name: "Uzay Gemisi Zırhı", category: "research", typeId: 111, href: () => "/research" },
];

// 6. Lifeform Buildings (12 buildings)
export const EMPIRE_LIFEFORM_BUILDINGS: EmpireRowItem[] = [
  { id: "residentialSector", name: "Barınma Tesisi", category: "lifeforms", href: () => "/lifeforms" },
  { id: "biosphereFarm", name: "Biyosfer Çiftliği", category: "lifeforms", href: () => "/lifeforms" },
  { id: "researchCentre", name: "Araştırma Merkezi", category: "lifeforms", href: () => "/lifeforms" },
  { id: "academyOfSciences", name: "Bilimler Akademisi", category: "lifeforms", href: () => "/lifeforms" },
  { id: "neuroCalibrationCentre", name: "Nöro-Kalibrasyon Merkezi", category: "lifeforms", href: () => "/lifeforms" },
  { id: "highEnergySmelting", name: "Yüksek Enerjili Ergitme", category: "lifeforms", href: () => "/lifeforms" },
  { id: "foodSilo", name: "Besin Silosu", category: "lifeforms", href: () => "/lifeforms" },
  { id: "fusionPoweredProduction", name: "Füzyon Enerjili Üretim", category: "lifeforms", href: () => "/lifeforms" },
  { id: "skyscraper", name: "Gökdelen", category: "lifeforms", href: () => "/lifeforms" },
  { id: "biotechLab", name: "Biyoteknoloji Laboratuvarı", category: "lifeforms", href: () => "/lifeforms" },
  { id: "metropolis", name: "Metropolis", category: "lifeforms", href: () => "/lifeforms" },
  { id: "planetaryShield", name: "Gezegensel Kalkan", category: "lifeforms", href: () => "/lifeforms" },
];

// 7. Lifeform Techs (18 tech slots)
export const EMPIRE_LIFEFORM_TECHS: EmpireRowItem[] = Array.from({ length: 18 }, (_, i) => ({
  id: `lfTech_${i + 1}`,
  name: `Canlı Formu Teknoloji #${i + 1}`,
  category: "lifeformsTech",
  href: () => "/lifeforms/tech-tree",
}));

