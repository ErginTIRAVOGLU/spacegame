"use client";

import { useState } from "react";
import Link from "next/link";
import {
  useGameStore,
  type PlanetSummary,
  type ActiveResearchQueue,
} from "@/store/useGameStore";
import { useCountdown } from "@/hooks/useCountdown";
import { Globe2, Moon, Hammer, Rocket, FlaskConical } from "lucide-react";

function ColonyProductionRow({
  planet,
  activeResearchQueue,
  onSelectPlanet,
}: {
  planet: PlanetSummary;
  activeResearchQueue: ActiveResearchQueue | null;
  onSelectPlanet: (id: string) => void;
}) {
  const fetchBootstrap = useGameStore((s) => s.fetchBootstrap);
  const bQueue = planet.activeBuildingQueue;
  const sQueue = planet.shipyardQueue?.[0] ?? null;
  const isResearchOrigin =
    activeResearchQueue && activeResearchQueue.originPlanetId === planet.id;

  const buildingCountdown = useCountdown(
    bQueue?.endTimeUtc,
    bQueue?.startTimeUtc,
    { referenceUtc: planet.serverTimeUtc, playSoundOnComplete: false, onComplete: () => fetchBootstrap() }
  );

  const shipyardCountdown = useCountdown(
    sQueue?.nextUnitFinishUtc,
    undefined,
    { referenceUtc: planet.serverTimeUtc, playSoundOnComplete: false, onComplete: () => fetchBootstrap() }
  );

  const researchCountdown = useCountdown(
    isResearchOrigin ? activeResearchQueue?.endTimeUtc : null,
    isResearchOrigin ? activeResearchQueue?.startTimeUtc : null,
    { referenceUtc: planet.serverTimeUtc, playSoundOnComplete: false, onComplete: () => fetchBootstrap() }
  );

  return (
    <tr className="hover:bg-[#111926]/80 transition-colors">
      {/* Planet Visual + Name + Coords */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onSelectPlanet(planet.id)}
            className="h-9 w-9 rounded-full bg-gradient-to-br from-cyan-400 via-blue-700 to-slate-950 border border-cyan-400/50 shrink-0 shadow-[0_0_10px_rgba(34,211,238,0.25)]"
          />
          <div>
            <button
              type="button"
              onClick={() => onSelectPlanet(planet.id)}
              className="text-xs font-bold text-zinc-100 hover:text-cyan-300 text-left block"
            >
              {planet.name}
            </button>
            <Link
              href="/galaxy"
              className="text-[11px] font-mono text-cyan-400 hover:underline"
            >
              {planet.coords}
            </Link>
          </div>
        </div>
      </td>

      {/* Bina Column */}
      <td className="py-3 px-4 font-mono text-xs">
        {bQueue ? (
          <div className="space-y-0.5">
            <div className="text-zinc-100 font-semibold flex items-center gap-1.5">
              <Hammer className="h-3.5 w-3.5 text-cyan-400" />
              <span>
                {bQueue.buildingName} (Kademe {bQueue.targetLevel})
              </span>
            </div>
            <div suppressHydrationWarning className="text-amber-400 font-bold">
              {buildingCountdown.formattedTr}
            </div>
          </div>
        ) : (
          <span className="text-zinc-500">— Boşta —</span>
        )}
      </td>

      {/* Tersane Column */}
      <td className="py-3 px-4 font-mono text-xs">
        {sQueue ? (
          <div className="space-y-0.5">
            <div className="text-zinc-100 font-semibold flex items-center gap-1.5">
              <Rocket className="h-3.5 w-3.5 text-amber-400" />
              <span>
                {sQueue.completedCount}/{sQueue.totalCount} Ünite
              </span>
            </div>
            <div suppressHydrationWarning className="text-amber-400">
              {shipyardCountdown.formattedTr}
            </div>
          </div>
        ) : (
          <span className="text-zinc-500">— Boşta —</span>
        )}
      </td>

      {/* Araştırma Column */}
      <td className="py-3 px-4 font-mono text-xs">
        {isResearchOrigin && activeResearchQueue ? (
          <div className="space-y-0.5">
            <div className="text-emerald-300 font-semibold flex items-center gap-1.5">
              <FlaskConical className="h-3.5 w-3.5 text-emerald-400" />
              <span>
                {activeResearchQueue.researchName} (Kademe{" "}
                {activeResearchQueue.targetLevel})
              </span>
            </div>
            <div suppressHydrationWarning className="text-amber-400 font-bold">
              {researchCountdown.formattedTr}
            </div>
          </div>
        ) : (
          <span className="text-zinc-500">— Boşta —</span>
        )}
      </td>
    </tr>
  );
}

export function ProductionOverviewTab() {
  const planets = useGameStore((s) => s.planets);
  const selectPlanet = useGameStore((s) => s.selectPlanet);
  const activeResearchQueue = useGameStore((s) => s.activeResearchQueue);

  const [subTab, setSubTab] = useState<"planets" | "moons">("planets");

  const filteredBodies = planets.filter((p) =>
    subTab === "moons" ? Boolean(p.isMoon) : !p.isMoon
  );

  return (
    <div className="rounded-lg border border-zinc-800 bg-[#090d14]/95 overflow-hidden shadow-lg">
      {/* Sub-tabs: Gezegenler / Aylar */}
      <div className="px-4 py-2.5 bg-[#121a26] border-b border-zinc-800 flex items-center justify-between flex-wrap gap-3">
        <div className="text-xs font-bold uppercase tracking-wider text-zinc-200">
          Üretim Genel Görünümü — Tüm Koloniler
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSubTab("planets")}
            className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 border transition ${
              subTab === "planets"
                ? "bg-cyan-500/20 border-cyan-400/60 text-cyan-200"
                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Globe2 className="h-3.5 w-3.5 text-cyan-400" />
            <span>Gezegenler</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab("moons")}
            className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 border transition ${
              subTab === "moons"
                ? "bg-cyan-500/20 border-cyan-400/60 text-cyan-200"
                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Moon className="h-3.5 w-3.5 text-amber-300" />
            <span>Aylar</span>
          </button>
        </div>
      </div>

      {/* Multi-Planet Queue Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#06090e] text-[11px] uppercase font-mono text-zinc-400 border-b border-zinc-800">
            <tr>
              <th className="py-2.5 px-4">Gezegen / Koordinat</th>
              <th className="py-2.5 px-4">Bina</th>
              <th className="py-2.5 px-4">Tersane</th>
              <th className="py-2.5 px-4">Araştırma</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/70">
            {filteredBodies.length > 0 ? (
              filteredBodies.map((planet) => (
                <ColonyProductionRow
                  key={planet.id}
                  planet={planet}
                  activeResearchQueue={activeResearchQueue}
                  onSelectPlanet={selectPlanet}
                />
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="py-8 text-center text-xs font-mono text-zinc-500"
                >
                  {subTab === "moons"
                    ? "Henüz yörüngede aktif bir Ay (Moon) bulunmuyor."
                    : "Kayıtlı gezegen bulunamadı."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

