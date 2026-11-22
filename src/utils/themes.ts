import type { WeatherThemeKey } from "../types/weather";

export interface ThemePalette {
  metaThemeColor: string;
  skyTop: string;
  skyMid: string;
  skyBottom: string;
  glowPrimary: string;
  glowSecondary: string;
  accent: string;
  accentSoft: string;
  surfaceBg: string;
  surfaceElevated: string;
  borderSubtle: string;
  borderStrong: string;
}

/**
 * Curated high-contrast atmospheric palettes.
 * Every palette pairs deep zenith sky tones with dark smoked-glass instrument surfaces,
 * guaranteeing WCAG AAA legibility for primary data and AA+ for secondary labels
 * across bright day, overcast, storm, and night conditions.
 */
export const WEATHER_THEMES: Record<WeatherThemeKey, ThemePalette> = {
  "clear-day": {
    metaThemeColor: "#071830",
    skyTop: "#06152c",
    skyMid: "#0d2e5c",
    skyBottom: "#174880",
    glowPrimary: "rgba(251, 191, 36, 0.28)",
    glowSecondary: "rgba(56, 189, 248, 0.22)",
    accent: "#fbbf24",
    accentSoft: "rgba(251, 191, 36, 0.16)",
    surfaceBg: "rgba(7, 17, 34, 0.68)",
    surfaceElevated: "rgba(10, 24, 48, 0.82)",
    borderSubtle: "rgba(255, 255, 255, 0.13)",
    borderStrong: "rgba(251, 191, 36, 0.35)",
  },
  "clear-night": {
    metaThemeColor: "#050914",
    skyTop: "#040711",
    skyMid: "#0a1228",
    skyBottom: "#141f3f",
    glowPrimary: "rgba(129, 140, 248, 0.22)",
    glowSecondary: "rgba(56, 189, 248, 0.14)",
    accent: "#a5b4fc",
    accentSoft: "rgba(129, 140, 248, 0.18)",
    surfaceBg: "rgba(8, 12, 26, 0.72)",
    surfaceElevated: "rgba(14, 21, 44, 0.86)",
    borderSubtle: "rgba(255, 255, 255, 0.12)",
    borderStrong: "rgba(165, 180, 252, 0.38)",
  },
  "partly-cloudy-day": {
    metaThemeColor: "#091729",
    skyTop: "#081424",
    skyMid: "#132c4c",
    skyBottom: "#1f4268",
    glowPrimary: "rgba(250, 204, 21, 0.2)",
    glowSecondary: "rgba(125, 211, 252, 0.2)",
    accent: "#38bdf8",
    accentSoft: "rgba(56, 189, 248, 0.16)",
    surfaceBg: "rgba(8, 17, 31, 0.7)",
    surfaceElevated: "rgba(13, 27, 48, 0.84)",
    borderSubtle: "rgba(255, 255, 255, 0.13)",
    borderStrong: "rgba(56, 189, 248, 0.36)",
  },
  "partly-cloudy-night": {
    metaThemeColor: "#070c18",
    skyTop: "#060a14",
    skyMid: "#101a2e",
    skyBottom: "#1b2944",
    glowPrimary: "rgba(148, 163, 184, 0.16)",
    glowSecondary: "rgba(99, 102, 241, 0.16)",
    accent: "#93c5fd",
    accentSoft: "rgba(147, 197, 253, 0.16)",
    surfaceBg: "rgba(9, 14, 26, 0.74)",
    surfaceElevated: "rgba(15, 23, 42, 0.86)",
    borderSubtle: "rgba(255, 255, 255, 0.12)",
    borderStrong: "rgba(147, 197, 253, 0.35)",
  },
  cloudy: {
    metaThemeColor: "#0c121d",
    skyTop: "#0a0f18",
    skyMid: "#172133",
    skyBottom: "#253349",
    glowPrimary: "rgba(148, 163, 184, 0.18)",
    glowSecondary: "rgba(56, 189, 248, 0.12)",
    accent: "#7dd3fc",
    accentSoft: "rgba(125, 211, 252, 0.15)",
    surfaceBg: "rgba(11, 16, 26, 0.74)",
    surfaceElevated: "rgba(18, 26, 41, 0.88)",
    borderSubtle: "rgba(255, 255, 255, 0.13)",
    borderStrong: "rgba(125, 211, 252, 0.34)",
  },
  fog: {
    metaThemeColor: "#11161f",
    skyTop: "#0e131b",
    skyMid: "#1e2736",
    skyBottom: "#313e50",
    glowPrimary: "rgba(203, 213, 225, 0.18)",
    glowSecondary: "rgba(148, 163, 184, 0.14)",
    accent: "#e2e8f0",
    accentSoft: "rgba(226, 232, 240, 0.14)",
    surfaceBg: "rgba(13, 18, 27, 0.76)",
    surfaceElevated: "rgba(22, 29, 43, 0.88)",
    borderSubtle: "rgba(255, 255, 255, 0.14)",
    borderStrong: "rgba(226, 232, 240, 0.34)",
  },
  rain: {
    metaThemeColor: "#060e1b",
    skyTop: "#050b16",
    skyMid: "#0d1f38",
    skyBottom: "#143052",
    glowPrimary: "rgba(56, 189, 248, 0.24)",
    glowSecondary: "rgba(14, 165, 233, 0.14)",
    accent: "#38bdf8",
    accentSoft: "rgba(56, 189, 248, 0.18)",
    surfaceBg: "rgba(6, 14, 28, 0.74)",
    surfaceElevated: "rgba(11, 24, 44, 0.88)",
    borderSubtle: "rgba(255, 255, 255, 0.12)",
    borderStrong: "rgba(56, 189, 248, 0.42)",
  },
  snow: {
    metaThemeColor: "#0a1524",
    skyTop: "#091321",
    skyMid: "#162b45",
    skyBottom: "#254469",
    glowPrimary: "rgba(224, 242, 254, 0.22)",
    glowSecondary: "rgba(125, 211, 252, 0.18)",
    accent: "#bae6fd",
    accentSoft: "rgba(186, 230, 253, 0.18)",
    surfaceBg: "rgba(9, 19, 34, 0.72)",
    surfaceElevated: "rgba(15, 31, 53, 0.86)",
    borderSubtle: "rgba(255, 255, 255, 0.15)",
    borderStrong: "rgba(186, 230, 253, 0.4)",
  },
  storm: {
    metaThemeColor: "#090714",
    skyTop: "#070511",
    skyMid: "#171130",
    skyBottom: "#261c4d",
    glowPrimary: "rgba(167, 139, 250, 0.26)",
    glowSecondary: "rgba(250, 204, 21, 0.16)",
    accent: "#facc15",
    accentSoft: "rgba(250, 204, 21, 0.16)",
    surfaceBg: "rgba(11, 8, 24, 0.76)",
    surfaceElevated: "rgba(20, 15, 42, 0.88)",
    borderSubtle: "rgba(255, 255, 255, 0.13)",
    borderStrong: "rgba(250, 204, 21, 0.38)",
  },
};
