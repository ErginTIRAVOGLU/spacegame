/**
 * SettingsModal.tsx
 *
 * Full Game Settings modal covering:
 * - Genel: Casusluk sondası sayısı (1 - 10)
 * - Durum: Tatil Modu (Vacation Mode) with 48h lock & active queue check
 * - Ekran: Gezegen listesi sıralama ölçütü (Oluşum Sırası, Koordinat, Alfabetik, Alan Büyüklüğü)
 * - Bildirim & Ses: Browser push notifications & sound settings
 */

'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import {
  Sliders,
  X,
  Eye,
  Palmtree,
  LayoutGrid,
  Bell,
  Volume2,
  VolumeX,
  AlertTriangle,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export function SettingsModal() {
  const isSettingsOpen = useGameStore((s) => s.isSettingsOpen);
  const setIsSettingsOpen = useGameStore((s) => s.setIsSettingsOpen);
  const settings = useGameStore((s) => s.settings);
  const updateSettings = useGameStore((s) => s.updateSettings);
  const planets = useGameStore((s) => s.planets);
  const activeResearchQueue = useGameStore((s) => s.activeResearchQueue);
  const incomingFleets = useGameStore((s) => s.incomingFleets);

  const [activeTab, setActiveTab] = useState<'general' | 'status' | 'display' | 'audio'>('general');
  const [vacationError, setVacationError] = useState<string | null>(null);
  const [vacationSuccess, setVacationSuccess] = useState<string | null>(null);

  if (!isSettingsOpen) return null;

  // Check whether Vacation Mode can be toggled on
  const handleToggleVacation = () => {
    if (settings.isVacationMode) {
      // Check 48h lock
      if (settings.vacationUntilUtc) {
        const untilMs = new Date(settings.vacationUntilUtc).getTime();
        if (Date.now() < untilMs) {
          const remainingHours = Math.ceil((untilMs - Date.now()) / (1000 * 60 * 60));
          setVacationError(`Tatil modu en az 48 saat kilitlidir. Kalan süre: ${remainingHours} saat.`);
          setTimeout(() => setVacationError(null), 4000);
          return;
        }
      }
      updateSettings({ isVacationMode: false, vacationUntilUtc: null });
      setVacationSuccess('Tatil modu başarıyla devre dışı bırakıldı.');
      setTimeout(() => setVacationSuccess(null), 3000);
      return;
    }

    // Check for active queues or fleet movements
    const hasActiveBuilding = planets.some((p) => p.activeBuildingQueue);
    const hasActiveShipyard = planets.some((p) => p.shipyardQueue && p.shipyardQueue.length > 0);
    const hasActiveResearch = Boolean(activeResearchQueue);
    const hasActiveFleets = incomingFleets.length > 0;

    if (hasActiveBuilding || hasActiveShipyard || hasActiveResearch || hasActiveFleets) {
      setVacationError(
        'Tatil moduna geçilemez: Aktif inşaat, araştırma, tersane üretimi veya hareket halinde filonuz bulunmamalıdır.'
      );
      setTimeout(() => setVacationError(null), 5000);
      return;
    }

    const lockUntil = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    updateSettings({ isVacationMode: true, vacationUntilUtc: lockUntil });
    setVacationSuccess('Tatil modu etkinleştirildi! Hesabınız 48 saat kilitlendi ve maden üretimi durduruldu.');
    setTimeout(() => setVacationSuccess(null), 4000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in"
    >
      <div className="relative w-full max-w-xl rounded-xl border border-cyan-500/40 bg-gradient-to-b from-[#0f1726] via-[#0b1018] to-[#06090e] shadow-[0_0_35px_rgba(6,182,212,0.25)] overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-[#121c2c] shrink-0">
          <div className="flex items-center gap-2.5">
            <Sliders className="h-5 w-5 text-cyan-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-100">
              Oyun & Sistem Ayarları
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setIsSettingsOpen(false)}
            aria-label="Kapat"
            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center border-b border-zinc-800 bg-[#090d14] px-5 pt-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'general'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Genel</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('status')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'status'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Palmtree className="h-3.5 w-3.5" />
            <span>Durum (Tatil)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('display')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'display'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Ekran</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audio')}
            className={`px-3 py-2 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'audio'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Bell className="h-3.5 w-3.5" />
            <span>Bildirimler</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* 1. Genel Sekmesi */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-zinc-800 bg-[#0d131e]/90 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-zinc-100 flex items-center gap-2">
                      <Eye className="h-4 w-4 text-cyan-400" />
                      <span>Casusluk Sondası Sayısı</span>
                    </h3>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Galaksi ekranında tek tıkla casusluk yaparken veya sistem casusluğunda hedef başına gönderilecek sonda sayısı.
                    </p>
                  </div>
                  <span className="text-lg font-mono font-bold text-cyan-300 px-3 py-1 bg-zinc-950 border border-zinc-700 rounded-lg">
                    {settings.spyProbeCount ?? 1}
                  </span>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={settings.spyProbeCount ?? 1}
                    onChange={(e) => updateSettings({ spyProbeCount: Number(e.target.value) })}
                    className="flex-1 accent-cyan-400 cursor-pointer"
                  />
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 5, 10].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => updateSettings({ spyProbeCount: count })}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono border transition ${
                          (settings.spyProbeCount ?? 1) === count
                            ? 'bg-cyan-500 text-zinc-950 font-bold border-cyan-400'
                            : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. Durum / Tatil Modu Sekmesi */}
          {activeTab === 'status' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-zinc-800 bg-[#0d131e]/90 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Palmtree className="h-5 w-5 text-amber-400" />
                    <div>
                      <h3 className="font-bold text-zinc-100">Tatil Modu (Vacation Mode)</h3>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Hesabınızı saldırılara karşı korur. En az 48 saat kilitlenir ve maden üretimi durdurulur.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleVacation}
                    className={`px-4 py-2 rounded-lg font-bold text-xs border transition flex items-center gap-1.5 ${
                      settings.isVacationMode
                        ? 'bg-amber-600 hover:bg-amber-500 text-zinc-950 border-amber-400'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-600'
                    }`}
                  >
                    {settings.isVacationMode ? <Lock className="h-3.5 w-3.5" /> : null}
                    <span>{settings.isVacationMode ? 'Tatili Kapat' : 'Tatil Moduna Geç'}</span>
                  </button>
                </div>

                {settings.isVacationMode && settings.vacationUntilUtc && (
                  <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-lg text-amber-200 text-xs">
                    Tatil modu aktif. Kilit bitiş zamanı: {new Date(settings.vacationUntilUtc).toLocaleString()}
                  </div>
                )}

                {vacationError && (
                  <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-lg text-rose-200 text-xs flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
                    <span>{vacationError}</span>
                  </div>
                )}

                {vacationSuccess && (
                  <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-lg text-emerald-200 text-xs flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                    <span>{vacationSuccess}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. Ekran Sekmesi */}
          {activeTab === 'display' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-zinc-800 bg-[#0d131e]/90 space-y-3">
                <div>
                  <h3 className="font-bold text-zinc-100 flex items-center gap-2">
                    <LayoutGrid className="h-4 w-4 text-cyan-400" />
                    <span>Gezegen Listesi Sıralama Ölçütü</span>
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Sağ paneldeki sömürge listesinin nasıl listeleneceğini belirler.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  {[
                    { key: 'order', label: 'Oluşum Sırası (Varsayılan)' },
                    { key: 'coords', label: 'Koordinat [G:S:P]' },
                    { key: 'alphabetical', label: 'Alfabetik (İsim)' },
                    { key: 'fields', label: 'Alan Büyüklüğü (Fields)' },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => updateSettings({ planetSorting: opt.key as any })}
                      className={`p-2.5 rounded-lg border text-left text-xs font-semibold transition ${
                        settings.planetSorting === opt.key
                          ? 'bg-cyan-950/60 border-cyan-400 text-cyan-300'
                          : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 4. Bildirim & Ses Sekmesi */}
          {activeTab === 'audio' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-zinc-800 bg-[#0d131e]/90 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-zinc-100 flex items-center gap-2">
                      <Volume2 className="h-4 w-4 text-cyan-400" />
                      <span>Ses Efektleri</span>
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Savaş alarmı, filo varışları ve inşaat tamamlanma sesleri.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.soundEnabled}
                    onChange={(e) => updateSettings({ soundEnabled: e.target.checked })}
                    className="h-4 w-4 accent-cyan-400 rounded cursor-pointer"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl border border-zinc-800 bg-[#0d131e]/90 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-zinc-100 flex items-center gap-2">
                      <Bell className="h-4 w-4 text-cyan-400" />
                      <span>Masaüstü Push Bildirimleri</span>
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Sekme arka plandayken gelen saldırı ve inşaat bitiş alarmları.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.browserPushEnabled}
                    onChange={(e) => updateSettings({ browserPushEnabled: e.target.checked })}
                    className="h-4 w-4 accent-cyan-400 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

