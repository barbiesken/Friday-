import { bus } from "./eventBus";
import { useFriday } from "./store";
import { route, type Intent } from "./nlu";
import { emotionThemes } from "./theme";
import { voice } from "../voice/voiceEngine";
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
    setAccent(emotion);
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
    go(useFriday.getState().night ? "sleep" : "idle", "calm");
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
    st.addThinking("planning", planLabel(intent));
    await delay(340);

    if (intent.command) {
      go("executing");
      st.addThinking("executing", intent.command);
      bus.emit("command/run", { id: intent.intent, label: intent.command });
      await delay(460);
      bus.emit("command/done", { id: intent.intent });
    }
    if (intent.layout) setLayout(intent.layout);

    await respond(intent.reply, intent.emotion ?? "calm", intent.settle);
  } finally {
    busy = false;
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

  // keyboard summon: Space (when not typing)
  if (typeof window !== "undefined") {
    window.addEventListener("keydown", (e) => {
      const typing = (e.target as HTMLElement)?.tagName?.match(/INPUT|TEXTAREA/);
      if (e.code === "Space" && !typing) {
        e.preventDefault();
        manualWake();
      }
    });
  }
}
