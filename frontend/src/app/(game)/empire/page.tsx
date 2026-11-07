"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { API_BASE_URL, useGameStore } from "@/store/useGameStore";
import { type EmpireSummaryDto, type EmpirePlanetDto } from "@/lib/empireCatalog";
import { EmpireTableSections } from "@/components/empire/EmpireTableSections";
import {
  Crown,
  Globe2,
  Sparkles,
  RotateCw,
  Boxes,
  Shield,
  Swords,
  ChevronRight,
} from "lucide-react";

export default function EmpirePage() {
  const userId = useGameStore((s) => s.userId);
  const selectPlanet = useGameStore((s) => s.selectPlanet);

  const [empireData, setEmpireData] = useState<EmpireSummaryDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterType, setFilterType] = useState<"all" | "planets" | "moons">("planets");

  const fetchEmpireSummary = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = userId
        ? `${API_BASE_URL}/api/empire/summary?userId=${userId}`
        : `${API_BASE_URL}/api/empire/summary`;
      const res = await fetch(url, { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as EmpireSummaryDto;
        setEmpireData(data);
      }
    } catch {
      // Ignore network errors
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchEmpireSummary();
  }, [fetchEmpireSummary]);

  // Filtered planets according to toggle (planets, moons, all)
  const visiblePlanets = useMemo(() => {
    if (!empireData?.planets) return [];
    if (filterType === "planets") {
      return empireData.planets.filter((p) => !p.isMoon);
    }
    if (filterType === "moons") {
      return empireData.planets.filter((p) => p.isMoon);
    }
    return empireData.planets;
  }, [empireData, filterType]);

  // Total Empire High-level Metrics
  const totalMetal = useMemo(
    () => empireData?.planets.reduce((s, p) => s + p.resources.metal, 0) ?? 0,
    [empireData]
  );
  const totalCrystal = useMemo(
    () => empireData?.planets.reduce((s, p) => s + p.resources.crystal, 0) ?? 0,
    [empireData]
  );
  const totalDeuterium = useMemo(
    () => empireData?.planets.reduce((s, p) => s + p.resources.deuterium, 0) ?? 0,
    [empireData]
  );

  return (
    <div className="space-y-5">
      {/* Top Cockpit Hero Header */}
      <div
        className="relative rounded-xl border border-amber-500/30 bg-[#080d16] p-5 overflow-hidden shadow-[0_6px_25px_rgba(0,0,0,0.7)] flex items-center justify-between flex-wrap gap-4"
        style={{
          backgroundImage:
            "radial-gradient(90% 120% at 85% 0%, rgba(245,158,11,0.16) 0%, rgba(34,211,238,0.08) 45%, rgba(8,13,22,0.96) 100%)",
        }}
      >
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
            <Crown className="h-3.5 w-3.5" />
            İmparatorluk Yönetim Merkezi • {empireData?.planets.length ?? 0} Koloni
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 mt-0.5">
            İmparatorluk Görünümü
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            Tüm kolonilerinizdeki hammadde stokları, maden seviyeleri, tersane donanmaları ve konuşlu savunma sistemlerinin tek ekranda toplu matrisi.
          </p>
        </div>

        {/* View Toggles & Refresh */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="p-1 rounded-lg border border-zinc-800 bg-zinc-900/80 flex items-center gap-1 text-xs font-mono">
            <button
              type="button"
              onClick={() => setFilterType("planets")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors ${
                filterType === "planets"
                  ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Globe2 className="h-3.5 w-3.5" />
              <span>Gezegenler</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType("moons")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors ${
                filterType === "moons"
                  ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Aylar</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType("all")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-md transition-colors ${
                filterType === "all"
                  ? "bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/40"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <span>Tümü</span>
            </button>
          </div>

          <button
            type="button"
            disabled={isLoading}
            onClick={fetchEmpireSummary}
            className="p-2 rounded-lg border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-cyan-300 transition-colors disabled:opacity-40"
            title="Verileri Güncelle"
          >
            <RotateCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Aggregate Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div className="p-3 rounded-xl border border-zinc-800 bg-[#0d1017] flex items-center justify-between">
          <span className="text-zinc-400">Toplam Metal:</span>
          <span className="text-zinc-100 font-bold">{totalMetal.toLocaleString()}</span>
        </div>
        <div className="p-3 rounded-xl border border-zinc-800 bg-[#0d1017] flex items-center justify-between">
          <span className="text-zinc-400">Toplam Kristal:</span>
          <span className="text-cyan-300 font-bold">{totalCrystal.toLocaleString()}</span>
        </div>
        <div className="p-3 rounded-xl border border-zinc-800 bg-[#0d1017] flex items-center justify-between">
          <span className="text-zinc-400">Toplam Döteryum:</span>
          <span className="text-teal-300 font-bold">{totalDeuterium.toLocaleString()}</span>
        </div>
        <div className="p-3 rounded-xl border border-zinc-800 bg-[#0d1017] flex items-center justify-between">
          <span className="text-zinc-400">Karanlık Madde:</span>
          <span className="text-amber-400 font-bold">
            {(empireData?.user.darkMatter ?? 0).toLocaleString()} KM
          </span>
        </div>
      </div>

      {/* Main Multi-Column Empire Matrix Table */}
      <div className="rounded-xl border border-zinc-800 bg-[#0d1017] shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-xs border-collapse">
            {/* Table Header: Column Names (Planet Names & Coords) */}
            <thead className="bg-[#090d14] text-zinc-300 border-b border-zinc-800 font-mono">
              <tr>
                {/* Sticky Top-Left Corner */}
                <th className="sticky left-0 z-30 bg-[#090d14] py-3.5 px-4 font-bold text-amber-300 border-r border-zinc-800 min-w-[220px]">
                  Kategori / Varlık
                </th>

                {/* Colony Columns */}
                {visiblePlanets.map((planet) => (
                  <th
                    key={planet.id}
                    className="py-3 px-3 text-center border-r border-zinc-800/80 min-w-[130px]"
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="font-bold text-zinc-100 truncate max-w-[120px]">
                        {planet.name}
                      </span>
                      <span className="text-[10px] text-cyan-400">{planet.coords}</span>
                    </div>
                  </th>
                ))}

                {/* Final Column: Toplam */}
                <th className="py-3 px-3 text-center font-bold text-amber-300 bg-amber-950/20 min-w-[130px]">
                  Toplam (İmparatorluk)
                </th>
              </tr>
            </thead>

            {/* Table Body: Grouped Rows */}
            <tbody className="divide-y divide-zinc-800/60">
              {empireData && visiblePlanets.length > 0 ? (
                <EmpireTableSections
                  planets={visiblePlanets}
                  researches={empireData.researches}
                  onSelectPlanet={(id) => selectPlanet(id)}
                />
              ) : (
                <tr>
                  <td
                    colSpan={visiblePlanets.length + 2}
                    className="py-12 text-center text-zinc-500 font-mono"
                  >
                    {isLoading ? "İmparatorluk verileri taranıyor..." : "Görüntülenecek koloni bulunamadı."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

