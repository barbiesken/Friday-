import { bus } from "./eventBus";
import { useFriday } from "./store";
import { route, type Intent } from "./nlu";
import { emotionThemes } from "./theme";
import { applyWorkspace } from "./workspaces";
import { startAmbient } from "./ambient";
import { startBridge } from "./bridge";
import { system } from "../system/bridge";
import { voice } from "../voice/voiceEngine";
import { clap } from "../voice/clap";
import type { AssistantState, Emotion, LayoutMode, WakeSource } from "./types";

let started = false;
let busy = false;

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function setAccent(emotion: Emotion) {
  if (typeof document !== "undefined") {
    document.documentElement.style.setProperty("--accent", emotionThemes[emotion].accent);
  }
}

/** Single place that mutates state — keeps the store and the bus in sync. */
function go(state: AssistantState, emotion?: Emotion) {
  const st = useFriday.getState();
  st.setState(state);
  bus.emit("assistant/state", { state });
  if (emotion) {
    st.setEmotion(emotion);
    // accent follows the emotion only in the default workspace; named
    // workspaces own the accent (see applyWorkspace).
    if (st.workspace === "default") setAccent(emotion);
    bus.emit("assistant/emotion", { emotion });
  }
}

function setLayout(mode: LayoutMode) {
  useFriday.getState().setLayout(mode);
  bus.emit("assistant/layout", { mode });
}

function planLabel(i: Intent): string {
  return `Intent → ${i.intent.replace(/_/g, " ")}`;
}

/** Which agent module handles this intent (it visibly leaves orbit to execute). */
function agentFor(intent: string): string | null {
  if (intent === "daily_brief" || intent === "time") return "Calendar";
  if (intent === "open_memory" || intent === "second_brain") return "Memory";
  if (intent === "next_action" || intent === "fallback" || intent === "identity") return "Research";
  if (intent === "open_app" || intent.startsWith("work") || intent.startsWith("workspace") ||
      intent === "transform_workspace" || intent === "focus_mode" || intent === "captain_mode") return "Builder";
  return null;
}

/** Route an intent's side-effects through the system bridge (OS control). */
function runEffects(intent: Intent): void {
  switch (intent.intent) {
    case "open_app":
      void system.openApp(String(intent.args?.app ?? "app"));
      break;
    case "work_mode":
      void system.runChain("Command chain · start work mode", [
        "Open VS Code", "Open browser", "Open calendar", "Start Deep Focus", "Activate focus",
      ]);
      break;
    case "focus_mode":
      void system.focusMode(true);
      break;
  }
}

function speakAndWait(text: string): Promise<void> {
  return new Promise<void>((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      off();
      resolve();
    };
    const off = bus.once("tts/end", finish);
    const night = useFriday.getState().night;
    voice.speak(text, night ? { rate: 0.96, volume: 0.7 } : undefined);
    // safety: never hang the loop if synth misbehaves
    window.setTimeout(finish, 9000);
  });
}

/** FRIDAY speaks `text` with `emotion`, then settles. No NLU. */
async function respond(text: string, emotion: Emotion, settle?: AssistantState) {
  const st = useFriday.getState();
  st.clearThinking();
  go(st.night ? "whisper" : "speaking", emotion);
  st.pushLine("friday", text);
  await speakAndWait(text);

  if (settle) {
    go(settle, settle === "sleep" ? "sleep" : "calm");
  } else if (emotion === "celebrating") {
    await delay(1400);
    go("idle", "calm");
  } else {
    // preserve the current emotion (workspace tints persist into idle)
    go(useFriday.getState().night ? "sleep" : "idle");
  }
}

