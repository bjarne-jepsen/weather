import type { TemperatureUnit, WeatherBundle } from "../types/weather";
import { useAnimatedNumber } from "../hooks/useAnimatedNumber";
import { describeWeatherCode } from "../utils/weatherCodes";
import {
  buildSmartSummary,
  compassDirection,
  convertTemp,
  formatHour,
  formatRelativeAge,
  formatTemp,
  formatWindSpeed,
} from "../utils/format";
import { WeatherIcon } from "./WeatherIcon";

interface HeroWeatherProps {
  data: WeatherBundle;
  unit: TemperatureUnit;
  isSaved: boolean;
  isOffline: boolean;
  onToggleSave: () => void;
}

export function HeroWeather({
  data,
  unit,
  isSaved,
  isOffline,
  onToggleSave,
}: HeroWeatherProps) {
  const { current, daily, hourly, city, consensus } = data;
  const today = daily[0];
  const wx = describeWeatherCode(current.weatherCode, current.isDay);

  const animatedTemp = useAnimatedNumber(convertTemp(current.temperature, unit));
  const animatedFeels = useAnimatedNumber(
    convertTemp(current.apparentTemperature, unit)
  );

  const summary = buildSmartSummary(current, hourly, today, unit);
  const windDir = compassDirection(current.windDirection);

  const showInlineSpread = consensus.modelCount >= 2 && consensus.spread >= 1.5;
  const consensusDotColor =
    consensus.confidence === "high"
      ? "bg-emerald-400"
      : consensus.confidence === "moderate"
        ? "bg-amber-400"
        : "bg-rose-400";

  const scrollToConsensus = () => {
    document
      .getElementById("model-consensus")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section
      aria-label="Aktuelt vejr"
      className="instrument-card animate-rise stagger-1 overflow-hidden p-5 sm:p-8"
    >
      {/* Subtle luminous radial corner wash */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full blur-3xl"
        style={{ background: "var(--glow-primary)" }}
      />

      {/* Location Header Row */}
      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {city.isCurrentLocation && (
              <span className="inline-flex items-center gap-1 rounded-full border border-sky-300/35 bg-sky-400/18 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-sky-100 uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-300" />
                GPS
              </span>
            )}
            <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              {city.name}
            </h1>
            <button
              type="button"
              onClick={onToggleSave}
              aria-label={isSaved ? "Fjern fra gemte byer" : "Gem by"}
              title={isSaved ? "Gemt som favorit" : "Gem som favorit"}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-200 active:scale-90 ${
                isSaved
                  ? "border-amber-300/45 bg-amber-400/18 text-amber-300"
                  : "border-white/15 bg-white/[0.06] text-white/65 hover:border-white/30 hover:text-white"
              }`}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill={isSaved ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth="2.1"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </button>
          </div>

          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm font-medium text-slate-300">
            <span>
              {[city.admin1, city.country].filter(Boolean).join(", ")}
            </span>
            <span className="text-white/30">•</span>
            <span className="font-mono-num text-xs text-slate-300/90">
              Lokal tid {formatHour(current.time)}
            </span>
          </p>
        </div>

        {/* Status / Freshness Badge */}
        <div className="flex items-center gap-2">
          {isOffline ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/40 bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-100">
              <span className="h-2 w-2 rounded-full bg-amber-300" />
              Offline-cache
            </span>
          ) : (
            <span className="font-mono-num inline-flex items-center gap-1.5 rounded-full border border-white/14 bg-black/30 px-3 py-1 text-[11px] font-medium text-slate-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
              {formatRelativeAge(data.fetchedAt)}
            </span>
          )}
        </div>
      </div>

      {/* Main Monumental Temperature + Animated Weather Display */}
      <div className="relative mt-6 grid items-center gap-6 sm:mt-8 sm:grid-cols-[1fr_auto]">
        <div className="flex items-center gap-5 sm:gap-7">
          <div className="tabular-nums text-[clamp(4.75rem,17vw,7.25rem)] leading-[0.88] font-extrabold tracking-[-0.055em] text-white drop-shadow-[0_10px_28px_rgba(0,0,0,0.45)]">
            {Math.round(animatedTemp)}
            <span className="align-top text-[0.44em] font-semibold text-white/80">
              °
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="inline-flex w-fit items-center rounded-full border border-white/16 bg-white/[0.08] px-3 py-1 text-sm font-bold text-white shadow-sm">
              {wx.label}
            </span>
            <p className="text-sm font-semibold text-slate-200">
              Føles som{" "}
              <span className="font-mono-num text-white">
                {Math.round(animatedFeels)}°
              </span>
            </p>
            {today && (
              <div className="font-mono-num flex items-center gap-3 text-xs font-semibold">
                <span className="text-amber-300">
                  ↑ H {formatTemp(today.tempMax, unit)}
                </span>
                <span className="text-sky-300">
                  ↓ L {formatTemp(today.tempMin, unit)}
                </span>
              </div>
            )}

            {consensus.modelCount >= 2 && (
              <button
                type="button"
                onClick={scrollToConsensus}
                className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full border border-white/14 bg-black/35 px-2.5 py-1 text-[11px] font-semibold text-slate-200 transition hover:border-white/30 hover:bg-black/50 hover:text-white"
              >
                <span className={`h-1.5 w-1.5 rounded-full ${consensusDotColor}`} />
                {showInlineSpread ? (
                  <span className="font-mono-num">
                    Spredning {formatTemp(consensus.currentMin, unit)}–
                    {formatTemp(consensus.currentMax, unit)} ·{" "}
                    {consensus.modelCount} modeller
                  </span>
                ) : (
                  <span>
                    {consensus.label} · {consensus.modelCount} modeller
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Hero Animated Weather Illustration */}
        <div className="flex items-center justify-between sm:flex-col sm:items-end">
          <div className="relative flex h-24 w-24 items-center justify-center sm:h-32 sm:w-32">
            <div
              aria-hidden="true"
              className="absolute inset-2 rounded-full blur-2xl"
              style={{ background: "var(--accent-soft)" }}
            />
            <WeatherIcon kind={wx.icon} size={112} className="relative z-10 h-full w-full" />
          </div>

          {/* Quick Live Pills on mobile alongside icon */}
          <div className="flex flex-col items-end gap-1.5 sm:mt-1 sm:flex-row">
            <span className="font-mono-num rounded-lg border border-white/14 bg-black/35 px-2.5 py-1 text-xs font-semibold text-slate-100">
              {formatWindSpeed(current.windSpeed)} {windDir.short}
            </span>
            <span className="font-mono-num rounded-lg border border-white/14 bg-black/35 px-2.5 py-1 text-xs font-semibold text-sky-200">
              Regn {current.precipitationProbability}%
            </span>
          </div>
        </div>
      </div>

      {/* Intelligent Contextual Briefing Strip */}
      <div className="relative mt-6 flex items-start gap-3 rounded-2xl border border-white/12 bg-black/30 px-4 py-3.5">
        <span
          className="mt-1 h-2 w-2 shrink-0 rounded-full"
          style={{
            backgroundColor: "var(--accent)",
            boxShadow: "0 0 10px var(--accent)",
          }}
        />
        <p className="text-sm leading-relaxed font-medium text-slate-100">
          {summary}
        </p>
      </div>
    </section>
  );
}
