'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Instances, Instance, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '@/lib/store';
import { PART_EXPLODE, COLORS } from '@/lib/constants';
import { createDialMaterial, platinumMaterial } from '@/shaders/materials';

const damp = THREE.MathUtils.damp;

// Assembled positions for each part group (watch faces +Z).
const HOME: Record<string, [number, number, number]> = {
  crystal: [0, 0, 0.46],
  cyclops: [0.96, 0.0, 0.52],
  hands: [0, 0, 0.34],
  dial: [0, 0, 0.27],
  bezel: [0, 0, 0.3],
  case: [0, 0, 0],
  movement: [0, 0, -0.22],
  crown: [1.98, 0, 0],
  braceletTop: [0, 1.0, -0.02],
  braceletBottom: [0, -1.0, -0.02],
};

function explodeTarget() {
  const { explodeMode, section, sectionProgress, watchmaker } = useStore.getState();
  if (explodeMode === 'open') return 1;
  if (explodeMode === 'closed') return 0;
  if (watchmaker) return 0.55;
  if (section === 0) return 0;
  if (section === 1) return 1 - THREE.MathUtils.smoothstep(sectionProgress, 0.0, 0.8);
  return 0;
}

export default function Watch() {
  const root = useRef<THREE.Group>(null);
  const parts = useRef<Record<string, THREE.Group | null>>({});
  const rotor = useRef<THREE.Group>(null);
  const balance = useRef<THREE.Mesh>(null);
  const gearA = useRef<THREE.Mesh>(null);
  const gearB = useRef<THREE.Mesh>(null);
  const secondHand = useRef<THREE.Group>(null);
  const minuteHand = useRef<THREE.Group>(null);
  const hourHand = useRef<THREE.Group>(null);

  const explodeAmt = useRef(0);
  const flip = useRef(0);

  const platinum = useMemo(() => platinumMaterial(), []);
  const polished = useMemo(() => platinumMaterial({ rough: 0.08, clearcoat: 0.9 }), []);
  const dialMat = useMemo(() => createDialMaterial(), []);
  const crystalMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        transmission: 1,
        thickness: 0.4,
        roughness: 0.02,
        ior: 1.52,
        metalness: 0,
        clearcoat: 1,
        transparent: true,
        opacity: 1,
        envMapIntensity: 1.6,
      }),
    [],
  );
  const darkInset = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#0a0d10', metalness: 0.8, roughness: 0.35 }),
    [],
  );
  const dialBase = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#0b1418', metalness: 0.6, roughness: 0.4 }),
    [],
  );
  const steel = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#cfd4da', metalness: 1, roughness: 0.3 }),
    [],
  );
  const movementPlate = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#1a2024', metalness: 0.9, roughness: 0.45 }),
    [],
  );
  const goldRotor = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#caa46a', metalness: 1, roughness: 0.25 }),
    [],
  );
  const secondMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: COLORS.iceBright, metalness: 0.4, roughness: 0.3 }),
    [],
  );

  const markers = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i < 12; i++) {
      if (i === 3) continue; // date aperture
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
      return { y: dir * (0.55 + i * 0.42), z: -t * 0.5, s: 1 - t * 0.18 };
    });
  const topLinks = useMemo(() => buildLinks(1), []);
  const bottomLinks = useMemo(() => buildLinks(-1), []);

  useFrame((state, dt) => {
    const { pointer, watchmaker, section } = useStore.getState();
    const t = state.clock.elapsedTime;

    explodeAmt.current = damp(explodeAmt.current, explodeTarget(), 4, dt);
    flip.current = damp(flip.current, section === 4 ? Math.PI : 0, 3, dt);

    if (root.current) {
      const idle = t * 0.08;
      root.current.rotation.y = damp(root.current.rotation.y, flip.current + pointer.x * 0.5 + idle, 5, dt);
      root.current.rotation.x = damp(root.current.rotation.x, pointer.y * 0.28, 5, dt);
    }

    const amt = explodeAmt.current;
    for (const key of Object.keys(HOME)) {
      const g = parts.current[key];
      if (!g) continue;
      const home = HOME[key];
      const ex = PART_EXPLODE[key] ?? [0, 0, 0];
      g.position.set(home[0] + ex[0] * amt, home[1] + ex[1] * amt, home[2] + ex[2] * amt);
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
    dialMat.uniforms.uReveal.value = damp(dialMat.uniforms.uReveal.value, section >= 2 ? 1 : 0, 3, dt);

    crystalMat.opacity = damp(crystalMat.opacity, watchmaker ? 0.35 : 1, 4, dt);
  });

  const setRef = (k: string) => (el: THREE.Group | null) => {
    parts.current[k] = el;
  };

  return (
    <group ref={root}>
      {/* CASE */}
      <group ref={setRef('case')}>
        <mesh material={platinum}>
          <cylinderGeometry args={[1.92, 1.92, 0.52, 96]} />
        </mesh>
        <mesh position={[0, 0, -0.27]} rotation={[Math.PI / 2, 0, 0]} material={polished}>
          <cylinderGeometry args={[1.7, 1.7, 0.04, 96]} />
        </mesh>
        {[1, -1].map((sy) =>
          [1, -1].map((sx) => (
            <mesh
              key={`${sx}-${sy}`}
              position={[sx * 1.5, sy * 1.65, 0]}
              rotation={[0, 0, sx * sy * 0.5]}
              material={platinum}
            >
              <boxGeometry args={[0.5, 0.7, 0.5]} />
            </mesh>
          )),
        )}
      </group>

      {/* FLUTED BEZEL */}
      <group ref={setRef('bezel')} rotation={[Math.PI / 2, 0, 0]}>
        <mesh material={polished}>
          <torusGeometry args={[1.78, 0.12, 24, 120]} />
        </mesh>
        <Instances limit={flutes.length} material={polished}>
          <boxGeometry args={[0.085, 0.26, 0.18]} />
          {flutes.map((angle, i) => (
            <Instance
              key={i}
              position={[Math.cos(angle) * 1.78, 0, Math.sin(angle) * 1.78]}
              rotation={[0, -angle, 0]}
            />
          ))}
        </Instances>
      </group>

      {/* DIAL */}
      <group ref={setRef('dial')}>
        <mesh material={dialBase}>
          <cylinderGeometry args={[1.6, 1.6, 0.04, 96]} />
        </mesh>
        <mesh position={[0, 0, 0.025]} material={dialMat}>
          <circleGeometry args={[1.55, 96]} />
        </mesh>
        <Instances limit={markers.length} material={polished}>
          <boxGeometry args={[0.09, 0.28, 0.05]} />
          {markers.map((angle, i) => (
            <Instance
              key={i}
              position={[Math.sin(angle) * 1.18, Math.cos(angle) * 1.18, 0.06]}
              rotation={[0, 0, -angle]}
            />
          ))}
        </Instances>
        <mesh position={[0, 1.0, 0.06]} material={darkInset}>
          <boxGeometry args={[0.7, 0.22, 0.04]} />
        </mesh>
        <mesh position={[1.12, 0, 0.06]} material={darkInset}>
          <boxGeometry args={[0.26, 0.22, 0.04]} />
        </mesh>
      </group>

      {/* HANDS */}
      <group ref={setRef('hands')}>
        <group ref={hourHand}>
          <mesh position={[0, 0.35, 0]} material={polished}>
            <boxGeometry args={[0.07, 0.8, 0.03]} />
          </mesh>
        </group>
        <group ref={minuteHand}>
          <mesh position={[0, 0.55, 0.02]} material={polished}>
            <boxGeometry args={[0.05, 1.2, 0.03]} />
          </mesh>
        </group>
        <group ref={secondHand}>
          <mesh position={[0, 0.5, 0.04]} material={secondMat}>
            <boxGeometry args={[0.018, 1.35, 0.02]} />
          </mesh>
        </group>
        <mesh position={[0, 0, 0.05]} material={polished}>
          <cylinderGeometry args={[0.07, 0.07, 0.1, 24]} />
        </mesh>
      </group>

      {/* CRYSTAL + CYCLOPS */}
      <group ref={setRef('crystal')}>
        <mesh scale={[1, 1, 0.16]} material={crystalMat}>
          <sphereGeometry args={[1.6, 64, 64]} />
        </mesh>
      </group>
      <group ref={setRef('cyclops')}>
        <mesh scale={[1, 1, 0.6]} material={crystalMat}>
          <sphereGeometry args={[0.2, 32, 32]} />
        </mesh>
      </group>

      {/* CROWN */}
      <group ref={setRef('crown')}>
        <mesh rotation={[0, 0, Math.PI / 2]} material={platinum}>
          <cylinderGeometry args={[0.16, 0.16, 0.22, 24]} />
        </mesh>
        <mesh position={[-0.18, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={platinum}>
          <cylinderGeometry args={[0.12, 0.12, 0.18, 6]} />
        </mesh>
      </group>

      {/* MOVEMENT — Calibre 3255 */}
      <group ref={setRef('movement')}>
        <mesh position={[0, 0, -0.02]} rotation={[Math.PI / 2, 0, 0]} material={movementPlate}>
          <cylinderGeometry args={[1.55, 1.55, 0.18, 96]} />
        </mesh>
        {[1.3, 1.0, 0.7].map((r, i) => (
          <mesh key={i} position={[0, 0, -0.12]} rotation={[Math.PI / 2, 0, 0]} material={steel}>
            <torusGeometry args={[r, 0.02, 12, 96]} />
          </mesh>
        ))}
        <mesh ref={balance} position={[0.7, 0.7, -0.16]} material={steel}>
          <torusGeometry args={[0.34, 0.05, 12, 48]} />
        </mesh>
        <mesh ref={gearA} position={[-0.6, 0.5, -0.15]} material={steel}>
          <cylinderGeometry args={[0.34, 0.34, 0.05, 18]} />
        </mesh>
        <mesh ref={gearB} position={[-0.2, -0.7, -0.15]} material={steel}>
          <cylinderGeometry args={[0.26, 0.26, 0.05, 14]} />
        </mesh>
        <group ref={rotor} position={[0, 0, -0.2]}>
          <mesh material={goldRotor}>
            <circleGeometry args={[1.45, 64, 0, Math.PI]} />
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
      <RoundedBox args={[1.5, 0.42, 0.3]} radius={0.12} smoothness={4} material={platinum} />
      <mesh position={[0, 0, 0.16]} material={polished}>
        <boxGeometry args={[0.5, 0.34, 0.06]} />
      </mesh>
    </group>
  );
}

function WatchmakerLabels() {
  const watchmaker = useStore((s) => s.watchmaker);
  if (!watchmaker) return null;
  const spots: { p: [number, number, number]; t: string }[] = [
    { p: [0.7, 0.7, 0.3], t: 'Chronergy escapement' },
    { p: [-0.6, 0.5, 0.3], t: 'Gear train' },
    { p: [0, -0.7, 0.3], t: 'Perpetual rotor' },
    { p: [1.78, 0, 0.3], t: 'Fluted bezel · 60 flutes' },
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
