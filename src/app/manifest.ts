import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Day-Date 40 — The Achievement of an Ideal',
    short_name: 'Day-Date 40',
    description: 'A cinematic WebGL concept experience of the platinum Day-Date 40. Unofficial design study.',
    start_url: '/',
    display: 'standalone',
    background_color: '#050607',
    theme_color: '#050607',
    icons: [],
  };
}
