"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { API_BASE_URL, useGameStore } from "@/store/useGameStore";
import {
  type LifeformTechItemMeta,
  type PlanetLifeformStateDto,
  getTechForSlot,
} from "@/lib/lifeformsCatalog";
import { LifeformTechTree } from "@/components/lifeforms/LifeformTechTree";
import {
  AlertTriangle,
  Sparkles,
  ArrowLeft,
  Sliders,
} from "lucide-react";

export default function LifeformsTechTreePage() {
  const planets = useGameStore((s) => s.planets);
  const selectedPlanetId = useGameStore((s) => s.selectedPlanetId);
  const isLoaded = useGameStore((s) => s.isLoaded);
  const planet = planets.find((p) => p.id === selectedPlanetId) ?? planets[0];

  const [lifeformState, setLifeformState] =
    useState<PlanetLifeformStateDto | null>(null);
  const [selectedTech, setSelectedTech] = useState<LifeformTechItemMeta>(() => getTechForSlot(1));

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
        const slot1Tech = getTechForSlot(1, data.slotSpecies?.[1] ?? data.activeSpecies);
        setSelectedTech(slot1Tech);
      }
    } catch {
      // Ignore network error
    }
  }, [planet?.id]);

  useEffect(() => {
    loadLifeforms();
  }, [loadLifeforms, isLoaded]);

  const researchCentreLevel =
    lifeformState?.buildingLevels?.researchCentre ??
    lifeformState?.buildingLevels?.runeTechnologicalInstitute ??
    lifeformState?.buildingLevels?.coreMatrix ??
    lifeformState?.buildingLevels?.cosmicResonator ??
    0;
  const currentPopulation =
    (lifeformState?.t1Population ?? 0) +
    (lifeformState?.t2Population ?? 0) +
    (lifeformState?.t3Population ?? 0);
  const artifactCount = lifeformState?.artifactCount ?? 420;
  const maxArtifacts = lifeformState?.maxArtifacts ?? 3600;

  return (
    <div className="space-y-4">
      {/* Top Banner with Artifacts Counter */}
      <div className="rounded-lg border border-purple-500/35 bg-[#080c14] p-5 flex items-center justify-between flex-wrap gap-4 shadow-lg">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400">
            3 Kademeli Evrim Matrisi • {planet.coords}
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-100 mt-0.5">
            Canlı türü araştırması -{" "}
            <span className="text-cyan-300">{planet.name}</span>
          </h1>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="px-3.5 py-2 rounded-lg bg-purple-950/40 border border-purple-500/40 text-xs font-mono text-purple-200 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>
              Toplanan eserler:{" "}
              <strong className="text-amber-300">{artifactCount}</strong> /{" "}
              {maxArtifacts}
            </span>
          </div>

          <Link
            href="/lifeforms"
            className="px-3 py-2 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-semibold text-zinc-200 flex items-center gap-1.5 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-cyan-400" />
            <span>Binalar</span>
          </Link>

          <Link
            href="/lifeforms/management"
            className="px-3 py-2 rounded bg-[#141f2e] hover:bg-[#1b2a3e] border border-cyan-500/40 text-xs font-semibold text-cyan-200 flex items-center gap-1.5 transition"
          >
            <Sliders className="h-3.5 w-3.5 text-cyan-400" />
            <span>Yönetim</span>
          </Link>
        </div>
      </div>

      {/* System Condition Alert Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div
          className={`p-3.5 rounded-lg border flex items-center gap-3 text-xs ${
            researchCentreLevel <= 0
              ? "border-amber-500/60 bg-amber-950/30 text-amber-200"
              : "border-zinc-800 bg-[#0b1018]/90 text-zinc-300"
          }`}
        >
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
          <span>
            Araştırmaya başlamadan önce Araştırma Merkezi binası inşa etmen
            gerekiyor.
          </span>
        </div>

        <div className="p-3.5 rounded-lg border border-amber-500/40 bg-amber-950/20 flex items-center gap-3 text-xs text-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
          <span>
            Nüfus gerekli sayının altına düştüğünde canlı türü araştırmaları
            devre dışı bırakılır.
          </span>
        </div>
      </div>

      {/* Selected Tech Inspector Bar */}
      <div className="rounded-lg border border-purple-500/30 bg-[#0b111c] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-purple-500/20 border border-purple-500/40 text-[10px] font-mono text-purple-300">
              Seviye {selectedTech.tier} • Slot {selectedTech.slot}
            </span>
            <h2 className="text-sm font-bold text-zinc-100">
              {selectedTech.name}
            </h2>
          </div>
          <p className="text-xs text-zinc-400">{selectedTech.description}</p>
        </div>

        <div className="text-xs font-mono text-right shrink-0 space-y-1">
          <div className="text-cyan-300">
            Gerekli Nüfus:{" "}
            {selectedTech.requiredPopulation.toLocaleString("en-US")} İnsan
          </div>
          <div className="text-zinc-400">
            Maliyet: {selectedTech.baseMetal.toLocaleString("en-US")} M •{" "}
            {selectedTech.baseCrystal.toLocaleString("en-US")} K •{" "}
            {selectedTech.baseDeut.toLocaleString("en-US")} D
          </div>
        </div>
      </div>

      {/* 3-Tier Research Grid with Reset & 60-Minute Restore */}
      <LifeformTechTree
        planetId={planet.id}
        activeSpecies={lifeformState?.activeSpecies ?? "humans"}
        currentPopulation={currentPopulation}
        researchCentreLevel={researchCentreLevel}
        onSelectTech={setSelectedTech}
        selectedSlot={selectedTech.slot}
      />
    </div>
  );
}

