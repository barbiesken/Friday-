import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { drive } from "./drive";

function polygon(sides: number, r: number): THREE.BufferGeometry {
  const pos: number[] = [];
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2;
    const b = ((i + 1) / sides) * Math.PI * 2;
    pos.push(Math.cos(a) * r, Math.sin(a) * r, 0, Math.cos(b) * r, Math.sin(b) * r, 0);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pos), 3));
  return g;
}

interface Item {
  edges: THREE.BufferGeometry;
  pos: [number, number, number];
  phase: number; spin: number; freq: number;
}

/** Layer 4 — holographic geometry. Triangles/hexagons/polyhedra forming + dissolving. */
export function HoloGeometry() {
  const group = useRef<THREE.Group>(null);
  const mats = useRef<THREE.LineBasicMaterial[]>([]);
  const meshes = useRef<THREE.LineSegments[]>([]);

  const items = useMemo<Item[]>(() => {
    const arr: Item[] = [];
    for (let i = 0; i < 16; i++) {
      const s = 0.1 + Math.random() * 0.16;
      let edges: THREE.BufferGeometry;
      const kind = i % 6;
      if (kind === 0) edges = new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(s, 0));
      else if (kind === 1) edges = new THREE.EdgesGeometry(new THREE.OctahedronGeometry(s, 0));
      else if (kind === 2) edges = new THREE.EdgesGeometry(new THREE.TetrahedronGeometry(s, 0));
      else if (kind === 3) edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(s, s, s));
      else if (kind === 4) edges = polygon(6, s); // hexagon
      else edges = polygon(3, s); // triangle
      const a = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      const rr = 0.85 + Math.random() * 0.7;
      arr.push({
        edges,
        pos: [rr * Math.sin(ph) * Math.cos(a), rr * Math.sin(ph) * Math.sin(a), rr * Math.cos(ph)],
        phase: Math.random() * 6.28,
        spin: (Math.random() - 0.5) * 0.8,
        freq: 0.25 + Math.random() * 0.6,
      });
    }
    return arr;
  }, []);

  useFrame((_, dt) => {
    const d = Math.min(dt, 0.05);
    if (group.current) {
      group.current.rotation.y += d * 0.05;
      group.current.rotation.x = Math.sin(drive.t * 0.08) * 0.15;
    }
    for (let i = 0; i < items.length; i++) {
      const m = mats.current[i];
      const mesh = meshes.current[i];
      if (m) {
        const wave = Math.sin(drive.t * items[i].freq + items[i].phase) * 0.5 + 0.5;
        m.opacity = Math.max(0, Math.min(0.85, wave * drive.geom * 1.7 - 0.08));
        m.color.copy(drive.glow);
      }
      if (mesh) {
        mesh.rotation.x += items[i].spin * d;
        mesh.rotation.y += items[i].spin * 0.7 * d;
      }
    }
  });

  return (
    <group ref={group} renderOrder={3}>
      {items.map((it, i) => (
        <lineSegments
          key={i}
          geometry={it.edges}
          position={it.pos}
          ref={(el) => {
            if (el) meshes.current[i] = el;
          }}
        >
          <lineBasicMaterial
            ref={(el) => {
              if (el) mats.current[i] = el;
            }}
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </lineSegments>
      ))}
    </group>
  );
}
