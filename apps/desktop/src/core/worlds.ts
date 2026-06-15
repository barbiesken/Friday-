import { useFriday } from "./store";
import type { WorldTheme } from "./types";

export interface World {
  id: WorldTheme;
  label: string;
  accent: string;
  auraA: string;
  auraB: string;
  /** grid floor + starfield colours (read by the scene) */
  grid: string;
  section: string;
  star: string;
}

/**
 * World Engine — the entire environment around the core transforms. Cool-toned by
 * design (the core keeps its electric-blue identity); these reskin the space.
 */
export const WORLDS: Record<WorldTheme, World> = {
  arc:     { id: "arc",     label: "Arc Reactor", accent: "#36b9ff", auraA: "rgba(28,92,160,0.55)", auraB: "rgba(40,110,200,0.32)", grid: "#0c2740", section: "#1c6fa8", star: "#7fd3ff" },
  space:   { id: "space",   label: "Space",       accent: "#6f8bff", auraA: "rgba(60,50,150,0.5)",  auraB: "rgba(90,70,200,0.34)",  grid: "#171b3a", section: "#3a44a8", star: "#b9c4ff" },
  ocean:   { id: "ocean",   label: "Ocean",       accent: "#36d0c4", auraA: "rgba(16,90,110,0.5)",  auraB: "rgba(20,120,140,0.32)", grid: "#0a2e36", section: "#137f8a", star: "#7fe3ff" },
  cyber:   { id: "cyber",   label: "Cyber",       accent: "#36d0ff", auraA: "rgba(20,90,160,0.5)",  auraB: "rgba(80,40,160,0.34)",  grid: "#102a44", section: "#2f7fd0", star: "#8fe9ff" },
  library: { id: "library", label: "Library",     accent: "#7fb8e8", auraA: "rgba(40,60,90,0.45)",  auraB: "rgba(60,80,120,0.3)",   grid: "#1a2a3a", section: "#3a5a78", star: "#cfe6ff" },
};

/** Apply a world: accent + aura (CSS) + scene colours (store). */
export function applyWorld(id: WorldTheme): void {
  const w = WORLDS[id];
  const root = document.documentElement;
  root.style.setProperty("--accent", w.accent);
  root.style.setProperty("--aura-a", w.auraA);
  root.style.setProperty("--aura-b", w.auraB);
  useFriday.getState().setWorld(id);
}
