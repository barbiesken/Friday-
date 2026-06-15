import { bus } from "../core/eventBus";
import { getRecognitionCtor, type SpeechRecognitionLike } from "./speech-types";
import { serverTTSAvailable, synthesizeTTS } from "./tts";

/**
 * VoiceEngine — STT (Web Speech), mic-level metering (Web Audio), and TTS with a
 * synthesized speaking envelope that drives the Sphere's pulse. Speech is
 * interruptible: a wake/barge-in cancels whatever FRIDAY is saying.
 *
 * Everything is optional and guarded — the app runs fine where the APIs are
 * absent (it just falls back to silent / chat-only behavior).
 */
export class VoiceEngine {
  private recog: SpeechRecognitionLike | null = null;
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private meterRAF = 0;
  private speakRAF = 0;
  private cueCtx: AudioContext | null = null;
  private playCtx: AudioContext | null = null;
  private playSource: AudioBufferSourceNode | null = null;
  private listening = false;

  readonly canSTT: boolean;
  readonly canTTS: boolean;

  constructor() {
    this.canSTT = !!getRecognitionCtor();
    this.canTTS = typeof window !== "undefined" && "speechSynthesis" in window;
  }

  // ---- Listening (STT + mic meter) ----------------------------------------

  async startListening(): Promise<void> {
    if (this.listening) return;
    this.listening = true;
    this.playWakeCue();
    bus.emit("voice/listen-start", {});
    this.cancelSpeak(); // barge-in
    void this.startMeter();
    this.startRecognition();
  }

