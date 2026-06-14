import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { sphereVertex, sphereFragment } from "./shaders";
import { useFriday } from "../core/store";
import { emotionThemes } from "../core/theme";
import type { AssistantState } from "../core/types";

/** Per-state behavioural targets the shader is lerped toward. */
interface Targets {
  displace: number;
  breatheAmp: number;
  breatheSpeed: number;
  ripple: number;
  storm: number;
  activity: number;
  alert: number;
  glowGain: number;
  scale: number;
  spin: number;
}

const STATE_TARGETS: Record<AssistantState, Targets> = {
  boot:        { displace: 0.045, breatheAmp: 0.02,  breatheSpeed: 0.6, ripple: 0,   storm: 0.2,  activity: 0.2,  alert: 0, glowGain: 0.8,  scale: 1.0,  spin: 0.04 },
  idle:        { displace: 0.05,  breatheAmp: 0.035, breatheSpeed: 0.8, ripple: 0,   storm: 0,    activity: 0.18, alert: 0, glowGain: 1.0,  scale: 1.0,  spin: 0.05 },
  listening:   { displace: 0.05,  breatheAmp: 0.03,  breatheSpeed: 1.2, ripple: 1,   storm: 0,    activity: 0.5,  alert: 0, glowGain: 1.15, scale: 1.03, spin: 0.07 },
  thinking:    { displace: 0.06,  breatheAmp: 0.03,  breatheSpeed: 1.0, ripple: 0,   storm: 1,    activity: 0.7,  alert: 0, glowGain: 1.2,  scale: 1.0,  spin: 0.16 },
  speaking:    { displace: 0.055, breatheAmp: 0.05,  breatheSpeed: 2.2, ripple: 0.3, storm: 0.15, activity: 0.75, alert: 0, glowGain: 1.25, scale: 1.02, spin: 0.08 },
  planning:    { displace: 0.05,  breatheAmp: 0.03,  breatheSpeed: 0.9, ripple: 0,   storm: 0.25, activity: 0.5,  alert: 0, glowGain: 1.1,  scale: 1.0,  spin: 0.1  },
  executing:   { displace: 0.06,  breatheAmp: 0.03,  breatheSpeed: 1.4, ripple: 0.2, storm: 0.4,  activity: 0.6,  alert: 0, glowGain: 1.15, scale: 1.0,  spin: 0.12 },
  alert:       { displace: 0.05,  breatheAmp: 0.04,  breatheSpeed: 3.0, ripple: 0,   storm: 0.3,  activity: 0.8,  alert: 1, glowGain: 1.3,  scale: 1.02, spin: 0.06 },
  celebrating: { displace: 0.07,  breatheAmp: 0.07,  breatheSpeed: 2.4, ripple: 0.2, storm: 0.2,  activity: 1.0,  alert: 0, glowGain: 1.5,  scale: 1.08, spin: 0.14 },
  sleep:       { displace: 0.03,  breatheAmp: 0.02,  breatheSpeed: 0.35,ripple: 0,   storm: 0,    activity: 0.05, alert: 0, glowGain: 0.45, scale: 0.96, spin: 0.02 },
  whisper:     { displace: 0.04,  breatheAmp: 0.025, breatheSpeed: 0.7, ripple: 0.5, storm: 0,    activity: 0.25, alert: 0, glowGain: 0.7,  scale: 0.98, spin: 0.04 },
};

const damp = THREE.MathUtils.damp;

export function Sphere() {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const clock = useRef(0);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDisplace: { value: 0.05 },
      uBreathe: { value: 0 },
      uRipple: { value: 0 },
      uAudio: { value: 0 },
      uStorm: { value: 0 },
      uActivity: { value: 0.18 },
      uAlert: { value: 0 },
      uGlowGain: { value: 1 },
      uOpacity: { value: 1 },
      uCore: { value: new THREE.Color().fromArray(emotionThemes.calm.core) },
      uGlow: { value: new THREE.Color().fromArray(emotionThemes.calm.glow) },
    }),
    []
  );

  // scratch colors for damping
  const coreTarget = useMemo(() => new THREE.Color(), []);
  const glowTarget = useMemo(() => new THREE.Color(), []);

  useFrame((_, dt) => {
    const d = Math.min(dt, 0.05); // clamp to avoid jumps after tab refocus
    clock.current += d;
    const t = clock.current;

    const { state, emotion, audioLevel } = useFriday.getState();
    const tgt = STATE_TARGETS[state];
    const theme = emotionThemes[emotion];
    const u = uniforms;

    const audioActive = state === "listening" || state === "speaking" || state === "whisper";
    const audioTarget = audioActive ? audioLevel : 0;

    u.uTime.value = t;
    u.uDisplace.value = damp(u.uDisplace.value, tgt.displace, 4, d);
    u.uRipple.value = damp(u.uRipple.value, tgt.ripple, 5, d);
    u.uStorm.value = damp(u.uStorm.value, tgt.storm, 4, d);
    u.uAlert.value = damp(u.uAlert.value, tgt.alert, 6, d);
    u.uGlowGain.value = damp(u.uGlowGain.value, tgt.glowGain, 4, d);
    u.uAudio.value = damp(u.uAudio.value, audioTarget, 12, d);

    // speaking pushes activity with the voice envelope
    const activityTarget =
      state === "speaking" ? Math.min(1, tgt.activity + audioLevel * 0.5) : tgt.activity;
    u.uActivity.value = damp(u.uActivity.value, activityTarget, 5, d);

    // breathing
    const breathe = Math.sin(t * tgt.breatheSpeed) * tgt.breatheAmp;
    u.uBreathe.value = breathe;

    // emotion colour drift
    coreTarget.fromArray(theme.core);
    glowTarget.fromArray(theme.glow);
    (u.uCore.value as THREE.Color).lerp(coreTarget, 1 - Math.exp(-3 * d));
    (u.uGlow.value as THREE.Color).lerp(glowTarget, 1 - Math.exp(-3 * d));

    if (meshRef.current) {
      const audioBump = state === "speaking" ? audioLevel * 0.04 : 0;
      const s = tgt.scale * (1 + breathe) + audioBump;
      meshRef.current.scale.setScalar(damp(meshRef.current.scale.x, s, 6, d));
      meshRef.current.rotation.y += d * tgt.spin;
      meshRef.current.rotation.x = Math.sin(t * 0.12) * 0.08;
    }
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1, 24]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={sphereVertex}
        fragmentShader={sphereFragment}
        uniforms={uniforms}
        transparent
      />
    </mesh>
  );
}
