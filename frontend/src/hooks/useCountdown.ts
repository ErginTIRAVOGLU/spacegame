"use client";

import { useEffect, useRef, useState } from "react";

export interface UseCountdownOptions {
  referenceUtc?: string;
  onComplete?: () => void;
  playSoundOnComplete?: boolean;
}

export interface CountdownResult {
  remainingSeconds: number;
  formattedClock: string;
  formattedTr: string;
  progressPercent: number;
}

function playSciFiCompletionChime() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.18); // A5

    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Audio playback blocked by browser autoplay policy; ignore silently
  }
}

export function formatCountdownClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  return [hrs, mins, secs].map((v) => String(v).padStart(2, "0")).join(":");
}

export function formatCountdownTurkish(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;

  if (hrs > 0) {
    return `${hrs}sa ${mins}dk ${secs}sn`;
  }
  if (mins > 0) {
    return `${mins}dk ${secs}sn`;
  }
  return `${secs}sn`;
}

export function useCountdown(
  targetUtc: string | null | undefined,
  startUtc?: string | null,
  options?: UseCountdownOptions
): CountdownResult {
  const [nowMs, setNowMs] = useState<number | null>(null);
  const lastTriggeredTargetRef = useRef<string | null>(null);
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const onCompleteRef = useRef(options?.onComplete);
  onCompleteRef.current = options?.onComplete;

  useEffect(() => {
    // Reset completed target reference when target changes or is cleared
    if (targetUtc !== lastTriggeredTargetRef.current) {
      lastTriggeredTargetRef.current = null;
      retryCountRef.current = 0;
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    }
  }, [targetUtc]);

  useEffect(() => {
    if (!targetUtc) return;

    setNowMs(Date.now());
    const id = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => clearInterval(id);
  }, [targetUtc]);

  const fallbackNowMs = options?.referenceUtc
    ? new Date(options.referenceUtc).getTime()
    : targetUtc
    ? new Date(targetUtc).getTime()
    : 0;

  const effectiveNowMs = nowMs ?? fallbackNowMs;
  const targetMs = targetUtc ? new Date(targetUtc).getTime() : 0;
  const remainingSeconds = targetUtc
    ? Math.max(0, Math.floor((targetMs - effectiveNowMs) / 1000))
    : 0;

  useEffect(() => {
    if (!targetUtc || nowMs === null) return;

    if (remainingSeconds <= 0) {
      // First trigger for this targetUtc
      if (lastTriggeredTargetRef.current !== targetUtc) {
        lastTriggeredTargetRef.current = targetUtc;
        retryCountRef.current = 0;
        if (options?.playSoundOnComplete !== false) {
          playSciFiCompletionChime();
        }
        onCompleteRef.current?.();
      }

      // If targetUtc is still present after firing (e.g. server delay, clock skew),
      // retry onComplete periodically until the queue clears in bootstrap (max 5 retries, every 2s)
      if (!retryTimerRef.current && retryCountRef.current < 5) {
        retryTimerRef.current = setTimeout(() => {
          retryTimerRef.current = null;
          if (remainingSeconds <= 0 && targetUtc && retryCountRef.current < 5) {
            retryCountRef.current += 1;
            onCompleteRef.current?.();
          }
        }, 2000);
      }
    }

    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, [targetUtc, nowMs, remainingSeconds, options?.playSoundOnComplete]);

  if (!targetUtc) {
    return {
      remainingSeconds: 0,
      formattedClock: "00:00:00",
      formattedTr: "0sn",
      progressPercent: 0,
    };
  }

  let progressPercent = 0;
  if (startUtc) {
    const startMs = new Date(startUtc).getTime();
    const totalSpan = Math.max(1000, targetMs - startMs);
    const elapsed = Math.max(0, effectiveNowMs - startMs);
    progressPercent = Math.min(
      100,
      Math.max(0, Math.round((elapsed / totalSpan) * 100))
    );
  }

  return {
    remainingSeconds,
    formattedClock: formatCountdownClock(remainingSeconds),
    formattedTr: formatCountdownTurkish(remainingSeconds),
    progressPercent,
  };
}
