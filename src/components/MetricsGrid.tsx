import type { TemperatureUnit, WeatherBundle } from "../types/weather";
import {
  aqiRisk,
  beaufortLabel,
  compassDirection,
  formatDuration,
  formatHour,
  formatTemp,
  formatWindSpeed,
  humidityComfort,
  pressureDescriptor,
  uvRisk,
} from "../utils/format";

interface MetricsGridProps {
  data: WeatherBundle;
  unit: TemperatureUnit;
}

function timeStringToMinutes(isoTime: string): number {
  const timePart = isoTime.split("T")[1] ?? "00:00";
  const [h, m] = timePart.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function MetricsGrid({ data, unit }: MetricsGridProps) {
  const { current, hourly, daily, airQuality } = data;
  const today = daily[0];

  // UV calculations
  const uv = uvRisk(current.uvIndex);
  const uvFraction = Math.max(0, Math.min(1, current.uvIndex / 11));
  const uvAngleRad = Math.PI * (1 - uvFraction);
  const uvCx = 90;
  const uvCy = 86;
  const uvR = 64;
  const uvDotX = uvCx + uvR * Math.cos(uvAngleRad);
  const uvDotY = uvCy - uvR * Math.sin(uvAngleRad);

  // Wind calculations
  const windDir = compassDirection(current.windDirection);
  const windBeaufort = beaufortLabel(current.windSpeed);

  // Next 6 hours precipitation mini-chart
  const next6 = hourly.slice(0, 6);
  const total24hRain = hourly
    .slice(0, 24)
    .reduce((sum, h) => sum + (h.precipitation || 0), 0);
  const max6hMm = Math.max(1.5, ...next6.map((h) => h.precipitation));

  // Solar trajectory calculations
  const nowMin = timeStringToMinutes(current.time);
  const sunriseMin = today ? timeStringToMinutes(today.sunrise) : 420;
  const sunsetMin = today ? timeStringToMinutes(today.sunset) : 1080;
  const daySpan = Math.max(1, sunsetMin - sunriseMin);
  const sunProgress = Math.max(0, Math.min(1, (nowMin - sunriseMin) / daySpan));
  const isSunUp = nowMin >= sunriseMin && nowMin <= sunsetMin;
  // Quadratic Bezier curve from (18, 76) through control (100, -14) to (182, 76)
  const t = sunProgress;
  const sunX = (1 - t) * (1 - t) * 18 + 2 * (1 - t) * t * 100 + t * t * 182;
  const sunY = (1 - t) * (1 - t) * 76 + 2 * (1 - t) * t * -14 + t * t * 76;

  // Humidity & pressure
  const comfort = humidityComfort(current.humidity, current.dewPoint);
  const pressure = pressureDescriptor(current.pressure);
  const visibilityKm = (current.visibility / 1000).toFixed(1).replace(".", ",");

  // Air quality & active pollen
  const aqi = airQuality ? aqiRisk(airQuality.europeanAqi) : null;
  const activePollen = airQuality
    ? [
        { label: "El", val: airQuality.pollen.alder },
        { label: "Birk", val: airQuality.pollen.birch },
        { label: "Græs", val: airQuality.pollen.grass },
        { label: "Bynke", val: airQuality.pollen.mugwort },
      ].filter((p): p is { label: string; val: number } => (p.val ?? 0) >= 5)
    : [];

  return (
    <section
      aria-label="Detaljerede vejrmålinger"
      className="animate-rise stagger-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      {/* 1. UV-INDEKS GAUGE */}
      <article className="instrument-card instrument-card-interactive flex flex-col justify-between p-5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-[0.18em] text-slate-400 uppercase">
            UV-indeks
          </span>
          <span
            className="rounded-full border px-2.5 py-0.5 text-[11px] font-bold"
            style={{
              color: uv.color,
              borderColor: `${uv.color}55`,
              backgroundColor: `${uv.color}18`,
            }}
          >
            {uv.level}
          </span>
        </div>

        <div className="my-2 flex flex-col items-center">
          <svg
            viewBox="0 0 180 100"
            className="h-28 w-44 overflow-visible"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="uvArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#4ade80" />
                <stop offset="32%" stopColor="#facc15" />
                <stop offset="60%" stopColor="#fb923c" />
                <stop offset="82%" stopColor="#f87171" />
                <stop offset="100%" stopColor="#c084fc" />
              </linearGradient>
            </defs>

            {/* Background track */}
            <path
              d="M 26 86 A 64 64 0 0 1 154 86"
              fill="none"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="10"
              strokeLinecap="round"
            />
            {/* Spectrum arc */}
            <path
              d="M 26 86 A 64 64 0 0 1 154 86"
              fill="none"
              stroke="url(#uvArcGrad)"
              strokeWidth="10"
              strokeLinecap="round"
              opacity="0.9"
            />
            {/* Active indicator */}
            <circle
              cx={uvDotX}
              cy={uvDotY}
              r="7.5"
              fill="#ffffff"
              stroke={uv.color}
              strokeWidth="3.5"
              className="transition-all duration-700"
            />
            {/* Big readout inside arc */}
            <text
              x="90"
              y="74"
              textAnchor="middle"
              fill="#ffffff"
              fontSize="28"
              fontWeight="800"
              className="font-mono-num"
            >
              {current.uvIndex.toFixed(1).replace(".", ",")}
            </text>
            <text
              x="90"
              y="91"
              textAnchor="middle"
              fill="#94a3b8"
              fontSize="10.5"
              fontWeight="600"
            >
              {today ? `Maks i dag ${today.uvIndexMax.toFixed(1).replace(".", ",")}` : ""}
            </text>
          </svg>
        </div>

        <p className="text-xs leading-relaxed font-medium text-slate-300">
          {uv.advice}
        </p>
      </article>

      {/* 2. VIND & KOMPAS */}
      <article className="instrument-card instrument-card-interactive flex flex-col justify-between p-5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-[0.18em] text-slate-400 uppercase">
            Vind & Retning
          </span>
          <span className="font-mono-num rounded-full border border-white/14 bg-white/[0.06] px-2.5 py-0.5 text-[11px] font-semibold text-slate-200">
            Fra {windDir.full}
          </span>
        </div>

        <div className="my-2 flex items-center justify-between gap-4">
          <div>
            <p className="font-mono-num text-3xl font-extrabold tracking-tight text-white">
              {current.windSpeed.toFixed(1).replace(".", ",")}
              <span className="ml-1 text-base font-semibold text-slate-300">
                m/s
              </span>
            </p>
            <p className="mt-1 text-sm font-semibold text-sky-300">
              {windBeaufort}
            </p>
            <p className="font-mono-num mt-2 text-xs text-slate-300">
              Vindstød:{" "}
              <span className="font-bold text-white">
                {formatWindSpeed(current.windGusts)}
              </span>
            </p>
          </div>

          {/* Precision Compass Dial */}
          <svg
            viewBox="0 0 110 110"
            className="h-28 w-28 shrink-0"
            aria-hidden="true"
          >
            <circle
              cx="55"
              cy="55"
              r="46"
              fill="rgba(0,0,0,0.28)"
              stroke="rgba(255,255,255,0.16)"
              strokeWidth="1.5"
            />
            <circle
              cx="55"
              cy="55"
              r="38"
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeDasharray="2 5"
              strokeWidth="2"
            />
            <text x="55" y="19" textAnchor="middle" fill="#f8fafc" fontSize="10" fontWeight="800">N</text>
            <text x="92" y="59" textAnchor="middle" fill="#94a3b8" fontSize="9.5" fontWeight="700">Ø</text>
            <text x="55" y="99" textAnchor="middle" fill="#94a3b8" fontSize="9.5" fontWeight="700">S</text>
            <text x="18" y="59" textAnchor="middle" fill="#94a3b8" fontSize="9.5" fontWeight="700">V</text>

            {/* Rotating needle showing wind direction */}
            <g
              style={{
                transformOrigin: "55px 55px",
                transform: `rotate(${current.windDirection}deg)`,
                transition: "transform 800ms cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              <polygon points="55,23 50,55 60,55" fill="#38bdf8" />
              <polygon points="55,87 51,55 59,55" fill="rgba(255,255,255,0.28)" />
              <circle cx="55" cy="55" r="4.5" fill="#ffffff" />
            </g>
          </svg>
        </div>

        <p className="font-mono-num text-xs text-slate-400">
          Kompasretning {Math.round(current.windDirection)}° ({windDir.short})
        </p>
      </article>

      {/* 3. NEDBØR */}
      <article className="instrument-card instrument-card-interactive flex flex-col justify-between p-5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-[0.18em] text-slate-400 uppercase">
            Nedbør
          </span>
          <span className="font-mono-num rounded-full border border-sky-300/30 bg-sky-400/15 px-2.5 py-0.5 text-[11px] font-bold text-sky-200">
            {current.precipitationProbability}% lige nu
          </span>
        </div>

        <div className="mt-2">
          <p className="font-mono-num text-3xl font-extrabold tracking-tight text-white">
            {current.precipitation.toFixed(1).replace(".", ",")}
            <span className="ml-1 text-base font-semibold text-slate-300">
              mm
            </span>
          </p>
          <p className="mt-0.5 text-xs font-medium text-slate-300">
            Næste 24 timer:{" "}
            <span className="font-mono-num font-bold text-white">
              {total24hRain.toFixed(1).replace(".", ",")} mm
            </span>
          </p>
        </div>

        {/* Next 6 Hours Precipitation Mini-Bars */}
        <div className="mt-4 grid grid-cols-6 items-end gap-2">
          {next6.map((h, i) => {
            const pct = Math.max(
              8,
              Math.min(100, (h.precipitation / max6hMm) * 100)
            );
            const hasRain = h.precipitation > 0 || h.precipitationProbability >= 25;
            return (
              <div key={h.time} className="flex flex-col items-center gap-1.5">
                <span className="font-mono-num text-[10px] font-semibold text-sky-200/90">
                  {h.precipitation > 0
                    ? h.precipitation.toFixed(1).replace(".", ",")
                    : `${h.precipitationProbability}%`}
                </span>
                <div className="flex h-12 w-full items-end overflow-hidden rounded-lg bg-white/[0.07] p-0.5">
                  <div
                    className="w-full rounded-md transition-all duration-500"
                    style={{
                      height: hasRain
                        ? `${Math.max(pct, h.precipitationProbability * 0.65)}%`
                        : "10%",
                      background: hasRain
                        ? "linear-gradient(180deg, #7dd3fc 0%, #0284c7 100%)"
                        : "rgba(255,255,255,0.14)",
                    }}
                  />
                </div>
                <span className="font-mono-num text-[10px] font-medium text-slate-400">
                  {i === 0 ? "Nu" : formatHour(h.time).slice(0, 2)}
                </span>
              </div>
            );
          })}
        </div>
      </article>

      {/* 4. SOLOPGANG & SOLNEDGANG */}
      {today && (
        <article className="instrument-card instrument-card-interactive flex flex-col justify-between p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold tracking-[0.18em] text-slate-400 uppercase">
              Solens bane
            </span>
            <span className="font-mono-num text-xs font-semibold text-amber-200">
              {formatDuration(today.daylightDuration)} dagslys
            </span>
          </div>

          <div className="my-2">
            <svg viewBox="0 0 200 96" className="h-24 w-full" aria-hidden="true">
              <defs>
                <linearGradient id="solarArc" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="50%" stopColor="#fde047" />
                  <stop offset="100%" stopColor="#fb7185" />
                </linearGradient>
              </defs>

              {/* Horizon line */}
              <line
                x1="10"
                y1="76"
                x2="190"
                y2="76"
                stroke="rgba(255,255,255,0.18)"
                strokeDasharray="4 4"
                strokeWidth="1.2"
              />

              {/* Parabolic daylight arc */}
              <path
                d="M 18 76 Q 100 -14 182 76"
                fill="none"
                stroke="url(#solarArc)"
                strokeWidth="2.8"
                strokeLinecap="round"
                opacity="0.88"
              />

              {/* Live sun marker */}
              {isSunUp ? (
                <g>
                  <circle cx={sunX} cy={sunY} r="11" fill="#fbbf24" opacity="0.28" />
                  <circle
                    cx={sunX}
                    cy={sunY}
                    r="5.5"
                    fill="#fef08a"
                    stroke="#f59e0b"
                    strokeWidth="2"
                  />
                </g>
              ) : (
                <circle
                  cx={nowMin < sunriseMin ? 18 : 182}
                  cy="76"
                  r="4.5"
                  fill="#94a3b8"
                />
              )}
            </svg>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div>
              <p className="text-slate-400">Solopgang</p>
              <p className="font-mono-num text-base font-bold text-white">
                {formatHour(today.sunrise)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-slate-400">Solnedgang</p>
              <p className="font-mono-num text-base font-bold text-white">
                {formatHour(today.sunset)}
              </p>
            </div>
          </div>
        </article>
      )}

      {/* 5. LUFTFUGTIGHED, DUGPUNKT & SIGTBARHED */}
      <article className="instrument-card instrument-card-interactive flex flex-col justify-between p-5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-[0.18em] text-slate-400 uppercase">
            Fugtighed & Tryk
          </span>
          <span className="font-mono-num text-xs font-semibold text-slate-300">
            Skydække {current.cloudCover}%
          </span>
        </div>

        <div className="mt-3 space-y-3.5">
          <div>
            <div className="flex items-baseline justify-between">
              <span className="font-mono-num text-3xl font-extrabold text-white">
                {Math.round(current.humidity)}%
              </span>
              <span className="text-xs font-semibold text-sky-200">
                Dugpunkt {formatTemp(current.dewPoint, unit)}
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/12">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.min(100, Math.max(4, current.humidity))}%`,
                  background: "linear-gradient(90deg, #38bdf8, #818cf8)",
                }}
              />
            </div>
            <p className="mt-1.5 text-xs font-medium text-slate-300">
              {comfort}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-white/10 pt-3">
            <div>
              <p className="text-[11px] font-semibold text-slate-400">
                Lufttryk ({pressure.label})
              </p>
              <p className="font-mono-num mt-0.5 text-sm font-bold text-white">
                {Math.round(current.pressure)} hPa
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400">
                Sigtbarhed
              </p>
              <p className="font-mono-num mt-0.5 text-sm font-bold text-white">
                {visibilityKm} km
              </p>
            </div>
          </div>
        </div>
      </article>

      {/* 6. LUFTKVALITET (EU AQI) & POLLEN */}
      <article className="instrument-card instrument-card-interactive flex flex-col justify-between p-5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-[0.18em] text-slate-400 uppercase">
            Luftkvalitet (EU AQI)
          </span>
          {aqi && (
            <span
              className="rounded-full border px-2.5 py-0.5 text-[11px] font-bold"
              style={{
                color: aqi.color,
                borderColor: `${aqi.color}55`,
                backgroundColor: `${aqi.color}18`,
              }}
            >
              {aqi.level}
            </span>
          )}
        </div>

        {airQuality && aqi ? (
          <>
            <div className="mt-3">
              <div className="flex items-baseline gap-2.5">
                <span className="font-mono-num text-3xl font-extrabold text-white">
                  {Math.round(airQuality.europeanAqi)}
                </span>
                <span className="text-xs font-medium text-slate-300">
                  / 100+ indeks
                </span>
              </div>

              {/* Color-coded EU AQI spectrum bar */}
              <div className="relative mt-2.5 h-2 w-full rounded-full bg-gradient-to-r from-emerald-400 via-yellow-400 via-70% to-rose-500">
                <span
                  className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-slate-950 bg-white shadow-md transition-all duration-700"
                  style={{
                    left: `${Math.min(98, Math.max(2, airQuality.europeanAqi))}%`,
                  }}
                />
              </div>

              <p className="mt-2 text-xs leading-relaxed font-medium text-slate-300">
                {aqi.advice}
              </p>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
              <span className="font-mono-num rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-[11px] text-slate-200">
                PM2.5: <strong>{airQuality.pm25.toFixed(1)}</strong>
              </span>
              <span className="font-mono-num rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-[11px] text-slate-200">
                PM10: <strong>{airQuality.pm10.toFixed(1)}</strong>
              </span>
              {activePollen.length > 0 ? (
                activePollen.map((p) => (
                  <span
                    key={p.label}
                    className="font-mono-num rounded-lg border border-amber-300/30 bg-amber-400/15 px-2 py-1 text-[11px] font-semibold text-amber-200"
                  >
                    {p.label}-pollen {Math.round(p.val)}
                  </span>
                ))
              ) : (
                <span className="text-[11px] font-medium text-slate-400">
                  Ingen aktiv pollen
                </span>
              )}
            </div>
          </>
        ) : (
          <div className="my-auto py-4 text-sm text-slate-400">
            Luftkvalitetsdata er ikke tilgængelig for denne position lige nu.
          </div>
        )}
      </article>
    </section>
  );
}
