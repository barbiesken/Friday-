# FRIDAY — Design System

Iron Man HUD × Apple restraint. Deep black, blue energy, soft white. Volumetric
glow, motion depth, premium minimalism. Nothing flashy — everything alive.

## Color — design tokens

These are mirrored in `src/styles/tokens.css` and `src/core/theme.ts`.

| Token            | Value        | Use |
|------------------|--------------|-----|
| `--void`         | `#04060a`    | Background base (deep black) |
| `--void-2`       | `#0a0f1a`    | Panel base |
| `--energy`       | `#36b9ff`    | Primary blue energy |
| `--energy-soft`  | `#7fd3ff`    | Highlights, rim light |
| `--energy-deep`  | `#0a4d8c`    | Shadowed energy |
| `--soft-white`   | `#eaf4ff`    | Primary text |
| `--mute`         | `#6b7d96`    | Secondary text |
| `--alert`        | `#ff4d5e`    | Alert / red pulse |
| `--success`      | `#43e8b0`    | Success / celebrate |
| `--glass`        | `rgba(18,28,44,0.45)` | Floating glass panels |
| `--glass-line`   | `rgba(127,211,255,0.18)` | Glass hairline border |

Emotion → accent mapping (drives the Sphere + UI accents):

```
calm        → energy
focused     → energy-soft
curious     → #9b7bff
alert       → alert
celebrating → success
deepthink   → #b06bff
sleep       → energy-deep
```

## Type

- **Display / HUD:** `Orbitron`, `"Space Grotesk"` — geometric, technical.
- **Body / UI:** system UI stack (`-apple-system, "Inter", …`).
- Generous tracking on labels (`0.18em`), uppercase for HUD chrome.
- Numbers are tabular.

## Surfaces — floating glass

```css
background: var(--glass);
backdrop-filter: blur(22px) saturate(140%);
border: 1px solid var(--glass-line);
border-radius: 18px;
box-shadow: 0 8px 40px rgba(0,0,0,.5), inset 0 1px 0 rgba(127,211,255,.08);
```

Panels float, never dock. They drift in with depth (`z` + blur), never slide flat.

## Motion — the cinematic microinteraction spec

Springs, not linear easing. Nothing snaps; everything breathes.

| Interaction | Duration | Curve | Notes |
|-------------|----------|-------|-------|
| Wake        | 200ms    | `spring(260,22)` | Sphere brightens, scales 1→1.06 |
| Listen      | loop     | sine pulse | Surface ripples track mic level |
| Think       | loop     | orbit | Internal particle storm |
| Speak       | per-word | ripple | Energy pulse synced to TTS |
| Success     | 420ms    | `spring(200,16)` | Brief expand + glow bloom |
| Error       | 320ms    | `spring(300,26)` | Quick collapse + red flash |
| Panel enter | 500ms    | `spring(180,24)` | Drift from depth, blur→sharp |
| Panel exit  | 280ms    | easeIn | Fade + recede |

Global easing token: `--ease-cine: cubic-bezier(0.16, 1, 0.3, 1)`.

## Sound

- Ambient hum on wake (sub, felt not heard).
- Spatial voice: greeting center, reminders gentle side, completion subtle drift.
- Whisper mode at night: lower volume, shorter answers, dimmer visuals.

## Layout modes

`mini` (floating orb) · `full` (fullscreen AI) · `orbital` (widgets around sphere)
· `hud` (holographic overlay) · `flow` (only sphere + task).

## Rules (non-negotiable)

- Do not overwhelm. Do not speak too much. Do not greet repeatedly.
- Visual changes communicate emotion — never claim feelings.
- Keep premium. Cut gimmicks.
