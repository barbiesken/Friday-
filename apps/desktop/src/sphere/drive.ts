import * as THREE from "three";
import { useFriday } from "../core/store";
import { emotionThemes } from "../core/theme";
import type { AssistantState } from "../core/types";

/**
 * One smoothed set of values that every core layer reads. The Core component
 * advances it once per frame (before the layers), so rings, particles, geometry
 * and the reactor all move in lock-step with FRIDAY's state.
 */
export const drive = {
  t: 0,
  color: new THREE.Color("#2f8fff"),
  glow: new THREE.Color("#7fd3ff"),
  activity: 0.28, // reactor energy / brightness
  ringSpeed: 1, // computational-ring speed multiplier
  flow: 1, // data-stream speed multiplier
  storm: 0.12, // turbulence
  geom: 0.18, // holographic geometry presence (forming/dissolving)
  audio: 0,
  breathe: 0,
  alert: 0,
  presence: 0, // attention toward the user (listening): rings still, core bright
  pulse: 0, // speaking voice envelope (outward waves)
  burst: 0, // one-shot celebration shockwave
  activeAgent: null as string | null, // an agent dispatched to execute
};

interface P {
  activity: number; ringSpeed: number; flow: number; storm: number; geom: number;
  presence: number; breatheAmp: number; breatheSpeed: number; alert: number;
}

const TARGETS: Record<AssistantState, P> = {
  boot:        { activity: .55, ringSpeed: 1.2, flow: 1.4, storm: .3, geom: .4, presence: .2, breatheAmp: .02, breatheSpeed: .6, alert: 0 },
  idle:        { activity: .30, ringSpeed: 1.0, flow: 1.0, storm: .12, geom: .18, presence: 0, breatheAmp: .03, breatheSpeed: .8, alert: 0 },
  // PRESENCE: rings nearly stop, core brightens, streams pull in — attention turns to you
  listening:   { activity: .95, ringSpeed: .12, flow: .5, storm: .1, geom: .25, presence: 1, breatheAmp: .025, breatheSpeed: 1.4, alert: 0 },
  // THINKING: rings accelerate, pathways light up, geometry appears, particles race
  thinking:    { activity: .82, ringSpeed: 3.4, flow: 3.2, storm: 1.0, geom: 1.0, presence: .2, breatheAmp: .03, breatheSpeed: 1.1, alert: 0 },
  speaking:    { activity: .85, ringSpeed: 1.3, flow: 1.6, storm: .25, geom: .35, presence: .3, breatheAmp: .05, breatheSpeed: 2.2, alert: 0 },
  planning:    { activity: .58, ringSpeed: 1.7, flow: 1.5, storm: .3, geom: .55, presence: .2, breatheAmp: .03, breatheSpeed: .9, alert: 0 },
  executing:   { activity: .72, ringSpeed: 2.4, flow: 2.4, storm: .5, geom: .6, presence: .1, breatheAmp: .03, breatheSpeed: 1.4, alert: 0 },
  alert:       { activity: .92, ringSpeed: 2.0, flow: 1.8, storm: .4, geom: .4, presence: .4, breatheAmp: .04, breatheSpeed: 3.0, alert: 1 },
  celebrating: { activity: 1.1, ringSpeed: 2.4, flow: 2.2, storm: .3, geom: .8, presence: 0, breatheAmp: .06, breatheSpeed: 2.4, alert: 0 },
  sleep:       { activity: .08, ringSpeed: .3, flow: .4, storm: 0, geom: .05, presence: 0, breatheAmp: .02, breatheSpeed: .35, alert: 0 },
  whisper:     { activity: .32, ringSpeed: .6, flow: .7, storm: 0, geom: .1, presence: .4, breatheAmp: .025, breatheSpeed: .7, alert: 0 },
};

const damp = THREE.MathUtils.damp;
const ct = new THREE.Color();
const gt = new THREE.Color();

export function updateDrive(dt: number): void {
  const d = Math.min(dt, 0.05);
  drive.t += d;
  const { state, emotion, audioLevel, activeAgent } = useFriday.getState();
  const p = TARGETS[state];
  const th = emotionThemes[emotion];
  drive.activeAgent = activeAgent;

  ct.fromArray(th.core);
  gt.fromArray(th.glow);
  drive.color.lerp(ct, 1 - Math.exp(-3 * d));
  drive.glow.lerp(gt, 1 - Math.exp(-3 * d));

  const audioActive = state === "listening" || state === "speaking" || state === "whisper";
  const audio = audioActive ? audioLevel : 0;
  drive.audio = damp(drive.audio, audio, 12, d);
  drive.activity = damp(drive.activity, state === "speaking" ? Math.min(1.3, p.activity + audioLevel * 0.4) : p.activity, 5, d);
  drive.ringSpeed = damp(drive.ringSpeed, p.ringSpeed, 4, d);
  drive.flow = damp(drive.flow, p.flow, 4, d);
  drive.storm = damp(drive.storm, p.storm, 4, d);
  drive.geom = damp(drive.geom, p.geom, 3, d);
  drive.presence = damp(drive.presence, p.presence, 5, d);
  drive.alert = damp(drive.alert, p.alert, 6, d);
  drive.breathe = Math.sin(drive.t * p.breatheSpeed) * p.breatheAmp;
  drive.pulse = state === "speaking" ? audioLevel : damp(drive.pulse, 0, 6, d);
  drive.burst = state === "celebrating" ? 1 : damp(drive.burst, 0, 2, d);
}
