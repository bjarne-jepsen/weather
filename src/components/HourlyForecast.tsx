import { useMemo, useState } from "react";
import type { HourlyPoint, TemperatureUnit } from "../types/weather";
import { describeWeatherCode } from "../utils/weatherCodes";
import {
  compassDirection,
  convertTemp,
  formatHour,
  formatTemp,
  formatWindSpeed,
} from "../utils/format";
import { WeatherIcon } from "./WeatherIcon";

interface HourlyForecastProps {
  hourly: HourlyPoint[];
  unit: TemperatureUnit;
}

/**
 * Generates a smooth Catmull-Rom cubic Bezier SVG path through data points.
 */
function buildSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

export function HourlyForecast({ hourly, unit }: HourlyForecastProps) {
  const hours = useMemo(() => hourly.slice(0, 24), [hourly]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const safeIndex = Math.min(selectedIndex, Math.max(0, hours.length - 1));
  const selected = hours[safeIndex];

  const chart = useMemo(() => {
    if (hours.length === 0) return null;
    const colWidth = 68;
    const width = hours.length * colWidth;
    const height = 108;
    const padTop = 24;
    const padBottom = 18;

    const allValues = hours.flatMap((h) => [
      convertTemp(h.temperature, unit),
      convertTemp(h.tempSpreadMin, unit),
      convertTemp(h.tempSpreadMax, unit),
    ]);
    const minT = Math.min(...allValues);
    const maxT = Math.max(...allValues);
    const span = Math.max(2, maxT - minT);

    const mapY = (val: number) =>
      height - padBottom - ((val - minT) / span) * (height - padTop - padBottom);

    const points = hours.map((h, idx) => {
      const t = convertTemp(h.temperature, unit);
      const x = idx * colWidth + colWidth / 2;
      const y = mapY(t);
      const yHigh = mapY(convertTemp(h.tempSpreadMax, unit));
      const yLow = mapY(convertTemp(h.tempSpreadMin, unit));
      return {
        x,
        y,
        yHigh,
        yLow,
        temp: Math.round(t),
        rainProb: h.precipitationProbability,
      };
    });

    const linePath = buildSmoothPath(points);
    const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${height} L ${points[0].x.toFixed(1)} ${height} Z`;

    // Multi-model uncertainty confidence ribbon (upper curve forward + lower curve backward)
    const upperPts = points.map((p) => ({ x: p.x, y: p.yHigh }));
    const lowerPts = [...points].reverse().map((p) => ({ x: p.x, y: p.yLow }));
    const upperLine = buildSmoothPath(upperPts);
    const lowerLine = buildSmoothPath(lowerPts);
    const spreadBandPath = `${upperLine} L ${lowerPts[0].x.toFixed(1)} ${lowerPts[0].y.toFixed(1)} ${lowerLine.replace(/^M\s+[-0-9.]+\s+[-0-9.]+/, "")} Z`;
    const hasSpread = hours.some(
      (h) => h.tempSpreadMax - h.tempSpreadMin >= 0.4
    );

    return {
      width,
      height,
      colWidth,
      points,
      linePath,
      areaPath,
      spreadBandPath,
      hasSpread,
    };
  }, [hours, unit]);

  if (!selected || !chart) return null;

  const selectedWx = describeWeatherCode(selected.weatherCode, selected.isDay);
  const selectedDir = compassDirection(selected.windDirection);

  return (
    <section
      aria-label="Timeprognose"
      className="instrument-card animate-rise stagger-2 p-5 sm:p-6"
    >
      {/* Header + Selected Hour Inspector */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold tracking-[0.18em] text-slate-400 uppercase">
            Time for time
          </p>
          <h2 className="mt-0.5 text-lg font-bold text-white">
            De næste 24 timer
          </h2>
        </div>

        {/* Interactive Inspector Pill */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/14 bg-black/35 px-3 py-2 text-xs">
          <span className="font-mono-num font-bold text-white">
            {safeIndex === 0 ? "Nu" : `Kl. ${formatHour(selected.time)}`}
          </span>
          <span className="text-white/25">|</span>
          <span className="font-semibold text-slate-200">{selectedWx.shortLabel}</span>
          {selected.tempSpreadMax - selected.tempSpreadMin >= 0.8 && (
            <>
              <span className="text-white/25">|</span>
              <span className="font-mono-num text-amber-200">
                {formatTemp(selected.tempSpreadMin, unit)}–
                {formatTemp(selected.tempSpreadMax, unit)}
              </span>
            </>
          )}
          <span className="text-white/25">|</span>
          <span className="font-mono-num text-sky-300">
            {selected.precipitationProbability}%
            {selected.precipitation > 0
              ? ` (${selected.precipitation.toFixed(1).replace(".", ",")} mm)`
              : ""}
          </span>
          <span className="text-white/25">|</span>
          <span className="font-mono-num text-slate-200">
            {formatWindSpeed(selected.windSpeed)} {selectedDir.short}
          </span>
          <span className="hidden text-white/25 sm:inline">|</span>
          <span className="font-mono-num hidden text-amber-300 sm:inline">
            UV {selected.uvIndex.toFixed(1).replace(".", ",")}
          </span>
        </div>
      </div>

      {/* Unified Scrollable Curve + Hourly Columns */}
      <div className="no-scrollbar mt-4 overflow-x-auto pb-1">
        <div style={{ width: `${chart.width}px` }} className="relative">
          {/* Interactive Smooth Temperature Curve + Rain Bars */}
          <svg
            width={chart.width}
            height={chart.height}
            viewBox={`0 0 ${chart.width} ${chart.height}`}
            className="block overflow-visible"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="tempAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.34" />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="tempLineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="var(--accent)" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
            </defs>

            {/* Subtle precipitation probability bars along bottom */}
            {chart.points.map((pt, idx) => {
              const barH = Math.max(0, (pt.rainProb / 100) * 38);
              if (barH < 2) return null;
              return (
                <rect
                  key={`bar-${idx}`}
                  x={pt.x - 10}
                  y={chart.height - barH}
                  width={20}
                  height={barH}
                  rx={4}
                  fill="rgba(56, 189, 248, 0.24)"
                />
              );
            })}

            {/* Area fill */}
            <path d={chart.areaPath} fill="url(#tempAreaGrad)" />

            {/* Multi-model min/max uncertainty ribbon */}
            {chart.hasSpread && (
              <path
                d={chart.spreadBandPath}
                fill="rgba(255, 255, 255, 0.16)"
                stroke="rgba(255, 255, 255, 0.24)"
                strokeWidth="0.8"
              />
            )}

            {/* Crisp spline stroke */}
            <path
              d={chart.linePath}
              fill="none"
              stroke="url(#tempLineGrad)"
              strokeWidth="2.8"
              strokeLinecap="round"
            />

            {/* Data nodes & labels */}
            {chart.points.map((pt, idx) => {
              const isSelected = idx === safeIndex;
              return (
                <g
                  key={`pt-${idx}`}
                  className="cursor-pointer"
                  onClick={() => setSelectedIndex(idx)}
                >
                  {isSelected && (
                    <line
                      x1={pt.x}
                      y1={pt.y + 6}
                      x2={pt.x}
                      y2={chart.height}
                      stroke="rgba(255,255,255,0.35)"
                      strokeDasharray="3 3"
                      strokeWidth="1.2"
                    />
                  )}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isSelected ? 5.5 : 3}
                    fill={isSelected ? "#ffffff" : "var(--accent)"}
                    stroke={isSelected ? "var(--accent)" : "rgba(7,17,34,0.8)"}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                  />
                  <text
                    x={pt.x}
                    y={pt.y - 10}
                    textAnchor="middle"
                    className="font-mono-num"
                    fontSize={isSelected ? "12.5" : "11"}
                    fontWeight={isSelected ? "700" : "600"}
                    fill={isSelected ? "#ffffff" : "rgba(226, 232, 240, 0.85)"}
                  >
                    {pt.temp}°
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Aligned Hourly Cards */}
          <div className="mt-1 flex">
            {hours.map((hour, idx) => {
              const isSelected = idx === safeIndex;
              const wx = describeWeatherCode(hour.weatherCode, hour.isDay);
              return (
                <button
                  key={hour.time}
                  type="button"
                  onClick={() => setSelectedIndex(idx)}
                  style={{ width: `${chart.colWidth}px` }}
                  className={`flex shrink-0 flex-col items-center gap-1.5 rounded-2xl border py-2.5 transition-all duration-200 ${
                    isSelected
                      ? "border-white/30 bg-white/[0.14] shadow-[0_10px_24px_-12px_rgba(0,0,0,0.8)]"
                      : "border-transparent bg-transparent hover:border-white/12 hover:bg-white/[0.05]"
                  }`}
                >
                  <span
                    className={`font-mono-num text-xs font-semibold ${
                      isSelected ? "text-white" : "text-slate-300"
                    }`}
                  >
                    {idx === 0 ? "Nu" : formatHour(hour.time)}
                  </span>

                  <WeatherIcon kind={wx.icon} size={30} />

                  <span
                    className={`font-mono-num text-[11px] font-semibold ${
                      hour.precipitationProbability >= 20
                        ? "text-sky-300"
                        : "text-slate-400"
                    }`}
                  >
                    {hour.precipitationProbability >= 10
                      ? `${hour.precipitationProbability}%`
                      : "—"}
                  </span>

                  <span className="font-mono-num text-[11px] font-medium text-slate-300/80">
                    {formatTemp(hour.apparentTemperature, unit)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
