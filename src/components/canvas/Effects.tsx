'use client';

import {
  EffectComposer,
  Bloom,
  Vignette,
  SMAA,
  BrightnessContrast,
  HueSaturation,
} from '@react-three/postprocessing';
import { useStore } from '@/lib/store';

// Cinematic finish: SMAA for crisp edges, a restrained bloom on the brightest
// platinum highlights, a subtle contrast/saturation grade for richness, and a
// gentle vignette. Disabled entirely in Performance mode.
export default function Effects() {
  const perfMode = useStore((s) => s.perfMode);
  if (perfMode) return null;
  return (
    <EffectComposer multisampling={0}>
      <SMAA />
      <Bloom intensity={0.45} luminanceThreshold={0.8} luminanceSmoothing={0.22} mipmapBlur radius={0.62} />
      <BrightnessContrast brightness={0.0} contrast={0.1} />
      <HueSaturation saturation={0.08} />
      <Vignette eskil={false} offset={0.26} darkness={0.66} />
    </EffectComposer>
  );
}
