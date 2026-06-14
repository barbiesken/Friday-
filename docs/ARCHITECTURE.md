# FRIDAY — Technical Architecture

## Topology

```
┌─────────────────────────────────────────────────────────────┐
│  DESKTOP SHELL  (Tauri — Rust)        [Phase 2]               │
│  • Global hotkey + double-clap listener                       │
│  • OS control: apps, windows, volume, brightness, clipboard   │
│  • Always-on-top mini sphere / overlay windows                │
│  • Secure bridge to the renderer                              │
└───────────────┬───────────────────────────────┬──────────────┘
                │ IPC                             │ HTTP + WS
                ▼                                 ▼
┌───────────────────────────────┐   ┌───────────────────────────┐
│  RENDERER  (React + R3F)      │   │  CORE SERVICE (FastAPI)    │
│  • The Sphere (GLSL shaders)  │   │  • Provider abstraction    │
│  • Boot / HUD / Command Center│   │  • Event bus (WS)          │
│  • Voice engine (STT/TTS)     │   │  • Memory / Second Brain   │
│  • Typed event bus + Zustand  │   │  • Presence / Ambient      │
│  • Framer Motion microinteract│   │  • SQLite storage          │
└───────────────────────────────┘   └───────────────────────────┘
```

We ship the **renderer first** as a browser-runnable app (Vite). The Tauri shell
wraps the exact same renderer in Phase 2 — no rewrite. This lets the cinematic
core be demonstrated and iterated immediately while OS-level capabilities land
behind a stable `SystemBridge` interface (mocked in the browser, native in Tauri).

## Why these choices

| Layer        | Choice                       | Rationale |
|--------------|------------------------------|-----------|
| Shell        | **Tauri** (over Electron)    | ~10× smaller, lower idle RAM, Rust security, native APIs. |
| 3D           | **three.js + react-three-fiber** | Declarative scene graph, GLSL shaders for the Sphere. |
| Post FX      | **@react-three/postprocessing** | Bloom = the volumetric glow that sells the HUD look. |
| Motion       | **Framer Motion**            | Spring-based microinteractions, layout transitions. |
| State        | **Zustand**                  | Tiny, fast, no boilerplate; selectors avoid re-renders. |
| Event bus    | **Custom typed emitter**     | Single source of truth for FRIDAY's "nervous system." |
| Backend      | **Python + FastAPI**         | Best AI/ML ecosystem, async, WebSocket-native. |
| Storage      | **SQLite**                   | Local-first, zero-config, fast, file-portable. |

## The nervous system — Event Bus

Everything is an event. The Sphere, voice, ambient engine, and command chains all
communicate through one typed bus (`core/eventBus.ts` on the client, mirrored over
WebSocket on the server). This keeps modules decoupled and plugin-friendly.

```
voice.wake ─▶ assistant.state=listening ─▶ sphere reacts
stt.final  ─▶ nlu.intent ─▶ command.run ─▶ assistant.state=executing
llm.delta  ─▶ tts.speak ─▶ assistant.state=speaking ─▶ sphere ripples
```

Canonical FRIDAY states (the Sphere mirrors these 1:1):

```
boot · idle · listening · thinking · speaking · planning · executing
 · alert · celebrating · sleep · whisper
```

## Modules (plugin-based)

Each module subscribes to events and emits events. No module reaches into another.

- **sphere** — visual presence; pure function of `(state, emotion, audioLevel)`.
- **voice** — wake detection, STT, TTS; interruptible streaming.
- **nlu** — intent classification → command dispatch.
- **commands** — system control + command chains (automation builder).
- **ambient** — presence, focus radar, battery/context observers.
- **memory** — Second Brain, Timeline, semantic recall.
- **insight** — daily brief, energy prediction.

## Provider abstraction (AI)

`services/core/friday/providers/` defines one `LLMProvider` protocol. Swapping
Anthropic ↔ OpenAI ↔ local is a config change, never a code change. The default
target is the latest Claude models. A `MockProvider` ships so the system runs with
zero API keys.

## Security posture

- **Local-first.** Data lives in SQLite on the user's machine.
- **Transparent access.** Every OS capability is gated by a permission the user
  can see and revoke (Permissions panel).
- **Thinking transparency.** Actions surface as `Understanding… Planning… Executing…`
  — never hidden.
- **No action without permission** for anything irreversible or outward-facing.

## Performance budget

| Target                | Budget |
|-----------------------|--------|
| Sustained framerate   | 60fps+ (Sphere capped/adaptive) |
| Perceived wake → react| < 200ms |
| Perceived response    | < 500ms (streaming) |
| Cold boot → greeting  | ≤ 4s |
| Idle CPU              | near-zero (Sphere throttles when unfocused) |
