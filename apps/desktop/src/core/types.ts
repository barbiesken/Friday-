/**
 * FRIDAY — canonical types.
 * The Sphere, voice, ambient engine and UI all speak this language.
 */

/** The eleven canonical states. The Sphere mirrors these 1:1. */
export type AssistantState =
  | "boot"
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "planning"
  | "executing"
  | "alert"
  | "celebrating"
  | "sleep"
  | "whisper";

/** Subtle emotional presence — visual language only, never claimed feelings. */
export type Emotion =
  | "calm"
  | "focused"
  | "curious"
  | "alert"
  | "celebrating"
  | "deepthink"
  | "sleep";

/** Where the Sphere lives on screen. */
export type LayoutMode = "mini" | "full" | "orbital" | "hud" | "flow" | "captain";

/** Workspace transformations — Aura Field + Room Mode. */
export type WorkspaceId = "default" | "focus" | "builder" | "study" | "movie" | "relax" | "night";

/** Overlay surfaces opened from the module rail / command palette. */
export type PanelId = "brief" | "memory" | "permissions" | "settings" | "palette";

/** Voice personality. */
export type VoiceMode = "professional" | "friendly" | "jarvis";

/** How a wake was triggered. */
export type WakeSource = "wake-word" | "double-clap" | "hotkey" | "manual";

/** Thinking-transparency phases (never hide actions). */
export type ThinkingPhase = "understanding" | "planning" | "executing";

export interface TranscriptLine {
  id: string;
  who: "friday" | "user";
  text: string;
  /** epoch ms */
  at: number;
  /** true while still streaming in */
  partial?: boolean;
}

export interface SystemMetrics {
  /** 0..1 */
  cpu: number;
  /** 0..1 */
  mem: number;
  /** 0..1 */
  net: number;
  /** 0..1, undefined if no battery */
  battery?: number;
}

/**
 * The event map — FRIDAY's nervous system. Every module communicates here.
 * Keys are namespaced "domain/event".
 */
export interface FridayEvents {
  "assistant/state": { state: AssistantState };
  "assistant/emotion": { emotion: Emotion };
  "assistant/layout": { mode: LayoutMode };
  "assistant/say": { text: string; emotion?: Emotion };
  "assistant/interrupt": Record<string, never>;

  "voice/wake": { source: WakeSource };
  "voice/level": { level: number }; // mic amplitude 0..1
  "voice/listen-start": Record<string, never>;
  "voice/listen-stop": Record<string, never>;

  "stt/partial": { text: string };
  "stt/final": { text: string };

  "tts/start": { text: string };
  "tts/level": { level: number }; // speaking amplitude 0..1
  "tts/end": Record<string, never>;

  "nlu/intent": { intent: string; utterance: string; args?: Record<string, unknown> };

  "command/run": { id: string; label: string };
  "command/done": { id: string };

  "thinking/step": { phase: ThinkingPhase; label: string };
  "thinking/clear": Record<string, never>;

  "system/metric": SystemMetrics;
  "notify": { level: "info" | "warn" | "alert"; message: string };

  "presence/change": { status: "active" | "idle" | "returning"; awayMs?: number };
}

export type FridayEventName = keyof FridayEvents;
