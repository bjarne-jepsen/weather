import { useCallback, useEffect, useMemo, useState } from "react";
import type { SavedCity, TemperatureUnit, WeatherBundle } from "./types/weather";
import {
  fetchWeatherBundle,
  loadActiveCity,
  loadSavedCities,
  loadUnit,
  persistActiveCity,
  persistSavedCities,
  persistUnit,
  readCachedWeather,
  reverseGeocodeCity,
} from "./services/weatherApi";
import { describeWeatherCode } from "./utils/weatherCodes";
import { WEATHER_THEMES } from "./utils/themes";
import { usePwaInstall } from "./hooks/usePwaInstall";
import { WeatherCanvas } from "./components/WeatherCanvas";
import { WeatherIcon } from "./components/WeatherIcon";
import { TopBar } from "./components/TopBar";
import { HeroWeather } from "./components/HeroWeather";
import { HourlyForecast } from "./components/HourlyForecast";
import { DailyForecast } from "./components/DailyForecast";
import { ModelConsensusCard } from "./components/ModelConsensusCard";
import { MetricsGrid } from "./components/MetricsGrid";
import { CitySearchModal } from "./components/CitySearchModal";
import { InstallModal } from "./components/InstallModal";

export function App() {
  const [savedCities, setSavedCities] = useState<SavedCity[]>(() =>
    loadSavedCities()
  );
  const [activeCity, setActiveCity] = useState<SavedCity | null>(() =>
    loadActiveCity(loadSavedCities())
  );
  const [unit, setUnit] = useState<TemperatureUnit>(() => loadUnit());

  const [weather, setWeather] = useState<WeatherBundle | null>(() =>
    activeCity ? readCachedWeather(activeCity.id) : null
  );
  const [isLoading, setIsLoading] = useState<boolean>(() =>
    Boolean(activeCity && !readCachedWeather(activeCity.id))
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [searchOpen, setSearchOpen] = useState(false);
  const [installOpen, setInstallOpen] = useState(false);

  const { canNativeInstall, isStandalone, isIos, promptNativeInstall } =
    usePwaInstall();

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => {
      setToast((prev) => (prev === msg ? null : prev));
    }, 3400);
  }, []);

  // Online / Offline listeners
  useEffect(() => {
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // Global Cmd/Ctrl + K search shortcut
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleLocateMe = useCallback(() => {
    if (!("geolocation" in navigator)) {
      showToast("Geolokation understøttes ikke i denne browser.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const city = await reverseGeocodeCity(
            pos.coords.latitude,
            pos.coords.longitude
          );
          setActiveCity(city);
          setSavedCities((prev) => {
            const withoutOldGps = prev.filter((c) => !c.isCurrentLocation);
            const next = [city, ...withoutOldGps].slice(0, 8);
            persistSavedCities(next);
            return next;
          });
          showToast(`Position opdateret: ${city.name}`);
        } catch {
          showToast("Kunne ikke bestemme bynavn for din position.");
        } finally {
          setIsLocating(false);
        }
      },
      (geoErr) => {
        setIsLocating(false);
        if (geoErr.code === geoErr.PERMISSION_DENIED) {
          showToast("Giv adgang til placering i browseren for lokalt vejr.");
        } else {
          showToast("Kunne ikke hente din GPS-position lige nu.");
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, [showToast]);

  // If no city is chosen yet and geolocation permission is already granted, auto-locate silently
  useEffect(() => {
    if (activeCity || !("permissions" in navigator)) return;
    let cancelled = false;
    navigator.permissions
      .query({ name: "geolocation" as PermissionName })
      .then((status) => {
        if (!cancelled && status.state === "granted") {
          handleLocateMe();
        }
      })
      .catch(() => {
        // Permissions API unsupported (e.g. older Safari) — show clean welcome card
      });
    return () => {
      cancelled = true;
    };
  }, [activeCity, handleLocateMe]);

  // Fetch weather whenever activeCity changes
  const loadCityWeather = useCallback(
    async (city: SavedCity, signal?: AbortSignal) => {
      const cached = readCachedWeather(city.id);
      if (cached) {
        setWeather(cached);
        setIsLoading(false);
      } else {
        setIsLoading(true);
      }

      setIsRefreshing(true);
      setError(null);

      try {
        const fresh = await fetchWeatherBundle(city, signal);
        setWeather(fresh);
        setIsOffline(false);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        if (!cached) {
          setError(
            "Kunne ikke hente vejrdata. Tjek din internetforbindelse og prøv igen."
          );
        } else {
          setIsOffline(true);
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    persistActiveCity(activeCity);
    if (!activeCity) {
      setWeather(null);
      setIsLoading(false);
      return;
    }
    const controller = new AbortController();
    void loadCityWeather(activeCity, controller.signal);
    return () => controller.abort();
  }, [activeCity, loadCityWeather]);

  // Apply dynamic high-contrast atmospheric theme tokens + mobile status bar color
  const wxInfo = useMemo(() => {
    if (!weather) {
      return describeWeatherCode(1, false);
    }
    return describeWeatherCode(
      weather.current.weatherCode,
      weather.current.isDay
    );
  }, [weather]);

  useEffect(() => {
    const theme = WEATHER_THEMES[wxInfo.theme];
    const root = document.documentElement;
    root.style.setProperty("--sky-top", theme.skyTop);
    root.style.setProperty("--sky-mid", theme.skyMid);
    root.style.setProperty("--sky-bottom", theme.skyBottom);
    root.style.setProperty("--glow-primary", theme.glowPrimary);
    root.style.setProperty("--glow-secondary", theme.glowSecondary);
    root.style.setProperty("--accent", theme.accent);
    root.style.setProperty("--accent-soft", theme.accentSoft);
    root.style.setProperty("--surface-bg", theme.surfaceBg);
    root.style.setProperty("--surface-elevated", theme.surfaceElevated);
    root.style.setProperty("--border-subtle", theme.borderSubtle);
    root.style.setProperty("--border-strong", theme.borderStrong);

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", theme.metaThemeColor);
    }
  }, [wxInfo.theme]);

  const handleSelectCity = useCallback(
    (city: SavedCity, saveAutomatically = false) => {
      setActiveCity(city);
      if (saveAutomatically) {
        setSavedCities((prev) => {
          if (prev.some((c) => c.id === city.id)) return prev;
          const next = [city, ...prev].slice(0, 8);
          persistSavedCities(next);
          return next;
        });
      }
    },
    []
  );

  const handleToggleSaveCurrent = useCallback(() => {
    if (!activeCity) return;
    setSavedCities((prev) => {
      const exists = prev.some((c) => c.id === activeCity.id);
      if (exists) {
        const next = prev.filter((c) => c.id !== activeCity.id);
        persistSavedCities(next);
        showToast(`${activeCity.name} fjernet fra gemte byer`);
        return next;
      }
      const next = [activeCity, ...prev].slice(0, 8);
      persistSavedCities(next);
      showToast(`${activeCity.name} gemt som favorit`);
      return next;
    });
  }, [activeCity, showToast]);

  const handleRemoveSavedCity = useCallback(
    (cityId: string) => {
      setSavedCities((prev) => {
        const next = prev.filter((c) => c.id !== cityId);
        persistSavedCities(next);
        if (activeCity?.id === cityId) {
          setActiveCity(next[0] ?? null);
        }
        return next;
      });
    },
    [activeCity]
  );

  const handleToggleUnit = useCallback((nextUnit: TemperatureUnit) => {
    setUnit(nextUnit);
    persistUnit(nextUnit);
  }, []);

  const handleInstallClick = useCallback(async () => {
    if (canNativeInstall) {
      const accepted = await promptNativeInstall();
      if (accepted) {
        showToast("KLAR er nu installeret som app!");
        setInstallOpen(false);
      }
      return;
    }
    setInstallOpen(true);
  }, [canNativeInstall, promptNativeInstall, showToast]);

  const isCurrentSaved = activeCity
    ? savedCities.some((c) => c.id === activeCity.id)
    : false;

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      {/* Dynamic Atmospheric Layers */}
      <div className="sky-backdrop" aria-hidden="true" />
      <div className="sky-grain" aria-hidden="true" />
      <WeatherCanvas
        mode={wxInfo.canvasMode}
        windSpeed={weather?.current.windSpeed ?? 3}
      />

      {/* Foreground App Shell */}
      <div className="relative z-10 flex min-h-screen flex-col">
        <TopBar
          activeCity={activeCity}
          savedCities={savedCities}
          unit={unit}
          isRefreshing={isRefreshing}
          isLocating={isLocating}
          showInstallButton={!isStandalone}
          onSelectCity={handleSelectCity}
          onOpenSearch={() => setSearchOpen(true)}
          onLocateMe={handleLocateMe}
          onToggleUnit={handleToggleUnit}
          onRefresh={() => {
            if (activeCity) void loadCityWeather(activeCity);
          }}
          onOpenInstall={() => setInstallOpen(true)}
        />

        <main className="safe-bottom mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5 px-4 pt-2 sm:px-6">
          {!activeCity ? (
            /* Clean first-run welcome state — zero preloaded cities */
            <section className="instrument-card animate-rise mx-auto my-auto flex w-full max-w-lg flex-col items-center px-6 py-10 text-center sm:px-10 sm:py-12">
              <div className="relative mb-4 flex h-24 w-24 items-center justify-center">
                <div
                  aria-hidden="true"
                  className="absolute inset-2 rounded-full blur-2xl"
                  style={{ background: "var(--accent-soft)" }}
                />
                <WeatherIcon kind="partly-sun" size={92} className="relative z-10" />
              </div>

              <p className="text-[11px] font-extrabold tracking-[0.22em] text-sky-300 uppercase">
                KLAR Vejr
              </p>
              <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                Vælg din første lokation
              </h1>
              <p className="mt-2.5 max-w-sm text-sm leading-relaxed text-slate-300">
                Brug din nuværende GPS-position eller søg efter en hvilken som
                helst by for at få time- og 7-dagesprognose, UV, vind, nedbør og
                luftkvalitet.
              </p>

              <div className="mt-7 flex w-full flex-col gap-2.5 sm:flex-row">
                <button
                  type="button"
                  onClick={handleLocateMe}
                  disabled={isLocating}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-sm font-extrabold text-slate-950 shadow-lg transition hover:bg-slate-100 active:scale-[0.98] disabled:opacity-60"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="3 11 22 2 13 21 11 13 3 11" />
                  </svg>
                  {isLocating ? "Finder position…" : "Brug min position"}
                </button>

                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/[0.08] px-5 py-3.5 text-sm font-bold text-white transition hover:border-white/35 hover:bg-white/[0.14] active:scale-[0.98]"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" />
                  </svg>
                  Søg efter by
                </button>
              </div>
            </section>
          ) : error && !weather ? (
            <div className="instrument-card my-12 p-8 text-center">
              <p className="text-lg font-bold text-white">{error}</p>
              <button
                type="button"
                onClick={() => void loadCityWeather(activeCity)}
                className="mt-4 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-slate-100"
              >
                Prøv igen
              </button>
            </div>
          ) : isLoading || !weather ? (
            /* High-contrast sleek loading skeleton */
            <div className="space-y-5">
              <div className="instrument-card h-72 animate-pulse p-6">
                <div className="h-6 w-44 rounded-lg bg-white/12" />
                <div className="mt-8 h-24 w-48 rounded-2xl bg-white/10" />
                <div className="mt-8 h-12 w-full rounded-2xl bg-white/8" />
              </div>
              <div className="instrument-card h-56 animate-pulse p-6">
                <div className="h-5 w-40 rounded-lg bg-white/12" />
                <div className="mt-6 h-32 w-full rounded-2xl bg-white/8" />
              </div>
            </div>
          ) : (
            <>
              <HeroWeather
                key={`hero-${weather.city.id}`}
                data={weather}
                unit={unit}
                isSaved={isCurrentSaved}
                isOffline={isOffline}
                onToggleSave={handleToggleSaveCurrent}
              />

              <HourlyForecast
                key={`hourly-${weather.city.id}`}
                hourly={weather.hourly}
                unit={unit}
              />

              <DailyForecast
                key={`daily-${weather.city.id}`}
                daily={weather.daily}
                currentTemp={weather.current.temperature}
                unit={unit}
              />

              <ModelConsensusCard
                key={`models-${weather.city.id}`}
                models={weather.models}
                consensus={weather.consensus}
                isDay={weather.current.isDay}
                unit={unit}
              />

              <MetricsGrid
                key={`metrics-${weather.city.id}`}
                data={weather}
                unit={unit}
              />

              {/* Subtle Attribution & Metadata Footer */}
              <footer className="animate-rise stagger-5 flex flex-wrap items-center justify-between gap-2 px-2 pt-2 pb-4 text-xs text-slate-300/75">
                <p>
                  Multi-model konsensus via{" "}
                  <a
                    href="https://open-meteo.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-white/90 underline decoration-white/30 underline-offset-4 hover:decoration-white"
                  >
                    Open-Meteo
                  </a>{" "}
                  ({weather.models.length > 0
                    ? weather.models.map((m) => m.name).join(" · ")
                    : "DMI / ECMWF"}
                  )
                </p>
                <p className="font-mono-num text-[11px]">
                  {weather.city.latitude.toFixed(3)}°N,{" "}
                  {weather.city.longitude.toFixed(3)}°Ø • {weather.timezone}
                </p>
              </footer>
            </>
          )}
        </main>
      </div>

      {/* Modals */}
      <CitySearchModal
        open={searchOpen}
        savedCities={savedCities}
        activeCityId={activeCity?.id ?? null}
        onClose={() => setSearchOpen(false)}
        onSelectCity={handleSelectCity}
        onRemoveSavedCity={handleRemoveSavedCity}
        onLocateMe={handleLocateMe}
      />

      <InstallModal
        open={installOpen}
        canNativeInstall={canNativeInstall}
        isIos={isIos}
        onClose={() => setInstallOpen(false)}
        onTriggerNativeInstall={() => void handleInstallClick()}
      />

      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="animate-modal fixed right-4 bottom-6 left-4 z-50 mx-auto w-fit max-w-md rounded-2xl border border-white/20 bg-slate-950/92 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-2xl backdrop-blur-xl"
        >
          {toast}
        </div>
      )}
    </div>
  );
}

export default App;
