import { create } from "zustand";
import type {
  AssistantState,
  Emotion,
  LayoutMode,
  PanelId,
  SystemMetrics,
  ThinkingPhase,
  TranscriptLine,
  VoiceMode,
  WorkspaceId,
} from "./types";

let lineSeq = 0;
const nextId = () => `l${Date.now().toString(36)}_${lineSeq++}`;

export interface FridayStore {
  state: AssistantState;
  emotion: Emotion;
  layout: LayoutMode;
  workspace: WorkspaceId;
  panel: PanelId | null;
  voiceMode: VoiceMode;
  /** unified 0..1 — mic level while listening, voice level while speaking */
  audioLevel: number;
  booted: boolean;
  night: boolean; // whisper / night mode
  metrics: SystemMetrics;
  transcript: TranscriptLine[];
  thinking: Array<{ phase: ThinkingPhase; label: string }>;
  memories: Array<{ id: string; text: string; kind: string; at: number }>;
  lastWake: number;

  setState: (s: AssistantState) => void;
  setEmotion: (e: Emotion) => void;
  setLayout: (m: LayoutMode) => void;
  setWorkspace: (w: WorkspaceId) => void;
  setPanel: (p: PanelId | null) => void;
  setVoiceMode: (v: VoiceMode) => void;
  setAudioLevel: (v: number) => void;
  setBooted: (v: boolean) => void;
  setNight: (v: boolean) => void;
  setMetrics: (m: SystemMetrics) => void;

  /** append a finished line */
  pushLine: (who: TranscriptLine["who"], text: string) => string;
  /** create or update the streaming line for a speaker */
  streamLine: (who: TranscriptLine["who"], text: string) => void;
  /** finalize whatever partial exists for a speaker */
  finalizeLine: (who: TranscriptLine["who"]) => void;

  setThinking: (steps: Array<{ phase: ThinkingPhase; label: string }>) => void;
  addThinking: (phase: ThinkingPhase, label: string) => void;
  clearThinking: () => void;

  /** Second Brain — capture a thought/idea/task. */
  capture: (text: string, kind?: string) => void;
}

const MAX_LINES = 60;

export const useFriday = create<FridayStore>((set, get) => ({
  state: "boot",
  emotion: "calm",
  layout: "full",
  workspace: "default",
  panel: null,
  voiceMode: "jarvis",
  audioLevel: 0,
  booted: false,
  night: isNight(),
  metrics: { cpu: 0.12, mem: 0.34, net: 0.05, battery: 0.82 },
  transcript: [],
  thinking: [],
  memories: [
    { id: nextId(), text: "The core should illuminate the room, not the other way around.", kind: "idea", at: Date.now() - 3600_000 },
    { id: nextId(), text: "Rebuild the core as five layers — energy, rings, streams, geometry, agents.", kind: "task", at: Date.now() - 1800_000 },
  ],
  lastWake: 0,

  setState: (state) => set({ state, lastWake: state === "listening" ? Date.now() : get().lastWake }),
  setEmotion: (emotion) => set({ emotion }),
  setLayout: (layout) => set({ layout }),
  setWorkspace: (workspace) => set({ workspace }),
  setPanel: (panel) => set({ panel }),
  setVoiceMode: (voiceMode) => set({ voiceMode }),
  setAudioLevel: (audioLevel) => set({ audioLevel }),
  setBooted: (booted) => set({ booted }),
  setNight: (night) => set({ night }),
  setMetrics: (metrics) => set({ metrics }),

  pushLine: (who, text) => {
    const id = nextId();
    set((s) => ({
      transcript: [...s.transcript, { id, who, text, at: Date.now() }].slice(-MAX_LINES),
    }));
    return id;
  },

  streamLine: (who, text) =>
    set((s) => {
      const last = s.transcript[s.transcript.length - 1];
      if (last && last.who === who && last.partial) {
        const updated = { ...last, text };
        return { transcript: [...s.transcript.slice(0, -1), updated] };
      }
      return {
        transcript: [
          ...s.transcript,
          { id: nextId(), who, text, at: Date.now(), partial: true },
        ].slice(-MAX_LINES),
      };
    }),

  finalizeLine: (who) =>
    set((s) => {
      const last = s.transcript[s.transcript.length - 1];
      if (last && last.who === who && last.partial) {
        return { transcript: [...s.transcript.slice(0, -1), { ...last, partial: false }] };
      }
      return {};
    }),

  setThinking: (thinking) => set({ thinking }),
  addThinking: (phase, label) => set((s) => ({ thinking: [...s.thinking, { phase, label }] })),
  clearThinking: () => set({ thinking: [] }),

  capture: (text, kind = "note") =>
    set((s) => ({ memories: [{ id: nextId(), text, kind, at: Date.now() }, ...s.memories].slice(0, 50) })),
}));

export function isNight(d = new Date()): boolean {
  const h = d.getHours();
  return h >= 22 || h < 7;
}