/** Full understand → plan → execute → speak loop for a user utterance. */
async function handle(text: string) {
  if (busy || !text.trim()) return;
  busy = true;
  try {
    const st = useFriday.getState();
    go("thinking", "deepthink");
    voice.stopListening();

    st.clearThinking();
    const short = text.length > 48 ? text.slice(0, 46) + "…" : text;
    st.addThinking("understanding", `"${short}"`);
    await delay(300);

    const intent = route(text);
    if (intent.intent === "second_brain") {
      const note = text
        .replace(/^\s*(hey\s+)?friday[,\s]*/i, "")
        .replace(/remember( this)?[:,]?/i, "")
        .trim();
      useFriday.getState().capture(note || "(captured)", "idea");
    }
    st.addThinking("planning", planLabel(intent));
    await delay(340);

    if (intent.command) {
      go("executing");
      const agent = agentFor(intent.intent);
      if (agent) useFriday.getState().setActiveAgent(agent);
      st.addThinking("executing", intent.command);
      bus.emit("command/run", { id: intent.intent, label: intent.command });
      void runEffects(intent);
      await delay(620);
      bus.emit("command/done", { id: intent.intent });
      useFriday.getState().setActiveAgent(null);
    }
    if (intent.workspace) applyWorkspace(intent.workspace);
    if (intent.panel) useFriday.getState().setPanel(intent.panel);
    if (intent.layout) setLayout(intent.layout);

    await respond(intent.reply, intent.emotion ?? useFriday.getState().emotion, intent.settle);
  } finally {
    busy = false;
    useFriday.getState().setActiveAgent(null);
  }
}

async function wake(_source: WakeSource) {
  if (busy) return;
  const st = useFriday.getState();
  if (st.state === "speaking") voice.cancelSpeak();
  go("listening", "focused");
  await voice.startListening();
}

/** Public: submit text from the chat input (skips STT). */
export function submitUserText(text: string) {
  if (!text.trim()) return;
  useFriday.getState().pushLine("user", text);
  void handle(text);
}

/** Public: trigger a wake manually (button / hotkey). */
export function manualWake() {
  bus.emit("voice/wake", { source: "manual" });
}

/** Public: enable/disable always-listening double-clap wake (opt-in). */
export async function setClapWake(on: boolean): Promise<void> {
  useFriday.getState().setClapWake(on);
  if (on) {
    const ok = await clap.start();
    if (!ok) {
      useFriday.getState().setClapWake(false);
      bus.emit("notify", { level: "warn", message: "Microphone unavailable for clap wake" });
    } else {
      bus.emit("notify", { level: "info", message: "Double-clap wake armed" });
    }
  } else {
    clap.stop();
  }
}

/** Public: FRIDAY greeting / ambient line (used by boot). */
export function fridaySay(text: string, emotion: Emotion = "calm") {
  void respond(text, emotion);
}

/** Public: called when the boot sequence finishes. Settle into orbital idle. */
export function bootComplete() {
  go("idle", "calm");
  setLayout("orbital");
}

export function startOrchestrator() {
  if (started) return;
  started = true;

  setAccent(useFriday.getState().emotion);
  startAmbient();
  startBridge();

  bus.on("voice/level", ({ level }) => {
    if (useFriday.getState().state === "listening") useFriday.getState().setAudioLevel(level);
  });
  bus.on("tts/level", ({ level }) => {
    const s = useFriday.getState().state;
    if (s === "speaking" || s === "whisper") useFriday.getState().setAudioLevel(level);
  });

  bus.on("voice/wake", ({ source }) => void wake(source));
  bus.on("stt/partial", ({ text }) => useFriday.getState().streamLine("user", text));
  bus.on("stt/final", ({ text }) => {
    useFriday.getState().finalizeLine("user");
    void handle(text);
  });

  // user said nothing — settle back to idle
  bus.on("voice/listen-stop", () => {
    if (useFriday.getState().state === "listening" && !busy) go("idle", "calm");
  });

  // keyboard summon: Space to speak · ⌘K or "/" for the command palette
  if (typeof window !== "undefined") {
    window.addEventListener("keydown", (e) => {
      const typing = (e.target as HTMLElement)?.tagName?.match(/INPUT|TEXTAREA/);
      if (e.key === "Escape") {
        const st = useFriday.getState();
        if (!st.panel && (st.layout === "flow" || st.layout === "captain")) setLayout("orbital");
        return; // panel closing is handled by the Overlays listener
      }
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        const st = useFriday.getState();
        st.setPanel(st.panel === "palette" ? null : "palette");
        return;
      }
      if (e.code === "Space" && !typing) {
        e.preventDefault();
        manualWake();
      }
    });
  }
}
