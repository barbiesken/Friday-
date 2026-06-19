/** @type {import('next').NextConfig} */
const isStatic = process.env.BUILD_STATIC === 'true';
const basePath = process.env.PAGES_BASE_PATH || '';

const nextConfig = {
  reactStrictMode: true,
  // Three.js ships untranspiled ESM examples; let Next handle them.
  transpilePackages: ['three'],
  // Static export for GitHub Pages (set BUILD_STATIC=true in CI).
  ...(isStatic
    ? {
        output: 'export',
        trailingSlash: true,
        basePath: basePath || undefined,
        assetPrefix: basePath ? `${basePath}/` : undefined,
      }
    : {}),
  images: { unoptimized: true },
  eslint: {
    // Lint is run explicitly via `npm run lint`; a stray rule should not
    // block a production build of the experience.
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Keep the heavy WebGL libraries out of the server bundle graph.
    optimizePackageImports: ['@react-three/drei', 'framer-motion'],
  },
  webpack: (config) => {
    // Allow `import shader from './x.glsl'` style raw imports if ever added.
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      type: 'asset/source',
    });
    return config;
  },
};

export default nextConfig;
