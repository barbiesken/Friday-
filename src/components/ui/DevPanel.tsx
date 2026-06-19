'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '@/lib/store';
import { SECTIONS } from '@/lib/constants';

function Row({ k, v }: { k: string; v: string | number }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <span className="text-platinum-dim">{k}</span>
      <span className="text-ice-bright">{v}</span>
    </div>
  );
}

export default function DevPanel() {
  const devPanel = useStore((s) => s.devPanel);
  const fps = useStore((s) => s.fps);
  const dpr = useStore((s) => s.dpr);
  const drawcalls = useStore((s) => s.drawcalls);
  const webgpu = useStore((s) => s.webgpu);
  const section = useStore((s) => s.section);
  const scroll = useStore((s) => s.scroll);
  const explodeMode = useStore((s) => s.explodeMode);
  const perfMode = useStore((s) => s.perfMode);
  const watchmaker = useStore((s) => s.watchmaker);

  const togglePerf = useStore((s) => s.togglePerf);
  const cycleExplode = useStore((s) => s.cycleExplode);
  const requestScreenshot = useStore((s) => s.requestScreenshot);

  return (
    <AnimatePresence>
      {devPanel && (
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          className="fixed bottom-6 left-6 z-50 w-60 rounded-xl border border-white/10 bg-ink-800/90 p-4 font-mono text-[11px] backdrop-blur"
        >
          <p className="mb-3 text-[10px] uppercase tracking-wide2 text-platinum">Developer Panel</p>
          <div className="space-y-1.5">
            <Row k="fps" v={fps} />
            <Row k="dpr" v={dpr} />
            <Row k="drawcalls" v={drawcalls} />
            <Row k="webgpu" v={webgpu ? 'available' : 'no'} />
            <Row k="section" v={`${section + 1} · ${SECTIONS[section]?.kicker ?? ''}`} />
            <Row k="scroll" v={scroll.toFixed(3)} />
            <Row k="explode" v={explodeMode} />
            <Row k="perf" v={perfMode ? 'on' : 'off'} />
            <Row k="watchmaker" v={watchmaker ? 'on' : 'off'} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={togglePerf} className="dev-btn">
              perf
            </button>
            <button onClick={cycleExplode} className="dev-btn">
              explode
            </button>
            <button onClick={requestScreenshot} className="dev-btn">
              shot
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
