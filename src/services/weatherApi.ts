import type {
  AirQualityData,
  ConsensusSummary,
  DailyPoint,
  GeocodingResult,
  HourlyPoint,
  SavedCity,
  WeatherBundle,
  WeatherModelSnapshot,
} from "../types/weather";

const CACHE_PREFIX = "klar-weather-cache-v3:";
const SAVED_CITIES_KEY = "klar-saved-cities-v2";
const ACTIVE_CITY_KEY = "klar-active-city-v2";
const UNIT_KEY = "klar-unit-v1";

interface ModelDefinition {
  id: string;
  name: string;
  provider: string;
  regionTag: string;
  accentColor: string;
  appliesTo: (lat: number, lon: number) => boolean;
}

const WEATHER_MODELS: ModelDefinition[] = [
  {
    id: "dmi_seamless",
    name: "DMI HARMONIE",
    provider: "Danmarks Meteorologiske Institut",
    regionTag: "DK",
    accentColor: "#38bdf8",
    appliesTo: (lat, lon) => lat >= 48 && lat <= 72 && lon >= -15 && lon <= 32,
  },
  {
    id: "metno_seamless",
    name: "YR / MET Norway",
    provider: "Meteorologisk institutt",
    regionTag: "NO",
    accentColor: "#34d399",
    appliesTo: (lat, lon) => lat >= 52 && lat <= 72 && lon >= -5 && lon <= 36,
  },
  {
    id: "ecmwf_ifs025",
    name: "ECMWF IFS",
    provider: "Det Europæiske Vejrcenter",
    regionTag: "EU",
    accentColor: "#fbbf24",
    appliesTo: () => true,
  },
  {
    id: "icon_seamless",
    name: "DWD ICON",
    provider: "Deutscher Wetterdienst",
    regionTag: "DE",
    accentColor: "#a78bfa",
    appliesTo: () => true,
  },
  {
    id: "gfs_seamless",
    name: "NOAA GFS",
    provider: "US National Weather Service",
    regionTag: "US",
    accentColor: "#fb7185",
    appliesTo: () => true,
  },
];

export function makeCityId(lat: number, lon: number): string {
  return `${lat.toFixed(4)},${lon.toFixed(4)}`;
}

