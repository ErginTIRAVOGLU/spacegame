export interface QuestTargetRoute {
  route: string;
  focusKey?: string;
  modalId?: string;
  label: string;
  category:
    | "resources"
    | "facilities"
    | "research"
    | "shipyard"
    | "defenses"
    | "lifeforms"
    | "fleet"
    | "galaxy"
    | "rewards"
    | "shop"
    | "alliance"
    | "techtree";
  buttonText: string;
  meta?: Record<string, any>;
}

export interface QuestRouteMappingItem {
  patterns: (string | RegExp)[];
  route: string;
  focusKey?: string;
  modalId?: string;
  label: string;
  category: QuestTargetRoute["category"];
  buttonText: string;
  meta?: Record<string, any>;
}

export interface QuestCustomRouteItem {
  path: string;
  tab?: string;
  focus?: string;
  labelOverride: string;
  category?: QuestTargetRoute["category"];
  meta?: Record<string, any>;
}

export const QUEST_ROUTE_MAPPING: Record<string, QuestCustomRouteItem> = {
  d1_s5_resource_settings: {
    path: "/resources/settings",
    focus: "metal-percentage-select",
    labelOverride: "Kaynak Ayarları",
    category: "resources",
    meta: {
      targetSetting: "metalMineProductionFactor",
      targetValue: 0.9,
    },
  },
  d1_s7_resource_settings_reset: {
    path: "/resources/settings",
    focus: "metal-percentage-select",
    labelOverride: "Kaynak Ayarları",
    category: "resources",
    meta: {
      targetSetting: "metalMineProductionFactor",
      targetValue: 1.0,
    },
  },

  // Task 05AY: Directive 2 - Step 5 (and Directive 3 - Step 5) Espionage Tech & Foundation Goals
  d2_s5_research_lab_3: {
    path: "/facilities",
    focus: "research-lab",
    labelOverride: "Bilimsel Araştırma Laboratuvarı",
    category: "facilities",
  },
  d2_s5_espionage_tech_2: {
    path: "/research",
    focus: "espionage-tech",
    labelOverride: "Casusluk Tekniği",
    category: "research",
  },
  d2_s5_shipyard_3: {
    path: "/facilities",
    focus: "shipyard",
    labelOverride: "Uzay Tersanesi",
    category: "facilities",
  },
  d2_s5_combustion_drive_3: {
    path: "/research",
    focus: "combustion-drive",
    labelOverride: "Yanma Motoru",
    category: "research",
  },

  // Directive 3 - Step 5 Aliases
  d3_s5_research_lab_3: {
    path: "/facilities",
    focus: "research-lab",
    labelOverride: "Bilimsel Araştırma Laboratuvarı",
    category: "facilities",
  },
  d3_s5_espionage_tech_2: {
    path: "/research",
    focus: "espionage-tech",
    labelOverride: "Casusluk Tekniği",
    category: "research",
  },
  d3_s5_shipyard_3: {
    path: "/facilities",
    focus: "shipyard",
    labelOverride: "Uzay Tersanesi",
    category: "facilities",
  },
  d3_s5_combustion_drive_3: {
    path: "/research",
    focus: "combustion-drive",
    labelOverride: "Yanma Motoru",
    category: "research",
  },

  // Task 05AZ: Directive 3 - Step 7: Bir imparatorluğu gözetlemek (Casusluk Filosu Görevi)
  d3_s7_espionage_mission: {
    path: "/fleet",
    focus: "espionage-probe-input",
    labelOverride: "Filo Hareketi",
    category: "fleet",
    meta: {
      defaultMission: "espionage",
      suggestedShip: "espionage-probe",
    },
  },
  d3_s7: {
    path: "/fleet",
    focus: "espionage-probe-input",
    labelOverride: "Filo Hareketi",
    category: "fleet",
    meta: {
      defaultMission: "espionage",
      suggestedShip: "espionage-probe",
    },
  },
  d3_s8_fleet_save: {
    path: "/fleet",
    focus: "espionage-probe-input",
    labelOverride: "Filo Hareketi",
    category: "fleet",
    meta: {
      defaultMission: "espionage",
      suggestedShip: "espionage-probe",
      targetSlot: 16,
    },
  },
  d3_s8: {
    path: "/fleet",
    focus: "espionage-probe-input",
    labelOverride: "Filo Hareketi",
    category: "fleet",
    meta: {
      defaultMission: "espionage",
      suggestedShip: "espionage-probe",
      targetSlot: 16,
    },
  },
  d3_s9_fleet_recall: {
    path: "/fleet",
    focus: "fleet-recall-btn",
    labelOverride: "Filo Hareketi (Geri Çağır)",
    category: "fleet",
  },
  d3_s9: {
    path: "/fleet",
    focus: "fleet-recall-btn",
    labelOverride: "Filo Hareketi (Geri Çağır)",
    category: "fleet",
  },

  // Task 05BG: Directive 4 - Step 8: Koloni Enerji Gelişimi
  d4_s8_colony_solar_plant_1: {
    path: "/resources",
    focus: "solar-plant",
    labelOverride: "Solar Enerji Santrali",
    category: "resources",
  },
  d4_s8_colony_solar_plant_2: {
    path: "/resources",
    focus: "solar-plant",
    labelOverride: "Solar Enerji Santrali",
    category: "resources",
  },
  d4_s8_colony_solar_plant_3: {
    path: "/resources",
    focus: "solar-plant",
    labelOverride: "Solar Enerji Santrali",
    category: "resources",
  },
  d4_s8_colony_solar_plant_4: {
    path: "/resources",
    focus: "solar-plant",
    labelOverride: "Solar Enerji Santrali",
    category: "resources",
  },
  d4_s8_colony_solar_plant_5: {
    path: "/resources",
    focus: "solar-plant",
    labelOverride: "Solar Enerji Santrali",
    category: "resources",
  },
  d4_s8: {
    path: "/resources",
    focus: "solar-plant",
    labelOverride: "Solar Enerji Santrali",
    category: "resources",
  },

  // Task 05BG: Directive 4 - Step 9: Bilgisayar Teknolojisi
  d4_s9_computer_tech_1: {
    path: "/research",
    focus: "computer-tech",
    labelOverride: "Bilgisayar Tekniği",
    category: "research",
  },
  d4_s9: {
    path: "/research",
    focus: "computer-tech",
    labelOverride: "Bilgisayar Tekniği",
    category: "research",
  },

  // Task 05BG: Directive 4 - Step 10: Sefer / Keşif Filosu
  d4_s10_expedition_mission: {
    path: "/fleet",
    focus: "expedition-dispatch",
    labelOverride: "Filo Hareketi (Keşif)",
    category: "fleet",
    meta: {
      mission: "expedition",
      targetPosition: 16,
    },
  },
  d4_s10: {
    path: "/fleet",
    focus: "expedition-dispatch",
    labelOverride: "Filo Hareketi (Keşif)",
    category: "fleet",
    meta: {
      mission: "expedition",
      targetPosition: 16,
    },
  },

  // Task 05BI: Directive 5 - Step 6: Uzay gemisi zırhı
  d5_s6_armor_tech_2: {
    path: "/research",
    focus: "armor-tech",
    labelOverride: "Uzay Gemisi Zırhı",
    category: "research",
  },
  d5_s6: {
    path: "/research",
    focus: "armor-tech",
    labelOverride: "Uzay Gemisi Zırhı",
    category: "research",
  },

  // Task 05BI: Directive 5 - Step 11: Ağır Avcı İnşası
  d5_s11_build_heavy_fighter: {
    path: "/shipyard",
    focus: "heavy-fighter",
    labelOverride: "Ağır Avcı",
    category: "shipyard",
  },
  d5_s11: {
    path: "/shipyard",
    focus: "heavy-fighter",
    labelOverride: "Ağır Avcı",
    category: "shipyard",
  },

  // Task 05BJ: Directive 6 - Step 1: Canlı türlerinin temelleri
  d6_s1_biosphere_farm_22: {
    path: "/lifeforms",
    focus: "biosphere-farm",
    labelOverride: "Biyosfer Çiftliği",
    category: "lifeforms",
  },
  d6_s1_residential_sector_21: {
    path: "/lifeforms",
    focus: "residential-sector",
    labelOverride: "Barınma Tesisi",
    category: "lifeforms",
  },
  d6_s1: {
    path: "/lifeforms",
    focus: "biosphere-farm",
    labelOverride: "Biyosfer Çiftliği",
    category: "lifeforms",
  },

  // Task 05BJ: Directive 6 - Step 2: Araştırma merkezini inşa et
  d6_s2_research_centre_1: {
    path: "/lifeforms",
    focus: "research-centre",
    labelOverride: "Araştırma Merkezi",
    category: "lifeforms",
  },
  d6_s2: {
    path: "/lifeforms",
    focus: "research-centre",
    labelOverride: "Araştırma Merkezi",
    category: "lifeforms",
  },

  // Task 05BJ: Directive 6 - Step 3: Galaksiler arası elçileri araştır
  d6_s3_intergalactic_envoys: {
    path: "/lifeforms",
    tab: "development",
    focus: "intergalactic-envoys",
    labelOverride: "Galaksiler Arası Elçiler",
    category: "lifeforms",
  },
  d6_s3: {
    path: "/lifeforms",
    tab: "development",
    focus: "intergalactic-envoys",
    labelOverride: "Galaksiler Arası Elçiler",
    category: "lifeforms",
  },

  // Task 05BJ: Directive 6 - Step 4: Bilgisayar teknolojisi
  d6_s4_computer_tech_2: {
    path: "/research",
    focus: "computer-tech",
    labelOverride: "Bilgisayar Tekniği",
    category: "research",
  },
  d6_s4: {
    path: "/research",
    focus: "computer-tech",
    labelOverride: "Bilgisayar Tekniği",
    category: "research",
  },

  // Task 05BK: Directive 6 - Step 5: Canlı Türü Keşif Görevi (Galaksi Haritası DNA İkonu)
  d6_s5_lifeform_discovery_mission: {
    path: "/galaxy",
    focus: "lifeform-discover",
    labelOverride: "Galaksi Haritası",
    category: "galaxy",
  },
  d6_s5: {
    path: "/galaxy",
    focus: "lifeform-discover",
    labelOverride: "Galaksi Haritası",
    category: "galaxy",
  },

  // Task 05BL: Directive 6 - Step 6: Bir canlı türü bul (16. Pozisyon Keşif)
  d6_s6_find_lifeform_on_expedition: {
    path: "/fleet",
    focus: "expedition-fleet",
    labelOverride: "Filo Hareketi (16. Pozisyon Keşif)",
    category: "fleet",
    meta: {
      mission: "expedition",
      targetPosition: 16,
      suggestedShips: ["small-cargo", "light-fighter"],
    },
  },
  d6_s6: {
    path: "/fleet",
    focus: "expedition-fleet",
    labelOverride: "Filo Hareketi (16. Pozisyon Keşif)",
    category: "fleet",
    meta: {
      mission: "expedition",
      targetPosition: 16,
      suggestedShips: ["small-cargo", "light-fighter"],
    },
  },
  d6_s6_discover_lifeform: {
    path: "/fleet",
    focus: "expedition-fleet",
    labelOverride: "Filo Hareketi (16. Pozisyon Keşif)",
    category: "fleet",
    meta: {
      mission: "expedition",
      targetPosition: 16,
      suggestedShips: ["small-cargo", "light-fighter"],
    },
  },

  // Task 05BN: Directive 6 - Step 7: Sömürgenin canlı türünü seç
  d6_s7_assign_colony_lifeform: {
    path: "/lifeforms",
    focus: "species-selector",
    labelOverride: "Sömürge Canlı Türü Seçimi",
    category: "lifeforms",
    meta: {
      requireColonySwitch: true,
    },
  },
  d6_s7: {
    path: "/lifeforms",
    focus: "species-selector",
    labelOverride: "Sömürge Canlı Türü Seçimi",
    category: "lifeforms",
    meta: {
      requireColonySwitch: true,
    },
  },
};

