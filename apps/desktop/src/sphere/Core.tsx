import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { updateDrive, drive } from "./drive";
import { atmoVertex, atmoFragment } from "./shaders";
import { CoreReactor } from "./CoreReactor";
import { Rings } from "./Rings";
import { DataStreams } from "./DataStreams";
import { HoloGeometry } from "./HoloGeometry";
import { Agents } from "./Agents";
import { Pulses } from "./Pulses";

/** Advances the shared drive once per frame, before the layers read it. */
function Driver() {
  useFrame((_, dt) => updateDrive(dt));
  return null;
}

/** The atmosphere — the core illuminating the space around it. */
function Atmosphere() {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const u = useMemo(() => ({ uGlow: { value: new THREE.Color("#7fd3ff") }, uGain: { value: 0.8 } }), []);
  useFrame(() => {
    if (mat.current) {
      (mat.current.uniforms.uGlow.value as THREE.Color).copy(drive.glow);
      mat.current.uniforms.uGain.value = 0.5 + drive.activity * 1.1 + drive.alert * 0.6;
    }
  });
  return (
    <mesh renderOrder={0}>
      <sphereGeometry args={[1.5, 64, 64]} />
      <shaderMaterial ref={mat} vertexShader={atmoVertex} fragmentShader={atmoFragment}
        uniforms={u} transparent depthWrite={false} side={THREE.BackSide} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

/**
 * FRIDAY's living computational core — five layers around a bright energy heart.
 * Not an orb: an impossible machine made of light.
 */
export function Core() {
  return (
    <group>
      <Driver />
      <Atmosphere />
      <CoreReactor />
      <Rings />
      <DataStreams />
      <HoloGeometry />
      <Agents />
      <Pulses />
    </group>
  );
}
