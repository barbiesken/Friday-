'use client';

import { Suspense } from 'react';
import Watch from './Watch';
import GLBWatch from './GLBWatch';

// If a real model URL is provided at build time, render it (with a generic
// break-apart) and fall back to the procedural watch while it loads.
// Otherwise the hand-built procedural Day-Date is used.
const MODEL_URL = process.env.NEXT_PUBLIC_WATCH_MODEL;

export default function WatchModel() {
  if (!MODEL_URL) return <Watch />;
  return (
    <Suspense fallback={<Watch />}>
      <GLBWatch url={MODEL_URL} />
    </Suspense>
  );
}
