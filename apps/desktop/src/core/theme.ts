import type { Emotion } from "./types";

export type RGB = [number, number, number];

/** hex → linear-ish 0..1 RGB tuple for shaders/three. */
export function hexToRGB(hex: string): RGB {
  const n = parseInt(hex.replace("#", ""), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export const palette = {
  void: "#04060a",
  void2: "#0a0f1a",
  energy: "#2f8fff", // electric blue (primary)
  energySoft: "#7fd3ff", // cyan (highlight)
  energyDeep: "#0a4d8c",
  softWhite: "#eaf4ff",
  mute: "#6b7d96",
  alert: "#ff3b4d",
  success: "#8fe9ff", // on-palette "bright" (no green)
  curious: "#36d0ff",
  deepthink: "#2f6bff",
} as const;

export interface EmotionTheme {
  /** core energy color of the Sphere */
  core: RGB;
  /** outer glow / rim */
  glow: RGB;
  /** css accent for UI chrome */
  accent: string;
  /** breathing / motion intensity multiplier */
  intensity: number;
}

/**
 * Emotion → visual language. Drives the Sphere shader uniforms and UI accents.
 * The Sphere never "feels" — it expresses these as color, motion and glow.
 */
export const emotionThemes: Record<Emotion, EmotionTheme> = {
  calm:        { core: hexToRGB("#2f8fff"), glow: hexToRGB("#7fd3ff"), accent: "#36b9ff", intensity: 0.6 },
  focused:     { core: hexToRGB("#36b9ff"), glow: hexToRGB("#aee9ff"), accent: "#36b9ff", intensity: 0.85 },
  curious:     { core: hexToRGB("#36d0ff"), glow: hexToRGB("#bff0ff"), accent: "#36d0ff", intensity: 0.9 },
  alert:       { core: hexToRGB("#ff3b4d"), glow: hexToRGB("#ff9aa3"), accent: "#ff3b4d", intensity: 1.0 },
  celebrating: { core: hexToRGB("#8fe9ff"), glow: hexToRGB("#ffffff"), accent: "#8fe9ff", intensity: 1.0 },
  deepthink:   { core: hexToRGB("#2f6bff"), glow: hexToRGB("#9fc4ff"), accent: "#2f6bff", intensity: 0.7 },
  sleep:       { core: hexToRGB("#143a66"), glow: hexToRGB("#1d6fb0"), accent: "#2f6fb0", intensity: 0.25 },
};
