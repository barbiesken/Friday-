'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Instances, Instance, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '@/lib/store';
import { PART_EXPLODE, PART_ASSEMBLE_AT, CASEBACK_SECTIONS, TOTAL_SECTIONS, COLORS } from '@/lib/constants';
import { createDialMaterial, platinumMaterial } from '@/shaders/materials';

const damp = THREE.MathUtils.damp;
const smoothstep = THREE.MathUtils.smoothstep;

// Assembled positions for each part group (watch faces +Z, dial in the XY plane).
const HOME: Record<string, [number, number, number]> = {
  case: [0, 0, 0],
  bezel: [0, 0, 0.3],
  dial: [0, 0, 0.26],
  indexes: [0, 0, 0.31],
  hands: [0, 0, 0.36],
  crystal: [0, 0, 0.4],
  cyclops: [1.0, 0, 0.5],
  crown: [1.98, 0, 0],
  movement: [0, 0, -0.22],
  braceletTop: [0, 1.0, -0.02],
  braceletBottom: [0, -1.0, -0.02],
};

function targetAmt(key: string): number {
  const { explodeMode, section, watchmaker, scroll } = useStore.getState();
  if (explodeMode === 'open') return 1;
  if (explodeMode === 'closed') return 0;
  if (watchmaker) return 0.5;
  if (section === 0) return 0; // glamour: assembled
  const at = PART_ASSEMBLE_AT[key] ?? 99;
  const f = scroll * TOTAL_SECTIONS; // continuous chapter position
  return 1 - smoothstep(f, at, at + 0.85);
}

