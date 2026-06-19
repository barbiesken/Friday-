'use client';

import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { createParticlesMaterial } from '@/shaders/materials';
import { useStore } from '@/lib/store';

export default function Particles() {
  const perfMode = useStore((s) => s.perfMode);
  const count = perfMode ? 300 : 900;
  const range = 16;
  const points = useRef<THREE.Points>(null);
  const gl = useThree((s) => s.gl);

  const material = useMemo(() => createParticlesMaterial(), []);

  const { positions, scales, speeds, offsets } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const speeds = new Float32Array(count);
    const offsets = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // Cylindrical cloud around the watch.
      const r = 1.5 + Math.random() * 7;
      const a = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = (Math.random() - 0.5) * range;
      positions[i * 3 + 2] = Math.sin(a) * r;
      scales[i] = 0.4 + Math.random() * 1.6;
      speeds[i] = 0.12 + Math.random() * 0.4;
      offsets[i] = Math.random() * 100;
    }
    return { positions, scales, speeds, offsets };
  }, [count]);

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime;
    material.uniforms.uPixelRatio.value = gl.getPixelRatio();
    material.uniforms.uRange.value = range;
  });

  return (
    <points ref={points} material={material} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aScale" args={[scales, 1]} />
        <bufferAttribute attach="attributes-aSpeed" args={[speeds, 1]} />
        <bufferAttribute attach="attributes-aOffset" args={[offsets, 1]} />
      </bufferGeometry>
    </points>
  );
}
