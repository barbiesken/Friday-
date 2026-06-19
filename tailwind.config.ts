import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Restrained luxury palette — near-black, platinum, ice blue.
        ink: {
          DEFAULT: '#050607',
          900: '#070809',
          800: '#0c0e10',
          700: '#14171a',
        },
        platinum: {
          DEFAULT: '#e6e8ec',
          bright: '#f4f6f9',
          soft: '#c3c7cd',
          dim: '#8a9099',
        },
        ice: {
          DEFAULT: '#a9c7d6',
          bright: '#cfe6f0',
          deep: '#6f97ab',
          shadow: '#2e4754',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Cormorant Garamond', 'serif'],
        sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        luxe: '0.42em',
        wide2: '0.22em',
      },
      transitionTimingFunction: {
        luxe: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 1.2s cubic-bezier(0.16,1,0.3,1) forwards',
        shimmer: 'shimmer 6s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
