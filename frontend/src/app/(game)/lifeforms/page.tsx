"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { API_BASE_URL, useGameStore } from "@/store/useGameStore";
import { useResourceStore } from "@/store/useResourceStore";
import { useQuestFocusHighlight } from "@/hooks/useQuestFocusHighlight";
import {
  LIFEFORM_BUILDINGS_CATALOG,
  LIFEFORM_TECH_CATALOG,
  LIFEFORMS_CATALOG,
  normalizeSpeciesId,
  type LifeformId,
  type LifeformBuildingKey,
  type PlanetLifeformStateDto,
  calculateLifeformBuildingUpgrade,
  calculateLifeformTechUpgrade,
} from "@/lib/lifeformsCatalog";
import { formatCountdownTurkish, useCountdown } from "@/hooks/useCountdown";
import { HumanBuildingsGrid } from "@/components/lifeforms/HumanBuildingsGrid";
import { HumanTechGrid } from "@/components/lifeforms/HumanTechGrid";
import { SpeciesSelectionModal } from "@/components/lifeforms/SpeciesSelectionModal";
import { handleTutorialEvent } from "@/services/questEvaluationService";
import {
  Users,
  Pickaxe,
  Cpu,
  Compass,
  Dna,
  Sliders,
  GitBranch,
  Clock,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  PowerOff,
  Play,
  Hammer,
  FlaskConical,
  X,
  Info,
  ChevronRight,
  Lock,
} from "lucide-react";

