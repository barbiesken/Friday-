import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { drive } from "./drive";

const WHITE = new THREE.Color("#ffffff");

/**
 * Layer 1.5 — the computational cathedral. A dense, camera-facing radial
 * structure: hundreds of fine filament spokes, concentric measurement rings and
 * tick marks, and a white-hot heart. This is what makes the core read as an
 * engineered star / arc-reactor iris rather than a soft orb.
 */

function lineGeom(pos: number[], col: number[]): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  return g;
}

/** Radial spokes — a dense inner corona + main filaments, additive sunburst. */
function buildSpokes(): THREE.BufferGeometry {
  const pos: number[] = [];
  const col: number[] = [];
  // inner corona — short, very dense, packs the heart with radial texture
  const CN = 260;
  for (let i = 0; i < CN; i++) {
    const a = (i / CN) * Math.PI * 2 + Math.random() * 0.01;
    const r0 = 0.3 + Math.random() * 0.05;
    const r1 = 0.46 + Math.random() * 0.1;
    const ca = Math.cos(a), sa = Math.sin(a);
    pos.push(ca * r0, sa * r0, 0, ca * r1, sa * r1, 0);
    const b = 0.5 + Math.random() * 0.5;
    col.push(b, b, b, b * 0.3, b * 0.3, b * 0.3);
  }
  // main filaments — bright at the aperture, fading to the rim; some long rays
  const N = 440;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const r0 = 0.44 + Math.random() * 0.05;
    const long = Math.random() > 0.84;
    const r1 = long ? 1.2 + Math.random() * 0.6 : 0.6 + Math.random() * 0.58;
    const ca = Math.cos(a), sa = Math.sin(a);
    pos.push(ca * r0, sa * r0, 0, ca * r1, sa * r1, 0);
    const b = long ? 0.95 + Math.random() * 0.3 : 0.26 + Math.random() * 0.5;
    col.push(b, b, b, 0.012, 0.012, 0.012);
  }
  return lineGeom(pos, col);
}

/** Concentric measurement rings made of ticks (every 5th tick longer/brighter). */
function buildTicks(): THREE.BufferGeometry {
  const rings = [
    { r: 0.56, n: 120, len: 0.02, b: 0.46 },
    { r: 0.72, n: 160, len: 0.026, b: 0.46 },
    { r: 0.9, n: 200, len: 0.03, b: 0.4 },
    { r: 1.08, n: 240, len: 0.022, b: 0.34 },
    { r: 1.26, n: 200, len: 0.026, b: 0.28 },
    { r: 1.46, n: 110, len: 0.055, b: 0.22 },
  ];
  const pos: number[] = [];
  const col: number[] = [];
  for (const ring of rings) {
    for (let i = 0; i < ring.n; i++) {
      const a = (i / ring.n) * Math.PI * 2;
      const ca = Math.cos(a), sa = Math.sin(a);
      const major = i % 5 === 0;
      const r0 = ring.r;
      const r1 = ring.r + ring.len * (major ? 2 : 1);
      pos.push(ca * r0, sa * r0, 0, ca * r1, sa * r1, 0);
      const b = ring.b * (major ? 1.5 : 1);
      col.push(b, b, b, b, b, b);
    }
  }
  return lineGeom(pos, col);
}

/** Concentric circles + a bright aperture ring (the iris boundary). */
function buildCircles(): THREE.BufferGeometry {
  const rings = [
    { r: 0.42, b: 0.6 }, // aperture — the defined iris boundary
    { r: 0.56, b: 0.14 }, { r: 0.72, b: 0.16 }, { r: 0.9, b: 0.15 },
    { r: 1.08, b: 0.14 }, { r: 1.26, b: 0.12 }, { r: 1.46, b: 0.12 },
  ];
  const seg = 220;
  const pos: number[] = [];
  const col: number[] = [];
  for (const { r, b } of rings) {
    for (let i = 0; i < seg; i++) {
      const a0 = (i / seg) * Math.PI * 2;
      const a1 = ((i + 1) / seg) * Math.PI * 2;
      pos.push(Math.cos(a0) * r, Math.sin(a0) * r, 0, Math.cos(a1) * r, Math.sin(a1) * r, 0);
      col.push(b, b, b, b, b, b);
    }
  }
  return lineGeom(pos, col);
}

