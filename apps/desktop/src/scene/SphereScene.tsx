import { Suspense, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { Sphere } from "../sphere/Sphere";
import { Satellites } from "../sphere/Satellites";
import { Starfield } from "../sphere/Starfield";

/** Eases the camera toward the pointer for subtle motion depth (parallax). */
function CameraRig() {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3(0, 0, 4.4));
  useFrame((state, dt) => {
    const d = Math.min(dt, 0.05);
    target.current.x = state.pointer.x * 0.45;
    target.current.y = state.pointer.y * 0.32;
    camera.position.x = THREE.MathUtils.damp(camera.position.x, target.current.x, 3, d);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, target.current.y, 3, d);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

/**
 * The cinematic stage. Fully emissive — the Sphere is the light. Bloom turns the
 * HDR rim + internal stars into the volumetric glow that sells the HUD look.
 */
export function SphereScene() {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
      }}
      camera={{ position: [0, 0, 4.4], fov: 42 }}
      onCreated={({ gl }) => gl.setClearColor("#04060a", 1)}
    >
      <Suspense fallback={null}>
        <CameraRig />
        <Starfield />
        <Sphere />
        <Satellites />
        <EffectComposer multisampling={0}>
          <Bloom
            intensity={0.95}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.25}
            mipmapBlur
            radius={0.7}
          />
          <Vignette eskil={false} offset={0.25} darkness={0.85} />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
}
