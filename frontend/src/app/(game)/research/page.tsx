"use client";

import { useState, useEffect, Suspense, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { useGameStore } from "@/store/useGameStore";
import {
  RESEARCH_CATALOG,
  type ResearchCategory,
  type ResearchDefinition,
  evaluateResearchPrerequisites,
} from "@/lib/researchCatalog";
import { useCountdown } from "@/hooks/useCountdown";
import { useQuestFocusHighlight } from "@/hooks/useQuestFocusHighlight";
import { ResearchDetailPanel } from "@/components/research/ResearchDetailPanel";
import {
  FlaskConical,
  Zap,
  Crosshair,
  Atom,
  Flame,
  Gauge,
  Rocket,
  Eye,
  Cpu,
  Telescope,
  Network,
  Radio,
  Swords,
  Shield,
  ShieldAlert,
  Lock,
  Sparkles,
} from "lucide-react";

const TECH_VISUALS: Record<
  number,
  { icon: ReactNode; gradient: string }
> = {
  113: { icon: <Zap className="h-8 w-8 text-amber-300" />, gradient: "from-amber-950/70 via-slate-900 to-[#070a0f]" },
  120: { icon: <Crosshair className="h-8 w-8 text-rose-300" />, gradient: "from-rose-950/70 via-slate-900 to-[#070a0f]" },
  121: { icon: <Atom className="h-8 w-8 text-cyan-300" />, gradient: "from-cyan-950/70 via-slate-900 to-[#070a0f]" },
  114: { icon: <Radio className="h-8 w-8 text-indigo-300" />, gradient: "from-indigo-950/70 via-slate-900 to-[#070a0f]" },
  122: { icon: <Sparkles className="h-8 w-8 text-purple-300" />, gradient: "from-purple-950/70 via-slate-900 to-[#070a0f]" },
  115: { icon: <Flame className="h-8 w-8 text-orange-300" />, gradient: "from-orange-950/70 via-slate-900 to-[#070a0f]" },
  117: { icon: <Gauge className="h-8 w-8 text-sky-300" />, gradient: "from-sky-950/70 via-slate-900 to-[#070a0f]" },
  118: { icon: <Rocket className="h-8 w-8 text-blue-300" />, gradient: "from-blue-950/70 via-slate-900 to-[#070a0f]" },
  106: { icon: <Eye className="h-8 w-8 text-teal-300" />, gradient: "from-teal-950/70 via-slate-900 to-[#070a0f]" },
  108: { icon: <Cpu className="h-8 w-8 text-emerald-300" />, gradient: "from-emerald-950/70 via-slate-900 to-[#070a0f]" },
  124: { icon: <Telescope className="h-8 w-8 text-yellow-300" />, gradient: "from-yellow-950/70 via-slate-900 to-[#070a0f]" },
  123: { icon: <Network className="h-8 w-8 text-cyan-400" />, gradient: "from-cyan-900/70 via-slate-900 to-[#070a0f]" },
  199: { icon: <Atom className="h-8 w-8 text-fuchsia-400" />, gradient: "from-fuchsia-950/80 via-slate-900 to-[#070a0f]" },
  109: { icon: <Swords className="h-8 w-8 text-red-400" />, gradient: "from-red-950/70 via-slate-900 to-[#070a0f]" },
  110: { icon: <Shield className="h-8 w-8 text-cyan-300" />, gradient: "from-cyan-950/70 via-slate-900 to-[#070a0f]" },
  111: { icon: <ShieldAlert className="h-8 w-8 text-zinc-300" />, gradient: "from-zinc-800/80 via-slate-900 to-[#070a0f]" },
};

const SECTIONS: { category: ResearchCategory; title: string; subtitle: string }[] = [
  { category: "basic", title: "A. Temel Araştırmalar", subtitle: "Enerji, Lazer, İyon ve Hiperuzay Temelleri" },
  { category: "drive", title: "B. Sürüş Araştırması", subtitle: "Yanma, İtki, Hiperuzay İticileri ve Plazma Verimi" },
  { category: "advanced", title: "C. Gelişmiş Araştırmalar", subtitle: "Casusluk, Bilgisayar, Astrofizik ve Araştırma Ağı" },
  { category: "combat", title: "D. Savaş Araştırması", subtitle: "Silah, Kalkan, Zırh ve Graviton Teknolojisi" },
];

function findTechTypeFromQuery(param: string | null): number | null {
  if (!param) return null;
  const num = Number(param);
  if (!isNaN(num) && RESEARCH_CATALOG.some((t) => t.researchType === num)) {
    return num;
  }
  const clean = param.toLowerCase().replace(/[-_]/g, "");

  // Alias mapping for common abbreviations or alternate namings
  if (clean === "computertech" || clean === "computertechnology" || clean === "computer") return 108;
  if (clean === "espionagetech" || clean === "espionagetechnology" || clean === "espionage") return 106;
  if (clean === "energytech" || clean === "energytechnology" || clean === "energy") return 113;
  if (clean === "lasertech" || clean === "lasertechnology" || clean === "laser") return 120;
  if (clean === "iontech" || clean === "iontechnology" || clean === "ion") return 121;
  if (clean === "hyperspacetech" || clean === "hyperspacetechnology") return 114;
  if (clean === "plasmatech" || clean === "plasmatechnology" || clean === "plasma") return 122;
  if (clean === "combustiondrive" || clean === "combustion") return 115;
  if (clean === "impulsedrive" || clean === "impulse") return 117;
  if (clean === "hyperspacedrive") return 118;
  if (clean === "astrophysics" || clean === "astro") return 124;
  if (clean === "irn" || clean === "intergalacticresearchnetwork") return 123;
  if (clean === "weaponstech" || clean === "weaponstechnology" || clean === "weapons") return 109;
  if (clean === "shieldingtech" || clean === "shieldingtechnology" || clean === "shielding") return 110;
  if (
    clean === "armortech" ||
    clean === "armourtech" ||
    clean === "armortechnology" ||
    clean === "armourtechnology" ||
    clean === "armor" ||
    clean === "armour" ||
    clean === "uzaygemisizirhi" ||
    clean === "zirh"
  ) {
    return 111;
  }
  if (clean === "gravitontech" || clean === "gravitontechnology" || clean === "graviton") return 199;

  const matchKey = RESEARCH_CATALOG.find((t) => {
    const keyClean = t.key.toLowerCase().replace(/[-_]/g, "");
    return (
      keyClean === clean ||
      t.key.toLowerCase() === param.toLowerCase() ||
      t.name.toLowerCase().includes(param.toLowerCase())
    );
  });
  if (matchKey) return matchKey.researchType;
  return null;
}

function ResearchPageContent() {
  const searchParams = useSearchParams();
  const techParam =
    searchParams.get("focus") ??
    searchParams.get("tech") ??
    searchParams.get("type") ??
    searchParams.get("key") ??
    searchParams.get("select");

  const initialTechType = findTechTypeFromQuery(techParam) ?? 113; // Default: Enerji Tekniği (113)

  const planets = useGameStore((s) => s.planets);
  const selectedPlanetId = useGameStore((s) => s.selectedPlanetId);
  const researches = useGameStore((s) => s.researches);
  const activeResearchQueue = useGameStore((s) => s.activeResearchQueue);
  const completeActiveResearch = useGameStore((s) => s.completeActiveResearch);

  const planet = planets.find((p) => p.id === selectedPlanetId) ?? planets[0];
  const originLabLevel = planet.buildings.find((b) => b.key === "researchLab")?.level ?? 0;

  const [selectedTechType, setSelectedTechType] = useState<number>(initialTechType);

  const { isHighlighted, highlightClass } = useQuestFocusHighlight({
    paramName: "focus",
    onFocusFound: (focus) => {
      const matched = findTechTypeFromQuery(focus);
      if (matched !== null) {
        setSelectedTechType(matched);
      }
    },
  });

  useEffect(() => {
    const matched = findTechTypeFromQuery(techParam);
    if (matched !== null) {
      setSelectedTechType(matched);
    }
  }, [techParam]);

  const queueTimer = useCountdown(
    activeResearchQueue?.endTimeUtc,
    activeResearchQueue?.startTimeUtc,
    {
      referenceUtc: planet.serverTimeUtc,
      onComplete: () => {
        completeActiveResearch();
      },
    }
  );

  const selectedTech =
    RESEARCH_CATALOG.find((t) => t.researchType === selectedTechType) ??
    RESEARCH_CATALOG[0];

  const renderCard = (tech: ResearchDefinition) => {
    const isSelected = tech.researchType === selectedTech.researchType;
    const isUnderResearch = activeResearchQueue?.researchType === tech.researchType;
    const visual = TECH_VISUALS[tech.researchType] ?? TECH_VISUALS[113];
    const level = researches[tech.researchType] ?? 0;

    const prereqResults = evaluateResearchPrerequisites(
      tech,
      originLabLevel,
      researches,
      planet.producedEnergy
    );
    const prerequisitesMet = prereqResults.every((p) => p.met);

    const kebab = tech.key.replace(/([A-Z])/g, "-$1").toLowerCase();
    const isFocused =
      isHighlighted(tech.researchType) ||
      isHighlighted(tech.key) ||
      isHighlighted(kebab) ||
      (tech.researchType === 108 &&
        (isHighlighted("computer-tech") ||
          isHighlighted("computertechnology") ||
          isHighlighted("computertech"))) ||
      (tech.researchType === 106 &&
        (isHighlighted("espionage-tech") ||
          isHighlighted("espionagetechnology") ||
          isHighlighted("espionagetech"))) ||
      (tech.researchType === 111 &&
        (isHighlighted("armor-tech") ||
          isHighlighted("armour-tech") ||
          isHighlighted("armortechnology") ||
          isHighlighted("armourtechnology") ||
          isHighlighted("armor") ||
          isHighlighted("armour") ||
          isHighlighted("armortech") ||
          isHighlighted("armourtech")));

    return (
      <button
        key={tech.researchType}
        id={tech.researchType === 111 ? "card-armor-tech" : `card-${kebab}`}
        data-tech-id={tech.researchType}
        data-tech-key={tech.key.toLowerCase()}
        type="button"
        onClick={() => setSelectedTechType(tech.researchType)}
        className={`group relative h-28 rounded-lg border overflow-hidden flex flex-col justify-between p-2.5 text-left transition-all ${
          isFocused
            ? highlightClass
            : isSelected
            ? "border-amber-400 ring-1 ring-amber-400/60 shadow-[0_0_18px_rgba(251,191,36,0.3)]"
            : "border-zinc-800 hover:border-cyan-500/50"
        } bg-gradient-to-br ${visual.gradient}`}
      >
        {/* Top: Name + Prerequisite lock */}
        <div className="relative z-10 flex items-start justify-between gap-1 w-full">
          <div className="text-[11px] font-bold text-zinc-100 leading-tight line-clamp-2 drop-shadow">
            {tech.name}
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

        {/* Center: Icon */}
        <div
          className={`relative z-10 flex items-center justify-center my-auto transition-transform group-hover:scale-110 ${
            prerequisitesMet ? "opacity-90" : "opacity-40 grayscale"
          }`}
        >
          {visual.icon}
        </div>

        {/* Bottom Right: Level Badge */}
        <div className="relative z-10 flex items-center justify-end w-full">
          <span
            className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${
              isSelected
                ? "bg-amber-500/20 border-amber-400/60 text-amber-200"
                : "bg-black/80 border-zinc-700/80 text-cyan-300"
            }`}
          >
            Kademe {level}
          </span>
        </div>

        {/* Active Research Indicator with Golden Frame and Real-time Timer (mm:ss) */}
        {isUnderResearch && (
          <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-[2px] flex flex-col items-center justify-center p-2 text-center border-2 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.5)]">
            <Sparkles className="h-5 w-5 text-amber-400 animate-spin mb-1" />
            <div className="text-[10px] font-mono uppercase text-amber-200">
              Kademe {activeResearchQueue.targetLevel}
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
            "radial-gradient(90% 120% at 85% 0%, rgba(34,211,238,0.16) 0%, rgba(168,85,247,0.08) 45%, rgba(8,13,22,0.96) 100%)",
        }}
      >
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
            <FlaskConical className="h-3.5 w-3.5" />
            İmparatorluk Bilim ve Araştırma İstasyonu • {planet.coords}
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 mt-0.5">
            Araştırma - <span className="text-cyan-300">{planet.name}</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            Tüm kolonilerinizde geçerli olan 16 temel, sürüş, gelişmiş ve askeri teknoloji. Araştırmalar hesap genelinde yürütülür.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-lg bg-[#0e1420] border border-zinc-800 text-xs font-mono text-zinc-300">
            <span className="text-zinc-500">Mevcut Lab: </span>
            <span className="text-cyan-300 font-bold">Kademe {originLabLevel}</span>
          </div>
        </div>
      </div>

      {/* Selected Tech Detail Panel */}
      {selectedTech && (
        <ResearchDetailPanel
          tech={selectedTech}
          planet={planet}
          planets={planets}
          researches={researches}
          remainingQueueSeconds={queueTimer.remainingSeconds}
          onSelectTech={(t) => setSelectedTechType(t)}
        />
      )}

      {/* 4 Categorized Sections Tech Grid */}
      <div className="space-y-4">
        {SECTIONS.map((sec) => {
          const techs = RESEARCH_CATALOG.filter((t) => t.category === sec.category);
          return (
            <div
              key={sec.category}
              className="rounded-lg border border-zinc-800/90 bg-[#090d14]/95 p-4 space-y-3"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                    {sec.title}
                  </h3>
                  <div className="text-[10px] font-mono text-zinc-500">
                    {sec.subtitle}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {techs.map(renderCard)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ResearchPage() {
  return (
    <Suspense fallback={null}>
      <ResearchPageContent />
    </Suspense>
  );
}

