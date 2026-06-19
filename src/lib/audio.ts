'use client';

// Fully procedural spatial audio — zero asset files.
// A low ambient drone + a filtered tick once per second, lightly panned.
// Created lazily on first user gesture (browsers block autoplay).

class WatchAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private droneGain: GainNode | null = null;
  private tickTimer: number | null = null;
  private panner: StereoPannerNode | null = null;
  private started = false;

  private ensure() {
    if (this.ctx) return;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    this.ctx = ctx;

    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    this.master = master;

    // Ambient drone: two detuned saws through a low-pass, slow LFO on gain.
    const drone = ctx.createGain();
    drone.gain.value = 0.06;
    drone.connect(master);
    this.droneGain = drone;

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 220;
    lp.Q.value = 0.6;
    lp.connect(drone);

    const oscA = ctx.createOscillator();
    oscA.type = 'sawtooth';
    oscA.frequency.value = 55;
    const oscB = ctx.createOscillator();
    oscB.type = 'sawtooth';
    oscB.frequency.value = 55.4;
    oscA.connect(lp);
    oscB.connect(lp);
    oscA.start();
    oscB.start();

    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.025;
    lfo.connect(lfoGain);
    lfoGain.connect(drone.gain);
    lfo.start();

    // Panner for the tick (spatial drift).
    const panner = ctx.createStereoPanner();
    panner.connect(master);
    this.panner = panner;
  }

  private scheduleTick = () => {
    const ctx = this.ctx;
    const panner = this.panner;
    if (!ctx || !panner) return;

    // Short filtered noise burst → mechanical "tick".
    const dur = 0.045;
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const env = Math.exp(-i / (data.length * 0.18));
      data[i] = (Math.random() * 2 - 1) * env;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 2600;
    bp.Q.value = 6;

    const g = ctx.createGain();
    g.gain.value = 0.5;

    src.connect(bp);
    bp.connect(g);
    g.connect(panner);

    panner.pan.setValueAtTime(Math.sin(ctx.currentTime * 0.6) * 0.5, ctx.currentTime);
    src.start();

    this.tickTimer = window.setTimeout(this.scheduleTick, 1000);
  };

  async enable() {
    this.ensure();
    if (!this.ctx || !this.master) return;
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    this.master.gain.cancelScheduledValues(this.ctx.currentTime);
    this.master.gain.linearRampToValueAtTime(0.9, this.ctx.currentTime + 1.2);
    if (!this.started) {
      this.started = true;
      this.scheduleTick();
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
