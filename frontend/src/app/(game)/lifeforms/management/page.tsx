"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { API_BASE_URL, useGameStore } from "@/store/useGameStore";
import {
  type PlanetLifeformStateDto,
  type LifeformId,
  LIFEFORMS_CATALOG,
  normalizeSpeciesId,
  getBuildingsForSpecies,
  getTechForSlot,
} from "@/lib/lifeformsCatalog";
import { SpeciesSelectionModal } from "@/components/lifeforms/SpeciesSelectionModal";
import {
  AlertTriangle,
  Dna,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  GitBranch,
  PowerOff,
  CheckCircle2,
  Sparkles,
  Users,
  Pickaxe,
  Cpu,
  Compass,
} from "lucide-react";

export default function LifeformsManagementPage() {
  const planets = useGameStore((s) => s.planets);
  const selectedPlanetId = useGameStore((s) => s.selectedPlanetId);
  const isLoaded = useGameStore((s) => s.isLoaded);
  const fetchBootstrap = useGameStore((s) => s.fetchBootstrap);
  const planet = planets.find((p) => p.id === selectedPlanetId) ?? planets[0];

  const [lifeformState, setLifeformState] =
    useState<PlanetLifeformStateDto | null>(null);
  const [showBuildingsList, setShowBuildingsList] = useState(true);
  const [showTechList, setShowTechList] = useState(true);
  const [resetNotice, setResetNotice] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [isSpeciesModalOpen, setIsSpeciesModalOpen] = useState(false);

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
      }
    } catch {
      // Ignore network error
    }
  }, [planet?.id]);

  useEffect(() => {
    loadLifeforms();
  }, [loadLifeforms, isLoaded]);

  const handleResetSpecies = async () => {
    setIsResetting(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/planets/${planet.id}/lifeforms/reset`,
        { method: "POST" }
      );
      if (res.ok) {
        const updated = (await res.json()) as PlanetLifeformStateDto;
        setLifeformState(updated);
        await fetchBootstrap();
        setResetNotice(
          "Gezegendeki canlı türü durduruldu: Nüfus ve besin stoku sıfırlandı, aktif yapı kuyrukları iade edildi."
        );
      }
    } finally {
      setIsResetting(false);
    }
  };

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
        await fetchBootstrap();
        setResetNotice(
          `Canlı türü "${LIFEFORMS_CATALOG[speciesId]?.name ?? speciesId}" olarak seçildi. Önceki seviyeler korundu.`
        );
      }
    } catch {
      // Ignore
    }
  };

  const currentSpeciesId = normalizeSpeciesId(lifeformState?.activeSpecies);
  const currentSpeciesConfig = LIFEFORMS_CATALOG[currentSpeciesId];
  const buildingsList = getBuildingsForSpecies(currentSpeciesId);

  const speciesIcons: Record<LifeformId, React.ReactNode> = {
    humans: <Users className="h-8 w-8 text-cyan-300" />,
    rocktal: <Pickaxe className="h-8 w-8 text-amber-300" />,
    mechas: <Cpu className="h-8 w-8 text-sky-300" />,
    kaelesh: <Compass className="h-8 w-8 text-emerald-300" />,
  };

  const xpPercent = lifeformState
    ? Math.min(
        100,
        Math.round(
          (lifeformState.currentXp / Math.max(1, lifeformState.maxXp)) * 100
        )
      )
    : 0;

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-zinc-800 pb-3">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400">
            Gezegen Biyosfer Kontrolü • {planet.coords}
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 mt-0.5">
            Canlı Türü Yönetimi -{" "}
            <span className="text-cyan-300">{planet.name}</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/lifeforms"
            className="px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-cyan-400" />
            <span>Canlı Türü Binaları</span>
          </Link>

          <Link
            href="/lifeforms/tech-tree"
            className="px-3 py-1.5 rounded bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/40 text-xs font-semibold text-purple-200 flex items-center gap-1.5 transition"
          >
            <GitBranch className="h-3.5 w-3.5 text-purple-300" />
            <span>Teknoloji Ağacı</span>
          </Link>
        </div>
      </div>

      {/* Critical System Warning Notice Box (Amber Frame) */}
      <div className="rounded-lg border border-amber-500/60 bg-amber-950/25 p-4 shadow-[0_0_25px_rgba(251,191,36,0.1)] space-y-2.5">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs font-semibold text-amber-200 leading-relaxed">
            Bu gezegendeki canlı türü değiştirildiğinde aşağıdaki kurallar işletilir:
          </p>
        </div>

        <ul className="list-disc list-inside text-xs text-zinc-300 space-y-1 pl-6 italic">
          <li>Mevcut nüfus sıfırlanır.</li>
          <li>Besin stoku sıfırlanır.</li>
          <li>
            Tüm etkin canlı türü yapı kuyrukları durdurulur ve ham maddeler iade edilir.
          </li>
          <li>
            Bu gezegenden gönderilen keşif gemileri uçuşlarını iptal eder.
          </li>
          <li className="text-emerald-300 font-semibold">
            Önceki canlı türünün 12 binası ve tüm teknoloji kademeleri korunur; o türe dönüldüğünde anında kaldığı seviyeden devam eder.
          </li>
        </ul>
      </div>

      {resetNotice && (
        <div className="p-3.5 rounded-lg border border-emerald-500/50 bg-emerald-950/30 text-xs font-mono text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{resetNotice}</span>
        </div>
      )}

      {/* Active Species Card */}
      <div className="rounded-lg border border-cyan-500/35 bg-gradient-to-b from-[#111927]/95 to-[#080c14]/95 p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-cyan-400 via-blue-600 to-purple-900 border-2 border-cyan-300/70 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(34,211,238,0.35)]">
            {speciesIcons[currentSpeciesId] || <Dna className="h-8 w-8 text-white" />}
          </div>

          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg font-bold text-zinc-100">
                {currentSpeciesConfig?.name ?? lifeformState?.activeSpecies}
              </h2>
              <span className="px-2.5 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/40 text-xs font-mono font-bold text-cyan-300">
                Kademe {lifeformState?.speciesLevel ?? 0}
              </span>
              <span className="text-xs font-mono text-zinc-400">
                ({currentSpeciesConfig?.tagline})
              </span>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              {currentSpeciesConfig?.playstyle}
            </p>

            {/* XP Progress & Bonus Indicator */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-2.5 rounded bg-[#06090e] border border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-zinc-400">
                    {lifeformState?.speciesLevel ?? 0}. Seviye:
                  </span>
                  <span className="text-cyan-300 font-bold">
                    {lifeformState?.currentXp ?? 0}/
                    {lifeformState?.maxXp ?? 900} tecrübe
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-zinc-900 overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 transition-all"
                    style={{ width: `${xpPercent}%` }}
                  />
                </div>
              </div>

              <div className="p-2.5 rounded bg-[#06090e] border border-zinc-800 flex items-center justify-between text-[11px] font-mono">
                <span className="text-zinc-400">
                  Canlı türü teknoloji bonusu:
                </span>
                <span className="text-emerald-400 font-bold">
                  %{lifeformState?.techBonusPercent ?? 0}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons: Tür Değiştir & Durdur */}
        <div className="shrink-0 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setIsSpeciesModalOpen(true)}
            className="px-4 py-2 rounded-md bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(34,211,238,0.3)] transition"
          >
            <Sparkles className="h-4 w-4" />
            <span>Tür Değiştir</span>
          </button>

          <button
            type="button"
            disabled={isResetting}
            onClick={handleResetSpecies}
            className="px-4 py-2 rounded-md bg-gradient-to-b from-rose-600 to-rose-800 hover:from-rose-500 hover:to-rose-700 disabled:opacity-50 border border-rose-400/60 text-white font-bold text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(225,29,72,0.35)] transition"
          >
            <PowerOff className="h-4 w-4" />
            <span>{isResetting ? "Durduruluyor..." : "Durdur"}</span>
          </button>
        </div>
      </div>

      {/* Collapsible List 1: Canlı türü binası listesi (12 Buildings) */}
      <div className="rounded-lg border border-zinc-800 bg-[#090d14]/95 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowBuildingsList((v) => !v)}
          className="w-full px-4 py-3 bg-[#121a26] hover:bg-[#172131] border-b border-zinc-800 flex items-center justify-between text-left transition"
        >
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-200">
            {currentSpeciesConfig?.name ?? "Canlı Türü"} Binaları (12 Bina)
          </span>
          {showBuildingsList ? (
            <ChevronUp className="h-4 w-4 text-cyan-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-zinc-400" />
          )}
        </button>

        {showBuildingsList && (
          <div className="divide-y divide-zinc-800/70">
            {buildingsList.map((b) => {
              const lvl = lifeformState?.buildingLevels?.[b.key] ?? 0;
              return (
                <div
                  key={b.key}
                  className="p-3.5 flex items-start justify-between gap-4 hover:bg-[#0e1520]"
                >
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-zinc-100 flex items-center gap-2">
                      <span>{b.name}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        (Yuva #{b.index})
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      {b.description}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-zinc-950 border border-zinc-800 text-xs font-mono text-cyan-300 shrink-0">
                    Kademe {lvl}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Collapsible List 2: Canlı türü araştırması listesi (18 Tech Items) */}
      <div className="rounded-lg border border-zinc-800 bg-[#090d14]/95 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowTechList((v) => !v)}
          className="w-full px-4 py-3 bg-[#121a26] hover:bg-[#172131] border-b border-zinc-800 flex items-center justify-between text-left transition"
        >
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-200">
            18 Teknoloji Yuvası &amp; Araştırmalar
          </span>
          {showTechList ? (
            <ChevronUp className="h-4 w-4 text-purple-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-zinc-400" />
          )}
        </button>

        {showTechList && (
          <div className="divide-y divide-zinc-800/70">
            {Array.from({ length: 18 }, (_, idx) => {
              const slot = idx + 1;
              const slotSpecies =
                lifeformState?.slotSpecies?.[slot] ?? lifeformState?.activeSpecies;
              const tech = getTechForSlot(slot, slotSpecies);
              const techLvl = lifeformState?.techLevels?.[slot] ?? 0;
              const totalPop =
                (lifeformState?.t1Population ?? 0) +
                (lifeformState?.t2Population ?? 0) +
                (lifeformState?.t3Population ?? 0);
              const isUnlocked = totalPop >= tech.requiredPopulation;

              return (
                <div
                  key={slot}
                  className="p-3.5 flex items-start justify-between gap-4 hover:bg-[#0e1520]"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                        Kademe {tech.tier} • Yuva {slot}
                      </span>
                      <span className="text-xs font-bold text-zinc-100">
                        {tech.name}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">
                        ({normalizeSpeciesId(tech.speciesId)})
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      {tech.description}
                    </p>
                  </div>

                  <div className="text-right shrink-0 space-y-1 font-mono text-xs">
                    <div
                      className={
                        isUnlocked ? "text-emerald-400" : "text-zinc-500"
                      }
                    >
                      Seviye {techLvl}
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      Gerekli Nüfus:{" "}
                      {tech.requiredPopulation.toLocaleString("tr-TR")}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Species Selection Modal */}
      <SpeciesSelectionModal
        isOpen={isSpeciesModalOpen}
        onClose={() => setIsSpeciesModalOpen(false)}
        activeSpeciesId={lifeformState?.activeSpecies ?? "humans"}
        unlockedSpecies={lifeformState?.unlockedSpecies}
        onSelectSpecies={handleSelectSpecies}
        planetName={planet.name}
      />
    </div>
  );
}
