'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from '@/lib/store';
import { TOTAL_SECTIONS } from '@/lib/constants';

const damp = THREE.MathUtils.damp;
const smoothstep = THREE.MathUtils.smoothstep;

/**
 * Renders a real photoreal watch model (.glb / .gltf) and gives every sub-mesh
 * a generic break-apart: each part flies outward from the model centre and
 * reassembles as you scroll (1 at the exploded view → 0 at the finale).
 * Used only when NEXT_PUBLIC_WATCH_MODEL is set; otherwise the procedural watch
 * is shown. Tune per-part offsets once a specific model is in place.
 */
export default function GLBWatch({ url }: { url: string }) {
  const root = useRef<THREE.Group>(null);
  const { scene } = useGLTF(url);
  const amt = useRef(0);

  const { model, parts } = useMemo(() => {
    const model = scene.clone(true);

    // Centre + scale the model to roughly 4 scene units.
    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const scale = 4 / Math.max(size.x, size.y, size.z || 1);
    model.scale.setScalar(scale);
    model.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
    model.updateWorldMatrix(true, true);

    // Record each mesh's home position + an outward direction from the centre.
    const parts: { mesh: THREE.Object3D; home: THREE.Vector3; dir: THREE.Vector3 }[] = [];
    const worldCenter = new THREE.Vector3();
    model.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        new THREE.Box3().setFromObject(o).getCenter(worldCenter);
        const dir = worldCenter.clone().normalize();
        if (!Number.isFinite(dir.x) || dir.lengthSq() === 0) dir.set(0, 1, 0);
        parts.push({ mesh: o, home: o.position.clone(), dir });
      }
    });
    return { model, parts };
  }, [scene]);

  useFrame((state, dt) => {
    const { scroll, section, pointer, explodeMode, watchmaker } = useStore.getState();
    const f = scroll * TOTAL_SECTIONS;
    let tgt = 1 - smoothstep(f, 1, TOTAL_SECTIONS - 1);
    if (explodeMode === 'open') tgt = 1;
    else if (explodeMode === 'closed') tgt = 0;
    else if (section === 0) tgt = 0;
    else if (watchmaker) tgt = 0.5;

    amt.current = damp(amt.current, tgt, 3.5, dt);
    const a = amt.current * 2.4;
    for (const p of parts) {
      p.mesh.position.set(p.home.x + p.dir.x * a, p.home.y + p.dir.y * a, p.home.z + p.dir.z * a);
    }

    if (root.current) {
      const t = state.clock.elapsedTime;
      root.current.rotation.y = damp(root.current.rotation.y, pointer.x * 0.5 + t * 0.06, 5, dt);
      root.current.rotation.x = damp(root.current.rotation.x, pointer.y * 0.24, 5, dt);
    }
  });

  return (
    <group ref={root}>
      <primitive object={model} />
    </group>
  );
}
