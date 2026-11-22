import { useState } from "react";
import type { DailyPoint, TemperatureUnit } from "../types/weather";
import { describeWeatherCode } from "../utils/weatherCodes";
import {
  compassDirection,
  formatDayLabel,
  formatHour,
  formatTemp,
  formatWindSpeed,
  uvRisk,
} from "../utils/format";
import { WeatherIcon } from "./WeatherIcon";

interface DailyForecastProps {
  daily: DailyPoint[];
  currentTemp: number;
  unit: TemperatureUnit;
}

export function DailyForecast({
  daily,
  currentTemp,
  unit,
}: DailyForecastProps) {
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  if (daily.length === 0) return null;

  const weekMin = Math.min(...daily.map((d) => d.tempMin));
  const weekMax = Math.max(...daily.map((d) => d.tempMax));
  const weekSpan = Math.max(1, weekMax - weekMin);

  return (
    <section
      aria-label="7-dagesprognose"
      className="instrument-card animate-rise stagger-3 p-5 sm:p-6"
    >
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold tracking-[0.18em] text-slate-400 uppercase">
            Ugeoversigt
          </p>
          <h2 className="mt-0.5 text-lg font-bold text-white">
            7-dagesprognose
          </h2>
        </div>
        <span className="text-xs font-medium text-slate-400">
          Tryk på en dag for detaljer
        </span>
      </div>

      <div className="divide-y divide-white/10">
        {daily.map((day, idx) => {
          const { primary, sub } = formatDayLabel(day.date, idx);
          const wx = describeWeatherCode(day.weatherCode, true);
          const isOpen = expandedDate === day.date;

          const leftPct = ((day.tempMin - weekMin) / weekSpan) * 100;
          const widthPct = Math.max(
            7,
            ((day.tempMax - day.tempMin) / weekSpan) * 100
          );

          const nowPct =
            idx === 0
              ? Math.max(
                  leftPct,
                  Math.min(
                    leftPct + widthPct,
                    ((currentTemp - weekMin) / weekSpan) * 100
                  )
                )
              : null;

          const uv = uvRisk(day.uvIndexMax);
          const windDir = compassDirection(day.windDirectionDominant);

          return (
            <div key={day.date} className="py-1 first:pt-0 last:pb-0">
              <button
                type="button"
                onClick={() =>
                  setExpandedDate(isOpen ? null : day.date)
                }
                aria-expanded={isOpen}
                className={`group grid w-full grid-cols-[minmax(88px,1.15fr)_auto_minmax(110px,1.55fr)_auto] items-center gap-2.5 rounded-2xl px-2.5 py-2.5 text-left transition-colors duration-200 sm:grid-cols-[minmax(120px,1.1fr)_90px_minmax(150px,1.7fr)_24px] sm:gap-4 sm:px-3 ${
                  isOpen ? "bg-white/[0.08]" : "hover:bg-white/[0.05]"
                }`}
              >
                {/* Day Name */}
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">
                    {primary}
                  </p>
                  <p className="font-mono-num text-[11px] font-medium text-slate-400">
                    {sub}
                  </p>
                </div>

                {/* Weather Icon + Rain Probability */}
                <div className="flex items-center gap-2">
                  <WeatherIcon kind={wx.icon} size={32} />
                  <span
                    className={`font-mono-num w-9 text-xs font-semibold ${
                      day.precipitationProbabilityMax >= 20
                        ? "text-sky-300"
                        : "text-slate-500"
                    }`}
                  >
                    {day.precipitationProbabilityMax >= 15
                      ? `${day.precipitationProbabilityMax}%`
                      : ""}
                  </span>
                </div>

                {/* Proportional Temperature Range Bar */}
                <div className="flex items-center gap-2.5">
                  <span className="font-mono-num w-8 text-right text-xs font-semibold text-slate-300 sm:text-sm">
                    {formatTemp(day.tempMin, unit)}
                  </span>

                  <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/12">
                    <div
                      className="absolute inset-y-0 rounded-full transition-all duration-500"
                      style={{
                        left: `${leftPct}%`,
                        width: `${widthPct}%`,
                        background:
                          "linear-gradient(90deg, #38bdf8 0%, #34d399 38%, #fbbf24 72%, #f97316 100%)",
                      }}
                    />
                    {nowPct !== null && (
                      <span
                        title="Aktuel temperatur"
                        className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-slate-950 bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]"
                        style={{ left: `${nowPct}%` }}
                      />
                    )}
                  </div>

                  <span className="font-mono-num w-8 text-xs font-bold text-white sm:text-sm">
                    {formatTemp(day.tempMax, unit)}
                  </span>
                </div>

                {/* Chevron */}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`text-slate-400 transition-transform duration-300 group-hover:text-white ${
                    isOpen ? "rotate-180 text-white" : ""
                  }`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {/* Smooth Expandable Details */}
              <div className="accordion-content" data-open={isOpen}>
                <div className="accordion-inner">
                  <div className="mx-1 mt-1 mb-2 grid grid-cols-2 gap-2.5 rounded-2xl border border-white/10 bg-black/35 p-3.5 sm:grid-cols-4">
                    <div>
                      <p className="text-[11px] font-semibold text-slate-400">
                        Vejrtype & Nedbør
                      </p>
                      <p className="mt-0.5 text-sm font-bold text-white">
                        {wx.label}
                      </p>
                      <p className="font-mono-num text-xs text-sky-300">
                        {day.precipitationSum.toFixed(1).replace(".", ",")} mm ({day.precipitationProbabilityMax}%)
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold text-slate-400">
                        Vind & Vindstød
                      </p>
                      <p className="font-mono-num mt-0.5 text-sm font-bold text-white">
                        {formatWindSpeed(day.windSpeedMax)} {windDir.short}
                      </p>
                      <p className="font-mono-num text-xs text-slate-300">
                        Stød op til {formatWindSpeed(day.windGustsMax)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold text-slate-400">
                        Maks. UV-indeks
                      </p>
                      <p className="font-mono-num mt-0.5 text-sm font-bold text-white">
                        {day.uvIndexMax.toFixed(1).replace(".", ",")} —{" "}
                        <span style={{ color: uv.color }}>{uv.level}</span>
                      </p>
                      <p className="font-mono-num text-xs text-slate-300">
                        {day.tempMaxSpreadMin !== undefined &&
                        day.tempMaxSpreadMax !== undefined &&
                        day.tempMaxSpreadMax - day.tempMaxSpreadMin >= 0.8
                          ? `Maks-spredning ${formatTemp(day.tempMaxSpreadMin, unit)}–${formatTemp(day.tempMaxSpreadMax, unit)}`
                          : `Føles ${formatTemp(day.apparentMin, unit)} / ${formatTemp(day.apparentMax, unit)}`}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold text-slate-400">
                        Solopgang / Nedgang
                      </p>
                      <p className="font-mono-num mt-0.5 text-sm font-bold text-amber-200">
                        {formatHour(day.sunrise)} → {formatHour(day.sunset)}
                      </p>
                      <p className="text-xs text-slate-300">
                        Lokal tid
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
