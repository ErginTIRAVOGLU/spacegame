"use client";

import { useState, Suspense, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import {
  useGameStore,
  type BuildingInfo,
  type ResourceItemKey,
} from "@/store/useGameStore";
import { useCountdown } from "@/hooks/useCountdown";
import { useQuestFocusHighlight } from "@/hooks/useQuestFocusHighlight";
import { ResourceDetailPanel } from "@/components/resources/ResourceDetailPanel";
import { ResourceSettingsModal } from "@/components/resources/ResourceSettingsModal";
import { SolarSatelliteCard } from "@/components/resources/SolarSatelliteCard";
import {
  Pickaxe,
  Gem,
  Droplets,
  Sun,
  Atom,
  Satellite,
  Database,
  Cylinder,
  Container,
  Cog,
  Sliders,
  Hammer,
} from "lucide-react";

const ITEM_VISUALS: Partial<
  Record<ResourceItemKey, { icon: ReactNode; gradient: string }>
> = {
  metalMine: {
    icon: <Pickaxe className="h-8 w-8 text-zinc-200" />,
    gradient: "from-zinc-800 via-slate-900 to-[#070a0f]",
  },
  crystalMine: {
    icon: <Gem className="h-8 w-8 text-cyan-300" />,
    gradient: "from-cyan-900/70 via-slate-900 to-[#070a0f]",
  },
  deuteriumSynthesizer: {
    icon: <Droplets className="h-8 w-8 text-emerald-300" />,
    gradient: "from-emerald-900/70 via-slate-900 to-[#070a0f]",
  },
  solarPlant: {
    icon: <Sun className="h-8 w-8 text-amber-300" />,
    gradient: "from-amber-900/70 via-slate-900 to-[#070a0f]",
  },
  fusionReactor: {
    icon: <Atom className="h-8 w-8 text-purple-300" />,
    gradient: "from-purple-900/70 via-slate-900 to-[#070a0f]",
  },
  solarSatellite: {
    icon: <Satellite className="h-8 w-8 text-sky-300" />,
    gradient: "from-sky-900/70 via-slate-900 to-[#070a0f]",
  },
  metalStorage: {
    icon: <Database className="h-8 w-8 text-zinc-300" />,
    gradient: "from-zinc-800/80 via-zinc-900 to-[#070a0f]",
  },
  crystalStorage: {
    icon: <Container className="h-8 w-8 text-cyan-300" />,
    gradient: "from-cyan-950 via-zinc-900 to-[#070a0f]",
  },
  deuteriumTank: {
    icon: <Cylinder className="h-8 w-8 text-emerald-300" />,
    gradient: "from-emerald-950 via-zinc-900 to-[#070a0f]",
  },
  crawler: {
    icon: <Cog className="h-8 w-8 text-amber-400" />,
    gradient: "from-amber-950 via-zinc-900 to-[#070a0f]",
  },
};

const RESOURCE_FOCUS_MAP: Record<string, ResourceItemKey> = {
  "metal-mine": "metalMine",
  metalmine: "metalMine",
  "crystal-mine": "crystalMine",
  crystalmine: "crystalMine",
  "deut-synth": "deuteriumSynthesizer",
  deuteriumsynthesizer: "deuteriumSynthesizer",
  "solar-plant": "solarPlant",
  solarplant: "solarPlant",
  solar: "solarPlant",
  "solar-energy": "solarPlant",
  solarenergy: "solarPlant",
  "fusion-reactor": "fusionReactor",
  fusionreactor: "fusionReactor",
  "metal-storage": "metalStorage",
  metalstorage: "metalStorage",
  "crystal-storage": "crystalStorage",
  crystalstorage: "crystalStorage",
  "deut-tank": "deuteriumTank",
  deuteriumtank: "deuteriumTank",
  crawler: "crawler",
};

function ResourcesPageContent() {
  const planets = useGameStore((s) => s.planets);
  const selectedPlanetId = useGameStore((s) => s.selectedPlanetId);
  const completeActiveBuildingUpgrade = useGameStore(
    (s) => s.completeActiveBuildingUpgrade
  );

  const planet = planets.find((p) => p.id === selectedPlanetId) ?? planets[0];
  const activeQueue = planet.activeBuildingQueue;

  const searchParams = useSearchParams();
  const rawFocus = searchParams.get("focus")?.toLowerCase();
  const initialKey: ResourceItemKey =
    rawFocus && RESOURCE_FOCUS_MAP[rawFocus] ? RESOURCE_FOCUS_MAP[rawFocus] : "metalMine";
  const [selectedKey, setSelectedKey] = useState<ResourceItemKey>(initialKey);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const { isHighlighted, highlightClass, clearHighlight } = useQuestFocusHighlight({
    paramName: "focus",
    onFocusFound: (focus) => {
      const lower = focus.toLowerCase();
      if (lower === "production-table" || lower === "settings") {
        setIsSettingsOpen(true);
      } else if (RESOURCE_FOCUS_MAP[lower]) {
        setSelectedKey(RESOURCE_FOCUS_MAP[lower]);
      }
    },
  });

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

  const selectedBuilding: BuildingInfo =
    planet.buildings.find((b) => b.key === selectedKey) ?? planet.buildings[0];

  const producerItems = planet.buildings.filter(
    (b) => b.category === "producer"
  );
  const storageItems = planet.buildings.filter((b) => b.category === "storage");

  const renderCard = (item: BuildingInfo) => {
    const isSelected = item.key === selectedBuilding.key;
    const isUnderConstruction = activeQueue?.buildingKey === item.key;
    const visual = ITEM_VISUALS[item.key] ?? ITEM_VISUALS.metalMine!;
    const kebab = item.key.replace(/([A-Z])/g, "-$1").toLowerCase();
    const isFocused =
      isHighlighted(item.key) ||
      isHighlighted(kebab) ||
      (item.key === "solarPlant" && (isHighlighted("solar-plant") || isHighlighted("solar") || isHighlighted("solar-energy"))) ||
      (item.key === "deuteriumSynthesizer" && isHighlighted("deut-synth")) ||
      (item.key === "deuteriumTank" && isHighlighted("deut-tank"));

    // Task 05AO: Render dedicated SolarSatelliteCard with live shipyard queue mirror
    if (item.key === "solarSatellite") {
      return (
        <SolarSatelliteCard
          key={item.key}
          item={item}
          isSelected={isSelected}
          isFocused={isFocused}
          highlightClass={highlightClass}
          onClick={() => {
            setSelectedKey(item.key);
            clearHighlight();
          }}
          queue={planet.shipyardQueue}
          serverTimeUtc={planet.serverTimeUtc}
          icon={visual.icon}
          gradient={visual.gradient}
        />
      );
    }

    return (
      <button
        key={item.key}
        id={`card-${kebab}`}
        data-key={item.key}
        type="button"
        onClick={() => {
          setSelectedKey(item.key);
          clearHighlight();
        }}
        className={`group relative h-28 rounded-lg border overflow-hidden flex flex-col justify-between p-2.5 text-left transition-all ${
          isFocused
            ? highlightClass
            : isSelected
            ? "border-amber-400 ring-1 ring-amber-400/60 shadow-[0_0_18px_rgba(251,191,36,0.3)]"
            : "border-zinc-800 hover:border-cyan-500/50"
        } bg-gradient-to-br ${visual.gradient}`}
      >
        {/* Top Item Name */}
        <div className="relative z-10 flex items-start justify-between gap-1">
          <div className="text-[11px] font-bold text-zinc-100 leading-tight line-clamp-2 drop-shadow">
            {item.name}
          </div>
          {planet.isMoon && item.category === "storage" && (
            <span className="text-[8px] px-1 py-0.2 rounded bg-rose-950/90 text-rose-300 border border-rose-500/50 font-mono font-bold shrink-0">
              Ayda Yok
            </span>
          )}
        </div>

        {/* Center Visual Icon */}
        <div className="relative z-10 flex items-center justify-center my-auto opacity-85 group-hover:scale-110 transition-transform">
          {visual.icon}
        </div>

        {/* Bottom-Right Level / Count Badge */}
        <div className="relative z-10 flex items-center justify-end">
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${
              isSelected
                ? "bg-amber-500/20 border-amber-400/60 text-amber-200"
                : "bg-black/80 border-zinc-700/80 text-cyan-300"
            }`}
          >
            {item.level}
          </span>
        </div>

        {/* Under Construction Dark Overlay with Real-time Timer */}
        {isUnderConstruction && (
          <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-[2px] flex flex-col items-center justify-center p-2 text-center border border-amber-500/60">
            <Hammer className="h-5 w-5 text-amber-400 animate-bounce mb-1" />
            <div className="text-[10px] font-mono uppercase text-amber-200">
              Kademe {activeQueue.targetLevel}
            </div>
            <div
              suppressHydrationWarning
              className="text-xs font-mono font-bold text-amber-400 mt-0.5 tabular-nums"
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
            "radial-gradient(90% 120% at 85% 0%, rgba(34,211,238,0.16) 0%, rgba(16,185,129,0.08) 45%, rgba(8,13,22,0.96) 100%)",
        }}
      >
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400">
            Gezegen Endüstri Ağı • {planet.coords}
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 mt-0.5">
            Kaynaklar - <span className="text-cyan-300">{planet.name}</span>
          </h1>
        </div>

        <button
          id="card-production-table"
          type="button"
          onClick={() => setIsSettingsOpen(true)}
          className={`px-3.5 py-2 rounded bg-gradient-to-b from-[#172334] to-[#0c131d] hover:from-[#1f3047] hover:to-[#111c2b] border border-cyan-500/40 text-xs font-semibold text-cyan-200 flex items-center gap-2 shadow-[0_2px_12px_rgba(0,0,0,0.6)] transition ${
            isHighlighted("production-table") || isHighlighted("settings")
              ? highlightClass
              : ""
          }`}
        >
          <Sliders className="h-3.5 w-3.5 text-cyan-400" />
          <span>Kaynak ayarları</span>
        </button>
      </div>

      {/* Selected Building Active Detail Panel */}
      {selectedBuilding && (
        <ResourceDetailPanel
          building={selectedBuilding}
          planet={planet}
          remainingQueueSeconds={queueTimer.remainingSeconds}
        />
      )}

      {/* Building Grid Section 1: Üretim Binaları & Enerji Üniteleri */}
      <div className="rounded-lg border border-zinc-800/90 bg-[#090d14]/95 p-4 space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-zinc-300 border-b border-zinc-800 pb-2">
          Üretim Binaları & Enerji Sistemleri
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {producerItems.map(renderCard)}
        </div>
      </div>

      {/* Building Grid Section 2: Depolama Tesisleri */}
      <div className="rounded-lg border border-zinc-800/90 bg-[#090d14]/95 p-4 space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-zinc-300 border-b border-zinc-800 pb-2">
          Hammadde Depoları ve Tankerler
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {storageItems.map(renderCard)}
        </div>
      </div>

      {/* Resource Settings Matrix Modal */}
      <ResourceSettingsModal
        planet={planet}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}

export default function ResourcesPage() {
  return (
    <Suspense fallback={null}>
      <ResourcesPageContent />
    </Suspense>
  );
}

