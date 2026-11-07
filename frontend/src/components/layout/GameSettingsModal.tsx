"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "@/store/useGameStore";
import {
  isBrowserNotificationSupported,
  getBrowserNotificationPermission,
  requestBrowserNotificationPermission,
  sendBrowserPushNotification,
} from "@/lib/pushNotifications";
import {
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  Sliders,
  X,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Send,
  Sparkles,
} from "lucide-react";

export function GameSettingsModal() {
  const isSettingsOpen = useGameStore((s) => s.isSettingsOpen);
  const setIsSettingsOpen = useGameStore((s) => s.setIsSettingsOpen);
  const settings = useGameStore((s) => s.settings);
  const updateSettings = useGameStore((s) => s.updateSettings);

  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(true);
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    setIsSupported(isBrowserNotificationSupported());
    setPermission(getBrowserNotificationPermission());
  }, [isSettingsOpen]);

  if (!isSettingsOpen) return null;

  const handleTogglePush = async () => {
    if (!settings.browserPushEnabled) {
      // Trying to enable
      if (permission !== "granted") {
        const res = await requestBrowserNotificationPermission();
        setPermission(res);
        if (res === "granted") {
          updateSettings({ browserPushEnabled: true });
        } else {
          updateSettings({ browserPushEnabled: false });
        }
      } else {
        updateSettings({ browserPushEnabled: true });
      }
    } else {
      // Disabling
      updateSettings({ browserPushEnabled: false });
    }
  };

  const handleSendTestNotification = async () => {
    if (permission !== "granted") {
      const res = await requestBrowserNotificationPermission();
      setPermission(res);
      if (res !== "granted") return;
    }

    sendBrowserPushNotification("OGame Regulus — Test Bildirimi", {
      body: "Masaüstü bildirimleri sorunsuz çalışıyor! İnşaat ve araştırmalarınız bittiğinde anında haberdar olacaksınız.",
      tag: "test-notification",
    });

    setTestSent(true);
    setTimeout(() => setTestSent(false), 4000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in"
    >
      <div className="relative w-full max-w-lg rounded-xl border border-cyan-500/40 bg-gradient-to-b from-[#0f1726] via-[#0b1018] to-[#06090e] shadow-[0_0_35px_rgba(6,182,212,0.25)] overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-[#121c2c]">
          <div className="flex items-center gap-2.5">
            <Sliders className="h-5 w-5 text-cyan-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-100">
              Oyun & Bildirim Ayarları
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

        {/* Content Body */}
        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Section 1: Browser Push Notifications */}
          <div className="rounded-lg border border-cyan-500/30 bg-[#09111b]/80 p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 shrink-0 mt-0.5">
                  <BellRing className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-100 uppercase tracking-wide">
                      Masaüstü / Tarayıcı Bildirimleri
                    </span>
                    {/* Status badge */}
                    {permission === "granted" ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                        <CheckCircle2 className="h-2.5 w-2.5" /> İzin Verildi
                      </span>
                    ) : permission === "denied" ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                        <AlertCircle className="h-2.5 w-2.5" /> Engellendi
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        İzin Gerekli
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-snug">
                    Bina, tersane veya araştırmalar tamamlandığında, tarayıcınız
                    küçültülmüş veya başka bir sekmede olsanız bile masaüstünüze anlık
                    bildirim gönderir.
                  </p>
                </div>
              </div>

              {/* Toggle switch */}
              <button
                type="button"
                onClick={handleTogglePush}
                disabled={!isSupported}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.browserPushEnabled && permission === "granted"
                    ? "bg-cyan-500"
                    : "bg-zinc-800"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.browserPushEnabled && permission === "granted"
                      ? "translate-x-5"
                      : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Warning if blocked in browser */}
            {permission === "denied" && (
              <div className="p-2.5 rounded bg-rose-950/40 border border-rose-500/30 text-[11px] text-rose-300 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                <span>
                  Tarayıcınız bu site için bildirimleri engellemiş. Adres
                  çubuğundaki <strong>Kilit (Site Bilgileri)</strong> simgesine
                  tıklayıp Bildirimler iznini <strong>İzin Ver</strong> olarak
                  değiştiriniz.
                </span>
              </div>
            )}

            {/* Test notification button */}
            <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60">
              <span className="text-[11px] text-zinc-400">
                Bildirimlerin çalıştığını doğrulamak için:
              </span>
              <button
                type="button"
                onClick={handleSendTestNotification}
                className="px-2.5 py-1 rounded bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 text-[11px] font-mono font-semibold text-cyan-300 flex items-center gap-1.5 transition cursor-pointer"
              >
                <Send className="h-3 w-3" />
                <span>{testSent ? "Gönderildi!" : "Test Bildirimi Gönder"}</span>
              </button>
            </div>
          </div>

          {/* Section 2: In-Game Toast Notifications */}
          <div className="rounded-lg border border-zinc-800/90 bg-[#090d14]/90 p-4 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-700/60 text-zinc-300 shrink-0 mt-0.5">
                <Bell className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-zinc-100 uppercase tracking-wide">
                  Oyun İçi Sağ Alt Bildirimler (Toast)
                </span>
                <p className="text-[11px] text-zinc-400 leading-snug">
                  İşlemler tamamlandığında sağ alt köşede 5 saniyelik görsel kart
                  bildirimi gösterir.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                updateSettings({
                  inGameToastsEnabled: !settings.inGameToastsEnabled,
                })
              }
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.inGameToastsEnabled ? "bg-cyan-500" : "bg-zinc-800"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings.inGameToastsEnabled
                    ? "translate-x-5"
                    : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Section 3: Sound Effects */}
          <div className="rounded-lg border border-zinc-800/90 bg-[#090d14]/90 p-4 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-700/60 text-zinc-300 shrink-0 mt-0.5">
                {settings.soundEnabled ? (
                  <Volume2 className="h-5 w-5 text-amber-400" />
                ) : (
                  <VolumeX className="h-5 w-5 text-zinc-500" />
                )}
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-zinc-100 uppercase tracking-wide">
                  Ses Efektleri
                </span>
                <p className="text-[11px] text-zinc-400 leading-snug">
                  İnşaat veya araştırma bittiğinde bilimkurgu onay melodisi çalar.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                updateSettings({ soundEnabled: !settings.soundEnabled })
              }
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.soundEnabled ? "bg-amber-500" : "bg-zinc-800"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings.soundEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-800 bg-[#0c121b]">
          <div className="text-[10px] font-mono text-zinc-500 flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Ayarlar otomatik olarak tarayıcınıza kaydedilir.</span>
          </div>

          <button
            type="button"
            onClick={() => setIsSettingsOpen(false)}
            className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 border border-cyan-400/50 text-xs font-bold text-white shadow transition cursor-pointer"
          >
            Tamam
          </button>
        </div>
      </div>
    </div>
  );
}

