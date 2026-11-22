import type { WeatherIconKind, WeatherThemeKey } from "../types/weather";

export interface WeatherCodeInfo {
  label: string;
  shortLabel: string;
  icon: WeatherIconKind;
  theme: WeatherThemeKey;
  canvasMode:
    | "clear-day"
    | "clear-night"
    | "cloudy"
    | "fog"
    | "rain"
    | "heavy-rain"
    | "snow"
    | "storm";
}

export function describeWeatherCode(code: number, isDay: boolean): WeatherCodeInfo {
  switch (code) {
    case 0:
      return {
        label: isDay ? "Skyfrit" : "Stjerneklart",
        shortLabel: isDay ? "Klart" : "Klart",
        icon: isDay ? "sun" : "moon",
        theme: isDay ? "clear-day" : "clear-night",
        canvasMode: isDay ? "clear-day" : "clear-night",
      };
    case 1:
      return {
        label: isDay ? "Overvejende klart" : "Mest klart",
        shortLabel: "Mest klart",
        icon: isDay ? "sun" : "moon",
        theme: isDay ? "clear-day" : "clear-night",
        canvasMode: isDay ? "clear-day" : "clear-night",
      };
    case 2:
      return {
        label: "Delvist skyet",
        shortLabel: "Let skyet",
        icon: isDay ? "partly-sun" : "partly-moon",
        theme: isDay ? "partly-cloudy-day" : "partly-cloudy-night",
        canvasMode: isDay ? "cloudy" : "clear-night",
      };
    case 3:
      return {
        label: "Overskyet",
        shortLabel: "Overskyet",
        icon: "cloud",
        theme: "cloudy",
        canvasMode: "cloudy",
      };
    case 45:
    case 48:
      return {
        label: code === 48 ? "Rimtåge" : "Tåge",
        shortLabel: "Tåge",
        icon: "fog",
        theme: "fog",
        canvasMode: "fog",
      };
    case 51:
    case 53:
    case 55:
      return {
        label: code === 55 ? "Tæt finregn" : "Finregn",
        shortLabel: "Finregn",
        icon: "drizzle",
        theme: "rain",
        canvasMode: "rain",
      };
    case 56:
    case 57:
      return {
        label: "Isslag / frysende finregn",
        shortLabel: "Isslag",
        icon: "drizzle",
        theme: "snow",
        canvasMode: "rain",
      };
    case 61:
      return {
        label: "Let regn",
        shortLabel: "Let regn",
        icon: "rain",
        theme: "rain",
        canvasMode: "rain",
      };
    case 63:
      return {
        label: "Regn",
        shortLabel: "Regn",
        icon: "rain",
        theme: "rain",
        canvasMode: "rain",
      };
    case 65:
      return {
        label: "Kraftig regn",
        shortLabel: "Skybrud",
        icon: "heavy-rain",
        theme: "rain",
        canvasMode: "heavy-rain",
      };
    case 66:
    case 67:
      return {
        label: "Frysende regn",
        shortLabel: "Isslag",
        icon: "rain",
        theme: "snow",
        canvasMode: "rain",
      };
    case 71:
    case 73:
    case 75:
    case 77:
      return {
        label:
          code === 75
            ? "Kraftigt snefald"
            : code === 71
              ? "Let sne"
              : "Snefald",
        shortLabel: "Sne",
        icon: "snow",
        theme: "snow",
        canvasMode: "snow",
      };
    case 80:
    case 81:
    case 82:
      return {
        label:
          code === 82
            ? "Kraftige regnbyger"
            : code === 80
              ? "Lette byger"
              : "Regnbyger",
        shortLabel: "Byger",
        icon: code === 82 ? "heavy-rain" : "rain",
        theme: "rain",
        canvasMode: code === 82 ? "heavy-rain" : "rain",
      };
    case 85:
    case 86:
      return {
        label: code === 86 ? "Kraftige snebyger" : "Snebyger",
        shortLabel: "Snebyger",
        icon: "snow",
        theme: "snow",
        canvasMode: "snow",
      };
    case 95:
    case 96:
    case 99:
      return {
        label: code === 95 ? "Tordenvejr" : "Torden & hagl",
        shortLabel: "Torden",
        icon: "storm",
        theme: "storm",
        canvasMode: "storm",
      };
    default:
      return {
        label: "Skiftende vejr",
        shortLabel: "Skiftende",
        icon: isDay ? "partly-sun" : "partly-moon",
        theme: "cloudy",
        canvasMode: "cloudy",
      };
  }
}
