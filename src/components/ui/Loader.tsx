'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useProgress } from '@react-three/drei';
import { useStore } from '@/lib/store';

export default function Loader() {
  const { progress: real, active } = useProgress();
  const loaded = useStore((s) => s.loaded);
  const setLoaded = useStore((s) => s.setLoaded);
  const setProgress = useStore((s) => s.setProgress);
  const [display, setDisplay] = useState(0);

  // Deterministic luxe ramp, blended with any real asset progress.
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const faux = Math.min(100, ((t - start) / 1500) * 100);
      const value = Math.max(faux, real);
      setDisplay(value);
      setProgress(value / 100);
      if (value >= 100 && !active) {
        setLoaded(true);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [real, active, setLoaded, setProgress]);

  return (
    <AnimatePresence>
      {!loaded && (
        <motion.div
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-ink"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className="font-display text-2xl tracking-wide2 text-platinum-bright">ROLEX</p>
          <div className="mt-8 h-px w-48 overflow-hidden bg-white/10">
            <div
              className="h-full bg-ice transition-[width] duration-150 ease-out"
              style={{ width: `${display}%` }}
            />
          </div>
          <p className="mt-4 font-mono text-[10px] tracking-wide2 text-platinum-dim">
            {Math.round(display)}%
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
