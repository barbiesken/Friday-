import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { drive } from "./drive";

export interface AgentSpec {
  name: string; color: string; radius: number; tilt: number; speed: number; phase: number; size: number;
}

/** The agent swarm — each AI agent is a module on its own orbit. */
export const AGENTS: AgentSpec[] = [
  { name: "Research", color: "#2f8fff", radius: 1.55, tilt: 0.5, speed: 0.32, phase: 0.0, size: 0.026 },
  { name: "Calendar", color: "#eaf6ff", radius: 1.74, tilt: -0.8, speed: -0.24, phase: 1.6, size: 0.024 },
  { name: "Memory", color: "#36d0ff", radius: 1.36, tilt: 1.1, speed: 0.4, phase: 3.0, size: 0.028 },
  { name: "Tasks", color: "#36b9ff", radius: 1.9, tilt: 0.2, speed: 0.2, phase: 4.4, size: 0.022 },
  { name: "Builder", color: "#8fe9ff", radius: 0.98, tilt: 1.4, speed: 0.55, phase: 2.2, size: 0.03 },
];

function Agent({ spec }: { spec: AgentSpec }) {
  const grp = useRef<THREE.Group>(null);
  const node = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Mesh>(null);
  const scratch = useMemo(() => new THREE.Vector3(), []);
  const radMult = useRef(1);
  const active = useRef(0);

  useFrame((_, dt) => {
    const d = Math.min(dt, 0.05);
    const isActive = drive.activeAgent === spec.name;
    // when dispatched, the agent leaves its orbit (extends out, toward the eye)
    radMult.current = THREE.MathUtils.damp(radMult.current, isActive ? 1.7 : 1, 4, d);
    active.current = THREE.MathUtils.damp(active.current, isActive ? 1 : 0, 5, d);

    const ang = drive.t * spec.speed * (1 + active.current) + spec.phase;
    const r = spec.radius * radMult.current;
    const ct = Math.cos(spec.tilt), st = Math.sin(spec.tilt);
    const cx = Math.cos(ang) * r, cy = Math.sin(ang) * r;
    scratch.set(cx, cy * ct, cy * st + active.current * 0.6); // tilt + lift toward camera
    node.current?.position.copy(scratch);
    halo.current?.position.copy(scratch);
    node.current?.scale.setScalar(1 + active.current * 1.1);
    halo.current?.scale.setScalar(1 + active.current * 1.6);
    if (grp.current) {
      // orbitals focus inward when FRIDAY turns its attention to you
      const s = 1 - drive.presence * 0.42;
      grp.current.scale.setScalar(THREE.MathUtils.damp(grp.current.scale.x || 1, s, 6, d));
    }
  });

  return (
    <group ref={grp}>
      <mesh rotation={[spec.tilt, 0, 0]}>
        <torusGeometry args={[spec.radius, 0.0016, 6, 140]} />
        <meshBasicMaterial color={spec.color} transparent opacity={0.22} depthWrite={false}
          blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      <mesh ref={halo}>
        <sphereGeometry args={[spec.size * 2.6, 12, 12]} />
        <meshBasicMaterial color={spec.color} transparent opacity={0.22} depthWrite={false}
          blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      <mesh ref={node}>
        <sphereGeometry args={[spec.size, 16, 16]} />
        <meshBasicMaterial color={spec.color} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Layer 5 — orbital satellites / agent swarm. */
export function Agents() {
  return (
    <group renderOrder={3}>
      {AGENTS.map((a) => (
        <Agent key={a.name} spec={a} />
      ))}
    </group>
  );
}
