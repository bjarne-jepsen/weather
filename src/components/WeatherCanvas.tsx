import { useEffect, useRef } from "react";
import type { WeatherCodeInfo } from "../utils/weatherCodes";

interface WeatherCanvasProps {
  mode: WeatherCodeInfo["canvasMode"];
  windSpeed: number;
}

interface RainDrop {
  x: number;
  y: number;
  len: number;
  speed: number;
  opacity: number;
  depth: number;
}

interface SnowFlake {
  x: number;
  y: number;
  r: number;
  speedY: number;
  driftPhase: number;
  driftAmp: number;
  opacity: number;
}

interface Star {
  x: number;
  y: number;
  r: number;
  phase: number;
  speed: number;
  baseOpacity: number;
}

interface MistBand {
  x: number;
  y: number;
  rx: number;
  ry: number;
  vx: number;
  opacity: number;
}

interface SunMote {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  phase: number;
}

export function WeatherCanvas({ mode, windSpeed }: WeatherCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // Seed particles based on mode
    const windTilt = Math.max(-0.42, Math.min(0.42, windSpeed * 0.025));

    const rainCount =
      mode === "heavy-rain" || mode === "storm"
        ? 115
        : mode === "rain"
          ? 70
          : 0;
    const rain: RainDrop[] = Array.from({ length: rainCount }, () => {
      const depth = 0.4 + Math.random() * 0.8;
      return {
        x: Math.random() * (width + 200) - 100,
        y: Math.random() * height,
        len: (mode === "heavy-rain" || mode === "storm" ? 26 : 18) * depth,
        speed: (mode === "heavy-rain" || mode === "storm" ? 18 : 13) * depth,
        opacity: 0.14 + depth * 0.24,
        depth,
      };
    });

    const snowCount = mode === "snow" ? 75 : 0;
    const snow: SnowFlake[] = Array.from({ length: snowCount }, () => {
      const depth = 0.45 + Math.random() * 0.85;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        r: (1.2 + Math.random() * 2.4) * depth,
        speedY: (0.7 + Math.random() * 1.4) * depth,
        driftPhase: Math.random() * Math.PI * 2,
        driftAmp: 0.35 + Math.random() * 0.8,
        opacity: 0.28 + depth * 0.48,
      };
    });

    const starCount = mode === "clear-night" ? 90 : 0;
    const stars: Star[] = Array.from({ length: starCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height * 0.72,
      r: 0.6 + Math.random() * 1.45,
      phase: Math.random() * Math.PI * 2,
      speed: 0.008 + Math.random() * 0.02,
      baseOpacity: 0.25 + Math.random() * 0.6,
    }));

    const mistCount = mode === "cloudy" || mode === "fog" ? 7 : 0;
    const mist: MistBand[] = Array.from({ length: mistCount }, (_, i) => ({
      x: Math.random() * width,
      y:
        mode === "fog"
          ? height * (0.18 + (i / mistCount) * 0.75)
          : height * (0.08 + (i / mistCount) * 0.45),
      rx: 220 + Math.random() * 280,
      ry: mode === "fog" ? 65 + Math.random() * 60 : 85 + Math.random() * 75,
      vx: (0.12 + Math.random() * 0.25) * (1 + windSpeed * 0.06),
      opacity: mode === "fog" ? 0.095 : 0.065,
    }));

    const moteCount = mode === "clear-day" ? 36 : 0;
    const motes: SunMote[] = Array.from({ length: moteCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height * 0.8,
      r: 1 + Math.random() * 2.2,
      vx: 0.12 + Math.random() * 0.22,
      vy: -0.08 + Math.random() * 0.16,
      phase: Math.random() * Math.PI * 2,
    }));

    let flashAlpha = 0;
    let nextFlashTime = performance.now() + 2600 + Math.random() * 4800;

    let shootingStar: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      maxLife: number;
    } | null = null;
    let nextMeteorTime = performance.now() + 5000 + Math.random() * 7000;

    let rafId = 0;
    let tick = 0;

    const drawFrame = (now: number) => {
      ctx.clearRect(0, 0, width, height);
      tick += 1;

      if (mode === "clear-day") {
        // Volumetric diagonal golden sun shafts from top-right
        ctx.save();
        const originX = width * 0.86;
        const originY = -height * 0.08;
        for (let i = 0; i < 3; i++) {
          const sway = Math.sin(tick * 0.006 + i * 1.7) * 0.04;
          const angle = 2.05 + i * 0.22 + sway;
          const length = Math.max(width, height) * 0.95;
          const spread = 0.09 + i * 0.03;

          const grad = ctx.createLinearGradient(
            originX,
            originY,
            originX + Math.cos(angle) * length,
            originY + Math.sin(angle) * length
          );
          grad.addColorStop(0, "rgba(253, 224, 71, 0.10)");
          grad.addColorStop(0.45, "rgba(251, 191, 36, 0.035)");
          grad.addColorStop(1, "rgba(251, 191, 36, 0)");

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.moveTo(originX, originY);
          ctx.lineTo(
            originX + Math.cos(angle - spread) * length,
            originY + Math.sin(angle - spread) * length
          );
          ctx.lineTo(
            originX + Math.cos(angle + spread) * length,
            originY + Math.sin(angle + spread) * length
          );
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();

        // Floating atmospheric light motes
        for (const m of motes) {
          if (!prefersReduced) {
            m.x += m.vx;
            m.y += m.vy;
            m.phase += 0.015;
            if (m.x > width + 20) m.x = -20;
            if (m.y < -20) m.y = height * 0.8;
            if (m.y > height * 0.85) m.y = -10;
          }
          const alpha = 0.12 + 0.18 * (0.5 + 0.5 * Math.sin(m.phase));
          ctx.fillStyle = `rgba(254, 240, 138, ${alpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (mode === "clear-night") {
        for (const s of stars) {
          if (!prefersReduced) s.phase += s.speed;
          const twinkle = 0.55 + 0.45 * Math.sin(s.phase);
          ctx.fillStyle = `rgba(226, 232, 240, ${(s.baseOpacity * twinkle).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fill();
        }

        if (!prefersReduced && !shootingStar && now > nextMeteorTime) {
          shootingStar = {
            x: width * (0.25 + Math.random() * 0.65),
            y: height * (0.05 + Math.random() * 0.25),
            vx: -7.5 - Math.random() * 4,
            vy: 3.5 + Math.random() * 2.5,
            life: 0,
            maxLife: 34,
          };
          nextMeteorTime = now + 7500 + Math.random() * 10000;
        }

        if (shootingStar) {
          shootingStar.x += shootingStar.vx;
          shootingStar.y += shootingStar.vy;
          shootingStar.life += 1;
          const progress = shootingStar.life / shootingStar.maxLife;
          const alpha = Math.sin(progress * Math.PI) * 0.85;
          const tailX = shootingStar.x - shootingStar.vx * 5.5;
          const tailY = shootingStar.y - shootingStar.vy * 5.5;
          const grad = ctx.createLinearGradient(
            shootingStar.x,
            shootingStar.y,
            tailX,
            tailY
          );
          grad.addColorStop(0, `rgba(255, 255, 255, ${alpha.toFixed(3)})`);
          grad.addColorStop(1, "rgba(165, 180, 252, 0)");
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(shootingStar.x, shootingStar.y);
          ctx.lineTo(tailX, tailY);
          ctx.stroke();

          if (shootingStar.life >= shootingStar.maxLife) {
            shootingStar = null;
          }
        }
      }

      if (mist.length > 0) {
        for (const band of mist) {
          if (!prefersReduced) {
            band.x += band.vx;
            if (band.x - band.rx > width + 80) {
              band.x = -band.rx - 80;
            }
          }
          const grad = ctx.createRadialGradient(
            band.x,
            band.y,
            band.ry * 0.1,
            band.x,
            band.y,
            band.rx
          );
          grad.addColorStop(0, `rgba(226, 232, 240, ${band.opacity})`);
          grad.addColorStop(0.55, `rgba(148, 163, 184, ${band.opacity * 0.45})`);
          grad.addColorStop(1, "rgba(148, 163, 184, 0)");

          ctx.save();
          ctx.translate(band.x, band.y);
          ctx.scale(1, band.ry / band.rx);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, band.rx, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      if (rain.length > 0) {
        ctx.lineCap = "round";
        for (const drop of rain) {
          if (!prefersReduced) {
            drop.y += drop.speed;
            drop.x += drop.speed * windTilt;
            if (drop.y > height + 30) {
              drop.y = -drop.len - Math.random() * 40;
              drop.x = Math.random() * (width + 200) - 100;
            }
          }
          ctx.strokeStyle = `rgba(186, 230, 253, ${drop.opacity.toFixed(3)})`;
          ctx.lineWidth = drop.depth * 1.25;
          ctx.beginPath();
          ctx.moveTo(drop.x, drop.y);
          ctx.lineTo(drop.x + drop.len * windTilt, drop.y + drop.len);
          ctx.stroke();
        }
      }

      if (snow.length > 0) {
        for (const flake of snow) {
          if (!prefersReduced) {
            flake.driftPhase += 0.018;
            flake.y += flake.speedY;
            flake.x +=
              Math.sin(flake.driftPhase) * flake.driftAmp + windTilt * 1.4;
            if (flake.y > height + 15) {
              flake.y = -15;
              flake.x = Math.random() * width;
            }
            if (flake.x > width + 15) flake.x = -15;
            if (flake.x < -15) flake.x = width + 15;
          }
          ctx.fillStyle = `rgba(241, 245, 249, ${flake.opacity.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(flake.x, flake.y, flake.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (mode === "storm" && !prefersReduced) {
        if (now > nextFlashTime) {
          flashAlpha = 0.22;
          nextFlashTime = now + 3800 + Math.random() * 6500;
        }
        if (flashAlpha > 0.005) {
          ctx.fillStyle = `rgba(224, 231, 255, ${flashAlpha.toFixed(3)})`;
          ctx.fillRect(0, 0, width, height);
          flashAlpha *= 0.84;
        }
      }

      if (!prefersReduced) {
        rafId = requestAnimationFrame(drawFrame);
      }
    };

    const handleVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(rafId);
      } else if (!prefersReduced) {
        rafId = requestAnimationFrame(drawFrame);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    rafId = requestAnimationFrame(drawFrame);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [mode, windSpeed]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[2]"
    />
  );
}
