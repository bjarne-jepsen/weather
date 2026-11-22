import { useEffect, useRef, useState } from "react";
import type { SavedCity } from "../types/weather";
import { searchCities } from "../services/weatherApi";
import { countryCodeToFlag } from "../utils/format";

interface CitySearchModalProps {
  open: boolean;
  savedCities: SavedCity[];
  activeCityId: string | null;
  onClose: () => void;
  onSelectCity: (city: SavedCity, saveAutomatically?: boolean) => void;
  onRemoveSavedCity: (cityId: string) => void;
  onLocateMe: () => void;
}

export function CitySearchModal({
  open,
  savedCities,
  activeCityId,
  onClose,
  onSelectCity,
  onRemoveSavedCity,
  onLocateMe,
}: CitySearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SavedCity[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setHighlightIdx(0);
      return;
    }
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    const debounce = window.setTimeout(async () => {
      try {
        const list = await searchCities(trimmed, controller.signal);
        setResults(list);
        setHighlightIdx(0);
      } catch {
        // Ignore aborted searches
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => {
      window.clearTimeout(debounce);
      controller.abort();
    };
  }, [query, open]);

  if (!open) return null;

  const isSearching = query.trim().length >= 2;
  const visibleList = isSearching ? results : savedCities;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx((prev) =>
        visibleList.length === 0 ? 0 : (prev + 1) % visibleList.length
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx((prev) =>
        visibleList.length === 0
          ? 0
          : (prev - 1 + visibleList.length) % visibleList.length
      );
    } else if (e.key === "Enter" && visibleList[highlightIdx]) {
      e.preventDefault();
      onSelectCity(visibleList[highlightIdx], isSearching);
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Søg efter by"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 pt-[max(1.5rem,8vh)] backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="animate-modal w-full max-w-lg overflow-hidden rounded-3xl border border-white/18 bg-[#091222]/95 shadow-[0_32px_90px_-20px_rgba(0,0,0,0.95)]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Header */}
        <div className="flex items-center gap-3 border-b border-white/12 px-4 py-3.5">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 text-sky-300"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Søg by, postnummer eller land…"
            className="w-full bg-transparent text-base font-medium text-white placeholder-slate-400 outline-none"
          />

          {loading ? (
            <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-white/25 border-t-sky-300" />
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-white/14 bg-white/[0.06] px-2 py-1 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.12] hover:text-white"
            >
              Esc
            </button>
          )}
        </div>

        {/* Body */}
        <div className="max-h-[65vh] overflow-y-auto p-3">
          {/* Quick GPS Action */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onLocateMe();
            }}
            className="mb-3 flex w-full items-center gap-3 rounded-2xl border border-sky-400/25 bg-sky-400/12 px-3.5 py-2.5 text-left transition hover:border-sky-300/45 hover:bg-sky-400/18"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-400/20 text-sky-200">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="3 11 22 2 13 21 11 13 3 11" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-bold text-white">
                Brug min nuværende position
              </p>
              <p className="text-xs text-sky-200/80">
                Henter automatisk lokalt vejr via GPS
              </p>
            </div>
          </button>

          {/* Active Search Results */}
          {isSearching ? (
            <div>
              <p className="px-2 pb-1.5 text-[11px] font-bold tracking-[0.16em] text-slate-400 uppercase">
                Søgeresultater
              </p>

              {!loading && results.length === 0 ? (
                <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-6 text-center text-sm text-slate-300">
                  Ingen byer fundet for “{query}”. Prøv et andet bynavn.
                </p>
              ) : (
                <div className="space-y-1">
                  {results.map((city, idx) => {
                    const highlighted = idx === highlightIdx;
                    return (
                      <button
                        key={city.id}
                        type="button"
                        onMouseEnter={() => setHighlightIdx(idx)}
                        onClick={() => {
                          onSelectCity(city, true);
                          onClose();
                        }}
                        className={`flex w-full items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-left transition ${
                          highlighted
                            ? "bg-white/[0.12] text-white"
                            : "text-slate-200 hover:bg-white/[0.06]"
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span className="text-base">
                            {countryCodeToFlag(city.countryCode)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-white">
                              {city.name}
                            </p>
                            <p className="truncate text-xs text-slate-400">
                              {[city.admin1, city.country]
                                .filter(Boolean)
                                .join(", ")}
                            </p>
                          </div>
                        </div>
                        <span className="font-mono-num shrink-0 text-[11px] text-slate-400">
                          {city.latitude.toFixed(2)}°, {city.longitude.toFixed(2)}°
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : savedCities.length > 0 ? (
            <div>
              <p className="px-2 pb-1.5 text-[11px] font-bold tracking-[0.16em] text-slate-400 uppercase">
                Dine gemte byer
              </p>
              <div className="space-y-1">
                {savedCities.map((city, idx) => {
                  const isActive = city.id === activeCityId;
                  const highlighted = idx === highlightIdx;
                  return (
                    <div
                      key={city.id}
                      onMouseEnter={() => setHighlightIdx(idx)}
                      className={`flex items-center justify-between gap-2 rounded-2xl px-3 py-2 transition ${
                        isActive || highlighted
                          ? "bg-white/[0.12]"
                          : "hover:bg-white/[0.06]"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onSelectCity(city);
                          onClose();
                        }}
                        className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
                      >
                        <span className="text-base">
                          {countryCodeToFlag(city.countryCode)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-white">
                            {city.name}
                          </p>
                          <p className="truncate text-xs text-slate-400">
                            {[city.admin1, city.country]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => onRemoveSavedCity(city.id)}
                        aria-label={`Fjern ${city.name}`}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-500/20 hover:text-rose-200"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-6 text-center text-sm text-slate-300">
              Skriv mindst 2 bogstaver for at søge efter enhver by i verden —
              eller brug din GPS-position ovenfor.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