export default function Watch() {
  const root = useRef<THREE.Group>(null);
  const parts = useRef<Record<string, THREE.Group | null>>({});
  const amt = useRef<Record<string, number>>({});
  const flip = useRef(0);

  const rotor = useRef<THREE.Group>(null);
  const balance = useRef<THREE.Mesh>(null);
  const gearA = useRef<THREE.Mesh>(null);
  const gearB = useRef<THREE.Mesh>(null);
  const secondHand = useRef<THREE.Group>(null);
  const minuteHand = useRef<THREE.Group>(null);
  const hourHand = useRef<THREE.Group>(null);

  const platinum = useMemo(() => platinumMaterial({ rough: 0.16, clearcoat: 0.7 }), []);
  const polished = useMemo(() => platinumMaterial({ rough: 0.05, clearcoat: 1 }), []);
  const dialMat = useMemo(() => createDialMaterial(), []);
  const crystalMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        metalness: 0,
        roughness: 0,
        transmission: 0, // no frosting — pure reflective glass
        transparent: true,
        opacity: 0.12,
        clearcoat: 1,
        clearcoatRoughness: 0,
        ior: 1.5,
        envMapIntensity: 2.4,
        depthWrite: false,
      }),
    [],
  );
  const dialBase = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#08303d', metalness: 0.7, roughness: 0.35 }),
    [],
  );
  const darkInset = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#05080a', metalness: 0.8, roughness: 0.3 }),
    [],
  );
  // Movement materials are double-sided so they read correctly once the watch
  // flips to reveal the caseback.
  const steel = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#d2d7dd', metalness: 1, roughness: 0.22, side: THREE.DoubleSide }),
    [],
  );
  const movementPlate = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#161c20', metalness: 0.95, roughness: 0.4, side: THREE.DoubleSide }),
    [],
  );
  const goldRotor = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#c9c3b4', metalness: 1, roughness: 0.18, side: THREE.DoubleSide }),
    [],
  );
  const secondMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: COLORS.iceBright, metalness: 0.5, roughness: 0.25 }),
    [],
  );

  const markers = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i < 12; i++) {
      if (i === 3) continue; // date aperture at 3 o'clock
      arr.push((i / 12) * Math.PI * 2);
    }
    return arr;
  }, []);

  const flutes = useMemo(() => {
    const n = 60;
    return Array.from({ length: n }, (_, i) => (i / n) * Math.PI * 2);
  }, []);

  const buildLinks = (dir: 1 | -1) =>
    Array.from({ length: 5 }, (_, k) => {
      const i = k + 1;
      const t = i / 5;
      return { y: dir * (0.5 + i * 0.4), z: -t * 0.45, s: 1 - t * 0.16 };
    });
  const topLinks = useMemo(() => buildLinks(1), []);
  const bottomLinks = useMemo(() => buildLinks(-1), []);

  useFrame((state, dt) => {
    const { pointer, watchmaker, section } = useStore.getState();
    const t = state.clock.elapsedTime;

    flip.current = damp(flip.current, CASEBACK_SECTIONS.includes(section) ? Math.PI : 0, 2.6, dt);

    if (root.current) {
      root.current.rotation.y = damp(root.current.rotation.y, flip.current + pointer.x * 0.45 + t * 0.06, 5, dt);
      root.current.rotation.x = damp(root.current.rotation.x, pointer.y * 0.24, 5, dt);
    }

    for (const key of Object.keys(HOME)) {
      const g = parts.current[key];
      if (!g) continue;
      const tgt = targetAmt(key);
      amt.current[key] = damp(amt.current[key] ?? tgt, tgt, 3.5, dt);
      const a = amt.current[key];
      const home = HOME[key];
      const ex = PART_EXPLODE[key] ?? [0, 0, 0];
      g.position.set(home[0] + ex[0] * a, home[1] + ex[1] * a, home[2] + ex[2] * a);
    }

    if (rotor.current) rotor.current.rotation.z = t * 0.9;
    if (balance.current) balance.current.rotation.z = Math.sin(t * 12) * 0.6;
    if (gearA.current) gearA.current.rotation.z = t * 1.6;
    if (gearB.current) gearB.current.rotation.z = -t * 2.3;

    const now = new Date();
    const sec = now.getSeconds() + now.getMilliseconds() / 1000;
    const min = now.getMinutes() + sec / 60;
    const hr = (now.getHours() % 12) + min / 60;
    if (secondHand.current) secondHand.current.rotation.z = -sec * (Math.PI / 30);
    if (minuteHand.current) minuteHand.current.rotation.z = -min * (Math.PI / 30);
    if (hourHand.current) hourHand.current.rotation.z = -hr * (Math.PI / 6);

    dialMat.uniforms.uTime.value = t;
    dialMat.uniforms.uPointer.value.set(pointer.x, pointer.y);
    dialMat.uniforms.uReveal.value = damp(dialMat.uniforms.uReveal.value, section >= 4 ? 1 : 0, 3, dt);

    crystalMat.opacity = damp(crystalMat.opacity, watchmaker ? 0.04 : 0.12, 4, dt);
  });

  const setRef = (k: string) => (el: THREE.Group | null) => {
    parts.current[k] = el;
  };

  return (
    <group ref={root}>
      {/* CASE — round Oyster middle case + caseback + lugs */}
      <group ref={setRef('case')}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={platinum}>
          <cylinderGeometry args={[1.92, 1.92, 0.5, 160]} />
        </mesh>
        <mesh position={[0, 0, 0.24]} material={polished}>
          <torusGeometry args={[1.9, 0.07, 24, 160]} />
        </mesh>
        <mesh position={[0, 0, -0.25]} rotation={[Math.PI / 2, 0, 0]} material={polished}>
          <cylinderGeometry args={[1.74, 1.74, 0.04, 160]} />
        </mesh>
        {[1, -1].map((sy) =>
          [1, -1].map((sx) => (
            <mesh
              key={`${sx}-${sy}`}
              position={[sx * 1.55, sy * 1.62, 0]}
              rotation={[0, 0, sx * sy * 0.45]}
              material={polished}
            >
              <boxGeometry args={[0.5, 0.72, 0.46]} />
            </mesh>
          )),
        )}
      </group>

      {/* FLUTED BEZEL — torus rim + 60 radial flutes in the XY plane */}
      <group ref={setRef('bezel')}>
        <mesh material={polished}>
          <torusGeometry args={[1.74, 0.14, 32, 160]} />
        </mesh>
        <Instances limit={flutes.length} material={polished}>
          <boxGeometry args={[0.1, 0.34, 0.18]} />
          {flutes.map((angle, i) => (
            <Instance
              key={i}
              position={[Math.cos(angle) * 1.74, Math.sin(angle) * 1.74, 0]}
              rotation={[0, 0, angle - Math.PI / 2]}
            />
          ))}
        </Instances>
      </group>

      {/* DIAL — solid backing + ice-blue sunray face + rehaut + apertures (no centre cylinder) */}
      <group ref={setRef('dial')}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={dialBase}>
          <cylinderGeometry args={[1.54, 1.54, 0.06, 160]} />
        </mesh>
        <mesh position={[0, 0, 0.035]} material={dialMat}>
          <circleGeometry args={[1.53, 160]} />
        </mesh>
        <mesh position={[0, 0, 0.045]} material={polished}>
          <torusGeometry args={[1.5, 0.025, 16, 160]} />
        </mesh>
        <mesh position={[0, 1.04, 0.06]} material={darkInset}>
          <boxGeometry args={[0.74, 0.22, 0.03]} />
        </mesh>
        <mesh position={[1.16, 0, 0.06]} material={darkInset}>
          <boxGeometry args={[0.3, 0.22, 0.03]} />
        </mesh>
      </group>

      {/* APPLIED INDEXES */}
      <group ref={setRef('indexes')}>
        <Instances limit={markers.length} material={polished}>
          <boxGeometry args={[0.1, 0.3, 0.06]} />
          {markers.map((angle, i) => (
            <Instance
              key={i}
              position={[Math.sin(angle) * 1.2, Math.cos(angle) * 1.2, 0]}
              rotation={[0, 0, -angle]}
            />
          ))}
        </Instances>
      </group>

      {/* HANDS + flat centre hub */}
      <group ref={setRef('hands')}>
        <group ref={hourHand}>
          <mesh position={[0, 0.4, 0]} material={polished}>
            <boxGeometry args={[0.08, 0.9, 0.03]} />
          </mesh>
        </group>
        <group ref={minuteHand}>
          <mesh position={[0, 0.62, 0.02]} material={polished}>
            <boxGeometry args={[0.05, 1.3, 0.03]} />
          </mesh>
        </group>
        <group ref={secondHand}>
          <mesh position={[0, 0.55, 0.04]} material={secondMat}>
            <boxGeometry args={[0.016, 1.45, 0.02]} />
          </mesh>
          <mesh position={[0, -0.26, 0.04]} material={secondMat}>
            <boxGeometry args={[0.05, 0.3, 0.02]} />
          </mesh>
        </group>
        <mesh position={[0, 0, 0.06]} rotation={[Math.PI / 2, 0, 0]} material={polished}>
          <cylinderGeometry args={[0.055, 0.055, 0.035, 32]} />
        </mesh>
      </group>

      {/* SAPPHIRE CRYSTAL + CYCLOPS — clear, reflective, non-frosting */}
      <group ref={setRef('crystal')}>
        <mesh scale={[1, 1, 0.14]} material={crystalMat}>
          <sphereGeometry args={[1.55, 96, 96]} />
        </mesh>
      </group>
      <group ref={setRef('cyclops')}>
        <mesh scale={[1, 1, 0.7]} material={crystalMat}>
          <sphereGeometry args={[0.22, 48, 48]} />
        </mesh>
      </group>

      {/* TWINLOCK CROWN */}
      <group ref={setRef('crown')}>
        <mesh rotation={[0, 0, Math.PI / 2]} material={polished}>
          <cylinderGeometry args={[0.17, 0.17, 0.2, 48]} />
        </mesh>
        <mesh position={[0.12, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={platinum}>
          <cylinderGeometry args={[0.2, 0.2, 0.12, 12]} />
        </mesh>
        <mesh position={[-0.18, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={platinum}>
          <cylinderGeometry args={[0.12, 0.12, 0.18, 24]} />
        </mesh>
      </group>

      {/* MOVEMENT — Calibre 3255 (revealed at the caseback) */}
      <group ref={setRef('movement')}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={movementPlate}>
          <cylinderGeometry args={[1.6, 1.6, 0.2, 160]} />
        </mesh>
        {[1.32, 1.0, 0.66].map((r, i) => (
          <mesh key={i} position={[0, 0, -0.11]} material={steel}>
            <torusGeometry args={[r, 0.02, 12, 160]} />
          </mesh>
        ))}
        <mesh ref={balance} position={[0.7, 0.7, -0.13]} material={steel}>
          <torusGeometry args={[0.34, 0.05, 12, 64]} />
        </mesh>
        <mesh ref={gearA} position={[-0.62, 0.5, -0.12]} material={steel}>
          <circleGeometry args={[0.34, 12]} />
        </mesh>
        <mesh ref={gearB} position={[-0.2, -0.72, -0.12]} material={steel}>
          <circleGeometry args={[0.26, 9]} />
        </mesh>
        <group ref={rotor} position={[0, 0, -0.16]}>
          <mesh material={goldRotor}>
            <circleGeometry args={[1.46, 96, 0, Math.PI]} />
          </mesh>
        </group>
      </group>

      {/* PRESIDENT BRACELET */}
      <group ref={setRef('braceletTop')}>
        {topLinks.map((l, i) => (
          <PresidentLink key={i} {...l} platinum={platinum} polished={polished} />
        ))}
      </group>
      <group ref={setRef('braceletBottom')}>
        {bottomLinks.map((l, i) => (
          <PresidentLink key={i} {...l} platinum={platinum} polished={polished} />
        ))}
      </group>

      <WatchmakerLabels />
    </group>
  );
}

function PresidentLink({
  y,
  z,
  s,
  platinum,
  polished,
}: {
  y: number;
  z: number;
  s: number;
  platinum: THREE.Material;
  polished: THREE.Material;
}) {
  return (
    <group position={[0, y, z]} scale={s}>
      <RoundedBox args={[1.5, 0.4, 0.28]} radius={0.11} smoothness={5} material={platinum} />
      <mesh position={[0, 0, 0.15]} material={polished}>
        <boxGeometry args={[0.5, 0.32, 0.06]} />
      </mesh>
    </group>
  );
}

function WatchmakerLabels() {
  const watchmaker = useStore((s) => s.watchmaker);
  if (!watchmaker) return null;
  const spots: { p: [number, number, number]; t: string }[] = [
    { p: [0.7, 0.7, 0.3], t: 'Chronergy escapement' },
    { p: [-0.62, 0.5, 0.3], t: 'Gear train' },
    { p: [0, -0.72, 0.3], t: 'Perpetual rotor' },
    { p: [1.74, 0, 0.3], t: 'Fluted bezel · 60 flutes' },
  ];
  return (
    <>
      {spots.map((s, i) => (
        <Html key={i} position={s.p} center distanceFactor={9}>
          <div className="watchmaker-tag">{s.t}</div>
        </Html>
      ))}
    </>
  );
}
