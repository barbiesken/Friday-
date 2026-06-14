import { Suspense, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Grid } from "@react-three/drei";
import { EffectComposer, Bloom, ChromaticAberration, Vignette, Noise } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import { Sphere } from "../sphere/Sphere";
import { Satellites } from "../sphere/Satellites";
import { Starfield } from "../sphere/Starfield";

/** Eases the camera toward the pointer for subtle motion depth (parallax). */
function CameraRig() {
  const { camera } = useThree();
  useFrame((state, dt) => {
    const d = Math.min(dt, 0.05);
    camera.position.x = THREE.MathUtils.damp(camera.position.x, state.pointer.x * 0.5, 3, d);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, state.pointer.y * 0.34, 3, d);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

/**
 * The cinematic stage. A transparent glass Sphere over a deep field. Bloom turns
 * the HDR rim + particles into volumetric glow; chromatic aberration + grain add
 * the lensed, filmic quality.
 */
export function SphereScene() {
  const aberration = useRef(new THREE.Vector2(0.0008, 0.0006));
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
      }}
      camera={{ position: [0, 0, 4.2], fov: 42 }}
      onCreated={({ gl }) => gl.setClearColor("#04060a", 1)}
    >
      <Suspense fallback={null}>
        <CameraRig />
        <Starfield />
        <Grid
          position={[0, -1.75, 0]}
          args={[40, 40]}
          cellSize={0.55}
          cellThickness={0.5}
          cellColor="#0c2740"
          sectionSize={3}
          sectionThickness={1}
          sectionColor="#1c6fa8"
          fadeDistance={24}
          fadeStrength={4}
          infiniteGrid
        />
        <Sphere />
        <Satellites />
        <EffectComposer multisampling={0}>
          <Bloom intensity={1.15} luminanceThreshold={0.18} luminanceSmoothing={0.3} mipmapBlur radius={0.78} />
          <ChromaticAberration offset={aberration.current} radialModulation modulationOffset={0.4} />
          <Noise premultiply blendFunction={BlendFunction.SCREEN} opacity={0.045} />
          <Vignette eskil={false} offset={0.22} darkness={0.92} />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
}
