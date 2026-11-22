import type {
  CurrentWeather,
  DailyPoint,
  HourlyPoint,
  TemperatureUnit,
} from "../types/weather";
import { describeWeatherCode } from "./weatherCodes";

export function convertTemp(celsius: number, unit: TemperatureUnit): number {
  return unit === "F" ? (celsius * 9) / 5 + 32 : celsius;
}

export function formatTemp(celsius: number, unit: TemperatureUnit): string {
  return `${Math.round(convertTemp(celsius, unit))}°`;
}

export function formatWindSpeed(ms: number): string {
  return `${ms.toFixed(1).replace(".", ",")} m/s`;
}

export function compassDirection(degrees: number): {
  short: string;
  full: string;
} {
  const dirs = [
    { short: "N", full: "nord" },
    { short: "NØ", full: "nordøst" },
    { short: "Ø", full: "øst" },
    { short: "SØ", full: "sydøst" },
    { short: "S", full: "syd" },
    { short: "SV", full: "sydvest" },
    { short: "V", full: "vest" },
    { short: "NV", full: "nordvest" },
  ];
  const index = Math.round((((degrees % 360) + 360) % 360) / 45) % 8;
  return dirs[index];
}

export function beaufortLabel(ms: number): string {
  if (ms < 0.3) return "Stille";
  if (ms < 1.6) return "Næsten stille";
  if (ms < 3.4) return "Svag vind";
  if (ms < 5.5) return "Let vind";
  if (ms < 8.0) return "Jævn vind";
  if (ms < 10.8) return "Frisk vind";
  if (ms < 13.9) return "Hård vind";
  if (ms < 17.2) return "Stiv kuling";
  if (ms < 20.8) return "Hård kuling";
  if (ms < 24.5) return "Stormende kuling";
  if (ms < 28.5) return "Storm";
  return "Orkanstyrke";
}

export function uvRisk(uv: number): {
  level: string;
  advice: string;
  color: string;
} {
  if (uv < 3) {
    return {
      level: "Lav",
      advice: "Ingen særlig solbeskyttelse nødvendig.",
      color: "#4ade80",
    };
  }
  if (uv < 6) {
    return {
      level: "Moderat",
      advice: "Solbriller og solcreme midt på dagen.",
      color: "#facc15",
    };
  }
  if (uv < 8) {
    return {
      level: "Høj",
      advice: "Søg skygge 12–15 og brug SPF 30+.",
      color: "#fb923c",
    };
  }
  if (uv < 11) {
    return {
      level: "Meget høj",
      advice: "Undgå direkte sol midt på dagen.",
      color: "#f87171",
    };
  }
  return {
    level: "Ekstrem",
    advice: "Bliv i skyggen og beskyt hud og øjne.",
    color: "#c084fc",
  };
}

export function aqiRisk(aqi: number): {
  level: string;
  advice: string;
  color: string;
} {
  if (aqi <= 20) {
    return {
      level: "Meget god",
      advice: "Frisk, ren luft — perfekt til udendørs aktivitet.",
      color: "#34d399",
    };
  }
  if (aqi <= 40) {
    return {
      level: "God",
      advice: "Høj luftkvalitet uden mærkbar belastning.",
      color: "#4ade80",
    };
  }
  if (aqi <= 60) {
    return {
      level: "Moderat",
      advice: "Acceptabel luftkvalitet for de fleste.",
      color: "#facc15",
    };
  }
  if (aqi <= 80) {
    return {
      level: "Ringe",
      advice: "Følsomme personer bør begrænse hård motion ude.",
      color: "#fb923c",
    };
  }
  return {
    level: "Meget ringe",
    advice: "Undgå længerevarende fysisk aktivitet udendørs.",
    color: "#f87171",
  };
}

export function humidityComfort(humidity: number, dewPoint: number): string {
  if (dewPoint >= 18) return "Trykkende & fugtig";
  if (humidity >= 82) return "Meget fugtig luft";
  if (humidity <= 35) return "Tør luft";
  if (dewPoint >= 13) return "Lidt fugtig";
  return "Behagelig luftfugtighed";
}

