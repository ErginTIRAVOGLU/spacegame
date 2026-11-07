"use client";

import { useEffect, useMemo, useState } from "react";
import { syncActiveQuestWithLivePlanet } from "@/services/questEvaluationService";
import { useTutorialStore } from "@/store/useTutorialStore";
import { useOfficerStore } from "@/store/useOfficerStore";
import {
  DEFAULT_RESOURCE_SETTINGS,
  type PlanetResourceSettings,
  type PlanetSummary,
  useGameStore,
} from "@/store/useGameStore";
import { buildResourceSettingsMatrix } from "@/services/resourceSettingsEngine";
import {
  X,
  RefreshCw,
  Boxes,
  Gem,
  Droplets,
  Zap,
  Sliders,
  Award,
  Database,
  BarChart3,
  Sparkles,
} from "lucide-react";

const PERCENT_OPTIONS = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0];
const COLLECTOR_CRAWLER_PERCENT_OPTIONS = [
  150, 140, 130, 120, 110, 100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0,
];

interface ResourceSettingsModalProps {
  planet: PlanetSummary;
  isOpen: boolean;
  onClose: () => void;
}

export function ResourceSettingsModal({
  planet,
  isOpen,
  onClose,
}: ResourceSettingsModalProps) {
  const fetchPlanetResourceSettings = useGameStore(
    (s) => s.fetchPlanetResourceSettings
  );
  const updatePlanetResourceSettings = useGameStore(
    (s) => s.updatePlanetResourceSettings
  );
  const researches = useGameStore((s) => s.researches);
  const playerClass = useGameStore((s) => s.playerClass);
  const officersStatus = useOfficerStore((s) => s.officersStatus);

  const [settings, setSettings] = useState<PlanetResourceSettings>(
    planet.resourceSettings ?? { ...DEFAULT_RESOURCE_SETTINGS }
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    fetchPlanetResourceSettings(planet.id).then((loaded) => {
      setSettings(loaded);
    });
  }, [isOpen, planet.id, fetchPlanetResourceSettings]);

  const matrix = useMemo(() => {
    return buildResourceSettingsMatrix({
      planet,
      settings,
      researches,
      playerClass,
      officersStatus,
    });
  }, [planet, settings, researches, playerClass, officersStatus]);

  if (!isOpen) return null;

  const handleSettingChange = (
    key: keyof PlanetResourceSettings,
    value: number
  ) => {
    setSettings((s) => ({
      ...s,
      [key]: value,
    }));
  };

  const handleRecalculate = async () => {
    setIsSaving(true);
    try {
      const updated = await updatePlanetResourceSettings(planet.id, settings);
      const finalSettings = updated || settings;
      syncActiveQuestWithLivePlanet({
        ...planet,
        resourceSettings: finalSettings,
      });
      useTutorialStore.getState().fetchTutorial(planet.id, undefined, 1);
    } finally {
      setIsSaving(false);
    }
  };

  const productionFactorPercent = Math.round(matrix.productionFactor * 100);

  const settingKeyMap: Record<string, keyof PlanetResourceSettings> = {
    metalMine: "metalMinePercent",
    crystalMine: "crystalMinePercent",
    deuteriumSynthesizer: "deuteriumSynthesizerPercent",
    solarPlant: "solarPlantPercent",
    fusionReactor: "fusionReactorPercent",
    solarSatellite: "solarSatellitePercent",
    crawler: "crawlerPercent",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-5xl rounded-lg border border-cyan-500/40 bg-[#090d14] shadow-[0_0_50px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#121a27] border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <Sliders className="h-4 w-4 text-cyan-400" />
            <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-zinc-100">
              Kaynak ayarları -{" "}
              <span className="text-cyan-300">{matrix.planetName}</span>
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Efficiency Factor Badge */}
            <span
              className={`px-3 py-1 rounded text-xs font-mono font-bold border ${
                productionFactorPercent >= 100
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                  : productionFactorPercent >= 50
                  ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                  : "bg-rose-500/15 border-rose-500/40 text-rose-300"
              }`}
            >
              Üretim faktörü: %{productionFactorPercent}
            </span>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-100 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Comprehensive Production Matrix Table (28 Rows) */}
        <div className="p-4 overflow-y-auto space-y-4">
          <div className="rounded border border-zinc-800 overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#06090e] text-zinc-400 uppercase border-b border-zinc-800">
                <tr>
                  <th className="py-2.5 px-3">Kaynak / Tesis / Bonus</th>
                  <th className="py-2.5 px-3 text-right">
                    <span className="inline-flex items-center gap-1 text-zinc-200">
                      <Boxes className="h-3.5 w-3.5 text-zinc-300" />
                      Metal
                    </span>
                  </th>
                  <th className="py-2.5 px-3 text-right">
                    <span className="inline-flex items-center gap-1 text-cyan-300">
                      <Gem className="h-3.5 w-3.5 text-cyan-400" />
                      Kristal
                    </span>
                  </th>
                  <th className="py-2.5 px-3 text-right">
                    <span className="inline-flex items-center gap-1 text-emerald-300">
                      <Droplets className="h-3.5 w-3.5 text-emerald-400" />
                      Deuterium
                    </span>
                  </th>
                  <th className="py-2.5 px-3 text-right">
                    <span className="inline-flex items-center gap-1 text-amber-300">
                      <Zap className="h-3.5 w-3.5 text-amber-400" />
                      Enerji
                    </span>
                  </th>
                  <th className="py-2.5 px-3 text-right">Verimlilik</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-800/70">
                {/* 1. Category Divider: Binalar ve Tesisler */}
                <tr className="bg-[#0b1018] text-cyan-400 font-bold border-t border-b border-zinc-800">
                  <td colSpan={6} className="py-1.5 px-3 flex items-center gap-1.5">
                    <Boxes className="w-3 h-3" />
                    <span>Üretim Binaları ve Tesisler</span>
                  </td>
                </tr>

                {matrix.rows
                  .filter((r) => r.category === "base" || r.category === "building" || r.category === "unit")
                  .map((row) => {
                    const settingKey = settingKeyMap[row.key];
                    const currentPercent = settingKey ? settings[settingKey] : row.percentage;

                    return (
                      <tr
                        key={row.key}
                        className={
                          row.category === "base"
                            ? "bg-[#0b1018]/60 font-semibold"
                            : "hover:bg-[#111926]/70 transition"
                        }
                      >
                        <td className="py-2 px-3 text-zinc-100">
                          {row.label}
                          {typeof row.levelOrCount === "number" && (
                            <span className="text-zinc-500 text-[11px] ml-1">
                              ({row.category === "unit" ? `Adet: ${row.levelOrCount}` : `Kademe ${row.levelOrCount}`})
                            </span>
                          )}
                        </td>
                        <td
                          className={`py-2 px-3 text-right ${
                            row.metal > 0 ? "text-emerald-400 font-semibold" : "text-zinc-500"
                          }`}
                        >
                          {row.metal > 0 ? `+${row.metal.toLocaleString("tr-TR")}` : "0"}
                        </td>
                        <td
                          className={`py-2 px-3 text-right ${
                            row.crystal > 0 ? "text-cyan-400 font-semibold" : "text-zinc-500"
                          }`}
                        >
                          {row.crystal > 0 ? `+${row.crystal.toLocaleString("tr-TR")}` : "0"}
                        </td>
                        <td
                          className={`py-2 px-3 text-right ${
                            row.deuterium > 0
                              ? "text-emerald-400 font-semibold"
                              : row.deuterium < 0
                              ? "text-rose-400 font-semibold"
                              : "text-zinc-500"
                          }`}
                        >
                          {row.deuterium > 0
                            ? `+${row.deuterium.toLocaleString("tr-TR")}`
                            : row.deuterium < 0
                            ? row.deuterium.toLocaleString("tr-TR")
                            : "0"}
                        </td>
                        <td
                          className={`py-2 px-3 text-right ${
                            row.energy > 0
                              ? "text-amber-300 font-semibold"
                              : row.energy < 0
                              ? "text-rose-400"
                              : "text-zinc-500"
                          }`}
                        >
                          {row.energy > 0
                            ? `+${row.energy.toLocaleString("tr-TR")}`
                            : row.energy < 0
                            ? row.energy.toLocaleString("tr-TR")
                            : "0"}
                        </td>
                        <td className="py-2 px-3 text-right">
                          {row.hasSetting && settingKey ? (
                            <select
                              value={currentPercent}
                              onChange={(e) =>
                                handleSettingChange(settingKey, Number(e.target.value))
                              }
                              className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs text-cyan-300"
                            >
                              {(settingKey === "crawlerPercent" && playerClass === "Collector"
                                ? COLLECTOR_CRAWLER_PERCENT_OPTIONS
                                : PERCENT_OPTIONS
                              ).map((p) => (
                                <option key={p} value={p}>
                                  %{p}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-zinc-500">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                {/* 2. Category Divider: Bonuslar */}
                <tr className="bg-[#0b1018] text-cyan-400 font-bold border-t border-b border-zinc-800">
                  <td colSpan={6} className="py-1.5 px-3 flex items-center gap-1.5">
                    <Award className="w-3 h-3" />
                    <span>Subaylar, Sınıf ve Araştırma Bonusları</span>
                  </td>
                </tr>

                {matrix.rows
                  .filter(
                    (r) =>
                      r.category === "officer" ||
                      r.category === "class" ||
                      r.category === "tech" ||
                      r.category === "alliance" ||
                      r.category === "booster" ||
                      r.category === "lifeform"
                  )
                  .map((row) => (
                    <tr key={row.key} className="hover:bg-[#111926]/70 transition">
                      <td className="py-1.5 px-3 text-zinc-300">
                        {row.label}
                        {row.category === "officer" && (
                          <span className={`text-[10px] ml-1.5 px-1 py-0.2 rounded ${row.officerActive ? "text-emerald-400" : "text-zinc-500"}`}>
                            ({row.officerActive ? "Aktif" : "Pasif"})
                          </span>
                        )}
                      </td>
                      <td className={`py-1.5 px-3 text-right ${row.metal > 0 ? "text-emerald-400" : "text-zinc-500"}`}>
                        {row.metal > 0 ? `+${row.metal.toLocaleString("tr-TR")}` : "0"}
                      </td>
                      <td className={`py-1.5 px-3 text-right ${row.crystal > 0 ? "text-cyan-400" : "text-zinc-500"}`}>
                        {row.crystal > 0 ? `+${row.crystal.toLocaleString("tr-TR")}` : "0"}
                      </td>
                      <td className={`py-1.5 px-3 text-right ${row.deuterium > 0 ? "text-emerald-400" : "text-zinc-500"}`}>
                        {row.deuterium > 0 ? `+${row.deuterium.toLocaleString("tr-TR")}` : "0"}
                      </td>
                      <td className={`py-1.5 px-3 text-right ${row.energy > 0 ? "text-amber-300" : "text-zinc-500"}`}>
                        {row.energy > 0 ? `+${row.energy.toLocaleString("tr-TR")}` : "0"}
                      </td>
                      <td className="py-1.5 px-3 text-right text-zinc-500">—</td>
                    </tr>
                  ))}

                {/* 3. Category Divider: Depolama Kapasiteleri */}
                <tr className="bg-[#0b1018] text-cyan-400 font-bold border-t border-b border-zinc-800">
                  <td colSpan={6} className="py-1.5 px-3 flex items-center gap-1.5">
                    <Database className="w-3 h-3" />
                    <span>Depolama Kapasiteleri</span>
                  </td>
                </tr>

                {matrix.rows
                  .filter((r) => r.category === "storage")
                  .map((row) => (
                    <tr key={row.key} className="bg-[#06090e]/60">
                      <td className="py-1.5 px-3 text-zinc-400">{row.label}</td>
                      <td className="py-1.5 px-3 text-right text-zinc-300">
                        {row.metal > 0 ? row.metal.toLocaleString("tr-TR") : "—"}
                      </td>
                      <td className="py-1.5 px-3 text-right text-cyan-300">
                        {row.crystal > 0 ? row.crystal.toLocaleString("tr-TR") : "—"}
                      </td>
                      <td className="py-1.5 px-3 text-right text-emerald-300">
                        {row.deuterium > 0 ? row.deuterium.toLocaleString("tr-TR") : "—"}
                      </td>
                      <td className="py-1.5 px-3 text-right text-zinc-500">—</td>
                      <td className="py-1.5 px-3 text-right text-zinc-500">—</td>
                    </tr>
                  ))}

                {/* 4. Toplamlar (Rows 25-28) */}
                <tr className="bg-[#0d1520] font-bold border-t-2 border-zinc-700">
                  <td className="py-2.5 px-3 text-cyan-300 flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Saatlik Toplam</span>
                  </td>
                  <td className="py-2.5 px-3 text-right text-emerald-400">
                    +{matrix.totals.hourly.metal.toLocaleString("tr-TR")}
                  </td>
                  <td className="py-2.5 px-3 text-right text-cyan-400">
                    +{matrix.totals.hourly.crystal.toLocaleString("tr-TR")}
                  </td>
                  <td
                    className={`py-2.5 px-3 text-right ${
                      matrix.totals.hourly.deuterium >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {matrix.totals.hourly.deuterium >= 0 ? "+" : ""}
                    {matrix.totals.hourly.deuterium.toLocaleString("tr-TR")}
                  </td>
                  <td
                    className={`py-2.5 px-3 text-right ${
                      matrix.rows.find((r) => r.key === "total_hourly")?.energy ?? 0 >= 0
                        ? "text-amber-300"
                        : "text-rose-400"
                    }`}
                  >
                    {matrix.totals.hourly.energy}
                  </td>
                  <td className="py-2.5 px-3 text-right text-zinc-400">1s</td>
                </tr>

                <tr className="bg-[#0b111b]">
                  <td className="py-2 px-3 text-zinc-300">Günlük Toplam (x24)</td>
                  <td className="py-2 px-3 text-right text-emerald-300">
                    +{matrix.totals.daily.metal.toLocaleString("tr-TR")}
                  </td>
                  <td className="py-2 px-3 text-right text-cyan-300">
                    +{matrix.totals.daily.crystal.toLocaleString("tr-TR")}
                  </td>
                  <td className="py-2 px-3 text-right text-emerald-300">
                    +{matrix.totals.daily.deuterium.toLocaleString("tr-TR")}
                  </td>
                  <td className="py-2 px-3 text-right text-zinc-500">—</td>
                  <td className="py-2 px-3 text-right text-zinc-500">24s</td>
                </tr>

                <tr className="bg-[#090e16]">
                  <td className="py-2 px-3 text-zinc-300">Haftalık Toplam (x168)</td>
                  <td className="py-2 px-3 text-right text-emerald-300">
                    +{matrix.totals.weekly.metal.toLocaleString("tr-TR")}
                  </td>
                  <td className="py-2 px-3 text-right text-cyan-300">
                    +{matrix.totals.weekly.crystal.toLocaleString("tr-TR")}
                  </td>
                  <td className="py-2 px-3 text-right text-emerald-300">
                    +{matrix.totals.weekly.deuterium.toLocaleString("tr-TR")}
                  </td>
                  <td className="py-2 px-3 text-right text-zinc-500">—</td>
                  <td className="py-2 px-3 text-right text-zinc-500">7g</td>
                </tr>

                <tr className="bg-[#0d1626]">
                  <td className="py-2 px-3 text-zinc-200 flex items-center gap-1.5 font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Net Enerji & Üretim Faktörü</span>
                  </td>
                  <td className="py-2 px-3 text-right text-zinc-500">—</td>
                  <td className="py-2 px-3 text-right text-zinc-500">—</td>
                  <td className="py-2 px-3 text-right text-zinc-500">—</td>
                  <td className="py-2 px-3 text-right font-bold text-amber-300">
                    {matrix.totals.hourly.energy}
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-cyan-300">
                    %{productionFactorPercent}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleRecalculate}
              disabled={isSaving}
              className="px-5 py-2 rounded bg-gradient-to-b from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-zinc-950 font-bold text-xs font-mono uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(34,211,238,0.3)] transition cursor-pointer"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isSaving ? "animate-spin" : ""}`}
              />
              <span>{isSaving ? "Hesaplanıyor..." : "Tekrar hesapla"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
