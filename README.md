# ROLEX DAY-DATE 40 — The Achievement of an Ideal

A cinematic, scroll-driven WebGL concept experience for the platinum **Day-Date 40**
(ref. 228236) — ice-blue dial, fluted bezel, President bracelet, Calibre 3255.

> **Unofficial design study.** Not affiliated with, endorsed by, or sponsored by
> Rolex SA. All trademarks belong to their respective owners. Built as a portfolio /
> technical concept piece.

---

## What makes it unusual

- **Zero binary assets.** The watch is built from real Three.js geometry and GLSL
  materials at runtime — there is no `.glb`, no texture files, no stock imagery. It
  clones cleanly and runs offline.
- **One continuous 3D scene** behind nine DOM chapters, with a camera that flies a
  keyframed path tied to a Lenis smooth-scroll timeline.
- **Procedural everything:** sunray ice-blue dial shader, platinum dust particles,
  in-memory studio lighting environment (no fetched HDRIs), and synthesized spatial
  audio (Web Audio — ambient drone + mechanical tick).

## The nine chapters

1. **Immersive open** — black, platinum particles, materialization, cursor orbit.
2. **Hero reveal** — the watch is exploded into nine parts and assembles on scroll.
3. **The ice-blue dial** — full-viewport ice grade, sunray shader, pointer-tracked sheen.
4. **The fluted bezel** — 60 machined flutes, refraction.
5. **Calibre 3255** — caseback flips open; rotor, gear train and balance animate.
6. **President bracelet** — articulated three-piece links.
7. **Water resistance** — underwater grade, rising bubbles.
8. **Time experience** — live day/date, night sky.
9. **Cinematic finale** — reassembled, camera pullback, full specification.

## Controls

| Action | Key | Notes |
| --- | --- | --- |
| Command palette | `⌘K` / `Ctrl+K` | searchable actions + chapter nav |
| Next / previous chapter | `↓` `↑` / `PageDn` `PageUp` | |
| Explode mode | `E` | freeze the watch apart |
| Performance mode | `P` | lower DPR, fewer particles, cheaper env |
| Screenshot | `C` | export the canvas to PNG |
| Audio | `M` | toggle spatial audio |
| Developer panel | `` ` `` | fps / dpr / drawcalls / WebGPU / state |
| **Watchmaker mode** | `↑ ↑ ↓ ↓ ← → ← → b a` | hidden Konami easter egg — x-ray + hotspots |

Full keyboard navigation, `prefers-reduced-motion` support, a skip link, and
screen-reader-only crawlable content are included.

---

## Tech stack

**Wired and running:** Next.js (App Router) · TypeScript · Tailwind CSS ·
React Three Fiber · Three.js · GSAP + ScrollTrigger · Lenis · Framer Motion
(a.k.a. Motion / motion.dev) · GLSL · Zustand · dynamic imports + progressive loading.

**WebGPU:** capability is detected and reported in the Developer panel; the renderer
runs on stable WebGL2 (WebGPU + R3F is still maturing — flip it on once it stabilizes).

**Intentionally deferred** (documented rather than shipped fragile):

- **Theatre.js** — animation is driven by GSAP ScrollTrigger + a keyframed camera rig,
  which is rock-solid for this scroll model. Theatre.js can be layered on for
  authored, editor-tweakable sequences.
- **Lottie** — no vector animation assets are used (the brief forbids stock/binary
  assets); the loader/transitions are CSS + Framer Motion.
- **Postprocessing DOF/Bloom** — soft bloom is approximated with emissive materials,
  tone mapping and the lighting environment to keep the bundle lean and avoid
  version-coupled effect passes. Add `@react-three/postprocessing` for true DOF.

These are deliberate, honest trade-offs so `npm install && npm run dev` just works.

---

## Quick start

```bash
npm install
npm run dev      # http://localhost:3000
```

```bash
npm run build && npm run start   # production
npm run typecheck                # tsc --noEmit
npm run lint
```

Requires Node ≥ 18.18 (developed on Node 22).

## Deploy (Vercel)

```bash
npm i -g vercel
vercel        # preview
vercel --prod
```

Zero config — it's a standard Next.js app. Set `NEXT_PUBLIC_SITE_URL` in the Vercel
project for correct canonical/OpenGraph/sitemap URLs.

---

## Optional: Gemini asset pipeline

The site never depends on this. It can author copy/textures offline and drop them
into `public/generated/` (git-ignored).

```bash
cp .env.example .env.local      # then add your key
npm run generate:assets         # text (gemini-2.5-pro) + images (Imagen)
npm run generate:assets -- --text
npm run generate:assets -- --img
```

| Var | Purpose |
| --- | --- |
| `GEMINI_API_KEY` | Google AI Studio key |
| `GEMINI_TEXT_MODEL` | default `gemini-2.5-pro` — narration / SEO copy |
| `GEMINI_IMAGE_MODEL` | default `imagen-3.0-generate-002` — textures (needs Imagen access) |
| `NEXT_PUBLIC_SITE_URL` | canonical / sitemap / OG base URL |

> **Security:** never commit `.env.local` (it's git-ignored). If a key has ever been
> pasted into a chat or shared, **regenerate it** in Google AI Studio.

---

## Architecture

```
src/
  app/
    layout.tsx            fonts, SEO metadata, skip link
    page.tsx              server page: JSON-LD + crawlable copy + client mount
    ClientExperience.tsx  ssr:false dynamic import boundary
    globals.css           Tailwind + luxe component classes + night sky
    robots.ts sitemap.ts manifest.ts
  components/
    Experience.tsx        Lenis + GSAP + Canvas + input + Konami orchestration
    canvas/
      Scene.tsx           camera rig, studio env, lights, bubbles, diagnostics, capture
      Watch.tsx           procedural Day-Date: case, bezel, dial, hands, movement, bracelet
      Particles.tsx       GPU platinum dust
    sections/Sections.tsx nine scroll chapters (Framer Motion)
    ui/
      Hud.tsx             intro gate, top bar, navigator, color grade, toasts
      CommandPalette.tsx  command palette (⌘K)
      DevPanel.tsx        live diagnostics
      Loader.tsx          progressive entry
  lib/
    store.ts              Zustand state (scroll, modes, diagnostics)
    constants.ts          chapters, explode vectors, camera keys, specs
    audio.ts              Web Audio spatial engine
    hooks.ts              Konami, reduced-motion, mounted
  shaders/materials.ts    dial sunray + particle GLSL + platinum PBR
scripts/generate-assets.mjs   optional Gemini pipeline
```

## Performance & accessibility

- DPR clamped (and lowered in Performance mode); instanced flutes/indexes/links;
  particle count scales with Performance mode; in-memory env baked once in perf mode.
- `prefers-reduced-motion` disables smooth-scroll easing and CSS animation.
- Targets a smooth 120fps desktop / 60fps mobile profile and a high Lighthouse score
  by keeping the initial HTML light and code-splitting the WebGL bundle — verify with
  your own Lighthouse run on the deployed URL.

## License

Code: MIT. Trademarks and the watch design referenced are the property of their
respective owners; this repository is a non-commercial concept study.
