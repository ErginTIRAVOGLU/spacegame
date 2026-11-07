"use client";

import { useState, useEffect, Suspense, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { useGameStore } from "@/store/useGameStore";
import {
  DEFENSE_CATALOG,
  type DefenseDefinition,
  evaluateDefensePrerequisites,
  calculateMissileSiloStatus,
} from "@/lib/defenseCatalog";
import { DefenseDetailPanel } from "@/components/defenses/DefenseDetailPanel";
import { ShipyardQueue } from "@/components/shipyard/ShipyardQueue";
import { useQuestFocusHighlight } from "@/hooks/useQuestFocusHighlight";
import {
  Shield,
  Zap,
  Flame,
  Crosshair,
  Radio,
  Sparkles,
  ShieldAlert,
  Bomb,
  Rocket,
  Lock,
  Wrench,
} from "lucide-react";

const DEFENSE_VISUALS: Record<number, { icon: ReactNode; gradient: string }> = {
  401: {
    icon: <Rocket className="h-8 w-8 text-amber-300" />,
    gradient: "from-amber-950/70 via-slate-900 to-[#070a0f]",
  },
  402: {
    icon: <Zap className="h-8 w-8 text-cyan-300" />,
    gradient: "from-cyan-950/70 via-slate-900 to-[#070a0f]",
  },
  403: {
    icon: <Flame className="h-8 w-8 text-blue-300" />,
    gradient: "from-blue-950/70 via-slate-900 to-[#070a0f]",
  },
  404: {
    icon: <Crosshair className="h-8 w-8 text-violet-300" />,
    gradient: "from-violet-950/70 via-slate-900 to-[#070a0f]",
  },
  405: {
    icon: <Radio className="h-8 w-8 text-emerald-300" />,
    gradient: "from-emerald-950/70 via-slate-900 to-[#070a0f]",
  },
  406: {
    icon: <Sparkles className="h-8 w-8 text-rose-300" />,
    gradient: "from-rose-950/70 via-slate-900 to-[#070a0f]",
  },
  407: {
    icon: <Shield className="h-8 w-8 text-sky-300" />,
    gradient: "from-sky-950/70 via-slate-900 to-[#070a0f]",
  },
  408: {
    icon: <ShieldAlert className="h-8 w-8 text-amber-400" />,
    gradient: "from-amber-950/70 via-slate-900 to-[#070a0f]",
  },
  502: {
    icon: <Shield className="h-8 w-8 text-teal-300" />,
    gradient: "from-teal-950/70 via-slate-900 to-[#070a0f]",
  },
  503: {
    icon: <Bomb className="h-8 w-8 text-red-400" />,
    gradient: "from-red-950/70 via-slate-900 to-[#070a0f]",
  },
};

function findDefenseUnitTypeFromQuery(param: string | null): number | null {
  if (!param) return null;
  const num = Number(param);
  if (!isNaN(num) && DEFENSE_CATALOG.some((d) => d.unitType === num)) {
    return num;
  }
  const clean = param.toLowerCase().replace(/[-_]/g, "");
  const match = DEFENSE_CATALOG.find((d) => {
    const keyClean = d.key.toLowerCase().replace(/[-_]/g, "");
    return (
      keyClean === clean ||
      d.key.toLowerCase() === param.toLowerCase() ||
      d.name.toLowerCase().includes(param.toLowerCase())
    );
  });
  if (match) return match.unitType;
  return null;
}

function DefensesPageContent() {
  const searchParams = useSearchParams();
  const defenseParam =
    searchParams.get("focus") ??
    searchParams.get("defense") ??
    searchParams.get("unit") ??
    searchParams.get("key");

  const initialUnitType = findDefenseUnitTypeFromQuery(defenseParam) ?? 401; // Roketatar default

  const planets = useGameStore((s) => s.planets);
  const selectedPlanetId = useGameStore((s) => s.selectedPlanetId);
  const researches = useGameStore((s) => s.researches);

  const planet = planets.find((p) => p.id === selectedPlanetId) ?? planets[0];
  const siloLevel = planet.buildings.find((b) => b.key === "missileSilo")?.level ?? 0;
  const queuedBatches = planet.shipyardQueue ?? [];

  const [selectedUnitType, setSelectedUnitType] = useState<number>(initialUnitType);

  const { isHighlighted, highlightClass } = useQuestFocusHighlight({
    paramName: "focus",
    onFocusFound: (focus) => {
      const matched = findDefenseUnitTypeFromQuery(focus);
      if (matched !== null) {
        setSelectedUnitType(matched);
      }
    },
  });

  useEffect(() => {
    const matched = findDefenseUnitTypeFromQuery(defenseParam);
    if (matched !== null) {
      setSelectedUnitType(matched);
    }
  }, [defenseParam]);

  const selectedDefense =
    DEFENSE_CATALOG.find((d) => d.unitType === selectedUnitType) ??
    DEFENSE_CATALOG[0];

  const getStationedCount = (unitType: number) => {
    return planet.units?.find((u) => u.unitType === unitType)?.count ?? 0;
  };

  const getQueuedCount = (unitType: number) => {
    return queuedBatches
      .filter((q) => q.unitType === unitType)
      .reduce((sum, q) => sum + Math.max(0, q.totalCount - q.completedCount), 0);
  };

  const siloStatus = calculateMissileSiloStatus(
    siloLevel,
    planet.units ?? [],
    queuedBatches
  );

  const renderDefenseCard = (defense: DefenseDefinition) => {
    const isSelected = defense.unitType === selectedDefense.unitType;
    const visual = DEFENSE_VISUALS[defense.unitType] ?? DEFENSE_VISUALS[401];
    const stationed = getStationedCount(defense.unitType);
    const queued = getQueuedCount(defense.unitType);
    const kebab = defense.key.replace(/([A-Z])/g, "-$1").toLowerCase();
    const isFocused =
      isHighlighted(defense.unitType) ||
      isHighlighted(defense.key) ||
      isHighlighted(kebab);

    const prereqResults = evaluateDefensePrerequisites(
      defense,
      planet.buildings,
      researches
    );
    const prerequisitesMet = prereqResults.every((p) => p.met);

    // Limit check for shield domes
    const isShieldDomeMaxed =
      defense.isShieldDome && stationed + queued >= 1;

    // Limit check for missiles (no space in silo)
    const slotCost = defense.missileSlotCost ?? 1;
    const isMissileFull =
      defense.isMissile && siloStatus.remainingSlots < slotCost;

    const isDisabled = !prerequisitesMet || isShieldDomeMaxed;

    return (
      <button
        key={defense.unitType}
        id={`card-${defense.key}`}
        data-unit-type={defense.unitType}
        type="button"
        onClick={() => setSelectedUnitType(defense.unitType)}
        className={`group relative h-28 rounded-lg border overflow-hidden flex flex-col justify-between p-2.5 text-left transition-all ${
          isFocused
            ? highlightClass
            : isSelected
            ? "border-amber-400 ring-1 ring-amber-400/60 shadow-[0_0_18px_rgba(251,191,36,0.3)]"
            : isDisabled
            ? "border-zinc-800/80 opacity-60 grayscale-[40%] hover:border-zinc-700"
            : "border-zinc-800 hover:border-cyan-500/50"
        } bg-gradient-to-br ${visual.gradient}`}
      >
        {/* Top: Name + Prerequisite lock / limit badges */}
        <div className="relative z-10 flex items-start justify-between gap-1 w-full">
          <div className="text-[11px] font-bold text-zinc-100 leading-tight line-clamp-2 drop-shadow">
            {defense.name}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {isShieldDomeMaxed && (
              <span
                title="Gezegen başına maksimum 1 adet kurulabilir"
                className="px-1.5 py-0.5 rounded bg-sky-950/90 border border-sky-500/60 text-[9px] font-bold text-sky-300"
              >
                1/1
              </span>
            )}
            {!prerequisitesMet && (
              <span
                title="Ön koşullar karşılanmadı"
                className="p-1 rounded bg-rose-950/80 border border-rose-500/50 text-rose-300"
              >
                <Lock className="h-3 w-3" />
              </span>
            )}
          </div>
        </div>

        {/* Center: Icon */}
        <div
          className={`relative z-10 flex items-center justify-center my-auto transition-transform group-hover:scale-110 ${
            prerequisitesMet && !isShieldDomeMaxed
              ? "opacity-90"
              : "opacity-40 grayscale"
          }`}
        >
          {visual.icon}
        </div>

        {/* Bottom Right: Deployed unit count badge */}
        <div className="relative z-10 flex items-center justify-between w-full">
          {defense.isMissile ? (
            <span className="text-[9px] font-mono text-zinc-400">
              {defense.missileSlotCost} Slot
            </span>
          ) : (
            <span />
          )}

          <span
            className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${
              isSelected
                ? "bg-amber-500/20 border-amber-400/60 text-amber-200"
                : "bg-black/80 border-zinc-700/80 text-cyan-300"
            }`}
          >
            Adet: {stationed.toLocaleString()}
          </span>
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div
        className="relative rounded-lg border border-cyan-500/25 bg-[#080d16] p-5 overflow-hidden shadow-[0_6px_25px_rgba(0,0,0,0.7)] flex items-center justify-between flex-wrap gap-4"
        style={{
          backgroundImage:
            "radial-gradient(90% 120% at 85% 0%, rgba(34,211,238,0.16) 0%, rgba(245,158,11,0.08) 45%, rgba(8,13,22,0.96) 100%)",
        }}
      >
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5" />
            Gezegen Yüzey Savunması • {planet.coords}
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 mt-0.5">
            Savunma - <span className="text-cyan-300">{planet.name}</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            Gezegeninizi düşman akınlarından ve yağmalarından koruyan sabit kuleler, kalkan kubbeleri ve füze bataryaları.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900/80 font-mono text-xs flex items-center gap-2">
            <Shield className="h-4 w-4 text-amber-400" />
            <span className="text-zinc-400">Toplam Savunma:</span>
            <span className="text-amber-300 font-bold">
              {(planet.units ?? [])
                .filter((u) => u.unitType >= 401 && u.unitType <= 503)
                .reduce((s, u) => s + u.count, 0)
                .toLocaleString()}{" "}
              Birim
            </span>
          </div>

          <div className="px-3 py-2 rounded-lg border border-zinc-800 bg-zinc-900/80 font-mono text-xs flex items-center gap-2">
            <Bomb className="h-4 w-4 text-cyan-400" />
            <span className="text-zinc-400">Silo Doluluk:</span>
            <span className="text-cyan-300 font-bold">
              {siloStatus.usedSlots} / {siloStatus.totalCapacitySlots} Slot
            </span>
          </div>
        </div>
      </div>

      {/* Post-Combat Auto-Repair Rule Notification Banner */}
      <div className="flex items-center gap-3 p-3 rounded-lg border border-cyan-500/30 bg-cyan-950/20 text-xs text-cyan-200">
        <Wrench className="h-4 w-4 shrink-0 text-cyan-400" />
        <div className="flex-1">
          <strong className="text-cyan-300">Otomatik Savunma Onarımı:</strong> Savaş
          sonrasında yok edilen savunma ünitelerinin <strong>%70&apos;i</strong> otomatik
          olarak yeniden kurulur (Gezegenlerarası Roket (IPM) saldırıları hariç).
        </div>
      </div>

      {/* 10-Item Defensive Grid (2 rows x 5 columns) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Savunma Sistemleri (10 Ünite)
          </h2>
          <span className="text-xs font-mono text-zinc-500">
            Tersane ve Silo Tesisleri İle Entegre
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {DEFENSE_CATALOG.map((defense) => renderDefenseCard(defense))}
        </div>
      </div>

      {/* Detail / Production Panel */}
      {selectedDefense && (
        <DefenseDetailPanel
          defense={selectedDefense}
          planet={planet}
          stationedCount={getStationedCount(selectedDefense.unitType)}
        />
      )}

      {/* Shared Shipyard/Defense Production Queue */}
      <ShipyardQueue queue={queuedBatches} />
    </div>
  );
}

export default function DefensesPage() {
  return (
    <Suspense fallback={null}>
      <DefensesPageContent />
    </Suspense>
  );
}

