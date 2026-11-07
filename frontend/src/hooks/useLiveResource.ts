"use client";

import { useEffect, useState } from "react";

export interface UseLiveResourceProps {
  currentAmount: number;
  hourlyRate: number;
  serverTimeUtc: string | number | Date;
}

/**
 * Interpolates resource production locally using requestAnimationFrame
 * without polling the backend:
 * LiveAmount = currentAmount + (hourlyRate / 3600) * ((now - serverTimeUtc) / 1000)
 */
export function useLiveResource({
  currentAmount,
  hourlyRate,
  serverTimeUtc,
}: UseLiveResourceProps): number {
  const [liveValue, setLiveValue] = useState<number>(currentAmount);

  useEffect(() => {
    const baseTimestampMs =
      typeof serverTimeUtc === "number"
        ? serverTimeUtc
        : new Date(serverTimeUtc).getTime();

    const originPerformanceNow = performance.now();
    const initialDriftMs = Math.max(0, Date.now() - baseTimestampMs);

    let animationFrameId: number;

    const tick = (nowPerformance: number) => {
      const elapsedSinceMountMs = Math.max(0, nowPerformance - originPerformanceNow);
      const totalElapsedSeconds = (initialDriftMs + elapsedSinceMountMs) / 1000.0;
      const produced = (hourlyRate / 3600.0) * totalElapsedSeconds;

      setLiveValue(Math.floor(currentAmount + produced));
      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [currentAmount, hourlyRate, serverTimeUtc]);

  return liveValue;
}

