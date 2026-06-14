import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useFriday } from "../core/store";

interface SatSpec {
  radius: number;
  speed: number;
  tilt: number;
  phase: number;
  size: number;
}

/**
 * Orbiting satellites — visible during planning / executing (and a flourish while
 * celebrating). They fade in/out with state so the Sphere "spins up" helpers.
 */
export function Satellites() {
  const group = useRef<THREE.Group>(null);
  const matRefs = useRef<THREE.MeshBasicMaterial[]>([]);
  const visible = useRef(0);

  const sats = useMemo<SatSpec[]>(
    () => [
      { radius: 1.7, speed: 0.9, tilt: 0.3, phase: 0, size: 0.05 },
      { radius: 2.0, speed: -0.6, tilt: -0.5, phase: 2.1, size: 0.045 },
      { radius: 2.3, speed: 0.45, tilt: 0.9, phase: 4.0, size: 0.06 },
      { radius: 1.9, speed: 0.7, tilt: 1.4, phase: 1.0, size: 0.04 },
    ],
    []
  );

  useFrame((_, dt) => {
    const d = Math.min(dt, 0.05);
    const { state } = useFriday.getState();
    const show = state === "planning" || state === "executing" || state === "celebrating";
    visible.current = THREE.MathUtils.damp(visible.current, show ? 1 : 0, 4, d);

    if (group.current) {
      group.current.children.forEach((child, i) => {
        const s = sats[i];
        const t = performance.now() / 1000;
        const a = t * s.speed + s.phase;
        child.position.set(
          Math.cos(a) * s.radius,
          Math.sin(a) * s.radius * Math.sin(s.tilt),
          Math.sin(a) * s.radius * Math.cos(s.tilt)
        );
      });
    }
    for (const m of matRefs.current) if (m) m.opacity = visible.current;
  });

  return (
    <group ref={group}>
      {sats.map((s, i) => (
        <mesh key={i}>
          <sphereGeometry args={[s.size, 16, 16]} />
          <meshBasicMaterial
            ref={(m) => {
              if (m) matRefs.current[i] = m;
            }}
            color={"#7fd3ff"}
            transparent
            opacity={0}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}
