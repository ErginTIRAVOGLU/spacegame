"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useGameStore } from "@/store/useGameStore";
import {
  Pencil,
  Compass,
  Flag,
  Settings2,
  X,
  Check,
  AlertTriangle,
} from "lucide-react";

export function PlanetHeroCard() {
  const planets = useGameStore((s) => s.planets);
  const selectedPlanetId = useGameStore((s) => s.selectedPlanetId);
  const totalPoints = useGameStore((s) => s.totalPoints);
  const honorPoints = useGameStore((s) => s.honorPoints);
  const renamePlanet = useGameStore((s) => s.renamePlanet);
  const incomingFleets = useGameStore((s) => s.incomingFleets);

  const planet = planets.find((p) => p.id === selectedPlanetId) ?? planets[0];

  const hostileRaid = incomingFleets.find(
    (f) =>
      f.isHostile &&
      (f.targetCoords === planet.coords ||
        f.targetPlanetName === planet.name ||
        f.targetPlanetName === "TR_NEW")
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newNameInput, setNewNameInput] = useState(planet.name);
  const [abandonNotice, setAbandonNotice] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const actionParam = searchParams.get("action");

  const openManageModal = () => {
    setNewNameInput(planet.name);
    setAbandonNotice(null);
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (actionParam === "rename-planet") {
      openManageModal();
    }
  }, [actionParam]);

  useEffect(() => {
    const handleGlobalModal = (e: Event) => {
      const custom = e as CustomEvent<{ modalId: string }>;
      if (custom.detail?.modalId === "RENAME_PLANET_MODAL") {
        openManageModal();
      }
    };
    window.addEventListener("open-game-modal", handleGlobalModal);
    return () => window.removeEventListener("open-game-modal", handleGlobalModal);
  }, []);

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNameInput.trim()) return;
    await renamePlanet(planet.id, newNameInput.trim());
    setIsModalOpen(false);
  };

  return (
    <>
      <div className="relative rounded-lg border border-cyan-500/25 bg-[#070b12] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.75)]">
        {/* High-Res Sci-Fi Orbital Horizon Backdrop */}
        <div
          aria-hidden="true"
          className="relative h-[270px] w-full overflow-hidden select-none"
          style={{
            background:
              "radial-gradient(120% 90% at 22% 110%, rgba(14,165,233,0.42) 0%, rgba(30,58,138,0.28) 38%, rgba(8,12,20,0.94) 72%, #04070d 100%)",
          }}
        >
          {/* Planetary Horizon Curve & Atmospheric Glow */}
          <div className="absolute -bottom-44 -left-24 w-[620px] h-[340px] rounded-[100%] bg-gradient-to-tr from-[#0b1f3a] via-[#154e75] to-cyan-300/40 border-t-2 border-cyan-300/60 shadow-[0_-18px_60px_rgba(34,211,238,0.35)]" />
          <div className="absolute -bottom-48 -left-20 w-[600px] h-[330px] rounded-[100%] bg-[radial-gradient(circle_at_50%_20%,rgba(251,191,36,0.18),transparent_65%)]" />

          {/* Top Bar Overlay: Genel Bakış - {PlanetName} */}
          <div className="relative z-10 flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-black/80 via-black/55 to-transparent border-b border-zinc-800/70">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-wide text-zinc-100">
                Genel Bakış -{" "}
                <span className="text-cyan-300">{planet.name}</span>
              </h1>
              <button
                type="button"
                onClick={openManageModal}
                title="Gezegen ismini değiştir"
                className="p-1 rounded bg-zinc-900/80 hover:bg-cyan-500/20 border border-zinc-700/70 hover:border-cyan-400/50 text-zinc-300 hover:text-cyan-300 transition"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>

            <span className="text-xs font-mono text-cyan-400/90 hidden sm:inline">
              {planet.coords}
            </span>
          </div>

          {/* Hostile Raid Active Warning Banner */}
          {hostileRaid && (
            <div className="relative z-10 mx-3 mt-2 px-3 py-1.5 rounded-md bg-red-950/85 border border-red-500/80 text-red-200 text-xs font-mono flex items-center justify-between shadow-[0_0_16px_rgba(239,68,68,0.5)] animate-pulse">
              <span className="flex items-center gap-2 font-bold">
                <AlertTriangle className="h-4 w-4 text-red-400 animate-bounce" />
                <span>UYARI: Düşman Saldırı Filosu Yaklaşıyor!</span>
              </span>
              <span className="text-amber-300 font-extrabold">
                {hostileRaid.shipCount} Gemi
              </span>
            </div>
          )}

          {/* Right Info Column (Sci-Fi Key-Value Telemetry Panel) */}
          <div className="relative z-10 mt-3 mr-3 ml-auto w-full max-w-[330px] rounded bg-black/75 backdrop-blur-md border border-zinc-700/70 p-3 text-xs shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
            <dl className="space-y-1.5 font-mono">
              <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-1">
                <dt className="text-zinc-400">Çap:</dt>
                <dd className="text-zinc-100 font-semibold">
                  {planet.diameter.toLocaleString("en-US")}km (
                  <span className="text-emerald-400">{planet.fieldsUsed}</span>/
                  <span>{planet.maxFields}</span>)
                </dd>
              </div>

              <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-1">
                <dt className="text-zinc-400">Sıcaklık:</dt>
                <dd className="text-amber-300 font-semibold">
                  {planet.tempMin}°C ile {planet.tempMax}°C arası
                </dd>
              </div>

              <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-1">
                <dt className="text-zinc-400">Pozisyon:</dt>
                <dd>
                  <Link
                    href="/galaxy"
                    className="text-cyan-300 hover:text-cyan-200 underline decoration-cyan-500/40 font-semibold inline-flex items-center gap-1"
                  >
                    <Compass className="h-3 w-3 text-cyan-400" />
                    {planet.coords}
                  </Link>
                </dd>
              </div>

              <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-1">
                <dt className="text-zinc-400">Puanlar:</dt>
                <dd className="text-zinc-100 font-semibold">
                  {totalPoints.toLocaleString("en-US")}{" "}
                  <span className="text-cyan-400">(1. sırada)</span>
                </dd>
              </div>

              <div className="flex items-center justify-between gap-2">
                <dt className="text-zinc-400">Onur Puanı:</dt>
                <dd className="text-emerald-300 font-semibold">
                  {honorPoints.toLocaleString("en-US")}
                </dd>
              </div>
            </dl>
          </div>

          {/* Bottom Quick Actions Bar */}
          <div className="absolute bottom-3 right-3 left-3 z-10 flex items-center justify-between flex-wrap gap-2">
            <Link
              href="/fleet"
              className="px-3 py-1.5 rounded bg-gradient-to-b from-[#172334] to-[#0c131d] hover:from-[#1e2e44] hover:to-[#111b29] border border-cyan-500/40 text-xs font-semibold text-cyan-200 flex items-center gap-1.5 shadow-[0_2px_10px_rgba(0,0,0,0.6)] transition"
            >
              <Flag className="h-3.5 w-3.5 text-cyan-400" />
              <span>İskan et</span>
            </Link>

            <button
              type="button"
              onClick={openManageModal}
              className="px-3 py-1.5 rounded bg-gradient-to-b from-[#1a202c] to-[#0d1117] hover:from-[#242c3d] hover:to-[#131922] border border-zinc-700/80 hover:border-amber-400/50 text-xs font-semibold text-zinc-200 hover:text-amber-200 flex items-center gap-1.5 shadow-[0_2px_10px_rgba(0,0,0,0.6)] transition"
            >
              <Settings2 className="h-3.5 w-3.5 text-amber-400" />
              <span>Terket / İsmini değiştir</span>
            </button>
          </div>
        </div>
      </div>

      {/* Abandon / Rename Planet Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-lg border border-cyan-500/40 bg-[#0b1018] shadow-[0_0_40px_rgba(0,0,0,0.9)] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-[#111926] border-b border-zinc-800">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-100">
                Gezegeni Yönet — {planet.coords}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4 space-y-5">
              <form onSubmit={handleRenameSubmit} className="space-y-2.5">
                <label className="block text-xs font-medium text-zinc-300">
                  Yeni Gezegen İsmi
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={32}
                    value={newNameInput}
                    onChange={(e) => setNewNameInput(e.target.value)}
                    className="flex-1 rounded bg-zinc-950 border border-zinc-700 px-3 py-1.5 text-xs font-mono text-zinc-100 focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold text-xs flex items-center gap-1 transition"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>İsmini Değiştir</span>
                  </button>
                </div>
              </form>

              <div className="border-t border-zinc-800 pt-4 space-y-2">
                <div className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Koloniyi Terk Et</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Bir koloniyi terk etmek üzerindeki tüm kademeleri ve savunmaları kalıcı olarak siler. Ana gezegen terk edilemez.
                </p>
                {abandonNotice && (
                  <div className="p-2 rounded bg-rose-950/40 border border-rose-500/40 text-[11px] font-mono text-rose-300">
                    {abandonNotice}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() =>
                    setAbandonNotice(
                      "Güvenlik kilidi: Aktif ana gezegen veya filo hareketi olan koloni terk edilemez."
                    )
                  }
                  className="px-3 py-1.5 rounded bg-rose-950/60 hover:bg-rose-900/60 border border-rose-500/40 text-xs font-semibold text-rose-300 transition"
                >
                  Koloniyi Terket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