export function loadSavedCities(): SavedCity[] {
  try {
    const raw = localStorage.getItem(SAVED_CITIES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedCity[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function persistSavedCities(cities: SavedCity[]): void {
  try {
    localStorage.setItem(SAVED_CITIES_KEY, JSON.stringify(cities));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadActiveCity(saved: SavedCity[]): SavedCity | null {
  try {
    const raw = localStorage.getItem(ACTIVE_CITY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SavedCity;
      if (
        parsed &&
        typeof parsed.latitude === "number" &&
        typeof parsed.longitude === "number"
      ) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  return saved[0] ?? null;
}

export function persistActiveCity(city: SavedCity | null): void {
  try {
    if (!city) {
      localStorage.removeItem(ACTIVE_CITY_KEY);
    } else {
      localStorage.setItem(ACTIVE_CITY_KEY, JSON.stringify(city));
    }
  } catch {
    // ignore
  }
}

export function loadUnit(): "C" | "F" {
  try {
    return localStorage.getItem(UNIT_KEY) === "F" ? "F" : "C";
  } catch {
    return "C";
  }
}

export function persistUnit(unit: "C" | "F"): void {
  try {
    localStorage.setItem(UNIT_KEY, unit);
  } catch {
    // ignore
  }
}

export function readCachedWeather(cityId: string): WeatherBundle | null {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${cityId}`);
    if (!raw) return null;
    return JSON.parse(raw) as WeatherBundle;
  } catch {
    return null;
  }
}

function writeCachedWeather(bundle: WeatherBundle): void {
  try {
    localStorage.setItem(
      `${CACHE_PREFIX}${bundle.city.id}`,
      JSON.stringify(bundle)
    );
  } catch {
    // ignore
  }
}

interface OpenMeteoForecastResponse {
  timezone: string;
  utc_offset_seconds: number;
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    is_day: number;
    precipitation: number;
    weather_code: number;
    cloud_cover: number;
    pressure_msl: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    wind_gusts_10m: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    apparent_temperature: number[];
    precipitation_probability: number[];
    precipitation: number[];
    weather_code: number[];
    wind_speed_10m: number[];
    wind_direction_10m: number[];
    wind_gusts_10m: number[];
    uv_index: number[];
    visibility: number[];
    dew_point_2m: number[];
    relative_humidity_2m: number[];
    is_day: number[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    apparent_temperature_max: number[];
    apparent_temperature_min: number[];
    sunrise: string[];
    sunset: string[];
    daylight_duration: number[];
    uv_index_max: number[];
    precipitation_sum: number[];
    precipitation_probability_max: number[];
    wind_speed_10m_max: number[];
    wind_gusts_10m_max: number[];
    wind_direction_10m_dominant: number[];
  };
}

interface SingleModelResponse {
  current?: {
    time?: string;
    temperature_2m?: number | null;
    wind_speed_10m?: number | null;
    weather_code?: number | null;
  };
  hourly?: {
    time?: string[];
    temperature_2m?: Array<number | null>;
    precipitation?: Array<number | null>;
  };
  daily?: {
    time?: string[];
    temperature_2m_max?: Array<number | null>;
    temperature_2m_min?: Array<number | null>;
  };
}

interface ParsedModelResult {
  def: ModelDefinition;
  currentTemp: number;
  currentWind: number;
  currentWeatherCode: number;
  precipitation24h: number;
  hourlyTempByTime: Map<string, number>;
  dailyMaxByDate: Map<string, number>;
  dailyMinByDate: Map<string, number>;
}

interface OpenMeteoAirQualityResponse {
  current?: {
    european_aqi?: number;
    pm2_5?: number;
    pm10?: number;
    ozone?: number;
    nitrogen_dioxide?: number;
    alder_pollen?: number | null;
    birch_pollen?: number | null;
    grass_pollen?: number | null;
    mugwort_pollen?: number | null;
  };
}

function avg(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function isFiniteNum(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

async function fetchSingleModel(
  def: ModelDefinition,
  city: SavedCity,
  signal?: AbortSignal
): Promise<ParsedModelResult | null> {
  const params = new URLSearchParams({
    latitude: city.latitude.toString(),
    longitude: city.longitude.toString(),
    timezone: "auto",
    wind_speed_unit: "ms",
    forecast_days: "7",
    models: def.id,
    current: "temperature_2m,wind_speed_10m,weather_code",
    hourly: "temperature_2m,precipitation",
    daily: "temperature_2m_max,temperature_2m_min",
  });

  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params.toString()}`,
    { signal }
  );
  if (!res.ok) return null;

  const json = (await res.json()) as SingleModelResponse;
  const times = json.hourly?.time ?? [];
  const temps = json.hourly?.temperature_2m ?? [];
  const precips = json.hourly?.precipitation ?? [];

  const hourlyTempByTime = new Map<string, number>();
  for (let i = 0; i < times.length; i++) {
    const val = temps[i];
    if (isFiniteNum(val)) {
      hourlyTempByTime.set(times[i], val);
    }
  }

  const localHourPrefix = json.current?.time?.slice(0, 13) ?? "";
  let startIdx = localHourPrefix
    ? times.findIndex((t) => t.startsWith(localHourPrefix))
    : 0;
  if (startIdx < 0) startIdx = 0;

  const currentTemp = isFiniteNum(json.current?.temperature_2m)
    ? json.current.temperature_2m
    : temps[startIdx];

  if (!isFiniteNum(currentTemp)) return null;

  let precipitation24h = 0;
  for (let i = startIdx; i < Math.min(times.length, startIdx + 24); i++) {
    const p = precips[i];
    if (isFiniteNum(p)) precipitation24h += p;
  }

  const dailyMaxByDate = new Map<string, number>();
  const dailyMinByDate = new Map<string, number>();
  const dailyTimes = json.daily?.time ?? [];
  const dailyMax = json.daily?.temperature_2m_max ?? [];
  const dailyMin = json.daily?.temperature_2m_min ?? [];
  for (let i = 0; i < dailyTimes.length; i++) {
    const maxV = dailyMax[i];
    const minV = dailyMin[i];
    if (isFiniteNum(maxV)) dailyMaxByDate.set(dailyTimes[i], maxV);
    if (isFiniteNum(minV)) dailyMinByDate.set(dailyTimes[i], minV);
  }

  return {
    def,
    currentTemp,
    currentWind: isFiniteNum(json.current?.wind_speed_10m)
      ? json.current.wind_speed_10m
      : 0,
    currentWeatherCode: isFiniteNum(json.current?.weather_code)
      ? json.current.weather_code
      : 0,
    precipitation24h,
    hourlyTempByTime,
    dailyMaxByDate,
    dailyMinByDate,
  };
}

function buildConsensusSummary(
  temps: number[],
  fallbackTemp: number
): ConsensusSummary {
  const valid = temps.length > 0 ? temps : [fallbackTemp];
  const currentAvg = avg(valid);
  const currentMin = Math.min(...valid);
  const currentMax = Math.max(...valid);
  const spread = currentMax - currentMin;

  if (spread <= 1.5) {
    return {
      modelCount: valid.length,
      currentAvg,
      currentMin,
      currentMax,
      spread,
      confidence: "high",
      label: "Høj enighed",
    };
  }
  if (spread <= 3.0) {
    return {
      modelCount: valid.length,
      currentAvg,
      currentMin,
      currentMax,
      spread,
      confidence: "moderate",
      label: "Moderat spredning",
    };
  }
  return {
    modelCount: valid.length,
    currentAvg,
    currentMin,
    currentMax,
    spread,
    confidence: "low",
    label: "Stor usikkerhed",
  };
}

export async function fetchWeatherBundle(
  city: SavedCity,
  signal?: AbortSignal
): Promise<WeatherBundle> {
  const forecastParams = new URLSearchParams({
    latitude: city.latitude.toString(),
    longitude: city.longitude.toString(),
    timezone: "auto",
    wind_speed_unit: "ms",
    forecast_days: "8",
    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "is_day",
      "precipitation",
      "weather_code",
      "cloud_cover",
      "pressure_msl",
      "wind_speed_10m",
      "wind_direction_10m",
      "wind_gusts_10m",
    ].join(","),
    hourly: [
      "temperature_2m",
      "apparent_temperature",
      "precipitation_probability",
      "precipitation",
      "weather_code",
      "wind_speed_10m",
      "wind_direction_10m",
      "wind_gusts_10m",
      "uv_index",
      "visibility",
      "dew_point_2m",
      "relative_humidity_2m",
      "is_day",
    ].join(","),
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "apparent_temperature_max",
      "apparent_temperature_min",
      "sunrise",
      "sunset",
      "daylight_duration",
      "uv_index_max",
      "precipitation_sum",
      "precipitation_probability_max",
      "wind_speed_10m_max",
      "wind_gusts_10m_max",
      "wind_direction_10m_dominant",
    ].join(","),
  });

  const aqiParams = new URLSearchParams({
    latitude: city.latitude.toString(),
    longitude: city.longitude.toString(),
    timezone: "auto",
    current: [
      "european_aqi",
      "pm2_5",
      "pm10",
      "ozone",
      "nitrogen_dioxide",
      "alder_pollen",
      "birch_pollen",
      "grass_pollen",
      "mugwort_pollen",
    ].join(","),
  });

  const forecastUrl = `https://api.open-meteo.com/v1/forecast?${forecastParams.toString()}`;
  const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?${aqiParams.toString()}`;

  const applicableModels = WEATHER_MODELS.filter((m) =>
    m.appliesTo(city.latitude, city.longitude)
  );

  // Start base forecast, air quality, and all independent models in parallel!
  const forecastPromise = fetch(forecastUrl, { signal });
  const aqiPromise = fetch(aqiUrl, { signal }).catch(() => null);
  const modelPromises = applicableModels.map((def) =>
    fetchSingleModel(def, city, signal).catch(() => null)
  );

  const [forecastRes, aqiRes, ...modelRawResults] = await Promise.all([
    forecastPromise,
    aqiPromise,
    ...modelPromises,
  ]);

  if (!forecastRes.ok) {
    throw new Error(`Kunne ikke hente vejrdata (${forecastRes.status})`);
  }

  const data = (await forecastRes.json()) as OpenMeteoForecastResponse;

  const currentHourPrefix = data.current.time.slice(0, 13);
  let startIdx = data.hourly.time.findIndex((t) =>
    t.startsWith(currentHourPrefix)
  );
  if (startIdx < 0) startIdx = 0;

  const parsedModels = modelRawResults.filter(
    (m): m is ParsedModelResult => m !== null
  );

  const consensus = buildConsensusSummary(
    parsedModels.map((m) => m.currentTemp),
    data.current.temperature_2m
  );

  const todayDate = data.daily.time[0];
  const models: WeatherModelSnapshot[] = parsedModels.map((m) => ({
    id: m.def.id,
    name: m.def.name,
    provider: m.def.provider,
    regionTag: m.def.regionTag,
    accentColor: m.def.accentColor,
    currentTemp: m.currentTemp,
    currentWind: m.currentWind,
    currentWeatherCode: m.currentWeatherCode,
    precipitation24h: m.precipitation24h,
    todayMax: todayDate ? (m.dailyMaxByDate.get(todayDate) ?? null) : null,
    todayMin: todayDate ? (m.dailyMinByDate.get(todayDate) ?? null) : null,
  }));

  const hourly: HourlyPoint[] = [];
  const endIdx = Math.min(data.hourly.time.length, startIdx + 25);
  for (let i = startIdx; i < endIdx; i++) {
    const timeKey = data.hourly.time[i];
    const baseTemp = data.hourly.temperature_2m[i];
    const modelTemps = parsedModels
      .map((m) => m.hourlyTempByTime.get(timeKey))
      .filter(isFiniteNum);

    const consensusHourTemp =
      modelTemps.length > 0 ? avg(modelTemps) : baseTemp;
    const spreadMin =
      modelTemps.length > 0 ? Math.min(...modelTemps) : baseTemp;
    const spreadMax =
      modelTemps.length > 0 ? Math.max(...modelTemps) : baseTemp;

    hourly.push({
      time: timeKey,
      temperature: consensusHourTemp,
      tempSpreadMin: spreadMin,
      tempSpreadMax: spreadMax,
      apparentTemperature: data.hourly.apparent_temperature[i],
      precipitationProbability: data.hourly.precipitation_probability[i] ?? 0,
      precipitation: data.hourly.precipitation[i] ?? 0,
      weatherCode: data.hourly.weather_code[i],
      windSpeed: data.hourly.wind_speed_10m[i] ?? 0,
      windDirection: data.hourly.wind_direction_10m[i] ?? 0,
      windGusts: data.hourly.wind_gusts_10m[i] ?? 0,
      uvIndex: data.hourly.uv_index[i] ?? 0,
      humidity: data.hourly.relative_humidity_2m[i] ?? 0,
      isDay: data.hourly.is_day[i] === 1,
    });
  }

  const daily: DailyPoint[] = data.daily.time.slice(0, 7).map((date, i) => {
    const modelMaxes = parsedModels
      .map((m) => m.dailyMaxByDate.get(date))
      .filter(isFiniteNum);
    const modelMins = parsedModels
      .map((m) => m.dailyMinByDate.get(date))
      .filter(isFiniteNum);

    return {
      date,
      weatherCode: data.daily.weather_code[i],
      tempMax:
        modelMaxes.length > 0
          ? avg(modelMaxes)
          : data.daily.temperature_2m_max[i],
      tempMin:
        modelMins.length > 0
          ? avg(modelMins)
          : data.daily.temperature_2m_min[i],
      tempMaxSpreadMin:
        modelMaxes.length > 1 ? Math.min(...modelMaxes) : undefined,
      tempMaxSpreadMax:
        modelMaxes.length > 1 ? Math.max(...modelMaxes) : undefined,
      apparentMax: data.daily.apparent_temperature_max[i],
      apparentMin: data.daily.apparent_temperature_min[i],
      sunrise: data.daily.sunrise[i],
      sunset: data.daily.sunset[i],
      daylightDuration: data.daily.daylight_duration[i] ?? 0,
      uvIndexMax: data.daily.uv_index_max[i] ?? 0,
      precipitationSum: data.daily.precipitation_sum[i] ?? 0,
      precipitationProbabilityMax:
        data.daily.precipitation_probability_max[i] ?? 0,
      windSpeedMax: data.daily.wind_speed_10m_max[i] ?? 0,
      windGustsMax: data.daily.wind_gusts_10m_max[i] ?? 0,
      windDirectionDominant: data.daily.wind_direction_10m_dominant[i] ?? 0,
    };
  });

  let airQuality: AirQualityData | null = null;
  if (aqiRes && aqiRes.ok) {
    try {
      const aqiData = (await aqiRes.json()) as OpenMeteoAirQualityResponse;
      if (aqiData.current && typeof aqiData.current.european_aqi === "number") {
        airQuality = {
          europeanAqi: aqiData.current.european_aqi,
          pm25: aqiData.current.pm2_5 ?? 0,
          pm10: aqiData.current.pm10 ?? 0,
          ozone: aqiData.current.ozone ?? 0,
          no2: aqiData.current.nitrogen_dioxide ?? 0,
          pollen: {
            alder: aqiData.current.alder_pollen ?? null,
            birch: aqiData.current.birch_pollen ?? null,
            grass: aqiData.current.grass_pollen ?? null,
            mugwort: aqiData.current.mugwort_pollen ?? null,
          },
        };
      }
    } catch {
      airQuality = null;
    }
  }

  // Consensus current temperature (smooth average across active services)
  const consensusCurrentTemp =
    parsedModels.length > 0 ? consensus.currentAvg : data.current.temperature_2m;

  const bundle: WeatherBundle = {
    city,
    timezone: data.timezone,
    utcOffsetSeconds: data.utc_offset_seconds,
    fetchedAt: Date.now(),
    current: {
      time: data.current.time,
      temperature: consensusCurrentTemp,
      apparentTemperature: data.current.apparent_temperature,
      humidity: data.current.relative_humidity_2m,
      dewPoint: data.hourly.dew_point_2m[startIdx] ?? 0,
      isDay: data.current.is_day === 1,
      precipitation: data.current.precipitation ?? 0,
      precipitationProbability:
        data.hourly.precipitation_probability[startIdx] ?? 0,
      weatherCode: data.current.weather_code,
      cloudCover: data.current.cloud_cover ?? 0,
      pressure: data.current.pressure_msl ?? 1013,
      windSpeed: data.current.wind_speed_10m ?? 0,
      windDirection: data.current.wind_direction_10m ?? 0,
      windGusts: data.current.wind_gusts_10m ?? 0,
      uvIndex: data.hourly.uv_index[startIdx] ?? 0,
      visibility: data.hourly.visibility[startIdx] ?? 10000,
    },
    hourly,
    daily,
    airQuality,
    models,
    consensus,
  };

  writeCachedWeather(bundle);
  return bundle;
}

export async function searchCities(
  query: string,
  signal?: AbortSignal
): Promise<SavedCity[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const params = new URLSearchParams({
    name: trimmed,
    count: "8",
    language: "da",
    format: "json",
  });

  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`,
    { signal }
  );
  if (!res.ok) return [];

  const data = (await res.json()) as { results?: GeocodingResult[] };
  return (data.results ?? []).map((item) => ({
    id: makeCityId(item.latitude, item.longitude),
    name: item.name,
    admin1: item.admin1,
    country: item.country ?? "",
    countryCode: item.country_code,
    latitude: item.latitude,
    longitude: item.longitude,
  }));
}

export async function reverseGeocodeCity(
  latitude: number,
  longitude: number
): Promise<SavedCity> {
  const fallback: SavedCity = {
    id: makeCityId(latitude, longitude),
    name: "Min position",
    country: `${latitude.toFixed(2)}°N, ${longitude.toFixed(2)}°Ø`,
    latitude,
    longitude,
    isCurrentLocation: true,
  };

  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=da`;
    const res = await fetch(url);
    if (!res.ok) return fallback;
    const data = (await res.json()) as {
      city?: string;
      locality?: string;
      principalSubdivision?: string;
      countryName?: string;
      countryCode?: string;
    };

    const name =
      data.city || data.locality || data.principalSubdivision || "Min position";
    return {
      id: makeCityId(latitude, longitude),
      name,
      admin1: data.principalSubdivision,
      country: data.countryName ?? "",
      countryCode: data.countryCode,
      latitude,
      longitude,
      isCurrentLocation: true,
    };
  } catch {
    return fallback;
  }
}
