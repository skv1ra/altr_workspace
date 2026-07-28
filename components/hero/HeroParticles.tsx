"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
}

export interface HeroParticlesProps {
  className?: string;
  reducedMotion: boolean;
  /** Hard cap, per this prompt's spec: <= 60. */
  maxParticles?: number;
}

/**
 * Faint bokeh dust specks (DESIGN_DIRECTION), drawn on <canvas> rather than
 * as DOM nodes — cheaper for a few dozen slowly-drifting dots. Backing
 * store DPR is capped at 2x even on higher-DPR screens (edge case: bound
 * the effective render cost rather than paying for e.g. 3x). Renders a
 * single static frame (no rAF loop) under reduced motion.
 */
export function HeroParticles({ className, reducedMotion, maxParticles = 48 }: HeroParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let frame: number | undefined;

    function makeParticles() {
      const count = Math.min(maxParticles, 60);
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.06,
        vy: (Math.random() - 0.5) * 0.06,
        radius: Math.random() * 1.4 + 0.4,
        opacity: Math.random() * 0.35 + 0.08,
      }));
    }

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      makeParticles();
    }

    function draw() {
      ctx!.clearRect(0, 0, width, height);
      for (const particle of particles) {
        if (!reducedMotion) {
          particle.x = (particle.x + particle.vx + width) % width;
          particle.y = (particle.y + particle.vy + height) % height;
        }
        ctx!.beginPath();
        ctx!.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        // Steel-grey motes, not white: on the silver fog a white speck is
        // invisible in the bright core, while a cool mid-grey reads across
        // the whole range of the ground and over the dark glass alike.
        ctx!.fillStyle = `rgba(108, 118, 130, ${particle.opacity})`;
        ctx!.fill();
      }
      if (!reducedMotion) frame = requestAnimationFrame(draw);
    }

    resize();
    draw();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    return () => {
      resizeObserver.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion, maxParticles]);

  return <canvas ref={canvasRef} className={className} />;
}
