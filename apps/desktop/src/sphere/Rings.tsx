import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ringVertex, ringFragment } from "./shaders";
import { drive } from "./drive";

const WHITE = new THREE.Color("#ffffff");

interface RingSpec {
  radius: number; tube: number; tiltX: number; tiltY: number;
  spin: number; precessX: number; precessY: number; segs: number; speedU: number; whiteMix: number;
}

/** A single computational ring — segmented, with a data pulse travelling it. */
function Ring(s: RingSpec) {
  const grp = useRef<THREE.Group>(null);
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.ShaderMaterial>(null);
  const u = useMemo(
    () => ({
      uTime: { value: 0 }, uSpeed: { value: s.speedU }, uSegs: { value: s.segs },
      uBright: { value: 1 }, uColor: { value: new THREE.Color("#7fd3ff") },
    }),
    [s.speedU, s.segs]
  );

  useFrame((_, dt) => {
    const d = Math.min(dt, 0.05);
    if (grp.current) {
      grp.current.rotation.x += s.precessX * d * (0.4 + drive.ringSpeed * 0.3);
      grp.current.rotation.y += s.precessY * d * (0.4 + drive.ringSpeed * 0.3);
    }
    if (mesh.current) mesh.current.rotation.z += s.spin * drive.ringSpeed * d;
    if (mat.current) {
      mat.current.uniforms.uTime.value = drive.t;
      mat.current.uniforms.uBright.value = 0.7 + drive.activity * 0.9 + drive.alert * 0.6;
      (mat.current.uniforms.uColor.value as THREE.Color).copy(drive.glow).lerp(WHITE, s.whiteMix);
    }
  });

  return (
    <group ref={grp} rotation={[s.tiltX, s.tiltY, 0]}>
      <mesh ref={mesh}>
        <torusGeometry args={[s.radius, s.tube, 8, 220]} />
        <shaderMaterial ref={mat} vertexShader={ringVertex} fragmentShader={ringFragment}
          uniforms={u} transparent depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/** Layer 2 — gyroscopic computational rings. Different speeds + directions. */
export function Rings() {
  const rings = useMemo<RingSpec[]>(
    () => [
      { radius: 0.78, tube: 0.006, tiltX: 0.4, tiltY: 0.2, spin: 0.5, precessX: 0.06, precessY: 0.10, segs: 60, speedU: 0.10, whiteMix: 0.15 },
      { radius: 0.96, tube: 0.005, tiltX: 1.3, tiltY: -0.5, spin: -0.35, precessX: -0.08, precessY: 0.05, segs: 90, speedU: 0.07, whiteMix: 0.0 },
      { radius: 1.12, tube: 0.004, tiltX: -0.6, tiltY: 0.9, spin: 0.28, precessX: 0.04, precessY: -0.07, segs: 120, speedU: 0.05, whiteMix: 0.3 },
      { radius: 0.66, tube: 0.007, tiltX: 1.0, tiltY: 1.1, spin: -0.6, precessX: 0.10, precessY: 0.03, segs: 40, speedU: 0.13, whiteMix: 0.1 },
      { radius: 1.34, tube: 0.0035, tiltX: 0.1, tiltY: -1.0, spin: 0.2, precessX: -0.03, precessY: 0.06, segs: 160, speedU: 0.04, whiteMix: 0.2 },
    ],
    []
  );
  return (
    <group renderOrder={3}>
      {rings.map((r, i) => (
        <Ring key={i} {...r} />
      ))}
    </group>
  );
}
