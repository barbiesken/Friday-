'use client';

import { useStore } from './store';
import { TOTAL_SECTIONS } from './constants';

// Fully procedural "deep ambient techno" — zero asset files.
// A slow sub-bass pulse + airy detuned pads through a synthesized reverb +
// filtered-noise hats. The pad filter and shimmer open up as you scroll.
// Created lazily on first user gesture (browsers block autoplay).

const BPM = 104;

class WatchAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private padGain: GainNode | null = null;
  private lp: BiquadFilterNode | null = null;
  private reverb: ConvolverNode | null = null;
  private pads: OscillatorNode[] = [];
  private timer: number | null = null;
  private nextBeat = 0;
  private beatIndex = 0;
  private started = false;

  // Chord roots (Hz) — a slow, minor, cinematic cycle.
  private roots = [55.0, 49.0, 58.27, 43.65]; // A1, G1, A#1, F1
  private chordStep = 0;

  private makeReverb(ctx: AudioContext) {
    const seconds = 2.6;
    const rate = ctx.sampleRate;
    const len = Math.floor(rate * seconds);
    const impulse = ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
      }
    }
    const conv = ctx.createConvolver();
    conv.buffer = impulse;
    return conv;
  }

  private ensure() {
    if (this.ctx) return;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    this.ctx = ctx;

    const master = ctx.createGain();
    master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 6;
    master.connect(comp);
    comp.connect(ctx.destination);
    this.master = master;

    const reverb = this.makeReverb(ctx);
    const revGain = ctx.createGain();
    revGain.gain.value = 0.5;
    reverb.connect(revGain);
    revGain.connect(master);
    this.reverb = reverb;

    // Pad: three detuned saws → low-pass → pad gain → master + reverb.
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 320;
    lp.Q.value = 1.2;
    this.lp = lp;

    const padGain = ctx.createGain();
    padGain.gain.value = 0.12;
    lp.connect(padGain);
    padGain.connect(master);
    padGain.connect(reverb);
    this.padGain = padGain;

    const detunes = [-6, 0, 7];
    for (let i = 0; i < 3; i++) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = this.roots[0] * (i === 2 ? 1.5 : 1); // root, root, fifth
      o.detune.value = detunes[i];
      o.connect(lp);
      o.start();
      this.pads.push(o);
    }

    // Slow filter LFO for movement.
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.06;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 120;
    lfo.connect(lfoGain);
    lfoGain.connect(lp.frequency);
    lfo.start();
  }

  private kick(time: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.setValueAtTime(120, time);
    o.frequency.exponentialRampToValueAtTime(45, time + 0.12);
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(0.95, time + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.34);
    o.connect(g);
    g.connect(this.master!);
    o.start(time);
    o.stop(time + 0.45);
  }

  private hat(time: number, gainValue: number) {
    const ctx = this.ctx!;
    const dur = 0.05;
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.25));
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 7000;
    const g = ctx.createGain();
    g.gain.value = gainValue;
    src.connect(hp);
    hp.connect(g);
    g.connect(this.master!);
    src.start(time);
  }

  private setChord(time: number) {
    const root = this.roots[this.chordStep % this.roots.length];
    const freqs = [root, root, root * 1.5];
    this.pads.forEach((o, i) => o.frequency.setTargetAtTime(freqs[i], time, 0.25));
    this.chordStep++;
  }

  private loop = () => {
    const ctx = this.ctx;
    if (!ctx) return;
    const beat = 60 / BPM;
    const time = this.nextBeat;
    const section = useStore.getState().section;
    const intensity = section / (TOTAL_SECTIONS - 1); // 0..1 across the journey

    this.kick(time);
    this.hat(time + beat * 0.5, 0.05 + intensity * 0.12);
    if (intensity > 0.5) this.hat(time + beat * 0.75, 0.04 + intensity * 0.08);
    if (this.beatIndex % 8 === 0) this.setChord(time);

    if (this.lp) this.lp.frequency.setTargetAtTime(280 + intensity * 1200, time, 0.5);
    if (this.padGain) this.padGain.gain.setTargetAtTime(0.1 + intensity * 0.07, time, 0.5);

    this.beatIndex++;
    this.nextBeat += beat;
    this.timer = window.setTimeout(this.loop, beat * 1000 * 0.85);
  };

  async enable() {
    this.ensure();
    if (!this.ctx || !this.master) return;
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    this.master.gain.cancelScheduledValues(this.ctx.currentTime);
    this.master.gain.linearRampToValueAtTime(0.85, this.ctx.currentTime + 1.4);
    if (!this.started) {
      this.started = true;
      this.nextBeat = this.ctx.currentTime + 0.1;
      this.loop();
    }
  }

  disable() {
    if (!this.ctx || !this.master) return;
    this.master.gain.cancelScheduledValues(this.ctx.currentTime);
    this.master.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.6);
  }
}

let instance: WatchAudio | null = null;
export function getAudio(): WatchAudio {
  if (!instance) instance = new WatchAudio();
  return instance;
}
