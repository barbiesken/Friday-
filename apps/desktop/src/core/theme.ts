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
  energy: "#36b9ff",
  energySoft: "#7fd3ff",
  energyDeep: "#0a4d8c",
  softWhite: "#eaf4ff",
  mute: "#6b7d96",
  alert: "#ff4d5e",
  success: "#43e8b0",
  curious: "#9b7bff",
  deepthink: "#b06bff",
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
  calm: {
    core: hexToRGB(palette.energy),
    glow: hexToRGB(palette.energySoft),
    accent: palette.energy,
    intensity: 0.6,
  },
  focused: {
    core: hexToRGB(palette.energySoft),
    glow: hexToRGB(palette.energy),
    accent: palette.energySoft,
    intensity: 0.85,
  },
  curious: {
    core: hexToRGB(palette.curious),
    glow: hexToRGB("#c9b6ff"),
    accent: palette.curious,
    intensity: 0.9,
  },
  alert: {
    core: hexToRGB(palette.alert),
    glow: hexToRGB("#ff9aa3"),
    accent: palette.alert,
    intensity: 1.0,
  },
  celebrating: {
    core: hexToRGB(palette.success),
    glow: hexToRGB("#9bffd9"),
    accent: palette.success,
    intensity: 1.0,
  },
  deepthink: {
    core: hexToRGB(palette.deepthink),
    glow: hexToRGB("#d6a8ff"),
    accent: palette.deepthink,
    intensity: 0.7,
  },
  sleep: {
    core: hexToRGB(palette.energyDeep),
    glow: hexToRGB("#1d6fb0"),
    accent: palette.energyDeep,
    intensity: 0.25,
  },
};
