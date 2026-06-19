import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const display = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-display',
  display: 'swap',
});
const sans = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Day-Date 40 — The Achievement of an Ideal',
    template: '%s · Day-Date 40',
  },
  description:
    'An immersive cinematic concept experience for the Day-Date 40 in 950 platinum — ice-blue dial, fluted bezel, President bracelet, Calibre 3255. An unofficial design study.',
  keywords: [
    'Day-Date 40',
    'platinum watch',
    'ice blue dial',
    'fluted bezel',
    'President bracelet',
    'Calibre 3255',
    'WebGL',
    'Three.js',
    'cinematic web experience',
  ],
  authors: [{ name: 'Concept Study' }],
  openGraph: {
    title: 'Day-Date 40 — The Achievement of an Ideal',
    description:
      'A cinematic WebGL concept experience of the platinum Day-Date 40 with the ice-blue dial. Unofficial design study.',
    type: 'website',
    url: SITE_URL,
    siteName: 'Day-Date 40 — Concept',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Day-Date 40 — The Achievement of an Ideal',
    description: 'A cinematic WebGL concept experience of the platinum Day-Date 40.',
  },
  robots: { index: true, follow: true },
  category: 'design',
};

export const viewport: Viewport = {
  themeColor: '#050607',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        <a
          href="#dial"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-ink-800 focus:px-4 focus:py-2 focus:text-sm focus:text-platinum"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
