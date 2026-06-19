#!/usr/bin/env node
/**
 * Optional offline asset pipeline (Google Gemini).
 *
 * The website runs fully WITHOUT this — every visual is generated procedurally
 * in WebGL. This script enriches the experience with AI-authored copy and
 * optional textures/backgrounds, written to /public/generated.
 *
 *   npm run generate:assets            # text + images
 *   npm run generate:assets -- --text  # narration / SEO copy only
 *   npm run generate:assets -- --img   # textures / backgrounds only
 *
 * Reads GEMINI_API_KEY / GEMINI_TEXT_MODEL / GEMINI_IMAGE_MODEL from .env.local.
 * Text uses the most capable model (default gemini-2.5-pro). Images use Imagen.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'public', 'generated');
const API = 'https://generativelanguage.googleapis.com/v1beta';

// ── minimal .env.local loader (no dependency) ──────────────────────────────
async function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    try {
      const raw = await fs.readFile(path.join(ROOT, file), 'utf8');
      for (const line of raw.split('\n')) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
        if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
      }
    } catch {
      /* file may not exist */
    }
  }
}

const TEXTURE_PROMPTS = [
  {
    name: 'ice-blue-dial-macro',
    prompt:
      'Extreme macro photograph of an ice-blue sunray-brushed luxury watch dial, fine concentric radial brushing catching cold studio light, platinum applied indexes, ultra sharp, museum product photography, near-black background, no text, no logos',
    aspect: '1:1',
  },
  {
    name: 'platinum-bezel-macro',
    prompt:
      'Macro photograph of a polished fluted platinum watch bezel, sharp triangular flutes refracting soft white light, cold metallic reflections, jewellery studio lighting, black background, no text, no logos',
    aspect: '16:9',
  },
  {
    name: 'platinum-env-loop',
    prompt:
      'Abstract luxury reflective environment, brushed platinum and soft ice-blue gradients, dark museum gallery ambience, subtle bloom, cinematic, seamless, no text',
    aspect: '16:9',
  },
  {
    name: 'caustics-underwater',
    prompt:
      'Dark underwater caustics, faint cold blue light rays through deep water, slow drifting bubbles, cinematic, abstract, no subjects, no text',
    aspect: '16:9',
  },
];

const TEXT_TASKS = [
  {
    name: 'narration',
    prompt:
      'Write a restrained, luxurious 90-second voiceover narration script for a cinematic concept film about a platinum Day-Date 40 wristwatch with an ice-blue dial, fluted bezel, President bracelet and a 70-hour movement. Nine short chapters: immersive open, hero reveal, the ice-blue dial, the fluted bezel, the movement, the bracelet, water resistance, the day/date experience, finale. Tone: Apple keynote meets museum. No hyperbole, no exclamation marks. Plain text, one chapter per line prefixed with the chapter number.',
  },
  {
    name: 'seo',
    prompt:
      'Write a 150-character meta description and 10 SEO keywords for an unofficial cinematic WebGL concept site about a platinum Day-Date 40 watch with an ice-blue dial. Return as JSON {"description": "...", "keywords": ["..."]}.',
  },
];

async function genText(model, prompt) {
  const res = await fetch(`${API}/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  });
  if (!res.ok) throw new Error(`text ${model} → ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? '';
}

async function genImage(model, prompt, aspect) {
  const res = await fetch(`${API}/models/${model}:predict?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: { sampleCount: 1, aspectRatio: aspect },
    }),
  });
  if (!res.ok) throw new Error(`image ${model} → ${res.status} ${await res.text()}`);
  const data = await res.json();
  const b64 = data?.predictions?.[0]?.bytesBase64Encoded;
  if (!b64) throw new Error('image: no bytes returned');
  return Buffer.from(b64, 'base64');
}

async function main() {
  await loadEnv();
  const key = process.env.GEMINI_API_KEY;
  const textModel = process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-pro';
  const imageModel = process.env.GEMINI_IMAGE_MODEL || 'imagen-3.0-generate-002';

  if (!key) {
    console.error('✗ GEMINI_API_KEY not set. Copy .env.example → .env.local and add your key.');
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const doText = args.length === 0 || args.includes('--text');
  const doImg = args.length === 0 || args.includes('--img');

  await fs.mkdir(OUT, { recursive: true });

  if (doText) {
    console.log(`\n→ Text via ${textModel}`);
    for (const t of TEXT_TASKS) {
      try {
        const out = await genText(textModel, t.prompt);
        const file = path.join(OUT, `${t.name}.txt`);
        await fs.writeFile(file, out, 'utf8');
        console.log(`  ✓ ${t.name}.txt (${out.length} chars)`);
      } catch (e) {
        console.warn(`  ✗ ${t.name}: ${e.message}`);
      }
    }
  }

  if (doImg) {
    console.log(`\n→ Images via ${imageModel}`);
    for (const t of TEXTURE_PROMPTS) {
      try {
        const buf = await genImage(imageModel, t.prompt, t.aspect);
        const file = path.join(OUT, `${t.name}.png`);
        await fs.writeFile(file, buf);
        console.log(`  ✓ ${t.name}.png (${(buf.length / 1024).toFixed(0)} KB)`);
      } catch (e) {
        console.warn(`  ✗ ${t.name}: ${e.message}`);
        console.warn('    (Image generation may require Imagen access on your key/region — text still works.)');
      }
    }
  }

  console.log(`\nDone. Assets in ${path.relative(ROOT, OUT)} (git-ignored).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
