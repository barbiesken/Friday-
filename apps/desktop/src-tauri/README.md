# FRIDAY — Desktop Shell (Tauri)

The native shell that wraps the **exact same renderer** (`apps/desktop`) as a
real desktop app. No renderer rewrite: the renderer's
[`SystemBridge`](../src/system/bridge.ts) auto-detects Tauri at runtime
(`window.__TAURI__`) and routes OS actions to the Rust commands here.

## What it provides

- **Global wake hotkey** — `Cmd/Ctrl+Shift+F` focuses the window and emits
  `friday://wake`; the renderer bridge turns that into a `voice/wake` event.
- **System tray** — Show / Quit.
- **Frameless, transparent window** — the core floats in your desktop.
- **Native commands** matching `SystemBridge`: `open_app`, `set_volume`,
  `set_brightness`, `focus_mode`, `run_chain`, `notify`.

## Status

Scaffolded for Phase 2. It is **not** built in CI (no Rust toolchain in the web
sandbox). To run it locally you need Rust + the Tauri prerequisites.

## Run / build

```bash
# one-time: Rust toolchain + Tauri CLI
#   https://tauri.app/start/prerequisites/
npm i -D @tauri-apps/cli

# generate the icon set from a 1024×1024 source (writes src-tauri/icons/*)
npx tauri icon path/to/friday-logo.png

# dev (spawns `npm run dev` and opens the native window)
npx tauri dev

# production bundle
npx tauri build
```

> `icons/` is intentionally empty in git — run `tauri icon` to populate it.
> Double-clap wake (background audio listener) lands next on top of this shell.
