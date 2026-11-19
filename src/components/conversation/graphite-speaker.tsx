"use client";

import { useEffect, useRef } from "react";

export type SpeakerMode = "idle" | "speak" | "listen";

type Particle = {
  angle: number;
  radius: number;
  size: number;
  opacity: number;
  lobes: number;
  phase: number;
  drift: number;
};

const PARTICLE_COUNT = 1500;

function createParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, () => {
    const dust = Math.random() < 0.16;
    return {
      angle: Math.random() * Math.PI * 2,
      radius: dust ? 1 + Math.random() * 0.55 : Math.pow(Math.random(), 0.55),
      size: dust ? 0.6 + Math.random() * 0.9 : 0.7 + Math.random() * 1.5,
      opacity: dust ? 0.12 + Math.random() * 0.3 : 0.25 + Math.random() * 0.6,
      lobes: 2 + Math.floor(Math.random() * 4),
      phase: Math.random() * Math.PI * 2,
      drift: dust ? 0.0006 + Math.random() * 0.0016 : 0,
    };
  });
}

/**
 * The conversation partner as a cloud of graphite dust (DS-7).
 * It moves while the partner speaks, settles while the user records,
 * pauses when off-screen, and is drawn once (static) under reduced motion.
 */
export function GraphiteSpeaker({
  mode,
  label,
  onActivate,
  className,
}: {
  mode: SpeakerMode;
  label: string;
  onActivate?: () => void;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modeRef = useRef<SpeakerMode>(mode);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const particles = createParticles();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let energy = 0.04;
    let width = 0;
    let visible = true;
    let frame = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth || 300;
      canvas.width = width * dpr;
      canvas.height = width * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (t: number) => {
      const ink =
        getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim() ||
        "#111";
      const current = modeRef.current;
      const target =
        current === "speak"
          ? 0.1 + 0.16 * Math.abs(Math.sin(t * 9.3) * Math.sin(t * 3.7))
          : current === "listen"
            ? 0.03 + 0.02 * Math.sin(t * 2)
            : 0.035;
      energy += (target - energy) * 0.12;
      const squeeze = current === "listen" ? 0.9 : 1;
      const center = width / 2;
      const base = width * 0.3;

      ctx.clearRect(0, 0, width, width);
      ctx.fillStyle = ink;
      for (const p of particles) {
        if (p.drift) {
          p.radius += p.drift * (1 + energy * 8);
          if (p.radius > 1.65) p.radius = 1;
        }
        const wobble =
          1 +
          energy *
            (Math.sin(p.angle * p.lobes + t * 1.6 + p.phase) * 0.6 +
              Math.sin(p.angle * 7 - t * 2.4) * 0.4);
        const r = p.radius * base * wobble * squeeze;
        const fade = p.drift ? Math.max(0, 1 - (p.radius - 1) / 0.65) : 1;
        ctx.globalAlpha = p.opacity * fade;
        const a = p.angle + t * 0.04;
        ctx.fillRect(center + Math.cos(a) * r, center + Math.sin(a) * r * 0.96, p.size, p.size);
      }
      ctx.globalAlpha = 1;
    };

    resize();
    window.addEventListener("resize", resize);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    observer.observe(canvas);

    if (reduceMotion) {
      draw(0);
    } else {
      const loop = (ms: number) => {
        if (visible) draw(ms / 1000);
        frame = requestAnimationFrame(loop);
      };
      frame = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      role="button"
      tabIndex={0}
      aria-label={label}
      onClick={onActivate}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onActivate?.();
        }
      }}
      className={`aspect-square w-[min(340px,80vw)] max-w-full cursor-pointer ${className ?? ""}`}
    />
  );
}
