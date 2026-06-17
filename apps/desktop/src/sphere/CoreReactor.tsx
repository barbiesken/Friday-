import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { vortexVertex, vortexFragment } from "./shaders";
import { drive } from "./drive";

/**
 * Layer 1 — the reactor heart: a camera-facing spiral vortex (plasma disc with
 * two logarithmic arms swirling into a white-hot center). Reads as an engineered
 * star rather than a soft orb.
 */
export function CoreReactor() {
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.ShaderMaterial>(null);
  const { camera } = useThree();
  const u = useMemo(
    () => ({
      uTime: { value: 0 }, uActivity: { value: 0.3 }, uAudio: { value: 0 }, uAlert: { value: 0 },
      uCore: { value: new THREE.Color("#2f8fff") }, uGlow: { value: new THREE.Color("#7fd3ff") },
    }),
    []
  );

  useFrame((_, dt) => {
    const d = Math.min(dt, 0.05);
    if (mat.current) {
      const uu = mat.current.uniforms;
      uu.uTime.value = drive.t;
      uu.uActivity.value = drive.activity + drive.presence * 0.4;
      uu.uAudio.value = drive.audio;
      uu.uAlert.value = drive.alert;
      (uu.uCore.value as THREE.Color).copy(drive.color);
      (uu.uGlow.value as THREE.Color).copy(drive.glow);
    }
    if (mesh.current) {
      mesh.current.quaternion.copy(camera.quaternion); // billboard toward the eye
      const s = 1 + drive.breathe * 0.6 + drive.audio * 0.05;
      mesh.current.scale.setScalar(THREE.MathUtils.damp(mesh.current.scale.x || 1, s, 8, d));
    }
  });

  return (
    <mesh ref={mesh} renderOrder={2}>
      <planeGeometry args={[1.42, 1.42]} />
      <shaderMaterial
        ref={mat}
        vertexShader={vortexVertex}
        fragmentShader={vortexFragment}
        uniforms={u}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
