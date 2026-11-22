import type {
  ConsensusSummary,
  TemperatureUnit,
  WeatherModelSnapshot,
} from "../types/weather";
import { describeWeatherCode } from "../utils/weatherCodes";
import { convertTemp, formatTemp, formatWindSpeed } from "../utils/format";
import { WeatherIcon } from "./WeatherIcon";

interface ModelConsensusCardProps {
  models: WeatherModelSnapshot[];
  consensus: ConsensusSummary;
  isDay: boolean;
  unit: TemperatureUnit;
}

export function ModelConsensusCard({
  models,
  consensus,
  isDay,
  unit,
}: ModelConsensusCardProps) {
  if (models.length < 2) return null;

  const badgeStyle =
    consensus.confidence === "high"
      ? "border-emerald-400/35 bg-emerald-400/15 text-emerald-200"
      : consensus.confidence === "moderate"
        ? "border-amber-400/40 bg-amber-400/15 text-amber-200"
        : "border-rose-400/40 bg-rose-400/15 text-rose-200";

  const dotColor =
    consensus.confidence === "high"
      ? "bg-emerald-400"
      : consensus.confidence === "moderate"
        ? "bg-amber-400"
        : "bg-rose-400";

  // Shared horizontal scale with padding so dots sit cleanly inside the track
  const temps = models.map((m) => convertTemp(m.currentTemp, unit));
  const avgVal = convertTemp(consensus.currentAvg, unit);
  const rawMin = Math.min(...temps);
  const rawMax = Math.max(...temps);
  const pad = Math.max(1.5, (rawMax - rawMin) * 0.35);
  const scaleMin = rawMin - pad;
  const scaleMax = rawMax + pad;
  const span = Math.max(0.1, scaleMax - scaleMin);

  const toPct = (v: number) =>
    Math.max(4, Math.min(96, ((v - scaleMin) / span) * 100));

  const avgPct = toPct(avgVal);

  const spreadDisplay =
    unit === "F"
      ? ((consensus.spread * 9) / 5).toFixed(1).replace(".", ",")
      : consensus.spread.toFixed(1).replace(".", ",");

  return (
    <section
      id="model-consensus"
      aria-label="Sammenligning af vejrmodeller"
      className="instrument-card animate-rise stagger-4 scroll-mt-28 p-5 sm:p-6"
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold tracking-[0.18em] text-slate-400 uppercase">
            Multi-model konsensus
          </p>
          <h2 className="mt-0.5 text-lg font-bold text-white">
            {models.length} uafhængige vejrtjenester
          </h2>
        </div>

        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${badgeStyle}`}
        >
          <span className={`h-2 w-2 rounded-full ${dotColor}`} />
          {consensus.label} · spredning {spreadDisplay}°
        </span>
      </div>

      {/* Summary strip */}
      <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-black/30 p-3 text-center sm:text-left">
        <div className="sm:px-2">
          <p className="text-[11px] font-semibold text-slate-400">
            Vist gennemsnit
          </p>
          <p className="font-mono-num mt-0.5 text-base font-extrabold text-white">
            {avgVal.toFixed(1).replace(".", ",")}°{unit}
          </p>
        </div>
        <div className="border-x border-white/10 sm:px-3">
          <p className="text-[11px] font-semibold text-slate-400">
            Laveste → Højeste
          </p>
          <p className="font-mono-num mt-0.5 text-base font-bold text-slate-100">
            {formatTemp(consensus.currentMin, unit)} –{" "}
            {formatTemp(consensus.currentMax, unit)}
          </p>
        </div>
        <div className="sm:px-2">
          <p className="text-[11px] font-semibold text-slate-400">
            Prognose-tillid
          </p>
          <p className="mt-0.5 text-sm font-bold text-white">
            {consensus.confidence === "high"
              ? "Meget sikker"
              : consensus.confidence === "moderate"
                ? "Let uenighed"
                : "Skiftende front"}
          </p>
        </div>
      </div>

      {/* Model Rows with Shared Consensus Dot-Plot */}
      <div className="mt-5 space-y-2.5">
        {models.map((m) => {
          const val = convertTemp(m.currentTemp, unit);
          const pct = toPct(val);
          const diff = val - avgVal;
          const wx = describeWeatherCode(m.currentWeatherCode, isDay);
          const barLeft = Math.min(pct, avgPct);
          const barWidth = Math.abs(pct - avgPct);

          return (
            <div
              key={m.id}
              className="grid grid-cols-[minmax(130px,1.2fr)_1fr_auto] items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2.5 transition hover:border-white/16 hover:bg-white/[0.06] sm:grid-cols-[minmax(180px,1.25fr)_1.2fr_140px]"
            >
              {/* Service name + origin */}
              <div className="flex min-w-0 items-center gap-2.5">
                <WeatherIcon kind={wx.icon} size={28} />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-bold text-white">
                      {m.name}
                    </span>
                    <span className="font-mono-num rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-slate-200">
                      {m.regionTag}
                    </span>
                  </div>
                  <p className="hidden truncate text-[11px] text-slate-400 sm:block">
                    {m.provider}
                  </p>
                </div>
              </div>

              {/* Relative Consensus Track */}
              <div className="flex items-center gap-2.5">
                <div className="relative h-5 flex-1">
                  {/* Track baseline */}
                  <div className="absolute top-1/2 right-0 left-0 h-1 -translate-y-1/2 rounded-full bg-white/10" />

                  {/* Consensus average vertical dashed marker */}
                  <div
                    title="Gennemsnit"
                    className="absolute top-0 bottom-0 w-px border-l border-dashed border-white/45"
                    style={{ left: `${avgPct}%` }}
                  />

                  {/* Deviation bar from consensus average */}
                  {barWidth > 0.5 && (
                    <div
                      className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full opacity-75"
                      style={{
                        left: `${barLeft}%`,
                        width: `${barWidth}%`,
                        backgroundColor: m.accentColor,
                      }}
                    />
                  )}

                  {/* Model temperature dot */}
                  <div
                    className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-slate-950 shadow-md transition-all duration-500"
                    style={{
                      left: `${pct}%`,
                      backgroundColor: m.accentColor,
                      boxShadow: `0 0 10px ${m.accentColor}88`,
                    }}
                  />
                </div>

                <span className="font-mono-num w-11 text-right text-sm font-extrabold text-white">
                  {val.toFixed(1).replace(".", ",")}°
                </span>
              </div>

              {/* Delta / Rain / Wind compact readouts */}
              <div className="font-mono-num hidden items-center justify-end gap-3 text-xs sm:flex">
                <span className="text-sky-300" title="Forventet nedbør næste 24t">
                  {m.precipitation24h.toFixed(1).replace(".", ",")} mm
                </span>
                <span className="text-slate-300" title="Vindstyrke lige nu">
                  {formatWindSpeed(m.currentWind)}
                </span>
              </div>

              {/* Compact delta on small screens */}
              <span
                className={`font-mono-num text-right text-[11px] font-semibold sm:hidden ${
                  Math.abs(diff) < 0.3
                    ? "text-slate-400"
                    : diff > 0
                      ? "text-amber-300"
                      : "text-sky-300"
                }`}
              >
                {diff >= 0 ? "+" : ""}
                {diff.toFixed(1).replace(".", ",")}°
              </span>
            </div>
          );
        })}
      </div>

      <p className="mt-3.5 text-xs leading-relaxed text-slate-400">
        Hovedtemperaturen viser gennemsnittet på tværs af alle aktive modeller
        for et roligt overblik. Den stiplede linje markerer snittet — spredningen
        vises automatisk i toppen og som skyggebånd i timegrafen, når modellerne
        er uenige.
      </p>
    </section>
  );
}
