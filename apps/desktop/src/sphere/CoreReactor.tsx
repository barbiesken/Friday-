import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { coreVertex, coreFragment } from "./shaders";
import { drive } from "./drive";

/** Layer 1 — the central energy core. Bright blue-white, pulsing, never still. */
export function CoreReactor() {
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.ShaderMaterial>(null);
  const u = useMemo(
    () => ({
      uTime: { value: 0 }, uBreathe: { value: 0 }, uActivity: { value: 0.3 },
      uAudio: { value: 0 }, uAlert: { value: 0 }, uPulse: { value: 0 },
      uCore: { value: new THREE.Color("#2f8fff") }, uGlow: { value: new THREE.Color("#7fd3ff") },
    }),
    []
  );

  useFrame((_, dt) => {
    const d = Math.min(dt, 0.05);
    if (mat.current) {
      const uu = mat.current.uniforms;
      uu.uTime.value = drive.t;
      uu.uBreathe.value = drive.breathe;
      uu.uActivity.value = drive.activity + drive.presence * 0.4;
      uu.uAudio.value = drive.audio;
      uu.uAlert.value = drive.alert;
      uu.uPulse.value = drive.pulse;
      (uu.uCore.value as THREE.Color).copy(drive.color);
      (uu.uGlow.value as THREE.Color).copy(drive.glow);
    }
    if (mesh.current) {
      const s = (1 + drive.breathe) * (1 + drive.audio * 0.06);
      mesh.current.scale.setScalar(THREE.MathUtils.damp(mesh.current.scale.x || 1, s, 8, d));
      mesh.current.rotation.y += d * 0.18;
      mesh.current.rotation.x = Math.sin(drive.t * 0.2) * 0.1;
    }
  });

  return (
    <mesh ref={mesh} renderOrder={2}>
      <icosahedronGeometry args={[0.42, 12]} />
      <shaderMaterial ref={mat} vertexShader={coreVertex} fragmentShader={coreFragment}
        uniforms={u} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}
