# KLAR — Vejr-PWA

En moderne, høj-kontrast vejr-PWA bygget med React 19, TypeScript, Tailwind CSS v4 og Vite — drevet udelukkende af gratis vejr-API'er uden API-nøgler.

## Features
- **Gratis vejrservices (ingen API-nøgle):**
  - [Open-Meteo Forecast API](https://open-meteo.com/) (inkl. DMI HARMONIE & ECMWF)
  - [Open-Meteo Air Quality API](https://open-meteo.com/en/docs/air-quality-api) (EU AQI, PM2.5, PM10 & pollen)
  - [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api) (by-søgning på dansk)
  - BigDataCloud client reverse geocoding til geolokation
- **Time- og 7-dagesprognose:**
  - Interaktiv 24-timers temperaturkurve (SVG spline) med regn-sandsynlighed og time-inspektør
  - 7-dagesprognose med proportionale temperaturbjælker og fold-ud detaljer pr. dag
- **Detaljerede målinger:** UV-indeks måler, roterende vindkompas + vindstød, 6-timers nedbørsoversigt, solopgang/solnedgang-bue, luftfugtighed, dugpunkt, lufttryk, sigtbarhed, EU AQI & pollen.
- **Levende animationer & høj kontrast:** 60fps HTML5 canvas-vejrbaggrund (regn, sne, stjerner, solstråler, tåge, torden) + animerede SVG-ikoner + mørke høj-kontrast instrumentkort.
- **Installerbar PWA:** `manifest.webmanifest`, PNG-ikoner (inkl. maskable og iOS `apple-touch-icon`), service worker (`public/sw.js`) og lokal offline-cache.

## Kør lokalt
```bash
npm install
npm run dev
```

## Produktion (til deploy på Vercel, Netlify, Cloudflare Pages m.fl.)
```bash
npm run build
```
Upload indholdet af `dist/` over HTTPS, og åbn siden på telefonen for at installere den som app.
