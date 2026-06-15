# FRIDAY — repo guide

A personal desktop AI built around a **living computational core** (not an orb).
Voice-first, cinematic, local-first. See [`docs/`](docs) for vision/architecture.

## Layout

- `apps/desktop` — the renderer (React + TS + Vite + react-three-fiber + Framer Motion)
  - `src/sphere/` — **the core**: `Core.tsx` composes `CoreReactor`, `Rings`,
    `DataStreams`, `HoloGeometry`, `Agents`, `Pulses`; `drive.ts` is the shared,
    per-frame state all layers read; `shaders.ts` holds the GLSL.
  - `src/core/` — `eventBus` (typed nervous system), `store` (Zustand),
    `orchestrator` (the brain: wake → NLU → effects → speak), `nlu`, `theme`,
    `workspaces`, `worlds`, `ambient`, `bridge` (WS to the service).
  - `src/scene/` Canvas + bloom/CA/grain + grid. `src/hud`, `src/command-center`,
    `src/voice`, `src/ui` (overlays, modes, toasts, onboarding), `src/system` (SystemBridge).
  - `src-tauri/` — Phase 2 desktop shell (Rust commands mirror `SystemBridge`).
- `services/core` — FastAPI: provider abstraction (`MockProvider` default,
  `AnthropicProvider` optional), SQLite, REST + WebSocket event hub.

## Commands

```bash
# renderer
cd apps/desktop && npm install && npm run dev      # http://localhost:5173
npm run build      # tsc + vite (must stay green)
npm test           # vitest

# core service (optional, zero keys)
cd services/core && pip install -r requirements.txt && python -m friday.main
```

## Conventions

- **One nervous system:** modules talk via `bus` (client) mirrored over WS. Never
  reach across modules directly.
- **The core is a pure function of state:** mutate FRIDAY's state through the
  orchestrator's `go()` / store; the `drive` lerps every layer toward it. Don't
  animate layers ad hoc.
- **Palette is strict** electric-blue / white / cyan / red, near-black. No orange.
- Keep `npm run build` and `npm test` green; add a vitest case with new NLU intents.
- Commit in small, verified increments. Don't push to other branches.
