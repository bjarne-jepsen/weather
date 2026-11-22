export type TemperatureUnit = "C" | "F";

export type WeatherThemeKey =
  | "clear-day"
  | "clear-night"
  | "partly-cloudy-day"
  | "partly-cloudy-night"
  | "cloudy"
  | "fog"
  | "rain"
  | "snow"
  | "storm";

export type WeatherIconKind =
  | "sun"
  | "moon"
  | "partly-sun"
  | "partly-moon"
  | "cloud"
  | "fog"
  | "drizzle"
  | "rain"
  | "heavy-rain"
  | "snow"
  | "storm";

export interface SavedCity {
  id: string;
  name: string;
  admin1?: string;
  country: string;
  countryCode?: string;
  latitude: number;
  longitude: number;
  isCurrentLocation?: boolean;
}

export interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  elevation?: number;
  country_code?: string;
  country?: string;
  admin1?: string;
  timezone?: string;
}

export interface WeatherModelSnapshot {
  id: string;
  name: string;
  provider: string;
  regionTag: string;
  accentColor: string;
  currentTemp: number;
  currentWind: number;
  currentWeatherCode: number;
  precipitation24h: number;
  todayMax: number | null;
  todayMin: number | null;
}

export interface ConsensusSummary {
  modelCount: number;
  currentAvg: number;
  currentMin: number;
  currentMax: number;
  spread: number;
  confidence: "high" | "moderate" | "low";
  label: string;
}

export interface CurrentWeather {
  time: string;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  dewPoint: number;
  isDay: boolean;
  precipitation: number;
  precipitationProbability: number;
  weatherCode: number;
  cloudCover: number;
  pressure: number;
  windSpeed: number; // m/s
  windDirection: number; // degrees
  windGusts: number; // m/s
  uvIndex: number;
  visibility: number; // meters
}

export interface HourlyPoint {
  time: string;
  temperature: number;
  tempSpreadMin: number;
  tempSpreadMax: number;
  apparentTemperature: number;
  precipitationProbability: number;
  precipitation: number;
  weatherCode: number;
  windSpeed: number; // m/s
  windDirection: number;
  windGusts: number; // m/s
  uvIndex: number;
  humidity: number;
  isDay: boolean;
}

export interface DailyPoint {
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  tempMaxSpreadMin?: number;
  tempMaxSpreadMax?: number;
  apparentMax: number;
  apparentMin: number;
  sunrise: string;
  sunset: string;
  daylightDuration: number; // seconds
  uvIndexMax: number;
  precipitationSum: number;
  precipitationProbabilityMax: number;
  windSpeedMax: number; // m/s
  windGustsMax: number; // m/s
  windDirectionDominant: number;
}

export interface AirQualityData {
  europeanAqi: number;
  pm25: number;
  pm10: number;
  ozone: number;
  no2: number;
  pollen: {
    alder: number | null;
    birch: number | null;
    grass: number | null;
    mugwort: number | null;
  };
}

export interface WeatherBundle {
  city: SavedCity;
  timezone: string;
  utcOffsetSeconds: number;
  fetchedAt: number;
  current: CurrentWeather;
  hourly: HourlyPoint[];
  daily: DailyPoint[];
  airQuality: AirQualityData | null;
  models: WeatherModelSnapshot[];
  consensus: ConsensusSummary;
}
