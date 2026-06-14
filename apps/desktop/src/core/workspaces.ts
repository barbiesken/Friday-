import { useFriday } from "./store";
import { emotionThemes } from "./theme";
import type { Emotion, WorkspaceId } from "./types";

export interface Workspace {
  id: WorkspaceId;
  label: string;
  accent: string;
  auraA: string;
  auraB: string;
  emotion: Emotion;
  blurb: string;
}

/**
 * Workspace transformations — Aura Field + Room Mode. Each changes the Sphere's
 * emotion, the UI accent, and the ambient atmosphere (the two aura glows).
 */
export const WORKSPACES: Record<WorkspaceId, Workspace> = {
  default: { id: "default", label: "Default", accent: "#4cc2ff", auraA: "rgba(28,92,160,0.55)", auraB: "rgba(120,90,230,0.32)", emotion: "calm", blurb: "Balanced presence." },
  focus:   { id: "focus",   label: "Focus",   accent: "#36b9ff", auraA: "rgba(20,80,150,0.55)", auraB: "rgba(20,120,170,0.30)", emotion: "focused", blurb: "Sharp. Quiet. One thing at a time." },
  builder: { id: "builder", label: "Builder", accent: "#43e8b0", auraA: "rgba(20,140,110,0.45)", auraB: "rgba(30,90,150,0.32)", emotion: "focused", blurb: "Editor, terminal, momentum." },
  study:   { id: "study",   label: "Study",   accent: "#9b7bff", auraA: "rgba(90,70,200,0.45)", auraB: "rgba(40,90,180,0.30)", emotion: "curious", blurb: "Calm, deep, retentive." },
  movie:   { id: "movie",   label: "Movie",   accent: "#ff7a9c", auraA: "rgba(120,30,80,0.40)", auraB: "rgba(60,20,120,0.34)", emotion: "calm", blurb: "Dim the world. Lean back." },
  relax:   { id: "relax",   label: "Relax",   accent: "#5fd0d8", auraA: "rgba(20,120,130,0.40)", auraB: "rgba(40,80,140,0.30)", emotion: "calm", blurb: "Soften everything." },
  night:   { id: "night",   label: "Night",   accent: "#2f6fb0", auraA: "rgba(14,40,80,0.50)", auraB: "rgba(30,30,80,0.34)", emotion: "sleep", blurb: "Whisper mode. Low light." },
};

/** Apply a workspace: accent + aura + Sphere emotion + whisper at night. */
export function applyWorkspace(id: WorkspaceId): void {
  const w = WORKSPACES[id];
  const root = document.documentElement;
  root.style.setProperty("--accent", w.accent);
  root.style.setProperty("--aura-a", w.auraA);
  root.style.setProperty("--aura-b", w.auraB);
  const st = useFriday.getState();
  st.setWorkspace(id);
  st.setEmotion(w.emotion);
  st.setNight(id === "night");
  // keep the accent in sync with the emotion's own tint when leaving a workspace
  if (id === "default") root.style.setProperty("--accent", emotionThemes[w.emotion].accent);
}
