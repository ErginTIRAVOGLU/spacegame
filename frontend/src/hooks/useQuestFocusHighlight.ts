"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";

export interface UseQuestFocusHighlightOptions {
  paramName?: string;
  durationMs?: number;
  onFocusFound?: (key: string) => void;
  cleanUrlParam?: boolean;
}

export function useQuestFocusHighlight({
  paramName = "focus",
  durationMs = 4000,
  onFocusFound,
  cleanUrlParam = true,
}: UseQuestFocusHighlightOptions = {}) {
  const searchParams = useSearchParams();
  const rawFocus = searchParams.get(paramName);
  const [highlightedKey, setHighlightedKey] = useState<string | null>(null);

  const clearHighlight = () => {
    setHighlightedKey(null);
  };

  const onFocusFoundRef = useRef(onFocusFound);
  useEffect(() => {
    onFocusFoundRef.current = onFocusFound;
  }, [onFocusFound]);

  const handledFocusRef = useRef<string | null>(null);

  // Task 05AO: Dismiss highlight when user clicks anywhere (another card or empty space)
  useEffect(() => {
    if (!highlightedKey) return;

    const handleDismissClick = () => {
      setHighlightedKey(null);
    };

    const attachTimer = setTimeout(() => {
      window.addEventListener("click", handleDismissClick, { capture: true });
      window.addEventListener("pointerdown", handleDismissClick, { capture: true });
    }, 100);

    return () => {
      clearTimeout(attachTimer);
      window.removeEventListener("click", handleDismissClick, { capture: true });
      window.removeEventListener("pointerdown", handleDismissClick, { capture: true });
    };
  }, [highlightedKey]);

  useEffect(() => {
    if (!rawFocus) {
      handledFocusRef.current = null;
      return;
    }

    const cleanFocus = rawFocus.toLowerCase().trim();
    if (handledFocusRef.current === cleanFocus) {
      return;
    }
    handledFocusRef.current = cleanFocus;

    setHighlightedKey(cleanFocus);
    onFocusFoundRef.current?.(rawFocus);

    // Attempt to locate and scroll to element
    const timer = setTimeout(() => {
      // Possible ID patterns: `card-${rawFocus}`, `card-${cleanFocus}`, `item-${rawFocus}`, `item-${cleanFocus}`, or exact rawFocus
      const cleanNoHyphen = cleanFocus.replace(/-/g, "");
      const candidates = [
        document.getElementById(`card-${rawFocus}`),
        document.getElementById(`card-${cleanFocus}`),
        document.getElementById(`card-${cleanNoHyphen}`),
        document.getElementById(`item-${rawFocus}`),
        document.getElementById(`item-${cleanFocus}`),
        document.getElementById(rawFocus),
        document.getElementById(cleanFocus),
        document.querySelector(`[data-tech-id="${cleanFocus}"]`),
        document.querySelector(`[data-tech-key="${cleanFocus}"]`),
        document.querySelector(`[data-tech-key="${cleanNoHyphen}"]`),
      ];

      const el = candidates.find((c) => c !== null);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      // Task 05AN: Clean up focus query parameter from URL without reloading
      if (cleanUrlParam && typeof window !== "undefined") {
        try {
          const url = new URL(window.location.href);
          if (url.searchParams.has(paramName)) {
            url.searchParams.delete(paramName);
            const newUrl =
              url.pathname + (url.search ? url.search : "") + (url.hash ? url.hash : "");
            window.history.replaceState(window.history.state, "", newUrl);
          }
        } catch {
          // Ignore URL parsing fallback
        }
      }
    }, 150);

    // Remove ring highlight after durationMs
    const clearTimer = setTimeout(() => {
      setHighlightedKey(null);
    }, durationMs);

    return () => {
      clearTimeout(timer);
      clearTimeout(clearTimer);
    };
  }, [rawFocus, paramName, durationMs, cleanUrlParam]);

  const isHighlighted = (key: string | number) => {
    if (!highlightedKey) return false;
    const str = String(key).toLowerCase().trim();
    return (
      str === highlightedKey ||
      str.replace(/-/g, "") === highlightedKey.replace(/-/g, "") ||
      str.replace(/_/g, "") === highlightedKey.replace(/_/g, "")
    );
  };

  return {
    rawFocus,
    highlightedKey,
    isHighlighted,
    clearHighlight,
    highlightClass: "ring-2 ring-amber-400 animate-pulse shadow-[0_0_20px_rgba(251,191,36,0.5)]",
  };
}

