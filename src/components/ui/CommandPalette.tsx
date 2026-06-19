'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '@/lib/store';
import { SECTIONS } from '@/lib/constants';

type Command = { id: string; label: string; hint?: string; run: () => void };

export default function CommandPalette({ onSeek }: { onSeek: (i: number) => void }) {
  const open = useStore((s) => s.paletteOpen);
  const setPalette = useStore((s) => s.setPalette);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [sel, setSel] = useState(0);

  const commands = useMemo<Command[]>(() => {
    const store = useStore.getState();
    const navItems: Command[] = SECTIONS.map((s, i) => ({
      id: `nav-${s.id}`,
      label: `Go to ${String(i + 1).padStart(2, '0')} · ${s.kicker}`,
      hint: 'Chapter',
      run: () => onSeek(i),
    }));
    return [
      ...navItems,
      { id: 'explode', label: 'Toggle explode mode', hint: 'E', run: () => store.cycleExplode() },
      { id: 'perf', label: 'Toggle performance mode', hint: 'P', run: () => store.togglePerf() },
      { id: 'shot', label: 'Capture screenshot', hint: 'C', run: () => store.requestScreenshot() },
      { id: 'audio', label: 'Toggle spatial audio', hint: 'M', run: () => store.toggleAudio() },
      { id: 'dev', label: 'Toggle developer panel', hint: '`', run: () => store.toggleDev() },
      {
        id: 'watch',
        label: 'Watchmaker mode',
        hint: '↑↑↓↓←→←→ba',
        run: () => store.setWatchmaker(!store.watchmaker),
      },
    ];
  }, [onSeek]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => c.label.toLowerCase().includes(q));
  }, [commands, query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSel(0);
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [open]);

  useEffect(() => {
    setSel(0);
  }, [query]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setPalette(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSel((s) => Math.min(filtered.length - 1, s + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSel((s) => Math.max(0, s - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = filtered[sel];
      if (cmd) {
        cmd.run();
        setPalette(false);
      }
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-start justify-center pt-[18vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setPalette(false)}
        >
          <div className="absolute inset-0 bg-ink/70 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-[92vw] max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-ink-800/95 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Search the experience…"
              className="w-full bg-transparent px-5 py-4 font-sans text-sm text-platinum-bright outline-none placeholder:text-platinum-dim"
            />
            <div className="max-h-[44vh] overflow-y-auto border-t border-white/10">
              {filtered.length === 0 && (
                <p className="px-5 py-4 font-sans text-xs text-platinum-dim">No matches.</p>
              )}
              {filtered.map((c, i) => (
                <button
                  key={c.id}
                  onMouseEnter={() => setSel(i)}
                  onClick={() => {
                    c.run();
                    setPalette(false);
                  }}
                  className={`flex w-full items-center justify-between px-5 py-3 text-left font-sans text-sm transition-colors ${
                    i === sel ? 'bg-white/[0.06] text-platinum-bright' : 'text-platinum-soft'
                  }`}
                >
                  <span>{c.label}</span>
                  {c.hint && <span className="font-mono text-[10px] tracking-wide2 text-platinum-dim">{c.hint}</span>}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
