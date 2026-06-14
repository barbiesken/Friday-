import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  coreVertex, coreFragment,
  shellVertex, shellFragment,
  atmoVertex, atmoFragment,
  particleVertex, particleFragment,
} from "./shaders";
import { useFriday } from "../core/store";
import { emotionThemes } from "../core/theme";
import type { AssistantState } from "../core/types";

interface Targets {
  displace: number; breatheAmp: number; breatheSpeed: number;
  activity: number; storm: number; alert: number;
  rimGain: number; rimAlpha: number; bodyAlpha: number; wobble: number;
  atmoGain: number; particleSize: number; scale: number; spin: number;
}

const T: Record<AssistantState, Targets> = {
  boot:        { displace: .05, breatheAmp: .02, breatheSpeed: .6, activity: .25, storm: .25, alert: 0, rimGain: 1.0, rimAlpha: .85, bodyAlpha: .04, wobble: .02, atmoGain: .7,  particleSize: 5,  scale: 1.0,  spin: .04 },
  idle:        { displace: .05, breatheAmp: .035,breatheSpeed: .8, activity: .22, storm: 0,   alert: 0, rimGain: 1.1, rimAlpha: .9,  bodyAlpha: .05, wobble: .02, atmoGain: .8,  particleSize: 5,  scale: 1.0,  spin: .05 },
  listening:   { displace: .05, breatheAmp: .03, breatheSpeed: 1.2,activity: .5,  storm: .1,  alert: 0, rimGain: 1.35,rimAlpha: 1.0, bodyAlpha: .06, wobble: .03, atmoGain: 1.0, particleSize: 7,  scale: 1.03, spin: .07 },
  thinking:    { displace: .06, breatheAmp: .03, breatheSpeed: 1.0,activity: .7,  storm: 1.0, alert: 0, rimGain: 1.25,rimAlpha: .95, bodyAlpha: .06, wobble: .035,atmoGain: 1.05,particleSize: 6,  scale: 1.0,  spin: .18 },
  speaking:    { displace: .055,breatheAmp: .05, breatheSpeed: 2.2,activity: .8,  storm: .2,  alert: 0, rimGain: 1.4, rimAlpha: 1.0, bodyAlpha: .07, wobble: .03, atmoGain: 1.1, particleSize: 7,  scale: 1.02, spin: .08 },
  planning:    { displace: .05, breatheAmp: .03, breatheSpeed: .9, activity: .5,  storm: .3,  alert: 0, rimGain: 1.2, rimAlpha: .95, bodyAlpha: .06, wobble: .03, atmoGain: 1.0, particleSize: 6,  scale: 1.0,  spin: .1  },
  executing:   { displace: .06, breatheAmp: .03, breatheSpeed: 1.4,activity: .6,  storm: .45, alert: 0, rimGain: 1.25,rimAlpha: .95, bodyAlpha: .06, wobble: .035,atmoGain: 1.0, particleSize: 6,  scale: 1.0,  spin: .12 },
  alert:       { displace: .05, breatheAmp: .04, breatheSpeed: 3.0,activity: .85, storm: .35, alert: 1, rimGain: 1.5, rimAlpha: 1.0, bodyAlpha: .08, wobble: .03, atmoGain: 1.3, particleSize: 7,  scale: 1.02, spin: .06 },
  celebrating: { displace: .07, breatheAmp: .07, breatheSpeed: 2.4,activity: 1.0, storm: .25, alert: 0, rimGain: 1.7, rimAlpha: 1.0, bodyAlpha: .08, wobble: .04, atmoGain: 1.5, particleSize: 9,  scale: 1.07, spin: .14 },
  sleep:       { displace: .03, breatheAmp: .02, breatheSpeed: .35,activity: .06, storm: 0,   alert: 0, rimGain: .6,  rimAlpha: .7,  bodyAlpha: .03, wobble: .015,atmoGain: .4,  particleSize: 4,  scale: .96,  spin: .02 },
  whisper:     { displace: .04, breatheAmp: .025,breatheSpeed: .7, activity: .28, storm: 0,   alert: 0, rimGain: .85, rimAlpha: .8,  bodyAlpha: .04, wobble: .02, atmoGain: .6,  particleSize: 5,  scale: .98,  spin: .04 },
};

const damp = THREE.MathUtils.damp;
const PARTICLES = 760;