export function pressureDescriptor(hpa: number): {
  label: string;
  note: string;
} {
  if (hpa >= 1022) return { label: "Højtryk", note: "Stabilt vejr" };
  if (hpa <= 1002) return { label: "Lavtryk", note: "Ustadigt vejr" };
  return { label: "Normalt", note: "Afbalanceret tryk" };
}

export function formatHour(isoTime: string): string {
  const timePart = isoTime.split("T")[1] ?? "00:00";
  return timePart.slice(0, 5);
}

export function formatDayLabel(isoDate: string, index: number): {
  primary: string;
  sub: string;
} {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const sub = new Intl.DateTimeFormat("da-DK", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  })
    .format(dt)
    .replace(".", "");

  if (index === 0) return { primary: "I dag", sub };
  if (index === 1) return { primary: "I morgen", sub };

  const weekday = new Intl.DateTimeFormat("da-DK", {
    weekday: "long",
    timeZone: "UTC",
  }).format(dt);

  return {
    primary: weekday.charAt(0).toUpperCase() + weekday.slice(1),
    sub,
  };
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return `${h}t ${m}m`;
}

export function formatRelativeAge(timestamp: number): string {
  const diffMin = Math.max(0, Math.round((Date.now() - timestamp) / 60000));
  if (diffMin < 1) return "Lige opdateret";
  if (diffMin === 1) return "Opdateret for 1 min siden";
  if (diffMin < 60) return `Opdateret for ${diffMin} min siden`;
  const diffH = Math.round(diffMin / 60);
  return `Opdateret for ${diffH} ${diffH === 1 ? "time" : "timer"} siden`;
}

export function buildSmartSummary(
  current: CurrentWeather,
  hourly: HourlyPoint[],
  today: DailyPoint | undefined,
  unit: TemperatureUnit
): string {
  const next12 = hourly.slice(0, 12);
  const nextRain = next12.find(
    (h, idx) => idx > 0 && (h.precipitation >= 0.4 || h.precipitationProbability >= 55)
  );
  const maxWind = Math.max(...next12.map((h) => h.windSpeed), current.windSpeed);
  const dir = compassDirection(current.windDirection).full;

  const parts: string[] = [];

  if (current.precipitation >= 0.3) {
    const dryHour = next12.find(
      (h, idx) => idx > 0 && h.precipitation < 0.1 && h.precipitationProbability < 35
    );
    if (dryHour) {
      parts.push(`Nedbør lige nu — klarer op omkring kl. ${formatHour(dryHour.time)}.`);
    } else {
      parts.push("Vedvarende nedbør de kommende timer — husk regntøj.");
    }
  } else if (nextRain) {
    const rainLabel = describeWeatherCode(nextRain.weatherCode, nextRain.isDay).shortLabel.toLowerCase();
    parts.push(
      `Chance for ${rainLabel} omkring kl. ${formatHour(nextRain.time)} (${nextRain.precipitationProbability}%).`
    );
  } else if (today) {
    parts.push(
      `${describeWeatherCode(current.weatherCode, current.isDay).label} med temperaturer mellem ${formatTemp(today.tempMin, unit)} og ${formatTemp(today.tempMax, unit)}.`
    );
  }

  if (maxWind >= 9) {
    parts.push(
      `${beaufortLabel(maxWind)} fra ${dir} op til ${Math.round(Math.max(current.windGusts, maxWind))} m/s.`
    );
  } else if (current.uvIndex >= 4) {
    parts.push(`UV-indeks på ${current.uvIndex.toFixed(1).replace(".", ",")} — husk solbeskyttelse.`);
  } else {
    parts.push(`${beaufortLabel(current.windSpeed)} fra ${dir}.`);
  }

  return parts.join(" ");
}

export function countryCodeToFlag(code?: string): string {
  if (!code || code.length !== 2) return "🌍";
  const base = 127397;
  return String.fromCodePoint(
    ...code
      .toUpperCase()
      .split("")
      .map((c) => base + c.charCodeAt(0))
  );
}
