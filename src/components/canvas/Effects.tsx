'use client';

import { EffectComposer, Bloom, Vignette, SMAA } from '@react-three/postprocessing';
import { useStore } from '@/lib/store';

// Cinematic finish: SMAA for crisp edges, a restrained bloom on the brightest
// platinum highlights, and a gentle vignette. Disabled entirely in Performance
// mode (and on auto-detected low-power / mobile devices).
export default function Effects() {
  const perfMode = useStore((s) => s.perfMode);
  if (perfMode) return null;
  return (
    <EffectComposer multisampling={0}>
      <SMAA />
      <Bloom intensity={0.4} luminanceThreshold={0.82} luminanceSmoothing={0.2} mipmapBlur radius={0.6} />
      <Vignette eskil={false} offset={0.28} darkness={0.6} />
    </EffectComposer>
  );
}
