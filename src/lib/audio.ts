'use client';

import { useStore } from './store';
import { TOTAL_SECTIONS } from './constants';

// Fully procedural HOUSE groove — zero asset files.
// 4-on-the-floor kick, claps on 2 & 4, off-beat open hats, an off-beat
// bassline, organ stabs and an atmospheric pad. The arrangement builds as you
// scroll (sparser early, full groove by the finale). Created lazily on a gesture.

const BPM = 123;

// 16-step (one bar) patterns.
const KICK = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0];
const CLAP = [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0];
const OHAT = [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0];
const CHAT = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0];
const BASS = [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0];
const STAB = [0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

class WatchAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private reverb: ConvolverNode | null = null;
  private padLp: BiquadFilterNode | null = null;
  private padGain: GainNode | null = null;
  private pads: OscillatorNode[] = [];
  private timer: number | null = null;
  private nextStep = 0;
  private step = 0;
  private started = false;

  // Housey minor progression (root Hz, low octave): Am · G · C · Em
  private roots = [110.0, 98.0, 130.81, 82.41];
  private bar = 0;

  private root() {
    return this.roots[Math.floor(this.bar / 2) % this.roots.length];
  }

  private makeReverb(ctx: AudioContext) {
    const len = Math.floor(ctx.sampleRate * 1.8);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    const c = ctx.createConvolver();
    c.buffer = buf;
    return c;
  }

  private ensure() {
    if (this.ctx) return;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    this.ctx = ctx;

    const master = ctx.createGain();
    master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -12;
    comp.ratio.value = 4;
    master.connect(comp);
    comp.connect(ctx.destination);
    this.master = master;

    const reverb = this.makeReverb(ctx);
    const revGain = ctx.createGain();
    revGain.gain.value = 0.35;
    reverb.connect(revGain);
    revGain.connect(master);
    this.reverb = reverb;

    // Atmospheric pad.
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 500;
    lp.Q.value = 1;
    this.padLp = lp;
    const padGain = ctx.createGain();
    padGain.gain.value = 0.07;
    lp.connect(padGain);
    padGain.connect(master);
    padGain.connect(reverb);
    this.padGain = padGain;

    [0, 0, 7].forEach((semi, i) => {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = this.roots[0] * (i === 2 ? 1.5 : 1) * 2;
      o.detune.value = i === 1 ? 8 : -5;
      o.connect(lp);
      o.start();
      this.pads.push(o);
    });
  }

  private env(time: number, peak: number, attack: number, decay: number) {
    const g = this.ctx!.createGain();
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(peak, time + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, time + attack + decay);
    return g;
  }

  private kick(time: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(135, time);
    o.frequency.exponentialRampToValueAtTime(48, time + 0.11);
    const g = this.env(time, 1.0, 0.005, 0.3);
    o.connect(g);
    g.connect(this.master!);
    o.start(time);
    o.stop(time + 0.4);
  }

  private noise(time: number, dur: number) {
    const ctx = this.ctx!;
    const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (d.length * 0.3));
    const src = ctx.createBufferSource();
    src.buffer = buf;
    return src;
  }

  private hat(time: number, open: boolean, vol: number) {
    const ctx = this.ctx!;
    const src = this.noise(time, open ? 0.2 : 0.05);
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = open ? 8000 : 9500;
    const g = ctx.createGain();
    g.gain.value = vol;
    src.connect(hp);
    hp.connect(g);
    g.connect(this.master!);
    src.start(time);
  }

  private clap(time: number, vol: number) {
    const ctx = this.ctx!;
    const src = this.noise(time, 0.18);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1600;
    bp.Q.value = 1.2;
    const g = ctx.createGain();
    g.gain.value = vol;
    src.connect(bp);
    bp.connect(g);
    g.connect(this.master!);
    g.connect(this.reverb!);
    src.start(time);
  }

  private bass(time: number, vol: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = this.root();
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 260;
    const g = this.env(time, vol, 0.01, 0.16);
    o.connect(lp);
    lp.connect(g);
    g.connect(this.master!);
    o.start(time);
    o.stop(time + 0.25);
  }

  private stab(time: number, vol: number) {
    const ctx = this.ctx!;
    const root = this.root() * 2;
    const freqs = [root, root * 1.2, root * 1.5]; // minor triad
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2200;
    const g = this.env(time, vol, 0.005, 0.18);
    lp.connect(g);
    g.connect(this.master!);
    g.connect(this.reverb!);
    freqs.forEach((f) => {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = f;
      o.connect(lp);
      o.start(time);
      o.stop(time + 0.22);
    });
  }

  private loop = () => {
    const ctx = this.ctx;
    if (!ctx) return;
    const sixteenth = 60 / BPM / 4;
    const time = this.nextStep;
    const s = this.step;
    const section = useStore.getState().section;
    const k = section / (TOTAL_SECTIONS - 1); // 0..1 build

    if (KICK[s]) this.kick(time);
    if (CHAT[s]) this.hat(time, false, 0.06 + k * 0.12);
    if (k > 0.15 && OHAT[s]) this.hat(time, true, 0.05 + k * 0.12);
    if (k > 0.3 && CLAP[s]) this.clap(time, 0.25 + k * 0.25);
    if (k > 0.1 && BASS[s]) this.bass(time, 0.3 + k * 0.3);
    if (k > 0.45 && STAB[s]) this.stab(time, 0.12 + k * 0.16);

    if (this.padLp) this.padLp.frequency.setTargetAtTime(420 + k * 1400, time, 0.4);
    if (this.padGain) this.padGain.gain.setTargetAtTime(0.06 + k * 0.05, time, 0.4);

    // advance
    this.step = (s + 1) % 16;
    if (this.step === 0) {
      this.bar++;
      const r = this.root();
      this.pads.forEach((o, i) => o.frequency.setTargetAtTime(r * (i === 2 ? 1.5 : 1) * 2, time, 0.3));
    }
    this.nextStep += sixteenth;
    this.timer = window.setTimeout(this.loop, sixteenth * 1000 * 0.5);
  };

  async enable() {
    this.ensure();
    if (!this.ctx || !this.master) return;
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    this.master.gain.cancelScheduledValues(this.ctx.currentTime);
    this.master.gain.linearRampToValueAtTime(0.85, this.ctx.currentTime + 1.0);
    if (!this.started) {
      this.started = true;
      this.nextStep = this.ctx.currentTime + 0.1;
      this.loop();
    }
  }

  disable() {
    if (!this.ctx || !this.master) return;
    this.master.gain.cancelScheduledValues(this.ctx.currentTime);
    this.master.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
  }
}

let instance: WatchAudio | null = null;
export function getAudio(): WatchAudio {
  if (!instance) instance = new WatchAudio();
  return instance;
}
