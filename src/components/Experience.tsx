'use client';

import { Suspense, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useStore } from '@/lib/store';
import { CAMERA_KEYS, TOTAL_SECTIONS } from '@/lib/constants';
import { useKonami, usePrefersReducedMotion } from '@/lib/hooks';
import { getAudio } from '@/lib/audio';

import Sections from './sections/Sections';
import Hud from './ui/Hud';
import CommandPalette from './ui/CommandPalette';
import DevPanel from './ui/DevPanel';
import Loader from './ui/Loader';

const Scene = dynamic(() => import('./canvas/Scene'), { ssr: false });

export default function Experience() {
  const lenisRef = useRef<Lenis | null>(null);
  const reduced = usePrefersReducedMotion();

  const setScroll = useStore((s) => s.setScroll);
  const setPointer = useStore((s) => s.setPointer);
  const setPalette = useStore((s) => s.setPalette);
  const toggleDev = useStore((s) => s.toggleDev);
  const togglePerf = useStore((s) => s.togglePerf);
  const toggleAudio = useStore((s) => s.toggleAudio);
  const cycleExplode = useStore((s) => s.cycleExplode);
  const requestScreenshot = useStore((s) => s.requestScreenshot);
  const setWatchmaker = useStore((s) => s.setWatchmaker);

  // Smooth scroll synced to GSAP / ScrollTrigger.
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const lenis = new Lenis({
      duration: reduced ? 0 : 1.15,
      lerp: reduced ? 1 : 0.09,
      smoothWheel: !reduced,
      wheelMultiplier: 1,
      touchMultiplier: 1.4,
    });
    lenisRef.current = lenis;

    lenis.on('scroll', (e: { progress: number }) => {
      setScroll(e.progress);
      ScrollTrigger.update();
    });

    const onTick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(onTick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [reduced, setScroll]);

  // Pointer parallax (normalized to -1..1).
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      setPointer((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, [setPointer]);

  // Seek helper used by the palette / scroll hint / keyboard.
  const seekSection = (i: number) => {
    const lenis = lenisRef.current;
    if (!lenis) return;
    const clamped = Math.max(0, Math.min(TOTAL_SECTIONS - 1, i));
    lenis.scrollTo((clamped / TOTAL_SECTIONS) * lenis.limit + 4, { duration: reduced ? 0 : 1.4 });
  };

  // Keyboard shortcuts + accessibility navigation.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPalette(!useStore.getState().paletteOpen);
        return;
      }
      if (useStore.getState().paletteOpen) return;

      switch (e.key) {
        case '`':
          toggleDev();
          break;
        case 'e':
        case 'E':
          cycleExplode();
          break;
        case 'p':
        case 'P':
          togglePerf();
          break;
        case 'm':
        case 'M':
          toggleAudio();
          break;
        case 'c':
        case 'C':
          requestScreenshot();
          break;
        case 'ArrowDown':
        case 'PageDown':
          e.preventDefault();
          seekSection(useStore.getState().section + 1);
          break;
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault();
          seekSection(useStore.getState().section - 1);
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Audio follows the toggle.
  const audioOn = useStore((s) => s.audioOn);
  useEffect(() => {
    const audio = getAudio();
    if (audioOn) audio.enable();
    else audio.disable();
  }, [audioOn]);

  // WebGPU capability probe (renderer stays WebGL2 for stability).
  useEffect(() => {
    useStore.getState().setDiag({ webgpu: typeof navigator !== 'undefined' && 'gpu' in navigator });
  }, []);

  // Auto-enable Performance mode on phones / low-power GPUs so the experience
  // renders reliably (disables post-processing, reflective floor, lowers DPR).
  useEffect(() => {
    const smallScreen = window.matchMedia('(max-width: 820px)').matches;
    const mobileUA = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const lowCores = (navigator.hardwareConcurrency || 8) <= 4;
    if (smallScreen || mobileUA || lowCores) {
      useStore.setState({ perfMode: true });
    }
  }, []);

  // Konami → watchmaker mode.
  useKonami(() => setWatchmaker(!useStore.getState().watchmaker));

  return (
    <>
      <div className="fixed inset-0 z-0" style={{ pointerEvents: 'none' }}>
        <Canvas
          dpr={[1, 2]}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
            preserveDrawingBuffer: true,
          }}
          camera={{ position: CAMERA_KEYS[0].pos, fov: CAMERA_KEYS[0].fov, near: 0.1, far: 100 }}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.06;
          }}
        >
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
        </Canvas>
      </div>

      <Loader />
      <Sections onSeek={seekSection} />
      <Hud onSeek={seekSection} />
      <CommandPalette onSeek={seekSection} />
      <DevPanel />
    </>
  );
}
