# FRIDAY — Production Roadmap

Status legend: ✅ done · 🟡 in progress · ⬜ planned

## Phase 0 — Cinematic Core (this build)

The heart of FRIDAY, runnable in a browser today.

- ✅ Monorepo + architecture decisions + design system
- ✅ Typed event bus ("nervous system") + Zustand store
- ✅ **The Sphere** — GLSL shaders, all states, audio-reactive, bloom glow
- ✅ Cinematic boot sequence (energy point → sphere → scanlines → greeting ≤ 4s)
- ✅ HUD overlay (task, timer, next meeting, CPU, AI status)
- ✅ Command Center — orbiting widgets (clock, energy, focus, system)
- ✅ Voice engine (Web Speech STT/TTS) + wake word + interruptible speech
- ✅ Emotional presence (state → visual language) + thinking transparency
- ✅ FastAPI core service: provider abstraction, event WS, SQLite schema
- ✅ Mock LLM provider (runs with zero keys)

## Phase 1 — Conversational MVP

- 🟡 Wire renderer ↔ FastAPI over WebSocket (live state + streaming)
- ⬜ Real STT (whisper.cpp / faster-whisper) + premium TTS provider
- ⬜ NLU intent router + first command chains ("start work mode")
- ⬜ Daily Insight Engine ("Friday brief me")
- ⬜ Second Brain capture + Timeline Memory
- ⬜ Permissions panel

## Phase 2 — Desktop Embodiment (Tauri)

- ⬜ Tauri shell wraps the renderer (no rewrite)
- ⬜ Global hotkey + **double-clap** wake (background audio listener)
- ⬜ System control: apps, windows, volume, brightness, clipboard, notifications
- ⬜ Mini-sphere always-on-top + Friday Dock
- ⬜ Presence engine (active / idle / returning)

## Phase 3 — Awareness

- ⬜ Vision Mode + Screen Awareness (understand current screen)
- ⬜ Smart Overlay (translate / summarize / reply)
- ⬜ Focus Radar (tabs / apps / deadlines → nudges)
- ⬜ Ambient Intelligence (battery, meeting prep, tab grouping)

## Phase 4 — World & Immersion

- ⬜ Workspace transformations (Focus / Builder / Study / Movie / Night)
- ⬜ Aura Field + Room Mode + World Engine themes
- ⬜ Task Constellations, Agent Swarm, Memory Palace
- ⬜ Captain Mode, Flow Mode, Legacy Mode, AI Dreamspace
- ⬜ Spatial audio, Signature Moments, streaks

## Phase 5 — Hardening & Ship

- ⬜ Plugin SDK + marketplace
- ⬜ Adaptive performance (GPU tiering, idle throttle)
- ⬜ Security review, sandboxing, signed releases
- ⬜ Onboarding, telemetry (opt-in, local), auto-update

## MVP definition (ship gate)

Voice wake → understand → act on the OS → speak back, with the Sphere expressing
state throughout, a daily brief each morning, and persistent memory across days —
all local-first with a visible permissions model.
