import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { dataVertex, dataFragment } from "./shaders";
import { drive } from "./drive";

const COUNT = 3600;

/** Layer 3 — data streams. Thousands of motes travelling orbits: light highways. */
export function DataStreams() {
  const mat = useRef<THREE.ShaderMaterial>(null);

  const attrs = useMemo(() => {
    const radius = new Float32Array(COUNT);
    const tilt = new Float32Array(COUNT);
    const phase = new Float32Array(COUNT);
    const speed = new Float32Array(COUNT);
    const seed = new Float32Array(COUNT);
    const dummy = new Float32Array(COUNT * 3); // position attribute (unused; computed in shader)
    for (let i = 0; i < COUNT; i++) {
      radius[i] = 0.5 + Math.random() * 0.95;
      tilt[i] = Math.random() * Math.PI;
      phase[i] = Math.random();
      speed[i] = (0.15 + Math.random() * 0.5) * (Math.random() > 0.5 ? 1 : -1);
      seed[i] = Math.random();
    }
    return { radius, tilt, phase, speed, seed, dummy };
  }, []);

  const u = useMemo(
    () => ({
      uTime: { value: 0 }, uFlow: { value: 1 }, uSize: { value: 5 },
      uColor: { value: new THREE.Color("#36b9ff") }, uWhite: { value: new THREE.Color("#eaf6ff") },
    }),
    []
  );

  useFrame(() => {
    if (mat.current) {
      mat.current.uniforms.uTime.value = drive.t;
      mat.current.uniforms.uFlow.value = drive.flow;
      mat.current.uniforms.uSize.value = 4 + drive.audio * 5 + drive.activity * 2;
      (mat.current.uniforms.uColor.value as THREE.Color).copy(drive.glow);
    }
  });

  return (
    <points renderOrder={3}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[attrs.dummy, 3]} />
        <bufferAttribute attach="attributes-aRadius" args={[attrs.radius, 1]} />
        <bufferAttribute attach="attributes-aTilt" args={[attrs.tilt, 1]} />
        <bufferAttribute attach="attributes-aPhase" args={[attrs.phase, 1]} />
        <bufferAttribute attach="attributes-aSpeed" args={[attrs.speed, 1]} />
        <bufferAttribute attach="attributes-aSeed" args={[attrs.seed, 1]} />
      </bufferGeometry>
      <shaderMaterial ref={mat} vertexShader={dataVertex} fragmentShader={dataFragment}
        uniforms={u} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}
