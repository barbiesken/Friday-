# Photoreal watch model drop-in

Put a real watch model here to replace the procedural one. The experience will
render **your** model in 4K with the same break-apart / reassemble animation.

## How to use

1. Get a Day-Date `.glb` (or `.gltf`) you have the rights to — e.g. a free
   downloadable model on **Sketchfab** (filter: Downloadable), **CGTrader**,
   **TurboSquid**, or your own. `.glb` (single file) is easiest.
2. Add it to this folder, e.g. `public/models/day-date.glb`. (On GitHub:
   **Add file → Upload files**, drop it in `public/models/`, commit to `main`.)
3. Point the app at it by setting the env var (or just tell me the filename and
   I'll wire it):

   ```
   NEXT_PUBLIC_WATCH_MODEL=/models/day-date.glb
   ```

That's it — the loader (`src/components/canvas/GLBWatch.tsx`) centres, scales,
and explodes/reassembles each sub-mesh on scroll automatically. Per-part offsets
can then be hand-tuned to match the real exploded view.

> Use models you have a licence for. This project is an unofficial concept study.
