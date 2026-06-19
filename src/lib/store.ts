'use client';

import { create } from 'zustand';
import { TOTAL_SECTIONS } from './constants';

export type ExplodeMode = 'scroll' | 'open' | 'closed';

type ToastState = { id: number; text: string } | null;

type State = {
  // lifecycle
  entered: boolean;
  loaded: boolean;
  progress: number; // asset/scene load progress 0..1

  // scroll
  scroll: number; // global 0..1
  section: number; // 0..TOTAL-1
  sectionProgress: number; // 0..1 within current section

  // interaction
  pointer: { x: number; y: number }; // normalized -1..1
  explodeMode: ExplodeMode;
  watchmaker: boolean;

  // modes / panels
  perfMode: boolean;
  audioOn: boolean;
  paletteOpen: boolean;
  devPanel: boolean;
  screenshotPending: boolean;

  // diagnostics
  fps: number;
  dpr: number;
  drawcalls: number;
  webgpu: boolean;

  toast: ToastState;
};

type Actions = {
  setEntered: (v: boolean) => void;
  setLoaded: (v: boolean) => void;
  setProgress: (v: number) => void;
  setScroll: (scroll: number) => void;
  setPointer: (x: number, y: number) => void;
  cycleExplode: () => void;
  setExplodeMode: (m: ExplodeMode) => void;
  setWatchmaker: (v: boolean) => void;
  togglePerf: () => void;
  toggleAudio: () => void;
  setPalette: (v: boolean) => void;
  toggleDev: () => void;
  requestScreenshot: () => void;
  clearScreenshot: () => void;
  setDiag: (d: Partial<Pick<State, 'fps' | 'dpr' | 'drawcalls' | 'webgpu'>>) => void;
  pushToast: (text: string) => void;
  clearToast: () => void;
};

export const useStore = create<State & Actions>((set, get) => ({
  entered: false,
  loaded: false,
  progress: 0,

  scroll: 0,
  section: 0,
  sectionProgress: 0,

  pointer: { x: 0, y: 0 },
  explodeMode: 'scroll',
  watchmaker: false,

  perfMode: false,
  audioOn: false,
  paletteOpen: false,
  devPanel: false,
  screenshotPending: false,

  fps: 0,
  dpr: 1,
  drawcalls: 0,
  webgpu: false,

  toast: null,

  setEntered: (v) => set({ entered: v }),
  setLoaded: (v) => set({ loaded: v }),
  setProgress: (v) => set({ progress: v }),

  setScroll: (scroll) => {
    const clamped = Math.min(0.999999, Math.max(0, scroll));
    const f = clamped * TOTAL_SECTIONS;
    const section = Math.min(TOTAL_SECTIONS - 1, Math.floor(f));
    set({ scroll: clamped, section, sectionProgress: f - section });
  },

  setPointer: (x, y) => set({ pointer: { x, y } }),

  cycleExplode: () => {
    const next: ExplodeMode = get().explodeMode === 'open' ? 'scroll' : 'open';
    set({ explodeMode: next });
    get().pushToast(next === 'open' ? 'Explode mode' : 'Assembled');
  },
  setExplodeMode: (m) => set({ explodeMode: m }),
  setWatchmaker: (v) => {
    set({ watchmaker: v });
    if (v) get().pushToast('Watchmaker mode unlocked');
  },

  togglePerf: () => {
    const perfMode = !get().perfMode;
    set({ perfMode });
    get().pushToast(perfMode ? 'Performance mode on' : 'Performance mode off');
  },
  toggleAudio: () => {
    const audioOn = !get().audioOn;
    set({ audioOn });
    get().pushToast(audioOn ? 'Spatial audio on' : 'Audio muted');
  },
  setPalette: (v) => set({ paletteOpen: v }),
  toggleDev: () => set({ devPanel: !get().devPanel }),

  requestScreenshot: () => set({ screenshotPending: true }),
  clearScreenshot: () => set({ screenshotPending: false }),

  setDiag: (d) => set(d),

  pushToast: (text) => {
    const id = Date.now();
    set({ toast: { id, text } });
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        if (get().toast?.id === id) set({ toast: null });
      }, 2200);
    }
  },
  clearToast: () => set({ toast: null }),
}));
