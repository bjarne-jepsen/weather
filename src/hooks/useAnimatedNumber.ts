import { useEffect, useRef, useState } from "react";

/**
 * Smoothly interpolates numeric weather readouts with an exponential ease-out
 * curve when switching cities or toggling °C/°F.
 */
export function useAnimatedNumber(target: number, duration = 480): number {
  const [value, setValue] = useState(target);
  const previousRef = useRef(target);

  useEffect(() => {
    const start = previousRef.current;
    const diff = target - start;
    if (Math.abs(diff) < 0.01) {
      previousRef.current = target;
      setValue(target);
      return;
    }

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      previousRef.current = target;
      setValue(target);
      return;
    }

    let rafId = 0;
    const startTime = performance.now();

    const step = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      // Expo ease-out for crisp, snappy instrument feel
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      const current = start + diff * eased;
      setValue(current);
      if (t < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        previousRef.current = target;
      }
    };

    rafId = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(rafId);
      previousRef.current = target;
    };
  }, [target, duration]);

  return value;
}