export const QUEST_ROUTE_REGISTRY: QuestRouteMappingItem[] = [
  // 0.05 Task 05BN: Directive 6 Step 7: Sömürgenin canlı türünü seç (Bir sömürgeye bir canlı türü ata)
  {
    patterns: [
      /sömürgenin canlı türünü seç/i,
      /somurgenin canli turunu sec/i,
      /bir sömürgeye bir canlı türü ata/i,
      /bir somurgeye bir canli turu ata/i,
      /sömürgeye bir canlı türü ata/i,
      /sömürgeye keşfedilmiş bir canlı türünü ata/i,
      /somurgeye kesfedilmis bir canli turunu ata/i,
      /^d6_s7/i,
      /d6_s7_assign_colony_lifeform/i,
    ],
    route: "/lifeforms?focus=species-selector",
    focusKey: "species-selector",
    label: "Sömürge Canlı Türü Seçimi",
    category: "lifeforms",
    buttonText: "Canlı Türü Seçimine Git",
    meta: {
      requireColonySwitch: true,
    },
  },
  // 0.04 Task 05BL: Directive 6 Step 6: Bir canlı türü bul (16. Pozisyona Keşif Görevi)
  {
    patterns: [
      /bir canlı türü bul/i,
      /bir canli turu bul/i,
      /canlı türü bul/i,
      /canli turu bul/i,
      /yeni bir canlı türü/i,
      /yeni bir canli turu/i,
      /uzayda yeni bir canlı türü/i,
      /uzayda yeni bir canli turu/i,
      /keşif filoları ile uzayda yeni bir canlı türü/i,
      /kesif filolari ile uzayda yeni bir canli turu/i,
      /derin uzay taramaları sonucunda yeni bir yabancı medeniyet/i,
      /derin uzay taramalari/i,
      /yabancı medeniyet/i,
      /yabanci medeniyet/i,
      /^d6_s6/i,
      /d6_s6_find_lifeform_on_expedition/i,
    ],
    route: "/fleet?mission=expedition&position=16&slot=16&focus=expedition-fleet",
    focusKey: "expedition-fleet",
    label: "Filo Hareketi (16. Pozisyon Keşif)",
    category: "fleet",
    buttonText: "Keşif Filosuna Git",
  },
  // 0.0 Task 05BK: Directive 6 Step 5: Canlı Türü Keşif Filosu Görevi (Galaksi Haritası DNA İkonu)
  {
    patterns: [
      /bir keşif filosu gönder/i,
      /keşif filosu gönder/i,
      /dna simgesi/i,
      /dna ikonu/i,
      /canlı türü keşif/i,
      /canlı türü keşfi/i,
      /canlı türlerini keşfet/i,
      /canli turu kesif/i,
      /^d6_s5/i,
      /d6_s5_lifeform_discovery_mission/i,
    ],
    route: "/galaxy?focus=lifeform-discover",
    focusKey: "lifeform-discover",
    label: "Galaksi (Canlı Türü Keşfi)",
    category: "galaxy",
    buttonText: "Galaksiye Git",
  },
  // 0.1 Directive 4 Step 10: Sefer / Keşif Filosu (16. Pozisyona Keşif Görevi)
  {
    patterns: [
      /16\. pozisyona keşif filosu/i,
      /16\. pozisyona.*keşif/i,
      /16\. slota.*keşif/i,
      /16\. pozisyona.*sefer/i,
      /16\. slota.*sefer/i,
      /bir sefer filosu/i,
      /sefer filosu/i,
      /keşif filosu/i,
      /keşif.*tamamla/i,
      /16\. slot.*keşif/i,
      /16\. pozisyon.*keşif/i,
      /^d4_s10/i,
    ],
    route: "/fleet?mission=expedition&slot=16&position=16&focus=expedition-dispatch",
    focusKey: "expedition-dispatch",
    label: "Filo Hareketi (Keşif)",
    category: "fleet",
    buttonText: "Keşif Filosuna Git",
  },
  // 0.1 Directive 3 Step 7: Bir imparatorluğu gözetlemek (Casusluk Filosu Görevi)
  {
    patterns: [
      /bir imparatorluğu gözetle/i,
      /bir imparatorlugu gozetle/i,
      /imparatorluğu gözetle/i,
      /imparatorlugu gozetle/i,
      /casusluk sondası fırlat/i,
      /casusluk sondasi firlat/i,
      /sonda.*fırlat/i,
      /sonda.*firlat/i,
      /istihbarat raporu/i,
      /istihbarat raporu elde et/i,
      /casusluk görevi/i,
      /casusluk gorevi/i,
      /casusluk filosu/i,
      /casusluk misyonu/i,
      /^d3_s7/i,
    ],
    route: "/fleet?mission=espionage&ship=espionage-probe&focus=espionage-probe-input",
    focusKey: "espionage-probe-input",
    label: "Casusluk Seferi",
    category: "fleet",
    buttonText: "Filo / Casusluk Seferine Git",
  },
  // 0.2 Directive 3 Step 8: Ham maddeleri olan bir filo gönder (Fleet Save / 16. Pozisyona Casusluk Görevi)
  {
    patterns: [
      /ham maddeleri olan bir filo/i,
      /ham maddeleri olan.*filo/i,
      /kaynak yüklü.*casusluk filosu/i,
      /kaynak yuklu.*casusluk filosu/i,
      /16\. pozisyona.*casusluk/i,
      /16\. slota.*casusluk/i,
      /fleet\s*save/i,
      /^d3_s8/i,
    ],
    route: "/fleet?mission=espionage&ship=espionage-probe&slot=16&focus=espionage-probe-input",
    focusKey: "espionage-probe-input",
    label: "Filo Hareketi (Fleet Save)",
    category: "fleet",
    buttonText: "Filoya Git (Fleet Save)",
  },
  // 0.3 Directive 3 Step 9: Filonun geri çağrılması (Fleet Recall)
  {
    patterns: [
      /filonun geri çağrılması/i,
      /filonun geri cagrilmasi/i,
      /filoyu geri çağır/i,
      /filoyu geri cagir/i,
      /havada hareket halinde olan filoyu/i,
      /hareket halinde.*filo.*geri çağır/i,
      /hareket halinde.*filo.*geri cagir/i,
      /geri çağırma/i,
      /geri cagirma/i,
      /fleet.*recall/i,
      /^d3_s9/i,
    ],
    route: "/fleet?focus=fleet-recall-btn",
    focusKey: "fleet-recall-btn",
    label: "Filo Hareketi (Geri Çağır)",
    category: "fleet",
    buttonText: "Filoya Git (Geri Çağır)",
  },
  // 0. Kaynak Ayarları & Üretim Yüzdesi Ayarları (Directive 1 Step 5 & Step 7)
  {
    patterns: [
      /kaynak ayarlar/i,
      /kaynak ayarı/i,
      /kaynak ayarlari/i,
      /resource settings/i,
      /resource-settings/i,
      /üretim yüzdesi/i,
      /uretim yuzdesi/i,
      /gücünü.*%?90/i,
      /gucunu.*%?90/i,
      /gücünü.*%?100/i,
      /gucunu.*%?100/i,
      /%90'a ayarla/i,
      /%100'e ayarla/i,
      /%90.*ayarla/i,
      /%100.*ayarla/i,
      /üretimini tekrar artır/i,
      /uretimini tekrar artir/i,
      /^d1_s5/i,
      /^d1_s7/i,
      /^metal-percentage-select$/i,
      /^resource-settings$/i,
    ],
    route: "/resources/settings?focus=metal-percentage-select",
    focusKey: "metal-percentage-select",
    label: "Kaynak Ayarları",
    category: "resources",
    buttonText: "Kaynak Ayarlarına Git",
  },
  {
    patterns: [
      /teknoloji\s*ağacı/i,
      /teknoloji\s*agaci/i,
      /techtree/i,
      /tech-tree/i,
      /önkoşul/i,
      /onkosul/i,
    ],
    route: "/techtree",
    label: "Teknoloji Ağacı",
    category: "techtree",
    buttonText: "Teknoloji Ağacına Git",
  },
  // 1. Resources (Madenler ve Enerji)
  {
    patterns: [/metal madeni/i, /^metal-mine$/i, /^metalMine$/i],
    route: "/resources?focus=metal-mine",
    focusKey: "metal-mine",
    label: "Metal Madeni",
    category: "resources",
    buttonText: "Metal Madenine Git",
  },
  {
    patterns: [/kristal madeni/i, /^crystal-mine$/i, /^crystalMine$/i],
    route: "/resources?focus=crystal-mine",
    focusKey: "crystal-mine",
    label: "Kristal Madeni",
    category: "resources",
    buttonText: "Kristal Madenine Git",
  },
  {
    patterns: [
      /deuterium sentezleyicisi/i,
      /döteryum sentezleyicisi/i,
      /deuterium mine/i,
      /^deut-synth$/i,
      /^deuteriumSynthesizer$/i,
    ],
    route: "/resources?focus=deut-synth",
    focusKey: "deut-synth",
    label: "Deuterium Sentezleyicisi",
    category: "resources",
    buttonText: "Döteryum Sentezleyicisine Git",
  },
  {
    patterns: [
      /olumlu bir enerji/i,
      /enerji bilançosu/i,
      /enerji\s*>=\s*0/i,
      /enerji ayarları/i,
      /enerji ayarlari/i,
      /^energy-settings$/i,
    ],
    route: "/resources/settings",
    focusKey: "energy-settings",
    label: "Kaynaklar / Enerji Ayarları",
    category: "resources",
    buttonText: "Kaynaklar / Enerji Ayarlarına Git",
  },
  {
    patterns: [
      /solar enerji santrali/i,
      /solar enerji/i,
      /güneş enerji santrali/i,
      /güneş enerjisi/i,
      /kolonide solar/i,
      /enerji ihtiyacı/i,
      /^solar-plant$/i,
      /^solarPlant$/i,
      /^d4_s8/i,
    ],
    route: "/resources?focus=solar-plant",
    focusKey: "solar-plant",
    label: "Solar Enerji Santrali",
    category: "resources",
    buttonText: "Solar Santraline Git",
  },
  {
    patterns: [
      /füzyoenerji/i,
      /füzyon santrali/i,
      /^fusion-reactor$/i,
      /^fusionReactor$/i,
    ],
    route: "/resources?focus=fusion-reactor",
    focusKey: "fusion-reactor",
    label: "Füzyoenerji Santrali",
    category: "resources",
    buttonText: "Füzyoenerji Santraline Git",
  },
  {
    patterns: [/metal deposu/i, /^metal-storage$/i, /^metalStorage$/i],
    route: "/resources?focus=metal-storage",
    focusKey: "metal-storage",
    label: "Metal Deposu",
    category: "resources",
    buttonText: "Metal Deposuna Git",
  },
  {
    patterns: [/kristal deposu/i, /^crystal-storage$/i, /^crystalStorage$/i],
    route: "/resources?focus=crystal-storage",
    focusKey: "crystal-storage",
    label: "Kristal Deposu",
    category: "resources",
    buttonText: "Kristal Deposuna Git",
  },
  {
    patterns: [
      /deuterium tankeri/i,
      /döteryum tankeri/i,
      /^deut-tank$/i,
      /^deuteriumTank$/i,
    ],
    route: "/resources?focus=deut-tank",
    focusKey: "deut-tank",
    label: "Deuterium Tankeri",
    category: "resources",
    buttonText: "Döteryum Tankerine Git",
  },
  {
    patterns: [
      /kaynak ayarları/i,
      /kaynak ayar/i,
      /gücünü %90/i,
      /gücünü tekrar %100/i,
      /%90.*ayarla/i,
      /%100.*ayarla/i,
      /%90/i,
      /%100/i,
      /üretim oran/i,
      /üretim ayarı/i,
      /production-table/i,
      /resource-settings/i,
    ],
    route: "/resources/settings",
    focusKey: "resource-settings",
    modalId: "RESOURCE_SETTINGS_MODAL",
    label: "Kaynak Ayarları",
    category: "resources",
    buttonText: "Kaynak Ayarlarına Git",
  },

  // 2. Facilities (Tesisler)
  {
    patterns: [/robot fabrikası/i, /^robot-factory$/i, /^roboticsFactory$/i],
    route: "/facilities?focus=robot-factory",
    focusKey: "robot-factory",
    label: "Robot Fabrikası",
    category: "facilities",
    buttonText: "Robot Fabrikasına Git",
  },
  {
    patterns: [
      /tersane binası/i,
      /tersaneyi kur/i,
      /tersane seviye/i,
      /^shipyard-facility$/i,
    ],
    route: "/facilities?focus=shipyard",
    focusKey: "shipyard",
    label: "Tersane Tesisleri",
    category: "facilities",
    buttonText: "Tersaneye Git",
  },
  {
    patterns: [
      /araştırma laboratuvarı/i,
      /laboratuvar/i,
      /^research-lab$/i,
      /^researchLab$/i,
    ],
    route: "/facilities?focus=research-lab",
    focusKey: "research-lab",
    label: "Araştırma Laboratuvarı",
    category: "facilities",
    buttonText: "Laboratuvara Git",
  },
  {
    patterns: [/nanit fabrikası/i, /^nanite-factory$/i, /^naniteFactory$/i],
    route: "/facilities?focus=nanite-factory",
    focusKey: "nanite-factory",
    label: "Nanit Fabrikası",
    category: "facilities",
    buttonText: "Nanit Fabrikasına Git",
  },
  {
    patterns: [/roket silosu/i, /^missile-silo$/i, /^missileSilo$/i],
    route: "/facilities?focus=missile-silo",
    focusKey: "missile-silo",
    label: "Roket Silosu",
    category: "facilities",
    buttonText: "Roket Silosuna Git",
  },
  {
    patterns: [/terraformer/i, /^terraformer$/i],
    route: "/facilities?focus=terraformer",
    focusKey: "terraformer",
    label: "Terraformer",
    category: "facilities",
    buttonText: "Terraformer'a Git",
  },
  {
    patterns: [/uzay iskelesi/i, /uzay doku/i, /^space-dock$/i, /^spaceDock$/i],
    route: "/facilities?focus=space-dock",
    focusKey: "space-dock",
    label: "Uzay İskelesi",
    category: "facilities",
    buttonText: "Uzay İskelesine Git",
  },

  // 3. Research (Araştırma Teknolojileri)
  {
    patterns: [/enerji tekniği/i, /^energyTechnology$/i, /^energy-tech$/i, /^113$/],
    route: "/research?focus=energyTechnology",
    focusKey: "energyTechnology",
    label: "Enerji Tekniği",
    category: "research",
    buttonText: "Enerji Tekniğine Git",
  },
  {
    patterns: [/lazer tekniği/i, /^laserTechnology$/i, /^laser-tech$/i, /^120$/],
    route: "/research?focus=laserTechnology",
    focusKey: "laserTechnology",
    label: "Lazer Tekniği",
    category: "research",
    buttonText: "Lazer Tekniğine Git",
  },
  {
    patterns: [/iyon tekniği/i, /^ionTechnology$/i, /^ion-tech$/i, /^121$/],
    route: "/research?focus=ionTechnology",
    focusKey: "ionTechnology",
    label: "İyon Tekniği",
    category: "research",
    buttonText: "İyon Tekniğine Git",
  },
  {
    patterns: [
      /hiperuzay tekniği/i,
      /^hyperspaceTechnology$/i,
      /^hyperspace-tech$/i,
      /^114$/,
    ],
    route: "/research?focus=hyperspaceTechnology",
    focusKey: "hyperspaceTechnology",
    label: "Hiperuzay Tekniği",
    category: "research",
    buttonText: "Hiperuzay Tekniğine Git",
  },
  {
    patterns: [/plazma tekniği/i, /^plasmaTechnology$/i, /^plasma-tech$/i, /^122$/],
    route: "/research?focus=plasmaTechnology",
    focusKey: "plasmaTechnology",
    label: "Plazma Tekniği",
    category: "research",
    buttonText: "Plazma Tekniğine Git",
  },
  {
    patterns: [
      /yanmalı motor/i,
      /yanma motoru/i,
      /yanma motoru.*araştır/i,
      /^combustionDrive$/i,
      /^combustion-drive$/i,
      /^115$/,
    ],
    route: "/research?focus=combustion-drive",
    focusKey: "combustion-drive",
    label: "Yanma Motoru",
    category: "research",
    buttonText: "Yanma Motoruna Git",
  },
  {
    patterns: [
      /impuls motoru/i,
      /itki tekniği/i,
      /^impulseDrive$/i,
      /^impulse-drive$/i,
      /^117$/,
    ],
    route: "/research?focus=impulseDrive",
    focusKey: "impulseDrive",
    label: "İmpuls Motoru",
    category: "research",
    buttonText: "İmpuls Motoruna Git",
  },
  {
    patterns: [
      /hiperuzay iticisi/i,
      /^hyperspaceDrive$/i,
      /^hyperspace-drive$/i,
      /^118$/,
    ],
    route: "/research?focus=hyperspaceDrive",
    focusKey: "hyperspaceDrive",
    label: "Hiperuzay İticisi",
    category: "research",
    buttonText: "Hiperuzay İticisine Git",
  },
  {
    patterns: [
      /casusluk tekniği/i,
      /casusluğun temelleri/i,
      /casusluk.*araştır/i,
      /^espionageTechnology$/i,
      /^espionage-tech$/i,
      /^106$/,
    ],
    route: "/research?focus=espionage-tech",
    focusKey: "espionage-tech",
    label: "Casusluk Tekniği",
    category: "research",
    buttonText: "Casusluk Tekniğine Git",
  },
  {
    patterns: [
      /bilgisayar tekniği/i,
      /bilgisayar teknolojisi/i,
      /^computerTechnology$/i,
      /^computer-tech$/i,
      /^computerTech$/i,
      /^108$/,
      /^d4_s9/i,
      /^d6_s4/i,
      /d6_s4_computer_tech_2/i,
    ],
    route: "/research?focus=computer-tech",
    focusKey: "computer-tech",
    label: "Bilgisayar Tekniği",
    category: "research",
    buttonText: "Bilgisayar Tekniğine Git",
  },
  {
    patterns: [/astrofizik/i, /^astrophysics$/i, /^124$/],
    route: "/research?focus=astrophysics",
    focusKey: "astrophysics",
    label: "Astrofizik",
    category: "research",
    buttonText: "Astrofiziğe Git",
  },
  {
    patterns: [
      /galaksilerarası araştırma/i,
      /araştırma ağı/i,
      /^intergalacticResearchNetwork$/i,
      /^123$/,
    ],
    route: "/research?focus=intergalacticResearchNetwork",
    focusKey: "intergalacticResearchNetwork",
    label: "Galaksilerarası Araştırma Ağı",
    category: "research",
    buttonText: "Araştırma Ağına Git",
  },
  {
    patterns: [/graviton/i, /^gravitonTechnology$/i, /^199$/],
    route: "/research?focus=gravitonTechnology",
    focusKey: "gravitonTechnology",
    label: "Graviton Tekniği",
    category: "research",
    buttonText: "Gravitona Git",
  },
  {
    patterns: [/silah tekniği/i, /^weaponsTechnology$/i, /^109$/],
    route: "/research?focus=weaponsTechnology",
    focusKey: "weaponsTechnology",
    label: "Silah Tekniği",
    category: "research",
    buttonText: "Silah Tekniğine Git",
  },
  {
    patterns: [/kalkan tekniği/i, /^shieldingTechnology$/i, /^110$/],
    route: "/research?focus=shieldingTechnology",
    focusKey: "shieldingTechnology",
    label: "Kalkan Tekniği",
    category: "research",
    buttonText: "Kalkan Tekniğine Git",
  },
  {
    patterns: [
      /uzay gemisi zırhı/i,
      /uzay gemisi zirhi/i,
      /gemisi zırhı/i,
      /zırhlandırma/i,
      /zırh tekniği/i,
      /zırh.*araştır/i,
      /^armorTechnology$/i,
      /^armourTechnology$/i,
      /^armor-tech$/i,
      /^armour-tech$/i,
      /^armorTech$/i,
      /^armourTech$/i,
      /^111$/,
      /^d5_s6/i,
    ],
    route: "/research?focus=armor-tech",
    focusKey: "armor-tech",
    label: "Uzay Gemisi Zırhı",
    category: "research",
    buttonText: "Uzay Gemisi Zırhına Git",
  },

  // 4. Shipyard (Gemiler)
  {
    patterns: [/küçük nakliye/i, /^smallCargo$/i, /^small-cargo$/i, /^202$/],
    route: "/shipyard?focus=smallCargo",
    focusKey: "smallCargo",
    label: "Küçük Nakliye Gemisi",
    category: "shipyard",
    buttonText: "Küçük Nakliyeye Git",
  },
  {
    patterns: [/büyük nakliye/i, /^largeCargo$/i, /^large-cargo$/i, /^203$/],
    route: "/shipyard?focus=largeCargo",
    focusKey: "largeCargo",
    label: "Büyük Nakliye Gemisi",
    category: "shipyard",
    buttonText: "Büyük Nakliyeye Git",
  },
  {
    patterns: [/hafif avcı/i, /^lightFighter$/i, /^light-fighter$/i, /^204$/],
    route: "/shipyard?focus=lightFighter",
    focusKey: "lightFighter",
    label: "Hafif Avcı",
    category: "shipyard",
    buttonText: "Hafif Avcıya Git",
  },
  {
    patterns: [
      /ağır avcı/i,
      /agir avci/i,
      /ağır savaşçı/i,
      /agir savasci/i,
      /ağır savaşçılara ihtiyacımız var/i,
      /ağır avcı.*inşa/i,
      /^heavyFighter$/i,
      /^heavy-fighter$/i,
      /^205$/,
      /^d5_s11/i,
    ],
    route: "/shipyard?focus=heavy-fighter",
    focusKey: "heavy-fighter",
    label: "Ağır Avcı",
    category: "shipyard",
    buttonText: "Ağır Avcıya Git",
  },
  {
    patterns: [/kruvazör/i, /^cruiser$/i, /^206$/],
    route: "/shipyard?focus=cruiser",
    focusKey: "cruiser",
    label: "Kruvazör",
    category: "shipyard",
    buttonText: "Kruvazöre Git",
  },
  {
    patterns: [
      /komuta gemisi/i,
      /savaş gemisi/i,
      /^battleship$/i,
      /^207$/,
    ],
    route: "/shipyard?focus=battleship",
    focusKey: "battleship",
    label: "Komuta Gemisi",
    category: "shipyard",
    buttonText: "Komuta Gemisine Git",
  },
  {
    patterns: [/koloni gemisi/i, /^colonyShip$/i, /^colony-ship$/i, /^208$/],
    route: "/shipyard?focus=colonyShip",
    focusKey: "colonyShip",
    label: "Koloni Gemisi",
    category: "shipyard",
    buttonText: "Koloni Gemisine Git",
  },
  {
    patterns: [/geri dönüşümcü/i, /^recycler$/i, /^209$/],
    route: "/shipyard?focus=recycler",
    focusKey: "recycler",
    label: "Geri Dönüşümcü",
    category: "shipyard",
    buttonText: "Geri Dönüşümcüye Git",
  },
  {
    patterns: [/casus sondası/i, /^espionageProbe$/i, /^espionage-probe$/i, /^210$/],
    route: "/shipyard?focus=espionageProbe",
    focusKey: "espionageProbe",
    label: "Casus Sondası",
    category: "shipyard",
    buttonText: "Casus Sondasına Git",
  },
  {
    patterns: [
      /solar uydu/i,
      /güneş uydusu/i,
      /^solarSatellite$/i,
      /^solar-satellite$/i,
      /^212$/,
    ],
    route: "/shipyard?focus=solarSatellite",
    focusKey: "solarSatellite",
    label: "Solar Uydu",
    category: "shipyard",
    buttonText: "Solar Uyduya Git",
  },
  {
    patterns: [/paletli/i, /^crawler$/i, /^217$/],
    route: "/shipyard?focus=crawler",
    focusKey: "crawler",
    label: "Paletli",
    category: "shipyard",
    buttonText: "Paletliye Git",
  },

  // 5. Defenses (Savunma Üniteleri)
  {
    patterns: [/roketatar/i, /^rocketLauncher$/i, /^rocket-launcher$/i, /^401$/],
    route: "/defenses?focus=rocketLauncher",
    focusKey: "rocketLauncher",
    label: "Roketatar",
    category: "defenses",
    buttonText: "Roketatara Git",
  },
  {
    patterns: [/hafif lazer/i, /^lightLaser$/i, /^light-laser$/i, /^402$/],
    route: "/defenses?focus=lightLaser",
    focusKey: "lightLaser",
    label: "Hafif Lazer",
    category: "defenses",
    buttonText: "Hafif Lazere Git",
  },
  {
    patterns: [/ağır lazer/i, /^heavyLaser$/i, /^heavy-laser$/i, /^403$/],
    route: "/defenses?focus=heavyLaser",
    focusKey: "heavyLaser",
    label: "Ağır Lazer",
    category: "defenses",
    buttonText: "Ağır Lazere Git",
  },
  {
    patterns: [/gauss topu/i, /^gaussCannon$/i, /^gauss-cannon$/i, /^404$/],
    route: "/defenses?focus=gaussCannon",
    focusKey: "gaussCannon",
    label: "Gauss Topu",
    category: "defenses",
    buttonText: "Gauss Topuna Git",
  },
  {
    patterns: [/iyon topu/i, /^ionCannon$/i, /^ion-cannon$/i, /^405$/],
    route: "/defenses?focus=ionCannon",
    focusKey: "ionCannon",
    label: "İyon Topu",
    category: "defenses",
    buttonText: "İyon Topuna Git",
  },
  {
    patterns: [/plazma atıcı/i, /^plasmaTurret$/i, /^plasma-turret$/i, /^406$/],
    route: "/defenses?focus=plasmaTurret",
    focusKey: "plasmaTurret",
    label: "Plazma Atıcı",
    category: "defenses",
    buttonText: "Plazma Atıcıya Git",
  },
  {
    patterns: [
      /küçük kalkan kubbesi/i,
      /^smallShieldDome$/i,
      /^small-shield-dome$/i,
      /^407$/,
    ],
    route: "/defenses?focus=smallShieldDome",
    focusKey: "smallShieldDome",
    label: "Küçük Kalkan Kubbesi",
    category: "defenses",
    buttonText: "Küçük Kalkan Kubbesine Git",
  },
  {
    patterns: [
      /büyük kalkan kubbesi/i,
      /^largeShieldDome$/i,
      /^large-shield-dome$/i,
      /^408$/,
    ],
    route: "/defenses?focus=largeShieldDome",
    focusKey: "largeShieldDome",
    label: "Büyük Kalkan Kubbesi",
    category: "defenses",
    buttonText: "Büyük Kalkan Kubbesine Git",
  },
  {
    patterns: [
      /yakalayıcı roket/i,
      /^antiBallisticMissiles$/i,
      /^anti-ballistic$/i,
      /^502$/,
    ],
    route: "/defenses?focus=antiBallisticMissiles",
    focusKey: "antiBallisticMissiles",
    label: "Yakalayıcı Roketler",
    category: "defenses",
    buttonText: "Yakalayıcı Roketlere Git",
  },
  {
    patterns: [
      /gezegenlerarası roket/i,
      /^interplanetaryMissiles$/i,
      /^interplanetary$/i,
      /^503$/,
    ],
    route: "/defenses?focus=interplanetaryMissiles",
    focusKey: "interplanetaryMissiles",
    label: "Gezegenlerarası Roketler",
    category: "defenses",
    buttonText: "Gezegenlerarası Roketlere Git",
  },

  // 6. Lifeforms (Canlı Türü Binaları ve Gelişimi)
  {
    patterns: [
      /barınma tesisi/i,
      /barinma tesisi/i,
      /barınma/i,
      /barinma/i,
      /konut sektörü/i,
      /konut sektoru/i,
      /yaşam alanı/i,
      /^residentialSector$/i,
      /^residential-sector$/i,
      /^11101$/,
      /d6_s1_residential_sector_21/i,
    ],
    route: "/lifeforms?focus=residential-sector",
    focusKey: "residential-sector",
    label: "Barınma Tesisi",
    category: "lifeforms",
    buttonText: "Barınma Tesisine Git",
  },
  {
    patterns: [
      /biyosfer çiftliği/i,
      /biyosfer ciftligi/i,
      /çiftlik/i,
      /^biosphereFarm$/i,
      /^biosphere-farm$/i,
      /^11102$/,
      /d6_s1_biosphere_farm_22/i,
    ],
    route: "/lifeforms?focus=biosphere-farm",
    focusKey: "biosphere-farm",
    label: "Biyosfer Çiftliği",
    category: "lifeforms",
    buttonText: "Biyosfer Çiftliğine Git",
  },
  {
    patterns: [
      /araştırma merkezi/i,
      /arastirma merkezi/i,
      /^researchCentre$/i,
      /^research-centre$/i,
      /^researchCenter$/i,
      /^research-center$/i,
      /^11103$/,
      /d6_s2_research_centre_1/i,
      /^d6_s2/i,
    ],
    route: "/lifeforms?focus=research-centre",
    focusKey: "research-centre",
    label: "Araştırma Merkezi",
    category: "lifeforms",
    buttonText: "Araştırma Merkezine Git",
  },
  {
    patterns: [
      /galaksiler arası elçiler/i,
      /galaksiler arasi elciler/i,
      /elçiler/i,
      /elciler/i,
      /^intergalactic-envoys$/i,
      /^intergalacticEnvoys$/i,
      /d6_s3_intergalactic_envoys/i,
      /^d6_s3/i,
    ],
    route: "/lifeforms?tab=development&focus=intergalactic-envoys",
    focusKey: "intergalactic-envoys",
    label: "Galaksiler Arası Elçiler",
    category: "lifeforms",
    buttonText: "Galaksiler Arası Elçilere Git",
  },
  {
    patterns: [/akademi/i, /^academy$/i, /^11104$/],
    route: "/lifeforms?focus=academy",
    focusKey: "academy",
    label: "Akademi",
    category: "lifeforms",
    buttonText: "Akademiye Git",
  },
  {
    patterns: [/canlı tür/i, /insan türü/i, /nüfus/i, /tür binası/i],
    route: "/lifeforms",
    label: "Canlı Türleri",
    category: "lifeforms",
    buttonText: "Canlı Türlerine Git",
  },

  // 7. Fleet / Expedition & Galaxy
  {
    patterns: [
      /16\. slot/i,
      /16\. pozisyon/i,
      /keşif görevi/i,
      /keşfe çık/i,
      /filoyu kaçır/i,
      /kaçırma/i,
    ],
    route: "/fleet?mission=expedition&slot=16",
    focusKey: "expedition",
    label: "16. Slot Keşif Görevi",
    category: "fleet",
    buttonText: "Keşif Filosuna Git",
  },
  {
    patterns: [/casusluk görevi/i, /casusluk yap/i, /sonda fırlat/i],
    route: "/galaxy",
    label: "Galaksi Casusluk",
    category: "galaxy",
    buttonText: "Galaksiye Git",
  },

  // 8. Other In-Game Areas
  {
    patterns: [/dükkan/i, /sınıf seç/i, /envanter/i, /booster/i],
    route: "/shop/classes",
    label: "Dükkan & Sınıflar",
    category: "shop",
    buttonText: "Dükkana Git",
  },
  {
    patterns: [/ittifak/i, /ittifak kur/i],
    route: "/alliance",
    label: "İttifak",
    category: "alliance",
    buttonText: "İttifaka Git",
  },
  {
    patterns: [
      /gezegeni yeniden adlandır/i,
      /ana gezegenin adını değiştir/i,
      /gezegen.*adını değiştir/i,
      /koloni.*adını değiştir/i,
      /rename-planet/i,
    ],
    route: "/overview?action=rename-planet",
    focusKey: "rename-planet",
    modalId: "RENAME_PLANET_MODAL",
    label: "Gezegen İsmini Değiştir",
    category: "rewards",
    buttonText: "Gezegen İsmini Değiştir",
  },
  {
    patterns: [
      /bir arkadaşlık isteği gönder/i,
      /başka bir imparatora arkadaşlık isteği/i,
      /arkadaşlık isteği/i,
      /arkadaş.*ekle/i,
      /add-friend/i,
    ],
    route: "/messages?tab=friends&action=add-friend",
    focusKey: "add-friend",
    modalId: "ADD_FRIEND_MODAL",
    label: "Arkadaş Ekle",
    category: "rewards",
    buttonText: "Arkadaş Ekle",
  },
];