  /** A short rising blip — the audible "I'm listening" cue. */
  playWakeCue(): void {
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.cueCtx ||= new Ctx();
      const ctx = this.cueCtx;
      const now = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(440, now);
      o.frequency.exponentialRampToValueAtTime(880, now + 0.16);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.1, now + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
      o.connect(g).connect(ctx.destination);
      o.start(now);
      o.stop(now + 0.42);
    } catch {
      /* audio unavailable — fine */
    }
  }

  stopListening(): void {
    if (!this.listening) return;
    this.listening = false;
    bus.emit("voice/listen-stop", {});
    this.recog?.stop();
    this.stopMeter();
  }

  private startRecognition(): void {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    const r = new Ctor();
    r.lang = "en-US";
    r.continuous = false;
    r.interimResults = true;
    r.maxAlternatives = 1;

    r.onresult = (e) => {
      let interim = "";
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        const text = res[0].transcript;
        if (res.isFinal) final += text;
        else interim += text;
      }
      if (interim) bus.emit("stt/partial", { text: interim.trim() });
      if (final) bus.emit("stt/final", { text: final.trim() });
    };
    r.onerror = () => {
      /* swallow — onend will clean up */
    };
    r.onend = () => {
      if (this.listening) this.stopListening();
    };
    this.recog = r;
    try {
      r.start();
    } catch {
      /* already started */
    }
  }

  private async startMeter(): Promise<void> {
    try {
      if (!navigator.mediaDevices?.getUserMedia) return;
      this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new Ctx();
      const src = this.audioCtx.createMediaStreamSource(this.micStream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 512;
      src.connect(this.analyser);
      const data = new Uint8Array(this.analyser.frequencyBinCount);

      const tick = () => {
        if (!this.analyser) return;
        this.analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        bus.emit("voice/level", { level: Math.min(1, rms * 3.2) });
        this.meterRAF = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      /* mic denied / unavailable — fine */
    }
  }

  private stopMeter(): void {
    cancelAnimationFrame(this.meterRAF);
    bus.emit("voice/level", { level: 0 });
    this.micStream?.getTracks().forEach((t) => t.stop());
    this.micStream = null;
    void this.audioCtx?.close().catch(() => undefined);
    this.audioCtx = null;
    this.analyser = null;
  }

  // ---- Speaking (TTS + synthesized envelope) ------------------------------

  speak(text: string, opts?: { rate?: number; pitch?: number; volume?: number }): void {
    bus.emit("tts/start", { text });
    this.startSpeakEnvelope(); // random envelope while real audio is fetched
    void this.speakViaServerOrFallback(text, opts);
  }

  /** Prefer the real (server) voice; fall back to Web Speech if unavailable. */
  private async speakViaServerOrFallback(
    text: string,
    opts?: { rate?: number; pitch?: number; volume?: number },
  ): Promise<void> {
    try {
      if (await serverTTSAvailable()) {
        if (await this.speakViaServer(text)) return;
      }
    } catch {
      /* fall through to Web Speech */
    }
    this.speakViaWebSpeech(text, opts);
  }

  /** Play server audio and drive the Sphere's pulse from its real amplitude. */
  private async speakViaServer(text: string): Promise<boolean> {
    const bytes = await synthesizeTTS(text);
    if (!bytes) return false;
    const ctx = this.ensurePlayCtx();
    let buffer: AudioBuffer;
    try {
      buffer = await ctx.decodeAudioData(bytes.slice(0));
    } catch {
      return false;
    }
    cancelAnimationFrame(this.speakRAF); // stop the synthesized envelope
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    src.connect(analyser);
    analyser.connect(ctx.destination);
    this.playSource = src;
    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const x = (data[i] - 128) / 128;
        sum += x * x;
      }
      const rms = Math.sqrt(sum / data.length);
      bus.emit("tts/level", { level: Math.max(0, Math.min(1, rms * 3.2)) });
      this.speakRAF = requestAnimationFrame(tick);
    };
    src.onended = () => {
      this.playSource = null;
      this.endSpeak();
    };
    src.start();
    tick();
    return true;
  }

  private speakViaWebSpeech(
    text: string,
    opts?: { rate?: number; pitch?: number; volume?: number },
  ): void {
    if (!this.canTTS) {
      // no synth — approximate duration so visuals still play
      const ms = Math.min(6000, 600 + text.length * 45);
      window.setTimeout(() => this.endSpeak(), ms);
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = opts?.rate ?? 1.02;
    u.pitch = opts?.pitch ?? 1.0;
    u.volume = opts?.volume ?? 1.0;
    const voice = pickVoice();
    if (voice) u.voice = voice;
    u.onend = () => this.endSpeak();
    u.onerror = () => this.endSpeak();
    window.speechSynthesis.speak(u);
  }

  private ensurePlayCtx(): AudioContext {
    if (!this.playCtx) this.playCtx = new AudioContext();
    if (this.playCtx.state === "suspended") void this.playCtx.resume();
    return this.playCtx;
  }

  cancelSpeak(): void {
    if (this.canTTS) window.speechSynthesis.cancel();
    if (this.playSource) {
      try {
        this.playSource.stop();
      } catch {
        /* already stopped */
      }
      this.playSource = null;
    }
    this.endSpeak();
  }

  private startSpeakEnvelope(): void {
    cancelAnimationFrame(this.speakRAF);
    let level = 0;
    const tick = () => {
      // random-walk envelope → a believable "voice" pulse for the Sphere
      const target = 0.35 + Math.random() * 0.5;
      level += (target - level) * 0.25;
      bus.emit("tts/level", { level: Math.max(0, Math.min(1, level)) });
      this.speakRAF = requestAnimationFrame(tick);
    };
    tick();
  }

  private endSpeak(): void {
    cancelAnimationFrame(this.speakRAF);
    bus.emit("tts/level", { level: 0 });
    bus.emit("tts/end", {});
  }
}

function pickVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  // prefer a premium-sounding English voice
  const prefer = [/samantha/i, /ava/i, /serena/i, /google uk english female/i, /female/i, /en-?GB/i, /en-?US/i];
  for (const re of prefer) {
    const hit = voices.find((v) => re.test(v.name) || re.test(v.lang));
    if (hit) return hit;
  }
  return voices[0];
}

/** App-wide singleton. */
export const voice = new VoiceEngine();
