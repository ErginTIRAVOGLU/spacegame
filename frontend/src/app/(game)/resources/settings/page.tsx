"use client";

import { useEffect, useMemo, useState, useRef, Suspense } from "react";
import Link from "next/link";
import { useQuestFocusHighlight } from "@/hooks/useQuestFocusHighlight";
import { syncActiveQuestWithLivePlanet } from "@/services/questEvaluationService";
import { useTutorialStore } from "@/store/useTutorialStore";
import { useOfficerStore } from "@/store/useOfficerStore";
import {
  DEFAULT_RESOURCE_SETTINGS,
  type PlanetResourceSettings,
  useGameStore,
} from "@/store/useGameStore";
import { buildResourceSettingsMatrix } from "@/services/resourceSettingsEngine";
import {
  ArrowLeft,
  RefreshCw,
  Boxes,
  Gem,
  Droplets,
  Zap,
  Sliders,
  CheckCircle2,
  RotateCcw,
  Shield,
  Award,
  Sparkles,
  Database,
  BarChart3,
} from "lucide-react";

const PERCENT_OPTIONS = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0];
const COLLECTOR_CRAWLER_PERCENT_OPTIONS = [
  150, 140, 130, 120, 110, 100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0,
];

function ResourceSettingsContent() {
  const { isHighlighted } = useQuestFocusHighlight({ paramName: "focus" });
  const planets = useGameStore((s) => s.planets);
  const selectedPlanetId = useGameStore((s) => s.selectedPlanetId);
  const planet = planets.find((p) => p.id === selectedPlanetId) ?? planets[0];

  const fetchPlanetResourceSettings = useGameStore(
    (s) => s.fetchPlanetResourceSettings
  );
  const updatePlanetResourceSettings = useGameStore(
    (s) => s.updatePlanetResourceSettings
  );
  const researches = useGameStore((s) => s.researches);
  const playerClass = useGameStore((s) => s.playerClass);
  const officersStatus = useOfficerStore((s) => s.officersStatus);

  // Saved server settings (baseline for dirty comparison)
  const [savedSettings, setSavedSettings] = useState<PlanetResourceSettings>(
    planet?.resourceSettings ?? { ...DEFAULT_RESOURCE_SETTINGS }
  );

  // Draft local form state (isolated from resource tick / polling loops per Task 05AV)
  const [draftSettings, setDraftSettings] = useState<PlanetResourceSettings>(
    planet?.resourceSettings ?? { ...DEFAULT_RESOURCE_SETTINGS }
  );

  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Track if current planet has loaded initial settings
  const loadedPlanetIdRef = useRef<string | null>(null);

  // Track if draft has unsaved changes compared to savedSettings
  const isDirty = useMemo(() => {
    return (
      draftSettings.metalMinePercent !== savedSettings.metalMinePercent ||
      draftSettings.crystalMinePercent !== savedSettings.crystalMinePercent ||
      draftSettings.deuteriumSynthesizerPercent !== savedSettings.deuteriumSynthesizerPercent ||
      draftSettings.solarPlantPercent !== savedSettings.solarPlantPercent ||
      draftSettings.fusionReactorPercent !== savedSettings.fusionReactorPercent ||
      draftSettings.solarSatellitePercent !== savedSettings.solarSatellitePercent ||
      draftSettings.crawlerPercent !== savedSettings.crawlerPercent
    );
  }, [draftSettings, savedSettings]);

  const isDirtyRef = useRef(false);
  isDirtyRef.current = isDirty;

  // Load settings ONLY when planet.id changes, or on initial mount (never on tick intervals)
  useEffect(() => {
    if (!planet?.id) return;
    if (loadedPlanetIdRef.current === planet.id) return;

    loadedPlanetIdRef.current = planet.id;
    fetchPlanetResourceSettings(planet.id).then((loaded) => {
      setSavedSettings(loaded);
      if (!isDirtyRef.current) {
        setDraftSettings(loaded);
      }
    });
  }, [planet?.id, fetchPlanetResourceSettings]);

  const handleSettingChange = (
    key: keyof PlanetResourceSettings,
    value: number
  ) => {
    setDraftSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
    setFeedback(null);
  };

  const handleResetDraft = () => {
    setDraftSettings(savedSettings);
    setFeedback("Değişiklikler sıfırlandı.");
  };

  // Build the complete 28-row matrix using the engine
  const matrix = useMemo(() => {
    return buildResourceSettingsMatrix({
      planet,
      settings: draftSettings,
      researches,
      playerClass,
      officersStatus,
    });
  }, [planet, draftSettings, researches, playerClass, officersStatus]);

  const handleRecalculate = async () => {
    if (!planet) return;
    setIsSaving(true);
    setFeedback(null);
    try {
      const updated = await updatePlanetResourceSettings(planet.id, draftSettings);
      const finalSettings = updated || draftSettings;
      setSavedSettings(finalSettings);
      setDraftSettings(finalSettings);

      // Real-time quest sync for Directive 1 Step 5 & Step 7
      const updatedPlanet = {
        ...planet,
        resourceSettings: finalSettings,
      };
      syncActiveQuestWithLivePlanet(updatedPlanet);

      // Refresh tutorial store in background
      useTutorialStore.getState().fetchTutorial(planet.id, undefined, 1);

      setFeedback("Kaynak ayarları ve üretim faktörleri başarıyla kaydedildi!");
    } catch {
      setFeedback("Ayarlar kaydedilirken hata oluştu.");
    } finally {
      setIsSaving(false);
    }
  };

  const productionFactorPercent = Math.round(matrix.productionFactor * 100);

  // Mapping from row key to setting key
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
    <div className="space-y-5">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between flex-wrap gap-3 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-3">
          <Link
            href="/resources"
            className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-cyan-300 transition flex items-center gap-1.5 text-xs font-mono"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kaynaklar Sayfasına Dön</span>
          </Link>

          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
              Gezegen Üretim Kontrolü
            </div>
            <h1 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <Sliders className="h-5 w-5 text-cyan-400" />
              <span>
                Kaynak Ayarları -{" "}
                <span className="text-cyan-300">{matrix.planetName}</span>
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border shadow-sm ${
              productionFactorPercent >= 100
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                : productionFactorPercent >= 50
                ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                : "bg-rose-500/15 border-rose-500/40 text-rose-300"
            }`}
          >
            Üretim faktörü: %{productionFactorPercent}
          </span>

          {isDirty && (
            <button
              type="button"
              onClick={handleResetDraft}
              disabled={isSaving}
              className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs flex items-center gap-1.5 transition cursor-pointer"
              title="Değişiklikleri iptal et ve son kaydedilen değerlere dön"
            >
              <RotateCcw className="h-3.5 w-3.5 text-zinc-400" />
              <span>Sıfırla</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleRecalculate}
            disabled={isSaving}
            className={`px-4 py-2 rounded-lg font-mono font-bold text-xs flex items-center gap-2 transition cursor-pointer disabled:opacity-50 ${
              isDirty
                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(52,211,153,0.4)] animate-pulse"
                : "bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_15px_rgba(34,211,238,0.3)]"
            }`}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSaving ? "animate-spin" : ""}`} />
            <span>
              {isSaving
                ? "Kaydediliyor..."
                : isDirty
                ? "Değişiklikleri Kaydet"
                : "Tekrar hesapla"}
            </span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Production Matrix Table (28 Rows) */}
      <div className="rounded-xl border border-zinc-800 bg-[#070b13] overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0b121e] text-zinc-400 uppercase border-b border-zinc-800">
              <tr>
                <th className="py-3 px-4">Kaynak / Tesis / Bonus</th>
                <th className="py-3 px-4 text-right">
                  <span className="inline-flex items-center gap-1 text-zinc-200">
                    <Boxes className="h-3.5 w-3.5 text-zinc-300" />
                    Metal
                  </span>
                </th>
                <th className="py-3 px-4 text-right">
                  <span className="inline-flex items-center gap-1 text-cyan-300">
                    <Gem className="h-3.5 w-3.5 text-cyan-400" />
                    Kristal
                  </span>
                </th>
                <th className="py-3 px-4 text-right">
                  <span className="inline-flex items-center gap-1 text-emerald-300">
                    <Droplets className="h-3.5 w-3.5 text-emerald-400" />
                    Deuterium
                  </span>
                </th>
                <th className="py-3 px-4 text-right">
                  <span className="inline-flex items-center gap-1 text-amber-300">
                    <Zap className="h-3.5 w-3.5 text-amber-400" />
                    Enerji
                  </span>
                </th>
                <th className="py-3 px-4 text-right">Verimlilik / Güç</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-zinc-800/70">
              {/* Category Divider: Temel & Binalar */}
              <tr className="bg-[#0d1624] text-cyan-400 font-bold border-t border-b border-zinc-800">
                <td colSpan={6} className="py-2 px-4 flex items-center gap-2">
                  <Boxes className="w-3.5 h-3.5" />
                  <span>Üretim Binaları ve Tesisler</span>
                </td>
              </tr>

              {matrix.rows
                .filter((r) => r.category === "base" || r.category === "building" || r.category === "unit")
                .map((row) => {
                  const isMetalMine = row.key === "metalMine";
                  const settingKey = settingKeyMap[row.key];
                  const currentPercent = settingKey ? draftSettings[settingKey] : row.percentage;

                  return (
                    <tr
                      key={row.key}
                      id={isMetalMine ? "card-metal-percentage-select" : undefined}
                      className={`transition ${
                        isMetalMine && isHighlighted("metal-percentage-select")
                          ? "bg-cyan-950/60 ring-2 ring-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)] animate-pulse"
                          : row.category === "base"
                          ? "bg-[#090e18]/80 font-semibold"
                          : "hover:bg-[#0f1726]/60"
                      }`}
                    >
                      <td className="py-2.5 px-4 text-zinc-100 font-medium">
                        {row.label}
                        {typeof row.levelOrCount === "number" && (
                          <span className="text-zinc-400 text-[11px] ml-1.5 font-normal">
                            ({row.category === "unit" ? `Adet: ${row.levelOrCount}` : `Kademe ${row.levelOrCount}`}
                            {row.maxCount ? ` / Maks: ${row.maxCount}` : ""})
                          </span>
                        )}
                      </td>
                      <td
                        className={`py-2.5 px-4 text-right ${
                          row.metal > 0 ? "text-emerald-400 font-semibold" : "text-zinc-500"
                        }`}
                      >
                        {row.metal > 0 ? `+${row.metal.toLocaleString("tr-TR")}` : row.metal < 0 ? row.metal.toLocaleString("tr-TR") : "0"}
                      </td>
                      <td
                        className={`py-2.5 px-4 text-right ${
                          row.crystal > 0 ? "text-cyan-400 font-semibold" : "text-zinc-500"
                        }`}
                      >
                        {row.crystal > 0 ? `+${row.crystal.toLocaleString("tr-TR")}` : row.crystal < 0 ? row.crystal.toLocaleString("tr-TR") : "0"}
                      </td>
                      <td
                        className={`py-2.5 px-4 text-right ${
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
                        className={`py-2.5 px-4 text-right ${
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
                      <td className="py-2.5 px-4 text-right">
                        {row.hasSetting && settingKey ? (
                          <select
                            id={isMetalMine ? "metal-percentage-select" : undefined}
                            value={currentPercent}
                            onChange={(e) =>
                              handleSettingChange(settingKey, Number(e.target.value))
                            }
                            className="rounded bg-zinc-950 border border-zinc-700 px-2 py-1 text-xs text-cyan-300 focus:outline-none focus:border-cyan-400"
                          >
                            {(settingKey === "crawlerPercent" && playerClass === "Collector"
                              ? COLLECTOR_CRAWLER_PERCENT_OPTIONS
                              : PERCENT_OPTIONS
                            ).map((pct) => (
                              <option key={pct} value={pct}>
                                %{pct}
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

              {/* Category Divider: Subaylar, Sınıf ve Bonuslar */}
              <tr className="bg-[#0d1624] text-cyan-400 font-bold border-t border-b border-zinc-800">
                <td colSpan={6} className="py-2 px-4 flex items-center gap-2">
                  <Award className="w-3.5 h-3.5" />
                  <span>Subaylar, Sınıf, Araştırma ve Güçlendirici Bonusları</span>
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
                .map((row) => {
                  const isActive =
                    row.officerActive ||
                    (row.levelOrCount && row.levelOrCount > 0) ||
                    row.metal > 0 ||
                    row.crystal > 0 ||
                    row.deuterium > 0 ||
                    row.energy > 0;

                  return (
                    <tr
                      key={row.key}
                      className={`hover:bg-[#0f1726]/60 transition ${
                        !isActive ? "opacity-60" : ""
                      }`}
                    >
                      <td className="py-2 px-4 text-zinc-300 font-medium">
                        <div className="flex items-center gap-2">
                          <span>{row.label}</span>
                          {row.category === "officer" && (
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                                row.officerActive
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                  : "bg-zinc-800 text-zinc-500"
                              }`}
                            >
                              {row.officerActive ? "Aktif" : "Pasif"}
                            </span>
                          )}
                          {row.category === "class" && (
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                                row.levelOrCount && row.levelOrCount > 0
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                  : "bg-zinc-800 text-zinc-500"
                              }`}
                            >
                              {row.levelOrCount && row.levelOrCount > 0 ? "Seçili" : "Seçili Değil"}
                            </span>
                          )}
                          {row.category === "tech" && typeof row.levelOrCount === "number" && (
                            <span className="text-zinc-500 text-[11px]">
                              (Kademe {row.levelOrCount})
                            </span>
                          )}
                        </div>
                      </td>
                      <td
                        className={`py-2 px-4 text-right ${
                          row.metal > 0 ? "text-emerald-400" : "text-zinc-500"
                        }`}
                      >
                        {row.metal > 0 ? `+${row.metal.toLocaleString("tr-TR")}` : "0"}
                      </td>
                      <td
                        className={`py-2 px-4 text-right ${
                          row.crystal > 0 ? "text-cyan-400" : "text-zinc-500"
                        }`}
                      >
                        {row.crystal > 0 ? `+${row.crystal.toLocaleString("tr-TR")}` : "0"}
                      </td>
                      <td
                        className={`py-2 px-4 text-right ${
                          row.deuterium > 0 ? "text-emerald-400" : "text-zinc-500"
                        }`}
                      >
                        {row.deuterium > 0 ? `+${row.deuterium.toLocaleString("tr-TR")}` : "0"}
                      </td>
                      <td
                        className={`py-2 px-4 text-right ${
                          row.energy > 0 ? "text-amber-300" : "text-zinc-500"
                        }`}
                      >
                        {row.energy > 0 ? `+${row.energy.toLocaleString("tr-TR")}` : "0"}
                      </td>
                      <td className="py-2 px-4 text-right text-zinc-500">—</td>
                    </tr>
                  );
                })}

              {/* Category Divider: Depolama Kapasiteleri */}
              <tr className="bg-[#0d1624] text-cyan-400 font-bold border-t border-b border-zinc-800">
                <td colSpan={6} className="py-2 px-4 flex items-center gap-2">
                  <Database className="w-3.5 h-3.5" />
                  <span>Depolama Kapasiteleri ve Korumalı Sığınak</span>
                </td>
              </tr>

              {matrix.rows
                .filter((r) => r.category === "storage")
                .map((row) => (
                  <tr key={row.key} className="bg-[#090e18]/60 hover:bg-[#0f1726]/60 transition">
                    <td className="py-2 px-4 text-zinc-300 font-medium">
                      {row.label}
                      {typeof row.levelOrCount === "number" && (
                        <span className="text-zinc-500 text-[11px] ml-1.5 font-normal">
                          (Kademe {row.levelOrCount})
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-4 text-right text-zinc-200">
                      {row.metal > 0 ? row.metal.toLocaleString("tr-TR") : "—"}
                    </td>
                    <td className="py-2 px-4 text-right text-cyan-300">
                      {row.crystal > 0 ? row.crystal.toLocaleString("tr-TR") : "—"}
                    </td>
                    <td className="py-2 px-4 text-right text-emerald-300">
                      {row.deuterium > 0 ? row.deuterium.toLocaleString("tr-TR") : "—"}
                    </td>
                    <td className="py-2 px-4 text-right text-zinc-500">—</td>
                    <td className="py-2 px-4 text-right text-zinc-500">—</td>
                  </tr>
                ))}
            </tbody>

            {/* Total Summaries (Rows 25 - 28) */}
            <tfoot className="bg-[#0b121e] border-t-2 border-zinc-700 font-bold">
              {/* Row 25: Toplam Saatlik Üretim */}
              <tr className="border-b border-zinc-800">
                <td className="py-3 px-4 text-zinc-100 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  <span>Toplam Saatlik Üretim</span>
                </td>
                <td className="py-3 px-4 text-right text-emerald-400 font-semibold">
                  +{matrix.totals.hourly.metal.toLocaleString("tr-TR")}
                </td>
                <td className="py-3 px-4 text-right text-cyan-400 font-semibold">
                  +{matrix.totals.hourly.crystal.toLocaleString("tr-TR")}
                </td>
                <td
                  className={`py-3 px-4 text-right font-semibold ${
                    matrix.totals.hourly.deuterium >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {matrix.totals.hourly.deuterium >= 0 ? "+" : ""}
                  {matrix.totals.hourly.deuterium.toLocaleString("tr-TR")}
                </td>
                <td
                  className={`py-3 px-4 text-right font-semibold ${
                    matrix.rows.find((r) => r.key === "total_hourly")?.energy ?? 0 >= 0
                      ? "text-amber-300"
                      : "text-rose-400"
                  }`}
                >
                  {matrix.totals.hourly.energy}
                </td>
                <td className="py-3 px-4 text-right text-cyan-300">1 Saat</td>
              </tr>

              {/* Row 26: Toplam Günlük Üretim */}
              <tr className="border-b border-zinc-800 bg-[#090e18]">
                <td className="py-2.5 px-4 text-zinc-300">Toplam Günlük Üretim (x24)</td>
                <td className="py-2.5 px-4 text-right text-emerald-300">
                  +{matrix.totals.daily.metal.toLocaleString("tr-TR")}
                </td>
                <td className="py-2.5 px-4 text-right text-cyan-300">
                  +{matrix.totals.daily.crystal.toLocaleString("tr-TR")}
                </td>
                <td className="py-2.5 px-4 text-right text-emerald-300">
                  +{matrix.totals.daily.deuterium.toLocaleString("tr-TR")}
                </td>
                <td className="py-2.5 px-4 text-right text-zinc-500">—</td>
                <td className="py-2.5 px-4 text-right text-zinc-400">24 Saat</td>
              </tr>

              {/* Row 27: Toplam Haftalık Üretim */}
              <tr className="border-b border-zinc-800 bg-[#070b13]">
                <td className="py-2.5 px-4 text-zinc-300">Toplam Haftalık Üretim (x168)</td>
                <td className="py-2.5 px-4 text-right text-emerald-300">
                  +{matrix.totals.weekly.metal.toLocaleString("tr-TR")}
                </td>
                <td className="py-2.5 px-4 text-right text-cyan-300">
                  +{matrix.totals.weekly.crystal.toLocaleString("tr-TR")}
                </td>
                <td className="py-2.5 px-4 text-right text-emerald-300">
                  +{matrix.totals.weekly.deuterium.toLocaleString("tr-TR")}
                </td>
                <td className="py-2.5 px-4 text-right text-zinc-500">—</td>
                <td className="py-2.5 px-4 text-right text-zinc-400">7 Gün</td>
              </tr>

              {/* Row 28: Net Enerji & Üretim Faktörü Bilançosu */}
              <tr className="bg-[#0d1626] text-zinc-200">
                <td className="py-3 px-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Net Enerji & Üretim Faktörü Bilançosu</span>
                </td>
                <td className="py-3 px-4 text-right text-zinc-400">—</td>
                <td className="py-3 px-4 text-right text-zinc-400">—</td>
                <td className="py-3 px-4 text-right text-zinc-400">—</td>
                <td
                  className={`py-3 px-4 text-right font-bold ${
                    matrix.rows.find((r) => r.key === "production_factor_summary")?.energy ?? 0 >= 0
                      ? "text-amber-300"
                      : "text-rose-400"
                  }`}
                >
                  {matrix.totals.hourly.energy}
                </td>
                <td className="py-3 px-4 text-right">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded text-xs font-bold ${
                      productionFactorPercent >= 100
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : productionFactorPercent >= 50
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                    }`}
                  >
                    %{productionFactorPercent}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Bottom Action Footer (Task 05AV / 05AW) */}
      <div className="flex items-center justify-between flex-wrap gap-3 p-4 rounded-xl border border-zinc-800 bg-[#0d1420]/80">
        <div className="text-xs font-mono text-zinc-400 flex items-center gap-2">
          {isDirty ? (
            <span className="flex items-center gap-1.5 text-amber-300 font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>Kaydedilmemiş değişiklikler var</span>
            </span>
          ) : (
            <span className="text-zinc-500">Tüm üretim faktörleri güncel</span>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {isDirty && (
            <button
              type="button"
              onClick={handleResetDraft}
              disabled={isSaving}
              className="px-3.5 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5 text-zinc-400" />
              <span>Vazgeç</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleRecalculate}
            disabled={isSaving}
            className={`px-5 py-2 rounded-lg font-mono font-bold text-xs flex items-center gap-2 transition cursor-pointer disabled:opacity-50 ${
              isDirty
                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_20px_rgba(52,211,153,0.4)] animate-pulse"
                : "bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_15px_rgba(34,211,238,0.3)]"
            }`}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSaving ? "animate-spin" : ""}`} />
            <span>
              {isSaving
                ? "Kaydediliyor..."
                : isDirty
                ? "Hesapla & Değişiklikleri Kaydet"
                : "Tekrar hesapla"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ResourceSettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-12 text-xs font-mono text-cyan-400">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 animate-spin" />
            <span>Kaynak Ayarları Yükleniyor...</span>
          </div>
        </div>
      }
    >
      <ResourceSettingsContent />
    </Suspense>
  );
}
