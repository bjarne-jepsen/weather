import type { SavedCity, TemperatureUnit } from "../types/weather";
import { countryCodeToFlag } from "../utils/format";

interface TopBarProps {
  activeCity: SavedCity | null;
  savedCities: SavedCity[];
  unit: TemperatureUnit;
  isRefreshing: boolean;
  isLocating: boolean;
  showInstallButton: boolean;
  onSelectCity: (city: SavedCity) => void;
  onOpenSearch: () => void;
  onLocateMe: () => void;
  onToggleUnit: (unit: TemperatureUnit) => void;
  onRefresh: () => void;
  onOpenInstall: () => void;
}

export function TopBar({
  activeCity,
  savedCities,
  unit,
  isRefreshing,
  isLocating,
  showInstallButton,
  onSelectCity,
  onOpenSearch,
  onLocateMe,
  onToggleUnit,
  onRefresh,
  onOpenInstall,
}: TopBarProps) {
  return (
    <header className="safe-top sticky top-0 z-30 w-full">
      <div className="mx-auto max-w-5xl px-4 pb-3 sm:px-6">
        <div className="instrument-card flex items-center justify-between gap-2 rounded-2xl px-3 py-2.5 sm:px-4">
          {/* Left: Brand + Search trigger */}
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <div className="hidden items-center gap-2 pr-1 sm:flex">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full shadow-[0_0_12px_var(--accent)]"
                style={{ backgroundColor: "var(--accent)" }}
              />
              <span className="text-xs font-extrabold tracking-[0.22em] text-white/95">
                KLAR
              </span>
            </div>

            <button
              type="button"
              onClick={onOpenSearch}
              aria-label="Søg efter by"
              className="group flex min-w-0 flex-1 items-center justify-between gap-2 rounded-xl border border-white/14 bg-white/[0.06] px-3 py-2 text-left transition-all duration-200 hover:border-white/28 hover:bg-white/[0.11] active:scale-[0.99] sm:max-w-xs"
            >
              <span className="flex min-w-0 items-center gap-2">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0 text-white/75 transition-colors group-hover:text-white"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.5-3.5" />
                </svg>
                <span className="truncate text-sm font-medium text-white/90">
                  {activeCity ? (
                    <>
                      {activeCity.name}
                      <span className="text-white/50"> — Søg by…</span>
                    </>
                  ) : (
                    <span className="text-white/65">Søg efter by…</span>
                  )}
                </span>
              </span>
              <kbd className="font-mono-num hidden rounded-md border border-white/15 bg-black/30 px-1.5 py-0.5 text-[10px] font-medium text-white/65 sm:inline-block">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right: Action controls */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {/* Geolocation Button */}
            <button
              type="button"
              onClick={onLocateMe}
              disabled={isLocating}
              title="Brug min nuværende position"
              aria-label="Brug min nuværende position"
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/14 bg-white/[0.06] text-white/90 transition-all duration-200 hover:border-white/30 hover:bg-white/[0.13] active:scale-95 disabled:opacity-60"
            >
              {isLocating && (
                <span className="absolute inset-0 animate-ping rounded-xl border border-sky-400/60" />
              )}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.1"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={isLocating ? "text-sky-300" : ""}
              >
                <polygon points="3 11 22 2 13 21 11 13 3 11" />
              </svg>
            </button>

            {/* Refresh Button */}
            {activeCity && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={isRefreshing}
                title="Opdater vejrdata"
                aria-label="Opdater vejrdata"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/14 bg-white/[0.06] text-white/90 transition-all duration-200 hover:border-white/30 hover:bg-white/[0.13] active:scale-95 disabled:opacity-60"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={isRefreshing ? "animate-spin text-sky-300" : ""}
                >
                  <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                  <polyline points="21 3 21 9 15 9" />
                </svg>
              </button>
            )}

            {/* °C / °F Segmented Toggle */}
            <div
              role="group"
              aria-label="Temperatur-enhed"
              className="flex h-9 items-center rounded-xl border border-white/14 bg-black/30 p-0.5"
            >
              {(["C", "F"] as const).map((u) => {
                const active = unit === u;
                return (
                  <button
                    key={u}
                    type="button"
                    onClick={() => onToggleUnit(u)}
                    className={`font-mono-num h-full rounded-[9px] px-2.5 text-xs font-semibold transition-all duration-200 ${
                      active
                        ? "bg-white text-slate-950 shadow-sm"
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    °{u}
                  </button>
                );
              })}
            </div>

            {/* PWA Install CTA */}
            {showInstallButton && (
              <button
                type="button"
                onClick={onOpenInstall}
                className="hidden items-center gap-1.5 rounded-xl border border-white/20 bg-white px-3 py-2 text-xs font-bold text-slate-950 shadow-sm transition-all duration-200 hover:bg-slate-100 active:scale-95 sm:inline-flex"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Installer
              </button>
            )}
          </div>
        </div>

        {/* Saved Cities Quick-Switch Strip */}
        {(savedCities.length > 0 || showInstallButton) && (
          <div className="no-scrollbar mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {savedCities.map((city) => {
              const isActive = activeCity?.id === city.id;
              return (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => onSelectCity(city)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200 active:scale-95 ${
                    isActive
                      ? "border-white/35 bg-white text-slate-950 shadow-[0_6px_20px_-6px_rgba(255,255,255,0.5)]"
                      : "border-white/14 bg-black/35 text-white/85 backdrop-blur-md hover:border-white/28 hover:bg-black/50 hover:text-white"
                  }`}
                >
                  {city.isCurrentLocation ? (
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <polygon points="3 11 22 2 13 21 11 13 3 11" />
                    </svg>
                  ) : (
                    <span aria-hidden="true" className="text-[11px] leading-none">
                      {countryCodeToFlag(city.countryCode)}
                    </span>
                  )}
                  <span>{city.name}</span>
                </button>
              );
            })}

            {savedCities.length > 0 && (
              <button
                type="button"
                onClick={onOpenSearch}
                className="flex shrink-0 items-center gap-1 rounded-full border border-dashed border-white/25 bg-black/25 px-3 py-1.5 text-xs font-semibold text-white/80 backdrop-blur-md transition-all hover:border-white/45 hover:bg-black/40 hover:text-white"
              >
                <span>+ Tilføj by</span>
              </button>
            )}

            {showInstallButton && (
              <button
                type="button"
                onClick={onOpenInstall}
                className="flex shrink-0 items-center gap-1 rounded-full border border-sky-300/35 bg-sky-400/15 px-3 py-1.5 text-xs font-semibold text-sky-100 backdrop-blur-md sm:hidden"
              >
                <span>↓ Installer app</span>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
