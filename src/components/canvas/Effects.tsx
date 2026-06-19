'use client';

import { EffectComposer, Bloom, Vignette, SMAA } from '@react-three/postprocessing';
import { useStore } from '@/lib/store';

// Cinematic finish: SMAA for crisp edges, a restrained bloom on the brightest
// platinum highlights (soft, not glowy), and a gentle vignette to focus the eye.
// Disabled entirely in Performance mode.
export default function Effects() {
  const perfMode = useStore((s) => s.perfMode);
  if (perfMode) return null;
  return (
    <EffectComposer multisampling={0}>
      <SMAA />
      <Bloom
        intensity={0.42}
        luminanceThreshold={0.82}
        luminanceSmoothing={0.22}
        mipmapBlur
        radius={0.6}
      />
      <Vignette eskil={false} offset={0.28} darkness={0.62} />
    </EffectComposer>
  );
}
