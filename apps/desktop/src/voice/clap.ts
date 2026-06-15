import { bus } from "../core/eventBus";

/**
 * Double-clap wake — an always-listening energy detector (opt-in). Two sharp
 * transients within a short window fire a wake. Tuned to avoid accidental
 * triggers: requires a rising edge over a high threshold, debounces single
 * claps, and cools down after firing.
 */
const HIGH = 0.18; // onset must spike above this RMS
const LOW = 0.07; // …after dropping below this (hysteresis)
const MIN_GAP = 120; // ms — ignore the same clap's ring-out
const MAX_GAP = 650; // ms — the two claps must be within this
const COOLDOWN = 1500; // ms — after a wake

class ClapDetector {
  private ctx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private raf = 0;
  private running = false;

  private armed = false; // below LOW since last onset → ready for a new onset
  private firstClap = 0;
  private lastOnset = 0;
  private lastWake = 0;

  get isRunning() {
    return this.running;
  }

  async start(): Promise<boolean> {
    if (this.running) return true;
    try {
      if (!navigator.mediaDevices?.getUserMedia) return false;
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctx();
      const src = this.ctx.createMediaStreamSource(this.stream);
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 1024;
      src.connect(this.analyser);
      this.running = true;
      this.armed = true;
      this.loop();
      return true;
    } catch {
      this.stop();
      return false;
    }
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.stream?.getTracks().forEach((t) => t.stop());
    void this.ctx?.close().catch(() => undefined);
    this.stream = null;
    this.ctx = null;
    this.analyser = null;
  }

  private loop = () => {
    if (!this.analyser) return;
    const buf = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteTimeDomainData(buf);
    let sum = 0;
    for (let i = 0; i < buf.length; i++) {
      const v = (buf[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / buf.length);
    const now = performance.now();

    if (rms < LOW) this.armed = true;
    if (this.armed && rms > HIGH && now - this.lastOnset > MIN_GAP) {
      this.armed = false;
      this.lastOnset = now;
      this.onClap(now);
    }
    this.raf = requestAnimationFrame(this.loop);
  };

  private onClap(now: number): void {
    if (now - this.lastWake < COOLDOWN) return;
    if (this.firstClap && now - this.firstClap <= MAX_GAP) {
      this.firstClap = 0;
      this.lastWake = now;
      bus.emit("voice/wake", { source: "double-clap" });
    } else {
      this.firstClap = now; // start of a potential pair
    }
  }
}

export const clap = new ClapDetector();
