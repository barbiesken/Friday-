import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { drive } from "./drive";

const WHITE = new THREE.Color("#ffffff");

/**
 * Tunables — nudge these to taste, then `npm run dev`. Defaults aim for the
 * engineered-star / arc-reactor reference: a small white-hot core with a clean
 * pupil gap, a machined aperture ring, and dense fine filaments.
 */
const TUNE = {
  spokeCount: 460, // main radial filaments
  coronaCount: 280, // short dense spokes that pack the heart
  longChance: 0.16, // fraction of filaments that shoot far past the rim
  pupil: 0.34, // inner radius where the corona begins (the dark aperture gap)
  heartScale: 0.5, // crisp hot-point over the plasma core (sits inside the aperture)
  heartWhiteMix: 0.72, // 0 = palette colour, 1 = pure white
  apertureBright: 0.72, // brightness of the iris boundary ring
  spinA: 0.035, // base rad/s of the spokes + circles layer
  spinB: 0.028, // base rad/s of the tick layer (counter-rotates)
};

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
  const CN = TUNE.coronaCount;
  for (let i = 0; i < CN; i++) {
    const a = (i / CN) * Math.PI * 2 + Math.random() * 0.01;
    const r0 = TUNE.pupil + Math.random() * 0.05;
    const r1 = TUNE.pupil + 0.16 + Math.random() * 0.1;
    const ca = Math.cos(a), sa = Math.sin(a);
    pos.push(ca * r0, sa * r0, 0, ca * r1, sa * r1, 0);
    const b = 0.3 + Math.random() * 0.4;
    col.push(b, b, b, b * 0.3, b * 0.3, b * 0.3);
  }
  // main filaments — bright at the aperture, fading to the rim; some long rays
  const N = TUNE.spokeCount;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const r0 = 0.44 + Math.random() * 0.05;
    const long = Math.random() < TUNE.longChance;
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
    { r: 0.39, b: TUNE.apertureBright * 0.45 }, // machined inner aperture line
    { r: 0.42, b: TUNE.apertureBright }, // aperture — the defined iris boundary
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
  // tight falloff — a crisp hot point, not a soft blue marble
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.16, "rgba(236,248,255,0.96)");
  g.addColorStop(0.4, "rgba(150,212,255,0.4)");
  g.addColorStop(0.72, "rgba(60,140,225,0.08)");
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
    if (spinA.current) spinA.current.rotation.z += d * (TUNE.spinA + drive.ringSpeed * 0.12);
    if (spinB.current) spinB.current.rotation.z -= d * (TUNE.spinB + drive.ringSpeed * 0.08);

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
      heartMat.current.color.copy(drive.color).lerp(WHITE, TUNE.heartWhiteMix);
      heartMat.current.opacity = Math.min(1, 0.45 + drive.activity * 0.3);
    }
    if (heartSprite.current) {
      const s = TUNE.heartScale * (1 + drive.breathe * 1.05 + drive.audio * 0.22 + drive.alert * 0.18);
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
      <sprite ref={heartSprite} scale={TUNE.heartScale}>
        <spriteMaterial ref={heartMat} map={heart} transparent depthWrite={false}
          blending={THREE.AdditiveBlending} opacity={0.85} />
      </sprite>
    </group>
  );
}
