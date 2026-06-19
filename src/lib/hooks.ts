'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/** Fires `onUnlock` when the Konami code is entered. */
export function useKonami(onUnlock: () => void) {
  const cb = useRef(onUnlock);
  cb.current = onUnlock;

  useEffect(() => {
    const seq = [
      'ArrowUp',
      'ArrowUp',
      'ArrowDown',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'ArrowLeft',
      'ArrowRight',
      'b',
      'a',
    ];
    let idx = 0;
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (key === seq[idx]) {
        idx += 1;
        if (idx === seq.length) {
          idx = 0;
          cb.current();
        }
      } else {
        idx = key === seq[0] ? 1 : 0;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

/** Respects the OS "reduce motion" preference. */
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

/** True once mounted on the client — guards SSR-only-safe code. */
export function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}
