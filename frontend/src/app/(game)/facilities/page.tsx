"use client";

import { useState, useEffect, Suspense, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import {
  useGameStore,
  evaluateBuildingPrerequisites,
  type BuildingInfo,
  type FacilityItemKey,
  type ResourceItemKey,
} from "@/store/useGameStore";
import { useCountdown } from "@/hooks/useCountdown";
import { useQuestFocusHighlight } from "@/hooks/useQuestFocusHighlight";
import { FacilityDetailPanel } from "@/components/facilities/FacilityDetailPanel";
import {
  Bot,
  Rocket,
  FlaskConical,
  Handshake,
  Crosshair,
  Cpu,
  Globe2,
  Wrench,
  Hammer,
  Lock,
  Flame,
} from "lucide-react";

const FACILITY_VISUALS: Record<
  FacilityItemKey,
  { icon: ReactNode; gradient: string }
> = {
  roboticsFactory: {
    icon: <Bot className="h-9 w-9 text-cyan-300" />,
    gradient: "from-cyan-950/80 via-slate-900 to-[#070a0f]",
  },
  shipyard: {
    icon: <Rocket className="h-9 w-9 text-amber-300" />,
    gradient: "from-amber-950/75 via-slate-900 to-[#070a0f]",
  },
  researchLab: {
    icon: <FlaskConical className="h-9 w-9 text-emerald-300" />,
    gradient: "from-emerald-950/75 via-slate-900 to-[#070a0f]",
  },
  allianceDepot: {
    icon: <Handshake className="h-9 w-9 text-sky-300" />,
    gradient: "from-sky-950/75 via-slate-900 to-[#070a0f]",
  },
  missileSilo: {
    icon: <Crosshair className="h-9 w-9 text-rose-300" />,
    gradient: "from-rose-950/75 via-slate-900 to-[#070a0f]",
  },
  naniteFactory: {
    icon: <Cpu className="h-9 w-9 text-purple-300" />,
    gradient: "from-purple-950/80 via-slate-900 to-[#070a0f]",
  },
  terraformer: {
    icon: <Globe2 className="h-9 w-9 text-teal-300" />,
    gradient: "from-teal-950/80 via-slate-900 to-[#070a0f]",
  },
  spaceDock: {
    icon: <Wrench className="h-9 w-9 text-indigo-300" />,
    gradient: "from-indigo-950/80 via-slate-900 to-[#070a0f]",
  },
};

const FACILITY_KEY_MAP: Record<string, ResourceItemKey> = {
  "robot-factory": "roboticsFactory",
  "robotics-factory": "roboticsFactory",
  roboticsfactory: "roboticsFactory",
  shipyard: "shipyard",
  "research-lab": "researchLab",
  researchlab: "researchLab",
  "alliance-depot": "allianceDepot",
  alliancedepot: "allianceDepot",
  "missile-silo": "missileSilo",
  missilesilo: "missileSilo",
  "nanite-factory": "naniteFactory",
  nanitefactory: "naniteFactory",
  terraformer: "terraformer",
  "space-dock": "spaceDock",
  spacedock: "spaceDock",
};

function FacilitiesPageContent() {
  const searchParams = useSearchParams();
  const rawParam =
    searchParams.get("focus") ??
    searchParams.get("building") ??
    searchParams.get("key") ??
    searchParams.get("facility");

  const validKeys: ResourceItemKey[] = [
    "roboticsFactory",
    "shipyard",
    "researchLab",
    "allianceDepot",
    "missileSilo",
    "naniteFactory",
    "terraformer",
    "spaceDock",
  ];

  const matchedKey = rawParam
    ? FACILITY_KEY_MAP[rawParam.toLowerCase()] ??
      (validKeys.includes(rawParam as ResourceItemKey) ? (rawParam as ResourceItemKey) : null)
    : null;

  const planets = useGameStore((s) => s.planets);
  const selectedPlanetId = useGameStore((s) => s.selectedPlanetId);
  const researches = useGameStore((s) => s.researches);
  const completeActiveBuildingUpgrade = useGameStore(
    (s) => s.completeActiveBuildingUpgrade
  );

  const planet = planets.find((p) => p.id === selectedPlanetId) ?? planets[0];
  const activeQueue = planet.activeBuildingQueue;

  const [selectedKey, setSelectedKey] = useState<ResourceItemKey>(
    matchedKey ?? "roboticsFactory"
  );

  const { isHighlighted, highlightClass } = useQuestFocusHighlight({
    paramName: "focus",
    onFocusFound: (focus) => {
      const match = FACILITY_KEY_MAP[focus.toLowerCase()];
      if (match) setSelectedKey(match);
    },
  });

  useEffect(() => {
    if (matchedKey) {
      setSelectedKey(matchedKey);
    }
  }, [matchedKey]);

  const queueTimer = useCountdown(
    activeQueue?.endTimeUtc,
    activeQueue?.startTimeUtc,
    {
      referenceUtc: planet.serverTimeUtc,
      onComplete: () => {
        completeActiveBuildingUpgrade();
      },
    }
  );

  const facilityItems = planet.buildings.filter(
    (b) => b.category === "facility"
  );

  const selectedBuilding: BuildingInfo =
    facilityItems.find((b) => b.key === selectedKey) ?? facilityItems[0];

  const renderCard = (item: BuildingInfo) => {
    const isSelected = item.key === selectedBuilding?.key;
    const isUnderConstruction = activeQueue?.buildingKey === item.key;
    const visual =
      FACILITY_VISUALS[item.key as FacilityItemKey] ??
      FACILITY_VISUALS.roboticsFactory;

    const prereqStatus = evaluateBuildingPrerequisites(
      item,
      planet,
      researches
    );
    const prerequisitesMet = prereqStatus.every((p) => p.met);

    const kebab = item.key.replace(/([A-Z])/g, "-$1").toLowerCase();
    const isFocused =
      isHighlighted(item.key) ||
      isHighlighted(kebab) ||
      (item.key === "roboticsFactory" && isHighlighted("robot-factory")) ||
      (item.key === "researchLab" && isHighlighted("research-lab")) ||
      (item.key === "naniteFactory" && isHighlighted("nanite-factory")) ||
      (item.key === "missileSilo" && isHighlighted("missile-silo")) ||
      (item.key === "spaceDock" && isHighlighted("space-dock"));

    return (
      <button
        key={item.key}
        id={`card-${kebab}`}
        data-key={item.key}
        type="button"
        onClick={() => setSelectedKey(item.key)}
        className={`group relative h-32 rounded-lg border overflow-hidden flex flex-col justify-between p-3 text-left transition-all ${
          isFocused
            ? highlightClass
            : isSelected
            ? "border-amber-400 ring-1 ring-amber-400/60 shadow-[0_0_18px_rgba(251,191,36,0.3)]"
            : "border-zinc-800 hover:border-cyan-500/50"
        } bg-gradient-to-br ${visual.gradient}`}
      >
        {/* Top Row: Name + Optional Prerequisite Lock Badge */}
        <div className="relative z-10 flex items-start justify-between gap-1.5 w-full">
          <div className="text-xs font-bold text-zinc-100 leading-tight line-clamp-2 drop-shadow">
            {item.name}
          </div>
          {!prerequisitesMet && (
            <span
              title="Ön koşullar karşılanmadı"
              className="p-1 rounded bg-rose-950/80 border border-rose-500/50 text-rose-300 shrink-0"
            >
              <Lock className="h-3 w-3" />
            </span>
          )}
        </div>

        {/* Center Visual Icon */}
        <div
          className={`relative z-10 flex items-center justify-center my-auto transition-transform group-hover:scale-110 ${
            prerequisitesMet ? "opacity-90" : "opacity-45 grayscale"
          }`}
        >
          {visual.icon}
        </div>

        {/* Bottom-Right Level Badge */}
        <div className="relative z-10 flex items-center justify-end w-full">
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${
              isSelected
                ? "bg-amber-500/20 border-amber-400/60 text-amber-200"
                : "bg-black/80 border-zinc-700/80 text-cyan-300"
            }`}
          >
            Kademe {item.level}
          </span>
        </div>

        {/* Under Construction or Demolition Dark Semi-Transparent Overlay with Real-time Timer (mm:ss) */}
        {isUnderConstruction && (
          <div
            className={`absolute inset-0 z-20 bg-black/85 backdrop-blur-[2px] flex flex-col items-center justify-center p-2 text-center border ${
              activeQueue.isDemolition
                ? "border-rose-500/70"
                : "border-amber-500/60"
            }`}
          >
            {activeQueue.isDemolition ? (
              <>
                <Flame className="h-5 w-5 text-rose-400 animate-pulse mb-1" />
                <div className="text-[10px] font-mono uppercase text-rose-300 font-bold">
                  Yıkım: Kademe {activeQueue.targetLevel}
                </div>
              </>
            ) : (
              <>
                <Hammer className="h-5 w-5 text-amber-400 animate-bounce mb-1" />
                <div className="text-[10px] font-mono uppercase text-amber-200">
                  Kademe {activeQueue.targetLevel}
                </div>
              </>
            )}
            <div
              suppressHydrationWarning
              className={`text-xs font-mono font-bold mt-0.5 tabular-nums ${
                activeQueue.isDemolition ? "text-rose-400" : "text-amber-400"
              }`}
            >
              {queueTimer.formattedClock}
            </div>
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header Hero Banner */}
      <div
        className="relative rounded-lg border border-cyan-500/25 bg-[#080d16] p-5 overflow-hidden shadow-[0_6px_25px_rgba(0,0,0,0.7)] flex items-center justify-between flex-wrap gap-4"
        style={{
          backgroundImage:
            "radial-gradient(90% 120% at 85% 0%, rgba(34,211,238,0.16) 0%, rgba(168,85,247,0.08) 45%, rgba(8,13,22,0.96) 100%)",
        }}
      >
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400">
            Gezegen Altyapı ve Tersane Kompleksi • {planet.coords}
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 mt-0.5">
            Tesisler - <span className="text-cyan-300">{planet.name}</span>
          </h1>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-zinc-300 bg-[#0b111b]/90 border border-zinc-800 px-3.5 py-2 rounded">
          <span className="text-zinc-400">Kullanılan Alan:</span>
          <span className="text-cyan-300 font-bold">
            {planet.fieldsUsed} / {planet.maxFields}
          </span>
        </div>
      </div>

      {/* Selected Facility Active Detail Panel */}
      {selectedBuilding && (
        <FacilityDetailPanel
          building={selectedBuilding}
          planet={planet}
          remainingQueueSeconds={queueTimer.remainingSeconds}
          onSelectFacility={(key) => setSelectedKey(key)}
        />
      )}

      {/* 8-Card Facility Grid Layout (2 rows x 4 columns) */}
      <div className="rounded-lg border border-zinc-800/90 bg-[#090d14]/95 p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
            Tesis Binaları (8 Altyapı Tesisi)
          </span>
          <span className="text-[11px] font-mono text-zinc-500">
            Detay ve yükseltme için bir tesise tıklayın
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {facilityItems.map(renderCard)}
        </div>
      </div>
    </div>
  );
}

export default function FacilitiesPage() {
  return (
    <Suspense fallback={null}>
      <FacilitiesPageContent />
    </Suspense>
  );
}

