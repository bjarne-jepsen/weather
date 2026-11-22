import { useId } from "react";
import type { WeatherIconKind } from "../types/weather";

interface WeatherIconProps {
  kind: WeatherIconKind;
  size?: number;
  className?: string;
}

export function WeatherIcon({
  kind,
  size = 48,
  className = "",
}: WeatherIconProps) {
  const uid = useId().replace(/:/g, "");
  const sunId = `sun-${uid}`;
  const cloudId = `cloud-${uid}`;
  const darkCloudId = `dcloud-${uid}`;
  const moonId = `moon-${uid}`;
  const rainId = `rain-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={`shrink-0 overflow-visible ${className}`}
    >
      <defs>
        <linearGradient id={sunId} x1="14" y1="10" x2="50" y2="54" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="52%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#F97316" />
        </linearGradient>
        <linearGradient id={cloudId} x1="16" y1="22" x2="48" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="65%" stopColor="#E2E8F0" />
          <stop offset="100%" stopColor="#94A3B8" />
        </linearGradient>
        <linearGradient id={darkCloudId} x1="16" y1="18" x2="52" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#CBD5E1" />
          <stop offset="55%" stopColor="#64748B" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
        <linearGradient id={moonId} x1="18" y1="12" x2="48" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="55%" stopColor="#C7D2FE" />
          <stop offset="100%" stopColor="#818CF8" />
        </linearGradient>
        <linearGradient id={rainId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#BAE6FD" />
          <stop offset="100%" stopColor="#0EA5E9" />
        </linearGradient>
      </defs>

      {kind === "sun" && (
        <g>
          <circle cx="32" cy="32" r="22" fill="#FBBF24" opacity="0.22" className="wx-sun-glow" />
          <g className="wx-sun-rays" stroke="#FDE047" strokeWidth="2.8" strokeLinecap="round">
            <line x1="32" y1="7" x2="32" y2="12" />
            <line x1="32" y1="52" x2="32" y2="57" />
            <line x1="7" y1="32" x2="12" y2="32" />
            <line x1="52" y1="32" x2="57" y2="32" />
            <line x1="14.3" y1="14.3" x2="17.8" y2="17.8" />
            <line x1="46.2" y1="46.2" x2="49.7" y2="49.7" />
            <line x1="49.7" y1="14.3" x2="46.2" y2="17.8" />
            <line x1="17.8" y1="46.2" x2="14.3" y2="49.7" />
          </g>
          <circle cx="32" cy="32" r="14" fill={`url(#${sunId})`} />
        </g>
      )}

      {kind === "moon" && (
        <g>
          <circle cx="31" cy="32" r="20" fill="#818CF8" opacity="0.16" className="wx-sun-glow" />
          <path
            d="M39.5 16.5A15.5 15.5 0 1 0 48.5 41.2A12.5 12.5 0 1 1 39.5 16.5Z"
            fill={`url(#${moonId})`}
          />
          <circle cx="46" cy="20" r="1.9" fill="#E0E7FF" className="wx-star-1" />
          <circle cx="51" cy="28" r="1.3" fill="#C7D2FE" className="wx-star-2" />
        </g>
      )}

      {kind === "partly-sun" && (
        <g>
          <circle cx="40" cy="24" r="16" fill="#FBBF24" opacity="0.2" className="wx-sun-glow" />
          <g className="wx-sun-rays" stroke="#FDE047" strokeWidth="2.3" strokeLinecap="round">
            <line x1="40" y1="6" x2="40" y2="10" />
            <line x1="54" y1="24" x2="58" y2="24" />
            <line x1="50" y1="14" x2="52.8" y2="11.2" />
            <line x1="30" y1="14" x2="27.2" y2="11.2" />
            <line x1="50" y1="34" x2="52.8" y2="36.8" />
          </g>
          <circle cx="40" cy="24" r="10.5" fill={`url(#${sunId})`} />
          <path
            className="wx-cloud-main"
            d="M19 47h24.5a9.5 9.5 0 0 0 1.4-18.9A12.5 12.5 0 0 0 21 25.6a9.5 9.5 0 0 0-2 21.4Z"
            fill={`url(#${cloudId})`}
          />
        </g>
      )}

      {kind === "partly-moon" && (
        <g>
          <path
            d="M42.8 11.8A11.5 11.5 0 1 0 51.5 29.2A9.2 9.2 0 1 1 42.8 11.8Z"
            fill={`url(#${moonId})`}
          />
          <circle cx="51" cy="14" r="1.5" fill="#E0E7FF" className="wx-star-1" />
          <path
            className="wx-cloud-main"
            d="M18 48h25.5a9.5 9.5 0 0 0 1.3-18.9A12.5 12.5 0 0 0 20.5 26.8a9.5 9.5 0 0 0-2.5 21.2Z"
            fill={`url(#${cloudId})`}
          />
        </g>
      )}

      {kind === "cloud" && (
        <g>
          <path
            className="wx-cloud-back"
            d="M27 36h21a7.5 7.5 0 0 0 .8-15A10 10 0 0 0 30 19a7.5 7.5 0 0 0-3 17Z"
            fill={`url(#${darkCloudId})`}
            opacity="0.82"
          />
          <path
            className="wx-cloud-main"
            d="M16 48h29a10 10 0 0 0 1.4-19.9A13.5 13.5 0 0 0 20.4 25a10 10 0 0 0-4.4 23Z"
            fill={`url(#${cloudId})`}
          />
        </g>
      )}

      {kind === "fog" && (
        <g>
          <path
            className="wx-cloud-main"
            d="M17 34h28a8.5 8.5 0 0 0 1.2-16.9A11.5 11.5 0 0 0 24 14.5a8.5 8.5 0 0 0-7 19.5Z"
            fill={`url(#${cloudId})`}
            opacity="0.92"
          />
          <line x1="12" y1="41" x2="50" y2="41" stroke="#CBD5E1" strokeWidth="3.2" strokeLinecap="round" className="wx-fog-1" />
          <line x1="17" y1="48" x2="52" y2="48" stroke="#94A3B8" strokeWidth="3.2" strokeLinecap="round" className="wx-fog-2" />
          <line x1="14" y1="55" x2="44" y2="55" stroke="#64748B" strokeWidth="3" strokeLinecap="round" className="wx-fog-3" />
        </g>
      )}

      {(kind === "drizzle" || kind === "rain" || kind === "heavy-rain") && (
        <g>
          <path
            className="wx-cloud-main"
            d="M16 39h29a9.5 9.5 0 0 0 1.3-18.9A13 13 0 0 0 21.5 17a9.5 9.5 0 0 0-5.5 22Z"
            fill={kind === "heavy-rain" ? `url(#${darkCloudId})` : `url(#${cloudId})`}
          />
          <g stroke={`url(#${rainId})`} strokeWidth={kind === "drizzle" ? "2.4" : "3"} strokeLinecap="round">
            <line x1="23" y1="43" x2="20" y2={kind === "heavy-rain" ? "54" : "51"} className="wx-rain-1" />
            <line x1="33" y1="43" x2="30" y2={kind === "heavy-rain" ? "55" : "52"} className="wx-rain-2" />
            <line x1="43" y1="43" x2="40" y2={kind === "heavy-rain" ? "54" : "51"} className="wx-rain-3" />
            {kind === "heavy-rain" && (
              <line x1="28" y1="45" x2="25" y2="55" className="wx-rain-3" />
            )}
          </g>
        </g>
      )}

      {kind === "snow" && (
        <g>
          <path
            className="wx-cloud-main"
            d="M16 38h29a9.5 9.5 0 0 0 1.3-18.9A13 13 0 0 0 21.5 16a9.5 9.5 0 0 0-5.5 22Z"
            fill={`url(#${cloudId})`}
          />
          <g fill="#E0F2FE">
            <circle cx="22" cy="46" r="2.7" className="wx-snow-1" />
            <circle cx="33" cy="48" r="3" className="wx-snow-2" />
            <circle cx="43" cy="45" r="2.5" className="wx-snow-3" />
          </g>
        </g>
      )}

      {kind === "storm" && (
        <g>
          <path
            className="wx-cloud-main"
            d="M16 37h29a9.5 9.5 0 0 0 1.3-18.9A13 13 0 0 0 21.5 15a9.5 9.5 0 0 0-5.5 22Z"
            fill={`url(#${darkCloudId})`}
          />
          <polygon
            points="34,35 25,48 32,48 29,59 41,44 34,44"
            fill="#FACC15"
            className="wx-bolt"
          />
          <g stroke={`url(#${rainId})`} strokeWidth="2.6" strokeLinecap="round">
            <line x1="21" y1="42" x2="18" y2="51" className="wx-rain-1" />
            <line x1="44" y1="42" x2="41" y2="51" className="wx-rain-2" />
          </g>
        </g>
      )}
    </svg>
  );
}
