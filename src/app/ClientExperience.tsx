'use client';

import dynamic from 'next/dynamic';

// The entire WebGL experience is client-only and code-split so the initial
// HTML stays light and crawlable.
const Experience = dynamic(() => import('@/components/Experience'), { ssr: false });

export default function ClientExperience() {
  return <Experience />;
}
