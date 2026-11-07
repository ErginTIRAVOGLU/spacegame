"use client";

import { useEffect, useState } from "react";
import { useGameStore, type GameToastNotification } from "@/store/useGameStore";
import {
  Hammer,
  Rocket,
  FlaskConical,
  Dna,
  ShieldAlert,
  Shield,
  X,
  CheckCircle2,
} from "lucide-react";

interface ToastItemProps {
  toast: GameToastNotification;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    // Smooth progress bar animation over 5000ms
    const interval = 50; // update every 50ms
    const step = (interval / 5000) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= step) {
          clearInterval(timer);
          return 0;
        }
        return prev - step;
      });
    }, interval);

    // Auto-dismiss after 5000ms
    const dismissTimer = setTimeout(() => {
      onDismiss(toast.id);
    }, 5000);

    return () => {
      clearInterval(timer);
      clearTimeout(dismissTimer);
    };
  }, [toast.id, onDismiss]);

  const styleConfig = (() => {
    switch (toast.type) {
      case "building":
        return {
          icon: <Hammer className="h-4 w-4 text-cyan-400 animate-pulse" />,
          borderColor: "border-cyan-500/60",
          glowColor: "shadow-[0_0_20px_rgba(6,182,212,0.3)]",
          barColor: "bg-cyan-400",
          badgeBg: "bg-cyan-950/80 text-cyan-300 border-cyan-500/40",
          titleColor: "text-cyan-200",
        };
      case "shipyard":
        return {
          icon: <Rocket className="h-4 w-4 text-amber-400 animate-pulse" />,
          borderColor: "border-amber-500/60",
          glowColor: "shadow-[0_0_20px_rgba(245,158,11,0.3)]",
          barColor: "bg-amber-400",
          badgeBg: "bg-amber-950/80 text-amber-300 border-amber-500/40",
          titleColor: "text-amber-200",
        };
      case "defense":
        return {
          icon: <Shield className="h-4 w-4 text-sky-400 animate-pulse" />,
          borderColor: "border-sky-500/60",
          glowColor: "shadow-[0_0_20px_rgba(14,165,233,0.3)]",
          barColor: "bg-sky-400",
          badgeBg: "bg-sky-950/80 text-sky-300 border-sky-500/40",
          titleColor: "text-sky-200",
        };
      case "research":
        return {
          icon: <FlaskConical className="h-4 w-4 text-purple-400 animate-pulse" />,
          borderColor: "border-purple-500/60",
          glowColor: "shadow-[0_0_20px_rgba(168,85,247,0.3)]",
          barColor: "bg-purple-400",
          badgeBg: "bg-purple-950/80 text-purple-300 border-purple-500/40",
          titleColor: "text-purple-200",
        };
      case "lifeform":
        return {
          icon: <Dna className="h-4 w-4 text-emerald-400 animate-pulse" />,
          borderColor: "border-emerald-500/60",
          glowColor: "shadow-[0_0_20px_rgba(16,185,129,0.3)]",
          barColor: "bg-emerald-400",
          badgeBg: "bg-emerald-950/80 text-emerald-300 border-emerald-500/40",
          titleColor: "text-emerald-200",
        };
      case "fleet":
        return {
          icon: <ShieldAlert className="h-4 w-4 text-rose-400 animate-pulse" />,
          borderColor: "border-rose-500/60",
          glowColor: "shadow-[0_0_20px_rgba(244,63,94,0.3)]",
          barColor: "bg-rose-400",
          badgeBg: "bg-rose-950/80 text-rose-300 border-rose-500/40",
          titleColor: "text-rose-200",
        };
      default:
        return {
          icon: <CheckCircle2 className="h-4 w-4 text-cyan-400" />,
          borderColor: "border-cyan-500/50",
          glowColor: "shadow-[0_0_15px_rgba(6,182,212,0.25)]",
          barColor: "bg-cyan-400",
          badgeBg: "bg-zinc-800 text-zinc-300 border-zinc-700",
          titleColor: "text-zinc-100",
        };
    }
  })();

  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-auto relative w-full overflow-hidden rounded-lg border bg-[#0b111a]/95 backdrop-blur-md p-3.5 ${styleConfig.borderColor} ${styleConfig.glowColor} transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-3`}
    >
      {/* Header row: Icon + Title + Planet badge + Close Button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="shrink-0">{styleConfig.icon}</div>
          <span
            className={`text-xs font-bold uppercase tracking-wider truncate ${styleConfig.titleColor}`}
          >
            {toast.title}
          </span>
          {toast.planetName && (
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded border shrink-0 truncate max-w-[120px] ${styleConfig.badgeBg}`}
            >
              {toast.planetName}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          aria-label="Bildirimi kapat"
          className="shrink-0 p-1 rounded hover:bg-white/10 text-zinc-400 hover:text-zinc-100 transition"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Message body */}
      <p className="mt-1.5 text-xs text-zinc-300 leading-snug">
        {toast.message}
      </p>

      {/* 5-second countdown progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-900/80 overflow-hidden">
        <div
          className={`h-full ${styleConfig.barColor} transition-all duration-75 ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export function ToastNotificationCenter() {
  const toasts = useGameStore((s) => s.toasts);
  const removeToast = useGameStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Oyun Bildirimleri"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
      ))}
    </div>
  );
}

