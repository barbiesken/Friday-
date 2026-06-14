import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { drive } from "./drive";

const N = 5;

/** Speaking mode — waves travel outward from the core, synced to the voice. */
export function Pulses() {
  const { camera } = useThree();
  const meshes = useRef<THREE.Mesh[]>([]);
  const mats = useRef<THREE.MeshBasicMaterial[]>([]);
  const offsets = useMemo(() => Array.from({ length: N }, (_, i) => i / N), []);

  useFrame(() => {
    const amount = drive.pulse * 0.9 + (drive.pulse > 0.015 ? 0.18 : 0);
    for (let i = 0; i < N; i++) {
      const m = meshes.current[i];
      const mat = mats.current[i];
      if (!m || !mat) continue;
      const frac = (drive.t * 0.6 + offsets[i]) % 1;
      const s = 0.5 + frac * 2.4;
      m.scale.setScalar(s);
      m.lookAt(camera.position);
      mat.opacity = Math.max(0, (1 - frac) * amount);
      mat.color.copy(drive.glow);
    }
  });

  return (
    <group renderOrder={1}>
      {offsets.map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) meshes.current[i] = el;
          }}
        >
          <ringGeometry args={[0.92, 1.0, 80]} />
          <meshBasicMaterial
            ref={(el) => {
              if (el) mats.current[i] = el;
            }}
            transparent
            opacity={0}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}
