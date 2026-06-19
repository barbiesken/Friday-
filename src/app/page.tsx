import ClientExperience from './ClientExperience';
import { SPECS } from '@/lib/constants';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CreativeWork',
  name: 'Day-Date 40 — The Achievement of an Ideal',
  about: 'A cinematic WebGL concept experience inspired by the platinum Day-Date 40 with the ice-blue dial.',
  genre: 'Interactive 3D experience',
  creativeWorkStatus: 'Concept / design study',
  disclaimer:
    'Unofficial concept. Not affiliated with, endorsed by, or sponsored by Rolex SA. All trademarks belong to their respective owners.',
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Crawlable, screen-reader-only content (the canvas itself is visual). */}
      <div className="sr-only">
        <h1>Day-Date 40 — The Achievement of an Ideal</h1>
        <p>
          An immersive, cinematic concept experience inspired by the Rolex Day-Date 40 in 950 platinum (reference
          228236): the ice-blue dial reserved for platinum models, the fluted platinum bezel, the President bracelet,
          and the Calibre 3255 with a 70-hour power reserve, waterproof to 100 metres. This is an unofficial design
          study and is not affiliated with Rolex SA.
        </p>
        <ul>
          {SPECS.map((s) => (
            <li key={s.k}>
              {s.k}: {s.v}
            </li>
          ))}
        </ul>
      </div>

      <ClientExperience />
    </>
  );
}