/**
 * Resolves a quest objective text or identifier to a target game route.
 */
export function getQuestTargetRoute(objectiveText?: string | null): QuestTargetRoute {
  if (!objectiveText || typeof objectiveText !== "string") {
    return {
      route: "/rewards",
      label: "Ödüller",
      category: "rewards",
      buttonText: "Ödüller Sayfasına Git",
    };
  }

  const clean = objectiveText.trim();

  // Direct composite key lookup (e.g. 'd1_s5_resource_settings', 'd2_s5_espionage_tech_2')
  if (QUEST_ROUTE_MAPPING[clean]) {
    const item = QUEST_ROUTE_MAPPING[clean];
    const category: QuestTargetRoute["category"] =
      item.category ??
      (item.path.startsWith("/research")
        ? "research"
        : item.path.startsWith("/facilities")
        ? "facilities"
        : item.path.startsWith("/shipyard")
        ? "shipyard"
        : item.path.startsWith("/defenses")
        ? "defenses"
        : item.path.startsWith("/fleet")
        ? "fleet"
        : item.path.startsWith("/galaxy")
        ? "galaxy"
        : item.path.startsWith("/lifeforms")
        ? "lifeforms"
        : "resources");

    const params = new URLSearchParams();
    if (item.tab) {
      params.set("tab", item.tab);
    }
    if (item.focus) {
      params.set("focus", item.focus);
    }
    const mission = item.meta?.mission ?? item.meta?.defaultMission;
    if (mission) {
      params.set("mission", mission);
    }
    const ship = item.meta?.suggestedShip ?? item.meta?.ship;
    if (ship) {
      params.set("ship", ship);
    }
    const targetSlot =
      item.meta?.targetSlot ??
      item.meta?.targetPosition ??
      item.meta?.slot ??
      item.meta?.position;
    if (targetSlot !== undefined) {
      params.set("slot", String(targetSlot));
      params.set("position", String(targetSlot));
    }
    const query = params.toString();
    const route = query ? `${item.path}?${query}` : item.path;

    return {
      route,
      focusKey: item.focus,
      label: item.labelOverride,
      category,
      buttonText: `${item.labelOverride}'na Git`,
      meta: item.meta,
    };
  }

  for (const item of QUEST_ROUTE_REGISTRY) {
    for (const pattern of item.patterns) {
      if (typeof pattern === "string") {
        if (clean.toLowerCase().includes(pattern.toLowerCase())) {
          return {
            route: item.route,
            focusKey: item.focusKey,
            modalId: item.modalId,
            label: item.label,
            category: item.category,
            buttonText: item.buttonText,
            meta: item.meta,
          };
        }
      } else if (pattern.test(clean)) {
        return {
          route: item.route,
          focusKey: item.focusKey,
          modalId: item.modalId,
          label: item.label,
          category: item.category,
          buttonText: item.buttonText,
          meta: item.meta,
        };
      }
    }
  }

  // Fallback defaults based on broad keywords
  if (/maden|kaynak|enerji|santral/i.test(clean)) {
    return {
      route: "/resources",
      label: "Kaynaklar",
      category: "resources",
      buttonText: "Kaynaklara Git",
    };
  }
  if (/tesis|fabrika|laboratuvar/i.test(clean)) {
    return {
      route: "/facilities",
      label: "Tesisler",
      category: "facilities",
      buttonText: "Tesisler Sayfasına Git",
    };
  }
  if (/araştır|tekni|motor/i.test(clean)) {
    return {
      route: "/research",
      label: "Araştırma",
      category: "research",
      buttonText: "Araştırma Sayfasına Git",
    };
  }
  if (/gemi|filo|avcı|nakliye|kruvazör|sonda|uydu/i.test(clean)) {
    return {
      route: "/shipyard",
      label: "Tersane",
      category: "shipyard",
      buttonText: "Tersaneye Git",
    };
  }
  if (/savunma|roket|kalkan|lazer|top/i.test(clean)) {
    return {
      route: "/defenses",
      label: "Savunma",
      category: "defenses",
      buttonText: "Savunmaya Git",
    };
  }
  if (/teknoloji|techtree|ağaç/i.test(clean)) {
    return {
      route: "/techtree",
      label: "Teknoloji Ağacı",
      category: "techtree",
      buttonText: "Teknoloji Ağacına Git",
    };
  }
  if (/canlı|insan|biyosfer/i.test(clean)) {
    return {
      route: "/lifeforms",
      label: "Canlı Türleri",
      category: "lifeforms",
      buttonText: "Canlı Türlerine Git",
    };
  }

  return {
    route: "/rewards",
    label: "Ödüller",
    category: "rewards",
    buttonText: "Ödüller Sayfasına Git",
  };
}