export function Sphere() {
  const group = useRef<THREE.Group>(null);
  const coreMat = useRef<THREE.ShaderMaterial>(null);
  const shellMat = useRef<THREE.ShaderMaterial>(null);
  const atmoMat = useRef<THREE.ShaderMaterial>(null);
  const partMat = useRef<THREE.ShaderMaterial>(null);
  const t = useRef(0);

  const coreCol = useMemo(() => new THREE.Color().fromArray(emotionThemes.calm.core), []);
  const glowCol = useMemo(() => new THREE.Color().fromArray(emotionThemes.calm.glow), []);
  const coreTgt = useMemo(() => new THREE.Color(), []);
  const glowTgt = useMemo(() => new THREE.Color(), []);

  const coreU = useMemo(() => ({
    uTime: { value: 0 }, uDisplace: { value: .05 }, uBreathe: { value: 0 },
    uStorm: { value: 0 }, uAudio: { value: 0 }, uActivity: { value: .2 }, uAlert: { value: 0 },
    uCore: { value: coreCol }, uGlow: { value: glowCol },
  }), [coreCol, glowCol]);

  const shellU = useMemo(() => ({
    uTime: { value: 0 }, uWobble: { value: .02 }, uBreathe: { value: 0 },
    uFresnelPow: { value: 3.0 }, uRimGain: { value: 1.1 }, uRimAlpha: { value: .9 },
    uBodyAlpha: { value: .05 }, uHue: { value: 0 }, uGlow: { value: glowCol }, uCore: { value: coreCol },
  }), [coreCol, glowCol]);

  const atmoU = useMemo(() => ({ uGlow: { value: glowCol }, uGain: { value: .8 } }), [glowCol]);

  const partU = useMemo(() => ({
    uTime: { value: 0 }, uStorm: { value: 0 }, uAudio: { value: 0 }, uSize: { value: 5 },
    uColor: { value: glowCol },
  }), [glowCol]);

  const particles = useMemo(() => {
    const pos = new Float32Array(PARTICLES * 3);
    const seed = new Float32Array(PARTICLES);
    const rad = new Float32Array(PARTICLES);
    for (let i = 0; i < PARTICLES; i++) {
      const r = 0.18 + Math.cbrt(Math.random()) * 0.74; // fill volume, bias outward
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
      pos[i * 3 + 2] = r * Math.cos(ph);
      seed[i] = Math.random();
      rad[i] = r / 0.92;
    }
    return { pos, seed, rad };
  }, []);

  useFrame((_, dt) => {
    const d = Math.min(dt, 0.05);
    t.current += d;
    const time = t.current;
    const { state, emotion, audioLevel } = useFriday.getState();
    const tg = T[state];
    const th = emotionThemes[emotion];

    coreTgt.fromArray(th.core); glowTgt.fromArray(th.glow);
    coreCol.lerp(coreTgt, 1 - Math.exp(-3 * d));
    glowCol.lerp(glowTgt, 1 - Math.exp(-3 * d));

    const audioActive = state === "listening" || state === "speaking" || state === "whisper";
    const audio = audioActive ? audioLevel : 0;
    const breathe = Math.sin(time * tg.breatheSpeed) * tg.breatheAmp;

    if (coreMat.current) {
      const u = coreMat.current.uniforms;
      u.uTime.value = time;
      u.uDisplace.value = damp(u.uDisplace.value, tg.displace, 4, d);
      u.uStorm.value = damp(u.uStorm.value, tg.storm, 4, d);
      u.uAudio.value = damp(u.uAudio.value, audio, 12, d);
      u.uActivity.value = damp(u.uActivity.value, state === "speaking" ? Math.min(1, tg.activity + audioLevel * 0.4) : tg.activity, 5, d);
      u.uAlert.value = damp(u.uAlert.value, tg.alert, 6, d);
      u.uBreathe.value = breathe;
    }
    if (shellMat.current) {
      const u = shellMat.current.uniforms;
      u.uTime.value = time;
      u.uBreathe.value = breathe;
      u.uHue.value = (u.uHue.value + d * 0.02) % 1;
      u.uWobble.value = damp(u.uWobble.value, tg.wobble, 4, d);
      u.uRimGain.value = damp(u.uRimGain.value, tg.rimGain, 4, d);
      u.uRimAlpha.value = damp(u.uRimAlpha.value, tg.rimAlpha, 4, d);
      u.uBodyAlpha.value = damp(u.uBodyAlpha.value, tg.bodyAlpha, 4, d);
    }
    if (atmoMat.current) {
      atmoMat.current.uniforms.uGain.value = damp(atmoMat.current.uniforms.uGain.value, tg.atmoGain, 4, d);
    }
    if (partMat.current) {
      const u = partMat.current.uniforms;
      u.uTime.value = time;
      u.uStorm.value = damp(u.uStorm.value, tg.storm, 4, d);
      u.uAudio.value = damp(u.uAudio.value, audio, 12, d);
      u.uSize.value = damp(u.uSize.value, tg.particleSize, 4, d);
    }
    if (group.current) {
      const s = tg.scale * (1 + breathe) + (state === "speaking" ? audioLevel * 0.04 : 0);
      group.current.scale.setScalar(damp(group.current.scale.x || 1, s, 6, d));
      group.current.rotation.y += d * tg.spin;
      group.current.rotation.x = Math.sin(time * 0.1) * 0.06;
    }
  });

  return (
    <group ref={group}>
      {/* atmosphere halo */}
      <mesh renderOrder={0}>
        <sphereGeometry args={[1.34, 64, 64]} />
        <shaderMaterial ref={atmoMat} vertexShader={atmoVertex} fragmentShader={atmoFragment}
          uniforms={atmoU} transparent depthWrite={false} side={THREE.BackSide} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* energy soul */}
      <mesh renderOrder={1}>
        <icosahedronGeometry args={[0.62, 24]} />
        <shaderMaterial ref={coreMat} vertexShader={coreVertex} fragmentShader={coreFragment}
          uniforms={coreU} transparent depthWrite={false} />
      </mesh>

      {/* particle field */}
      <points renderOrder={2}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particles.pos, 3]} />
          <bufferAttribute attach="attributes-aSeed" args={[particles.seed, 1]} />
          <bufferAttribute attach="attributes-aRadius" args={[particles.rad, 1]} />
        </bufferGeometry>
        <shaderMaterial ref={partMat} vertexShader={particleVertex} fragmentShader={particleFragment}
          uniforms={partU} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </points>

      {/* glass shell */}
      <mesh renderOrder={3}>
        <icosahedronGeometry args={[1.0, 48]} />
        <shaderMaterial ref={shellMat} vertexShader={shellVertex} fragmentShader={shellFragment}
          uniforms={shellU} transparent depthWrite={false} side={THREE.FrontSide} />
      </mesh>
    </group>
  );
}
