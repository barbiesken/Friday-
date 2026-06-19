'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import WatchModel from './WatchModel';
import Particles from './Particles';
import Effects from './Effects';
import { useStore } from '@/lib/store';
import { CAMERA_KEYS, COLORS, TOTAL_SECTIONS } from '@/lib/constants';

const damp = THREE.MathUtils.damp;

function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const posTarget = useMemo(() => new THREE.Vector3(...CAMERA_KEYS[0].pos), []);
  const lookTarget = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  const lookCurrent = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  const a = useMemo(() => new THREE.Vector3(), []);
  const b = useMemo(() => new THREE.Vector3(), []);
  const fovTarget = useRef(CAMERA_KEYS[0].fov);

  useFrame((_, dt) => {
    const { section, sectionProgress, pointer } = useStore.getState();
    const i = Math.min(TOTAL_SECTIONS - 1, section);
    const j = Math.min(TOTAL_SECTIONS - 1, i + 1);
    const f = THREE.MathUtils.smoothstep(sectionProgress, 0, 1);
    const k0 = CAMERA_KEYS[i];
    const k1 = CAMERA_KEYS[j];

    posTarget.lerpVectors(a.set(...k0.pos), b.set(...k1.pos), f);
    posTarget.x += pointer.x * 0.35;
    posTarget.y += pointer.y * 0.22;
    lookTarget.lerpVectors(a.set(...k0.target), b.set(...k1.target), f);
    fovTarget.current = THREE.MathUtils.lerp(k0.fov, k1.fov, f);

    camera.position.x = damp(camera.position.x, posTarget.x, 3.5, dt);
    camera.position.y = damp(camera.position.y, posTarget.y, 3.5, dt);
    camera.position.z = damp(camera.position.z, posTarget.z, 3.5, dt);

    lookCurrent.x = damp(lookCurrent.x, lookTarget.x, 4, dt);
    lookCurrent.y = damp(lookCurrent.y, lookTarget.y, 4, dt);
    lookCurrent.z = damp(lookCurrent.z, lookTarget.z, 4, dt);
    camera.lookAt(lookCurrent);

    const nextFov = damp(camera.fov, fovTarget.current, 4, dt);
    if (Math.abs(nextFov - camera.fov) > 0.001) {
      camera.fov = nextFov;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}

function Bubbles() {
  const section = useStore((s) => s.section);
  const visible = section === 13;
  const ref = useRef<THREE.Points>(null);
  const count = 220;
  const { positions } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 9;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    return { positions };
  }, []);
  const mat = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: new THREE.Color(COLORS.iceBright),
        size: 0.06,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );

  useFrame((_, dt) => {
    mat.opacity = damp(mat.opacity, visible ? 0.5 : 0, 3, dt);
    const pts = ref.current;
    if (!pts) return;
    const arr = pts.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += dt * (0.3 + (i % 5) * 0.05);
      arr[i * 3] += Math.sin(arr[i * 3 + 1] * 2 + i) * dt * 0.05;
      if (arr[i * 3 + 1] > 6) arr[i * 3 + 1] = -6;
    }
    pts.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref} material={mat} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
    </points>
  );
}

function Diagnostics() {
  const gl = useThree((s) => s.gl);
  const setDiag = useStore((s) => s.setDiag);
  const frames = useRef(0);
  const acc = useRef(0);

  useFrame((_, dt) => {
    frames.current += 1;
    acc.current += dt;
    if (acc.current >= 0.5) {
      setDiag({
        fps: Math.round(frames.current / acc.current),
        dpr: Number(gl.getPixelRatio().toFixed(2)),
        drawcalls: gl.info.render.calls,
      });
      frames.current = 0;
      acc.current = 0;
    }
  });
  return null;
}

function Capture() {
  const gl = useThree((s) => s.gl);
  const pending = useStore((s) => s.screenshotPending);
  const clear = useStore((s) => s.clearScreenshot);
  const pushToast = useStore((s) => s.pushToast);

  useEffect(() => {
    if (!pending) return;
    // The latest post-processed frame is retained (preserveDrawingBuffer),
    // so exporting the canvas includes the bloom/vignette pass.
    const id = requestAnimationFrame(() => {
      try {
        const url = gl.domElement.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `day-date-40-${Date.now()}.png`;
        link.href = url;
        link.click();
        pushToast('Screenshot saved');
      } catch {
        pushToast('Screenshot blocked by browser');
      }
      clear();
    });
    return () => cancelAnimationFrame(id);
  }, [pending, gl, clear, pushToast]);

  return null;
}

export default function Scene() {
  const { scene } = useThree();
  const gl = useThree((s) => s.gl);
  const perfMode = useStore((s) => s.perfMode);

  useEffect(() => {
    // Very light haze for depth only — keeps the watch itself crisp.
    scene.fog = new THREE.FogExp2(new THREE.Color(COLORS.ink), 0.006);
    scene.background = null;
    return () => {
      scene.fog = null;
    };
  }, [scene]);

  useEffect(() => {
    const max = perfMode ? 1.25 : 2;
    gl.setPixelRatio(Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, max));
  }, [perfMode, gl]);

  return (
    <>
      <CameraRig />
      <Diagnostics />
      <Capture />

      {/* Lighting */}
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 8, 6]} intensity={1.4} color={COLORS.platinum} />
      <directionalLight position={[-6, 2, -4]} intensity={0.5} color={COLORS.ice} />
      <pointLight position={[0, 0, 6]} intensity={0.6} color={COLORS.iceBright} />

      {/* In-memory studio environment for reflections — no external HDR. */}
      <Environment resolution={perfMode ? 128 : 512} frames={perfMode ? 1 : Infinity}>
        <Lightformer intensity={2.2} position={[0, 2.5, 4]} scale={[7, 7, 1]} color="#eef3f8" />
        <Lightformer intensity={1.3} position={[-5, 1, 2]} scale={[4, 9, 1]} color="#9fb4c4" />
        <Lightformer intensity={1.0} position={[5, 1, 2]} scale={[4, 9, 1]} color="#ffffff" />
        <Lightformer intensity={1.6} position={[0, 4.5, -3]} scale={[12, 2, 1]} color="#cfe6f0" />
        <Lightformer intensity={0.8} position={[0, -4, 3]} scale={[10, 3, 1]} color="#6f97ab" />
      </Environment>

      <WatchModel />
      <Particles />
      <Bubbles />

      {!perfMode && (
        <ContactShadows
          position={[0, -2.4, 0]}
          opacity={0.5}
          scale={14}
          blur={2.6}
          far={6}
          color="#000000"
        />
      )}

      <Effects />
    </>
  );
}
