'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '@/lib/store';
import { SECTIONS } from '@/lib/constants';

function SceneTint() {
  const section = useStore((s) => s.section);
  // Color grade per chapter — ice dial, underwater, night sky.
  const ice = section === 4 ? 1 : 0;
  const water = section === 13 ? 1 : 0;
  const night = section === 14 ? 1 : 0;
  return (
    <div className="pointer-events-none fixed inset-0 z-[5]">
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 60% at 50% 45%, rgba(160,210,235,0.22), rgba(110,160,185,0.05) 55%, transparent 75%)',
        }}
        animate={{ opacity: ice }}
        transition={{ duration: 1.0 }}
      />
      <motion.div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, rgba(10,30,45,0.55), rgba(4,12,20,0.85))' }}
        animate={{ opacity: water }}
        transition={{ duration: 1.0 }}
      />
      <motion.div
        className="absolute inset-0 stars"
        animate={{ opacity: night }}
        transition={{ duration: 1.2 }}
      />
    </div>
  );
}

function Intro() {
  const loaded = useStore((s) => s.loaded);
  const entered = useStore((s) => s.entered);
  const setEntered = useStore((s) => s.setEntered);
  const toggleAudio = useStore((s) => s.toggleAudio);

  return (
    <AnimatePresence>
      {loaded && !entered && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-ink"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.0 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.0, delay: 0.2 }}
            className="flex flex-col items-center"
          >
            <p className="font-sans text-[11px] uppercase tracking-luxe text-ice">The Achievement of an Ideal</p>
            <h1 className="mt-4 font-display text-4xl tracking-wide2 text-platinum-bright md:text-6xl">
              Day-Date 40
            </h1>
            <button
              onClick={() => {
                toggleAudio();
                setEntered(true);
              }}
              className="luxe-btn mt-12"
            >
              Enter the experience
            </button>
            <button
              onClick={() => setEntered(true)}
              className="mt-4 font-sans text-[10px] uppercase tracking-luxe text-platinum-dim transition hover:text-platinum"
            >
              Enter muted
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function TopBar({ onSeek }: { onSeek: (i: number) => void }) {
  const entered = useStore((s) => s.entered);
  const audioOn = useStore((s) => s.audioOn);
  const toggleAudio = useStore((s) => s.toggleAudio);
  const setPalette = useStore((s) => s.setPalette);

  return (
    <AnimatePresence>
      {entered && (
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-between px-6 py-5 md:px-10"
        >
          <button
            onClick={() => onSeek(0)}
            className="pointer-events-auto font-display text-sm tracking-wide2 text-platinum-bright"
          >
            ROLEX <span className="text-platinum-dim">· Day-Date 40</span>
          </button>

          <div className="pointer-events-auto flex items-center gap-3">
            <button
              onClick={toggleAudio}
              aria-label={audioOn ? 'Mute audio' : 'Enable audio'}
              className="hud-chip"
            >
              {audioOn ? '♪ On' : '♪ Off'}
            </button>
            <button onClick={() => setPalette(true)} className="hud-chip" aria-label="Open command palette">
              ⌘K
            </button>
          </div>
        </motion.header>
      )}
    </AnimatePresence>
  );
}

function Navigator({ onSeek }: { onSeek: (i: number) => void }) {
  const entered = useStore((s) => s.entered);
  const section = useStore((s) => s.section);
  if (!entered) return null;
  return (
    <div className="pointer-events-none fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-end gap-3 md:flex">
      {SECTIONS.map((s, i) => (
        <button
          key={s.id}
          onClick={() => onSeek(i)}
          className="pointer-events-auto group flex items-center gap-2"
          aria-label={`Go to ${s.kicker}`}
        >
          <span
            className={`font-sans text-[9px] uppercase tracking-wide2 transition-opacity ${
              section === i ? 'text-ice opacity-100' : 'text-platinum-dim opacity-0 group-hover:opacity-100'
            }`}
          >
            {String(i + 1).padStart(2, '0')}
          </span>
          <span
            className={`h-px transition-all duration-500 ${
              section === i ? 'w-8 bg-ice' : 'w-4 bg-platinum-dim/50 group-hover:bg-platinum'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function ScrollHint() {
  const section = useStore((s) => s.section);
  const entered = useStore((s) => s.entered);
  return (
    <AnimatePresence>
      {entered && section === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none fixed inset-x-0 bottom-10 z-40 flex flex-col items-center gap-3"
        >
          <span className="font-sans text-[10px] uppercase tracking-luxe text-platinum-dim">Scroll</span>
          <span className="scroll-line" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Toast() {
  const toast = useStore((s) => s.toast);
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          className="pointer-events-none fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-full border border-white/10 bg-ink-800/90 px-5 py-2 font-sans text-[11px] uppercase tracking-wide2 text-platinum-soft backdrop-blur"
        >
          {toast.text}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function Hud({ onSeek }: { onSeek: (i: number) => void }) {
  return (
    <>
      <SceneTint />
      <Intro />
      <TopBar onSeek={onSeek} />
      <Navigator onSeek={onSeek} />
      <ScrollHint />
      <Toast />
    </>
  );
}