/** A radial-gradient sprite texture for the white-hot heart. */
function heartTexture(): THREE.Texture {
  const s = 128;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.25, "rgba(220,242,255,0.9)");
  g.addColorStop(0.55, "rgba(120,200,255,0.35)");
  g.addColorStop(1, "rgba(40,120,220,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

export function Filaments() {
  const billboard = useRef<THREE.Group>(null);
  const spinA = useRef<THREE.Group>(null);
  const spinB = useRef<THREE.Group>(null);
  const spokeMat = useRef<THREE.LineBasicMaterial>(null);
  const tickMat = useRef<THREE.LineBasicMaterial>(null);
  const circleMat = useRef<THREE.LineBasicMaterial>(null);
  const heartMat = useRef<THREE.SpriteMaterial>(null);
  const heartSprite = useRef<THREE.Sprite>(null);
  const { camera } = useThree();

  const spokes = useMemo(buildSpokes, []);
  const ticks = useMemo(buildTicks, []);
  const circles = useMemo(buildCircles, []);
  const heart = useMemo(heartTexture, []);
  const tint = useMemo(() => new THREE.Color(), []);

  useFrame((_, dt) => {
    const d = Math.min(dt, 0.05);
    if (billboard.current) billboard.current.quaternion.copy(camera.quaternion); // face camera
    if (spinA.current) spinA.current.rotation.z += d * (0.04 + drive.ringSpeed * 0.12);
    if (spinB.current) spinB.current.rotation.z -= d * (0.03 + drive.ringSpeed * 0.08);

    tint.copy(drive.glow);
    const bright = 0.5 + drive.activity * 0.85 + drive.alert * 0.7 + drive.audio * 0.35;
    if (spokeMat.current) {
      spokeMat.current.color.copy(tint);
      spokeMat.current.opacity = Math.min(1, 0.55 + bright * 0.5);
    }
    if (tickMat.current) {
      tickMat.current.color.copy(tint);
      tickMat.current.opacity = Math.min(1, 0.5 + bright * 0.4);
    }
    if (circleMat.current) {
      circleMat.current.color.copy(tint);
      circleMat.current.opacity = 0.35 + bright * 0.25;
    }
    if (heartMat.current) {
      heartMat.current.color.copy(drive.color).lerp(WHITE, 0.5);
      heartMat.current.opacity = Math.min(1, 0.7 + drive.activity * 0.4);
    }
    if (heartSprite.current) {
      const s = 1.05 + drive.breathe * 1.2 + drive.audio * 0.25 + drive.alert * 0.2;
      const cur = heartSprite.current.scale.x || 1;
      heartSprite.current.scale.setScalar(THREE.MathUtils.damp(cur, s, 7, d));
    }
  });

  return (
    <group ref={billboard} renderOrder={1}>
      <group ref={spinA}>
        <lineSegments geometry={spokes}>
          <lineBasicMaterial ref={spokeMat} vertexColors transparent depthWrite={false}
            blending={THREE.AdditiveBlending} opacity={0.9} />
        </lineSegments>
        <lineSegments geometry={circles}>
          <lineBasicMaterial ref={circleMat} vertexColors transparent depthWrite={false}
            blending={THREE.AdditiveBlending} opacity={0.5} />
        </lineSegments>
      </group>
      <group ref={spinB}>
        <lineSegments geometry={ticks}>
          <lineBasicMaterial ref={tickMat} vertexColors transparent depthWrite={false}
            blending={THREE.AdditiveBlending} opacity={0.8} />
        </lineSegments>
      </group>
      <sprite ref={heartSprite} scale={1.1}>
        <spriteMaterial ref={heartMat} map={heart} transparent depthWrite={false}
          blending={THREE.AdditiveBlending} opacity={0.85} />
      </sprite>
    </group>
  );
}
