import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { drive } from "./drive";

/**
 * Layer 1.5 — the machined housing. A clean, camera-facing arc-reactor casing:
 * a segmented ring (two rims + radial dividers) around the vortex, a bright
 * aperture line, and a few concentric measurement rings with tick marks. This is
 * the engineered structure that frames the spiral heart (no soft sunburst).
 */
const TUNE = {
  apertureR: 0.52, // bright inner iris line (just outside the vortex)
  housingInner: 0.6,
  housingOuter: 0.76,
  housingSegs: 44, // radial dividers → the "machined" segmentation
  spinA: 0.04, // housing + circles
  spinB: 0.03, // ticks (counter-rotate)
};

function lineGeom(pos: number[], col: number[]): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  return g;
}

function circle(pos: number[], col: number[], r: number, b: number, seg = 220) {
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * Math.PI * 2;
    const a1 = ((i + 1) / seg) * Math.PI * 2;
    pos.push(Math.cos(a0) * r, Math.sin(a0) * r, 0, Math.cos(a1) * r, Math.sin(a1) * r, 0);
    col.push(b, b, b, b, b, b);
  }
}

/** Segmented machined housing: two rims + radial dividers (every 4th major). */
function buildHousing(): THREE.BufferGeometry {
  const pos: number[] = [];
  const col: number[] = [];
  const { apertureR, housingInner: ri, housingOuter: ro, housingSegs: n } = TUNE;
  circle(pos, col, apertureR, 0.6); // bright aperture line
  circle(pos, col, ri, 0.42); // inner rim
  circle(pos, col, ro, 0.5); // outer rim
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const ca = Math.cos(a), sa = Math.sin(a);
    const major = i % 4 === 0;
    const r0 = ri - (major ? 0.03 : 0);
    const r1 = ro + (major ? 0.04 : 0);
    pos.push(ca * r0, sa * r0, 0, ca * r1, sa * r1, 0);
    const b = major ? 0.7 : 0.3;
    col.push(b, b, b, b, b, b);
  }
  return lineGeom(pos, col);
}

/** A few concentric measurement rings outside the housing. */
function buildCircles(): THREE.BufferGeometry {
  const pos: number[] = [];
  const col: number[] = [];
  circle(pos, col, 0.92, 0.14);
  circle(pos, col, 1.12, 0.12);
  circle(pos, col, 1.36, 0.1);
  return lineGeom(pos, col);
}

/** Tick marks on one ring (every 5th longer/brighter). */
function buildTicks(): THREE.BufferGeometry {
  const pos: number[] = [];
  const col: number[] = [];
  const r = 0.84, n = 120, len = 0.03, b = 0.32;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const ca = Math.cos(a), sa = Math.sin(a);
    const major = i % 5 === 0;
    const r1 = r + len * (major ? 2 : 1);
    pos.push(ca * r, sa * r, 0, ca * r1, sa * r1, 0);
    const bb = b * (major ? 1.5 : 1);
    col.push(bb, bb, bb, bb, bb, bb);
  }
  return lineGeom(pos, col);
}

export function Filaments() {
  const billboard = useRef<THREE.Group>(null);
  const spinA = useRef<THREE.Group>(null);
  const spinB = useRef<THREE.Group>(null);
  const housingMat = useRef<THREE.LineBasicMaterial>(null);
  const circleMat = useRef<THREE.LineBasicMaterial>(null);
  const tickMat = useRef<THREE.LineBasicMaterial>(null);
  const { camera } = useThree();

  const housing = useMemo(buildHousing, []);
  const circles = useMemo(buildCircles, []);
  const ticks = useMemo(buildTicks, []);
  const tint = useMemo(() => new THREE.Color(), []);

  useFrame((_, dt) => {
    const d = Math.min(dt, 0.05);
    if (billboard.current) billboard.current.quaternion.copy(camera.quaternion);
    if (spinA.current) spinA.current.rotation.z += d * (TUNE.spinA + drive.ringSpeed * 0.06);
    if (spinB.current) spinB.current.rotation.z -= d * (TUNE.spinB + drive.ringSpeed * 0.05);

    tint.copy(drive.glow);
    const bright = 0.5 + drive.activity * 0.7 + drive.alert * 0.6 + drive.audio * 0.3;
    if (housingMat.current) {
      housingMat.current.color.copy(tint);
      housingMat.current.opacity = Math.min(1, 0.55 + bright * 0.4);
    }
    if (circleMat.current) {
      circleMat.current.color.copy(tint);
      circleMat.current.opacity = 0.3 + bright * 0.2;
    }
    if (tickMat.current) {
      tickMat.current.color.copy(tint);
      tickMat.current.opacity = 0.4 + bright * 0.3;
    }
  });

  return (
    <group ref={billboard} renderOrder={1}>
      <group ref={spinA}>
        <lineSegments geometry={housing}>
          <lineBasicMaterial ref={housingMat} vertexColors transparent depthWrite={false}
            blending={THREE.AdditiveBlending} opacity={0.85} />
        </lineSegments>
        <lineSegments geometry={circles}>
          <lineBasicMaterial ref={circleMat} vertexColors transparent depthWrite={false}
            blending={THREE.AdditiveBlending} opacity={0.4} />
        </lineSegments>
      </group>
      <group ref={spinB}>
        <lineSegments geometry={ticks}>
          <lineBasicMaterial ref={tickMat} vertexColors transparent depthWrite={false}
            blending={THREE.AdditiveBlending} opacity={0.6} />
        </lineSegments>
      </group>
    </group>
  );
}
