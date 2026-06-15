import { useFriday } from "./store";
import { bus } from "./eventBus";

/**
 * Ambient intelligence — never interrupts, just makes FRIDAY feel alive and aware.
 * Live system vitals + a (rare, respectful) presence welcome-back on return.
 */
let started = false;
let lastActivity = Date.now();
let lastWelcome = 0;

export function startAmbient(): void {
  if (started || typeof window === "undefined") return;
  started = true;

  // live system vitals — gentle drift so the HUD breathes
  setInterval(() => {
    const m = useFriday.getState().metrics;
    const j = (v: number, lo: number, hi: number) =>
      Math.max(lo, Math.min(hi, v + (Math.random() - 0.5) * 0.06));
    useFriday.getState().setMetrics({
      cpu: j(m.cpu, 0.05, 0.62),
      mem: j(m.mem, 0.2, 0.72),
      net: j(m.net, 0.02, 0.55),
      battery: m.battery,
    });
  }, 2600);

  // presence — detect return after a meaningful absence
  const mark = () => {
    const now = Date.now();
    const idleFor = now - lastActivity;
    lastActivity = now;
    if (idleFor > 90_000) onReturn(idleFor);
  };
  for (const ev of ["mousemove", "keydown", "click", "touchstart"]) {
    window.addEventListener(ev, mark, { passive: true });
  }
}

function onReturn(idleFor: number): void {
  const now = Date.now();
  if (now - lastWelcome < 10 * 60_000) return; // never greet repeatedly
  const st = useFriday.getState();
  if (st.state !== "idle") return; // don't talk over anything
  lastWelcome = now;
  const mins = Math.round(idleFor / 60_000);
  st.pushLine("friday", `Welcome back, Aaryan. You were away ${mins} minute${mins === 1 ? "" : "s"}. Resume?`);
  st.setEmotion("curious");
  bus.emit("presence/change", { status: "returning", awayMs: idleFor });
}