function LifeformsHubPageContent() {
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab")?.toLowerCase();
  const rawFocus = searchParams.get("focus")?.toLowerCase();

  const planets = useGameStore((s) => s.planets);
  const selectedPlanetId = useGameStore((s) => s.selectedPlanetId);
  const isLoaded = useGameStore((s) => s.isLoaded);
  const fetchBootstrap = useGameStore((s) => s.fetchBootstrap);
  const planet = planets.find((p) => p.id === selectedPlanetId) ?? planets[0];

  const [lifeformState, setLifeformState] = useState<PlanetLifeformStateDto>(
    () => useResourceStore.getState().getPlanetLifeformState(planet.id)
  );

  const [hasMounted, setHasMounted] = useState<boolean>(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);

  const [activeTab, setActiveTab] = useState<"buildings" | "tech">("buildings");
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isResearching, setIsResearching] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [isStopModalOpen, setIsStopModalOpen] = useState(false);
  const [isSpeciesModalOpen, setIsSpeciesModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const researchCentreLevel =
    lifeformState.buildingLevels?.researchCentre ??
    lifeformState.buildingLevels?.runeTechnologicalInstitute ??
    lifeformState.buildingLevels?.coreMatrix ??
    lifeformState.buildingLevels?.cosmicResonator ??
    (lifeformState.buildingLevels as Record<string, number> | undefined)?.["researchCenter"] ??
    0;
  const isDevelopmentUnlocked = researchCentreLevel >= 1;

  const { isHighlighted, highlightedKey, highlightClass } = useQuestFocusHighlight({
    paramName: "focus",
    onFocusFound: (key) => {
      const clean = key.toLowerCase();
      if (
        clean === "intergalactic-envoys" ||
        clean.includes("envoy") ||
        clean.includes("tech")
      ) {
        if (isDevelopmentUnlocked) {
          setActiveTab("tech");
        } else {
          setActiveTab("buildings");
          setNotification(
            "Canlı Türü Gelişimi sekmesi kilitli: Önce Araştırma Merkezi (Seviye 1) inşa edilmelidir."
          );
        }
      } else {
        setActiveTab("buildings");
      }
    },
  });

  // Handle direct tab or focus query parameters
  useEffect(() => {
    if (rawFocus === "species-selector") {
      setIsSpeciesModalOpen(true);
    }
  }, [rawFocus]);

  useEffect(() => {
    if (
      rawTab === "development" ||
      rawTab === "tech" ||
      rawTab === "tech-tree" ||
      rawFocus === "intergalactic-envoys"
    ) {
      if (isDevelopmentUnlocked) {
        setActiveTab("tech");
      } else {
        setActiveTab("buildings");
        setNotification(
          "Canlı Türü Gelişimi sekmesi kilitli: Önce Araştırma Merkezi (Seviye 1) inşa edilmelidir."
        );
      }
    }
  }, [rawTab, rawFocus, isDevelopmentUnlocked]);

  const loadLifeforms = useCallback(async () => {
    if (!planet?.id) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/lifeforms/planet/${planet.id}`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const data = (await res.json()) as PlanetLifeformStateDto;
        setLifeformState(data);
        useResourceStore.getState().setPlanetLifeformState(planet.id, data);
      } else {
        const fallback = useResourceStore.getState().getPlanetLifeformState(planet.id);
        setLifeformState(fallback);
      }
    } catch {
      const fallback = useResourceStore.getState().getPlanetLifeformState(planet.id);
      setLifeformState(fallback);
    }
  }, [planet?.id]);

  useEffect(() => {
    loadLifeforms();
  }, [loadLifeforms, isLoaded]);

  // Timers for active building queue & active tech queue
  const activeBuildingQueue = lifeformState.activeQueue;
  const activeTechQueue = lifeformState.activeTechQueue;

  const buildingQueueTimer = useCountdown(
    activeBuildingQueue?.endTimeUtc,
    activeBuildingQueue?.startTimeUtc,
    {
      referenceUtc: planet.serverTimeUtc,
      onComplete: () => {
        loadLifeforms();
        fetchBootstrap();
      },
    }
  );

  const techQueueTimer = useCountdown(
    activeTechQueue?.endTimeUtc,
    activeTechQueue?.startTimeUtc,
    {
      referenceUtc: planet.serverTimeUtc,
      onComplete: () => {
        loadLifeforms();
        fetchBootstrap();
      },
    }
  );

  const hasAssignedSpecies = Boolean(
    lifeformState?.activeSpecies &&
      lifeformState.activeSpecies !== "none" &&
      lifeformState.activeSpecies !== "Durduruldu"
  );

  const isSpeciesActive =
    hasAssignedSpecies &&
    lifeformState.isActive !== false &&
    lifeformState.activeSpecies !== "Durduruldu";

  // Upgrade building handler
  const handleUpgradeBuilding = async (buildingKey: LifeformBuildingKey) => {
    if (activeBuildingQueue || isUpgrading) return;
    setIsUpgrading(true);
    try {
      const meta = LIFEFORM_BUILDINGS_CATALOG.find((b) => b.key === buildingKey);
      if (!meta) return;
      const currentLevel = lifeformState.buildingLevels?.[buildingKey] ?? 0;
      const spec = calculateLifeformBuildingUpgrade(meta, currentLevel);

      const res = await fetch(
        `${API_BASE_URL}/api/lifeforms/planet/${planet.id}/buildings/build`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            buildingKey: meta.key,
            buildingName: meta.name,
            metalCost: spec.metal,
            crystalCost: spec.crystal,
            deuteriumCost: spec.deuterium,
            durationSeconds: spec.durationSeconds,
          }),
        }
      );
      if (res.ok) {
        const updated = (await res.json()) as PlanetLifeformStateDto;
        setLifeformState(updated);
        useResourceStore.getState().setPlanetLifeformState(planet.id, updated);
        await fetchBootstrap();
      }
    } finally {
      setIsUpgrading(false);
    }
  };

  // Research tech handler
  const handleResearchTech = async (slot: number) => {
    if (activeTechQueue || isResearching) return;
    setIsResearching(true);
    try {
      const meta = LIFEFORM_TECH_CATALOG.find((t) => t.slot === slot);
      if (!meta) return;
      const currentLevel = lifeformState.techLevels?.[slot] ?? 0;
      const researchCenterLvl = lifeformState.buildingLevels?.researchCentre ?? 1;
      const spec = calculateLifeformTechUpgrade(meta, currentLevel, researchCenterLvl);

      const res = await fetch(
        `${API_BASE_URL}/api/lifeforms/planet/${planet.id}/tech/research`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slot: meta.slot,
            techName: meta.name,
            metalCost: spec.metal,
            crystalCost: spec.crystal,
            deuteriumCost: spec.deuterium,
            durationSeconds: spec.durationSeconds,
          }),
        }
      );
      if (res.ok) {
        const updated = (await res.json()) as PlanetLifeformStateDto;
        setLifeformState(updated);
        useResourceStore.getState().setPlanetLifeformState(planet.id, updated);
        await fetchBootstrap();
      }
    } finally {
      setIsResearching(false);
    }
  };

  // Stop species handler
  const handleStopSpecies = async () => {
    setIsStopping(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/lifeforms/planet/${planet.id}/stop`,
        { method: "POST" }
      );
      if (res.ok) {
        const updated = (await res.json()) as PlanetLifeformStateDto;
        setLifeformState(updated);
        useResourceStore.getState().setPlanetLifeformState(planet.id, updated);
        await fetchBootstrap();
        setIsStopModalOpen(false);
        setNotification(
          "Canlı türü durduruldu: Nüfus ve besin sıfırlandı, kuyruklar iade edildi."
        );
      }
    } finally {
      setIsStopping(false);
    }
  };

  // Activate species handler
  const handleActivateSpecies = async () => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/lifeforms/planet/${planet.id}/activate`,
        { method: "POST" }
      );
      if (res.ok) {
        const updated = (await res.json()) as PlanetLifeformStateDto;
        setLifeformState(updated);
        useResourceStore.getState().setPlanetLifeformState(planet.id, updated);
        await fetchBootstrap();
        setNotification("Canlı türü başarıyla yeniden aktif edildi.");
      }
    } catch {
      // Ignore
    }
  };

  // Switch / Select active species handler
  const handleSelectSpecies = async (speciesId: LifeformId) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/lifeforms/planet/${planet.id}/species/select`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ speciesId }),
        }
      );
      if (res.ok) {
        const updated = (await res.json()) as PlanetLifeformStateDto;
        setLifeformState(updated);
        useResourceStore.getState().setPlanetLifeformState(planet.id, updated);
        await fetchBootstrap();

        if (!planet.isCapital) {
          await handleTutorialEvent("COLONY_LIFEFORM_ASSIGNED");
        }

        setNotification(
          `Canlı türü "${LIFEFORMS_CATALOG[speciesId]?.name ?? speciesId}" olarak seçildi. Önceki bina ve teknoloji kademeleri korundu.`
        );
      }
    } catch {
      // Ignore
    }
  };

  // Select cross-species technology for a specific slot
  const handleSelectSlotTech = async (slot: number, speciesId: string) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/lifeforms/planet/${planet.id}/tech/slot/select`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slot, speciesId }),
        }
      );
      if (res.ok) {
        const updated = (await res.json()) as PlanetLifeformStateDto;
        setLifeformState(updated);
        useResourceStore.getState().setPlanetLifeformState(planet.id, updated);
        await fetchBootstrap();
        setNotification(
          `Yuva #${slot} için teknoloji "${speciesId}" türü ile güncellendi (100 Artifakt).`
        );
      }
    } catch {
      // Ignore
    }
  };

  const currentXp = lifeformState.currentXp || 0;
  const maxXp = lifeformState.maxXp || 900;
  const xpPercent = Math.min(100, Math.round((currentXp / Math.max(1, maxXp)) * 100));

  if (!hasMounted) {
    return (
      <div className="space-y-4 animate-pulse p-4">
        <div className="h-28 rounded-lg bg-zinc-900/60 border border-zinc-800" />
        <div className="h-64 rounded-xl bg-zinc-900/60 border border-zinc-800" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="h-48 rounded-lg bg-zinc-900/60 border border-zinc-800" />
          <div className="h-48 rounded-lg bg-zinc-900/60 border border-zinc-800" />
          <div className="h-48 rounded-lg bg-zinc-900/60 border border-zinc-800" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 1. Top Notice Banner: Species Change / Deactivation Warning Rules */}
      <div className="rounded-lg border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-[#0d111a] to-[#070b13] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.6)]">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-300">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="space-y-1.5 flex-1">
            <h3 className="text-sm font-bold text-amber-200 uppercase tracking-wide">
              Canlı Türü Yönetimi — Değişim ve Durdurma Kuralları
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Bir gezegende mevcut canlı türünü durdurduğunuzda veya başka bir türe geçiş yaptığınızda aşağıdaki kurallar geçerlidir:
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-1.5 pt-1 text-[11px] text-zinc-400 font-mono">
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                <span>Mevcut nüfus 0&apos;a sıfırlanır.</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                <span>Gezegendeki besin rezervi 0&apos;a sıfırlanır.</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                <span>Aktif canlı türü inşaat kuyrukları iptal edilir ve kaynaklar iade edilir.</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                <span>Gezegenden sevk edilmiş canlı türü keşif filoları geri çağrılır.</span>
              </li>
              <li className="flex items-center gap-1.5 md:col-span-2 text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>İnşa edilen bina ve araştırma kademeleri hafızada korunur, tür yeniden aktif edildiğinde aynı seviyelerden geri yüklenir.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {notification && (
        <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>{notification}</span>
          </span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-emerald-400 hover:text-emerald-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 2. Species Overview Card (or Colony Unassigned Hero Card) */}
      {!hasAssignedSpecies ? (
        <div
          id="item-species-selector"
          className="rounded-xl border-2 border-amber-500/60 bg-[#090d18] p-6 shadow-[0_0_30px_rgba(245,158,11,0.2)] relative overflow-hidden"
          style={{
            backgroundImage:
              "radial-gradient(120% 140% at 85% 15%, rgba(245,158,11,0.18) 0%, rgba(168,85,247,0.08) 50%, rgba(9,13,24,0.98) 100%)",
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-600 via-amber-700 to-slate-900 border-2 border-amber-400/80 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(245,158,11,0.4)]">
                <Dna className="h-9 w-9 text-amber-200 animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-bold text-zinc-100">
                    Sömürge Canlı Türü Atanmamış
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/50 text-xs font-mono font-bold text-amber-300">
                    Koloni Gezegeni
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-2xl bg-[#060810]/70 border border-zinc-800/80 rounded-md p-3">
                  Bir gezegeni sömürgeleştirdiğinizde, keşfettiğiniz canlı türlerinden hangisinin onu yurt bileceğini seçebilirsiniz. Farklı canlı türleri bazı alanlarda diğerlerinden daha iyidir. Bu yüzden her zaman koloninizle neyi başarmak istediğinizi düşünün ve ona uygun canlı türünü seçin.
                </p>
              </div>
            </div>

            <div className="shrink-0 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setIsSpeciesModalOpen(true)}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-sm font-bold font-mono uppercase tracking-wider transition shadow-[0_0_25px_rgba(245,158,11,0.6)] flex items-center justify-center gap-2 cursor-pointer hover:scale-102 active:scale-98"
              >
                <Sparkles className="h-4 w-4 text-slate-950" />
                <span>Canlı Türü Seç ve Yerleş</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          id="item-species-selector"
          className="rounded-lg border border-purple-500/35 bg-[#090d18] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.7)] relative overflow-hidden"
          style={{
            backgroundImage:
              "radial-gradient(120% 140% at 85% 15%, rgba(168,85,247,0.20) 0%, rgba(34,211,238,0.08) 50%, rgba(9,13,24,0.98) 100%)",
          }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Avatar + Title + Lore */}
            {(() => {
              const currentSpeciesId = normalizeSpeciesId(lifeformState.activeSpecies);
              const currentSpeciesConfig = LIFEFORMS_CATALOG[currentSpeciesId];
              const speciesIcons: Record<LifeformId, React.ReactNode> = {
                humans: <Users className="h-8 w-8 text-cyan-300" />,
                rocktal: <Pickaxe className="h-8 w-8 text-amber-300" />,
                mechas: <Cpu className="h-8 w-8 text-sky-300" />,
                kaelesh: <Compass className="h-8 w-8 text-emerald-300" />,
              };

              return (
                <div className="flex items-start gap-4 max-w-2xl">
                  <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-purple-600 via-indigo-700 to-slate-900 border-2 border-purple-400/60 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(168,85,247,0.35)]">
                    {speciesIcons[currentSpeciesId] || <Users className="h-8 w-8 text-white" />}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="text-xl font-bold text-zinc-100">
                        {currentSpeciesConfig?.name ?? lifeformState.activeSpecies}
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/50 text-xs font-mono font-bold text-purple-300">
                        Kademe {lifeformState.speciesLevel}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold ${
                          isSpeciesActive
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        }`}
                      >
                        {isSpeciesActive ? "Aktif Tür" : "Durduruldu"}
                      </span>
                    </div>

                    {/* Playstyle / Tagline */}
                    <p className="text-xs text-zinc-300 leading-relaxed bg-[#060810]/70 border border-zinc-800/80 rounded-md p-2.5">
                      {currentSpeciesConfig?.tagline}: {currentSpeciesConfig?.playstyle}
                    </p>

                    {/* Functionality Bullets */}
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-zinc-400">
                      {currentSpeciesConfig?.coreBonuses?.map((bonus, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shrink-0" />
                          <span>{bonus}</span>
                        </li>
                      )) ?? (
                        <li className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                          <span>12 Koloni Binası &amp; 18 Teknoloji Yuvası.</span>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              );
            })()}

            {/* Stats & Durdur Action */}
            <div className="flex flex-col gap-3 min-w-[280px] bg-[#060912]/90 border border-purple-500/30 rounded-xl p-4 shadow-inner">
              {/* Experience Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-400">Tecrübe İlerlemesi:</span>
                  <span className="text-purple-300 font-bold" suppressHydrationWarning>
                    {currentXp} / {maxXp} tecrübe
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-zinc-950 border border-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 transition-all duration-300"
                    style={{ width: `${xpPercent}%` }}
                  />
                </div>
              </div>

              {/* Active Tech Bonus */}
              <div className="flex items-center justify-between text-xs font-mono border-t border-zinc-800/80 pt-2">
                <span className="text-zinc-400">Canlı türü teknoloji bonusu:</span>
                <span className="text-emerald-400 font-bold">
                  %{lifeformState.techBonusPercent ?? 0.8}%
                </span>
              </div>

              {/* Actions: Canlı Türü Değiştir & Durdur/Aktif Et */}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setIsSpeciesModalOpen(true)}
                  className="w-full py-2 px-3 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/60 text-cyan-300 hover:text-cyan-100 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Canlı Türünü Seç / Değiştir</span>
                </button>

                {isSpeciesActive ? (
                  <button
                    type="button"
                    onClick={() => setIsStopModalOpen(true)}
                    className="w-full py-2 px-3 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/60 text-rose-300 hover:text-rose-100 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98"
                  >
                    <PowerOff className="h-4 w-4" />
                    <span>Durdur</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleActivateSpecies}
                    className="w-full py-2 px-3 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/60 text-emerald-300 hover:text-emerald-100 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98"
                  >
                    <Play className="h-4 w-4" />
                    <span>Aktif Et</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Building / Tech Queue Status */}
      {(activeBuildingQueue || activeTechQueue) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {activeBuildingQueue && (
            <div className="p-3.5 rounded-lg border border-amber-500/50 bg-gradient-to-r from-amber-950/40 via-[#0d121c] to-[#070b13] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Hammer className="h-5 w-5 text-amber-400 shrink-0 animate-bounce" />
                <div>
                  <div className="text-[11px] font-mono text-zinc-400">
                    Aktif Bina İnşası:
                  </div>
                  <div className="text-xs font-bold text-zinc-100">
                    {activeBuildingQueue.buildingName} (Kademe{" "}
                    {activeBuildingQueue.targetLevel})
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-mono font-bold text-amber-300">
                  {buildingQueueTimer.formattedTr}
                </div>
                <div className="text-[10px] font-mono text-zinc-500">Kalan Süre</div>
              </div>
            </div>
          )}

          {activeTechQueue && (
            <div className="p-3.5 rounded-lg border border-cyan-500/50 bg-gradient-to-r from-cyan-950/40 via-[#0d121c] to-[#070b13] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <FlaskConical className="h-5 w-5 text-cyan-400 shrink-0 animate-bounce" />
                <div>
                  <div className="text-[11px] font-mono text-zinc-400">
                    Aktif Teknoloji Araştırması:
                  </div>
                  <div className="text-xs font-bold text-zinc-100">
                    {activeTechQueue.techName} (Kademe{" "}
                    {activeTechQueue.targetLevel})
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-mono font-bold text-cyan-300">
                  {techQueueTimer.formattedTr}
                </div>
                <div className="text-[10px] font-mono text-zinc-500">Kalan Süre</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Navigation Tabs: Binalar (12) vs Teknoloji Ağacı (18) */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab("buildings")}
          className={`px-4 py-2 rounded-t-lg text-xs font-bold flex items-center gap-2 transition cursor-pointer border-t border-x ${
            activeTab === "buildings"
              ? "bg-[#0b101c] border-purple-500/60 text-purple-200 border-b-2 border-b-purple-500 shadow-sm"
              : "bg-transparent border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <Hammer className="h-3.5 w-3.5 text-purple-400" />
          <span>Binalar (12)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (!isDevelopmentUnlocked) {
              setNotification(
                "Canlı Türü Gelişimi sekmesi kilitli: Önce Araştırma Merkezi (Seviye 1) inşa edilmelidir."
              );
              return;
            }
            setActiveTab("tech");
          }}
          title={
            isDevelopmentUnlocked
              ? "Canlı Türü Gelişimi"
              : "Önkoşul: Araştırma Merkezi (Seviye 1) inşa edilmelidir."
          }
          className={`px-4 py-2 rounded-t-lg text-xs font-bold flex items-center gap-2 transition border-t border-x ${
            !isDevelopmentUnlocked
              ? "opacity-60 cursor-not-allowed bg-zinc-950/60 border-zinc-800/80 text-zinc-500"
              : activeTab === "tech"
              ? "bg-[#0b101c] border-cyan-500/60 text-cyan-200 border-b-2 border-b-cyan-500 shadow-sm cursor-pointer"
              : "bg-transparent border-transparent text-zinc-400 hover:text-zinc-200 cursor-pointer"
          }`}
        >
          {isDevelopmentUnlocked ? (
            <GitBranch className="h-3.5 w-3.5 text-cyan-400" />
          ) : (
            <Lock className="h-3.5 w-3.5 text-zinc-500" />
          )}
          <span>Canlı Türü Gelişimi (18)</span>
          {!isDevelopmentUnlocked && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-amber-400 border border-amber-500/30">
              Kilitli
            </span>
          )}
        </button>
      </div>

      {/* Tab Content */}
      {!hasAssignedSpecies ? (
        <div className="rounded-xl border border-zinc-800 bg-[#090d18] p-8 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-300">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-zinc-200">
              Canlı Türü Altyapısı Kilitli
            </h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Bu sömürgeye ait 12 koloni binasını ve 18 teknoloji yuvasını görüntülemek ve geliştirmek için önce bir canlı türü seçmelisiniz.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsSpeciesModalOpen(true)}
            className="px-5 py-2.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 font-bold text-xs inline-flex items-center gap-2 transition cursor-pointer hover:bg-amber-500/30"
          >
            <Sparkles className="w-4 h-4" />
            <span>Canlı Türü Seç</span>
          </button>
        </div>
      ) : activeTab === "buildings" ? (
        <HumanBuildingsGrid
          planet={planet}
          lifeformState={lifeformState}
          onUpgrade={handleUpgradeBuilding}
          isUpgrading={isUpgrading}
          highlightedKey={highlightedKey}
          highlightClass={highlightClass}
        />
      ) : (
        <HumanTechGrid
          planet={planet}
          lifeformState={lifeformState}
          onResearch={handleResearchTech}
          isResearching={isResearching}
          highlightedKey={highlightedKey}
          highlightClass={highlightClass}
          onSelectSlotTech={handleSelectSlotTech}
        />
      )}

      {/* Species Selection & Docking Modal */}
      <SpeciesSelectionModal
        isOpen={isSpeciesModalOpen}
        onClose={() => setIsSpeciesModalOpen(false)}
        activeSpeciesId={lifeformState.activeSpecies}
        unlockedSpecies={lifeformState.unlockedSpecies}
        onSelectSpecies={handleSelectSpecies}
        planetName={planet.name}
      />

      {/* Confirmation Modal for Durdur */}
      {isStopModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-xl border border-rose-500/60 bg-[#0c101b] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.9)] text-left space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5 text-rose-400">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="text-base font-bold text-zinc-100">
                  Canlı Türünü Durdur?
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsStopModalOpen(false)}
                className="h-7 w-7 rounded bg-zinc-900 text-zinc-400 hover:text-white flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Bu işlem gezegendeki canlı türü faaliyetlerini askıya alır. Devam etmek istediğinizden emin misiniz?
            </p>

            <div className="rounded-lg bg-rose-950/30 border border-rose-500/40 p-3 space-y-1.5 text-[11px] font-mono text-rose-200">
              <div className="font-bold uppercase tracking-wider text-rose-300">
                Sonuçlar:
              </div>
              <div>• Nüfus ve besin rezervi sıfırlanacaktır.</div>
              <div>• Aktif bina ve teknoloji kuyrukları iade edilerek iptal edilecektir.</div>
              <div>• Keşif filoları geri çağrılacaktır.</div>
              <div className="text-zinc-400">• Bina ve araştırma seviyeleriniz silinmez, hafızada saklanır.</div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsStopModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition"
              >
                İptal
              </button>
              <button
                type="button"
                disabled={isStopping}
                onClick={handleStopSpecies}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95"
              >
                <PowerOff className="h-3.5 w-3.5" />
                <span>{isStopping ? "Durduruluyor..." : "Evet, Durdur"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LifeformsHubPage() {
  return (
    <Suspense fallback={null}>
      <LifeformsHubPageContent />
    </Suspense>
  );
}
