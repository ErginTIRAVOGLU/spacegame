export interface ResourceProductionRow {
  key: string;
  label: string;
  levelOrCount?: number;
  maxCount?: number;
  metal: number;
  crystal: number;
  deuterium: number;
  energy: number; // Üretim (+) veya Tüketim (-)
  percentage?: number; // 0, 10, 20 ... 100%
  hasSetting: boolean;
  officerActive?: boolean;
  category?:
    | "base"
    | "building"
    | "unit"
    | "officer"
    | "class"
    | "tech"
    | "alliance"
    | "booster"
    | "lifeform"
    | "storage"
    | "total";
}

export interface ResourceSettingsMatrix {
  planetName: string;
  productionFactor: number; // Örn: 0.67 (%67)
  rows: ResourceProductionRow[];
  storageCapacities: {
    metal: number;
    crystal: number;
    deuterium: number;
  };
  totals: {
    hourly: { metal: number; crystal: number; deuterium: number; energy: string };
    daily: { metal: number; crystal: number; deuterium: number; energy: string };
    weekly: { metal: number; crystal: number; deuterium: number; energy: string };
  };
}

