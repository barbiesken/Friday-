import { useEffect, useRef } from "react";
import { useFriday } from "../core/store";

/**
 * A live voice waveform — center of the top status cluster. Driven directly from
 * the store's audio level via rAF (no React re-render at 60fps).
 */
export function WaveBars({ count = 30 }: { count?: number }) {
  const wrap = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    let tt = 0;
    const loop = () => {
      tt += 0.05;
      const { audioLevel, state } = useFriday.getState();
      const live = state === "listening" || state === "speaking";
      const base = live ? audioLevel : 0.05;
      const bars = wrap.current?.children;
      if (bars) {
        for (let i = 0; i < bars.length; i++) {
          const el = bars[i] as HTMLElement;
          const mid = 1 - Math.abs(i / (count - 1) - 0.5) * 2; // taller in the middle
          const env = Math.sin(tt * 2.2 + i * 0.55) * 0.5 + 0.5;
          const h = 2 + (base * 0.9 + 0.1) * 24 * (0.35 + env * 0.9) * (0.4 + mid);
          el.style.height = `${Math.max(2, Math.min(26, h))}px`;
        }
      }
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [count]);

  return (
    <div ref={wrap} className="wave">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} />
      ))}
    </div>
  );
}
