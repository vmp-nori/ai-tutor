"use client";

import { useEffect, useRef } from "react";

interface ReactiveGridBackgroundProps {
  className?: string;
}

export function ReactiveGridBackground({ className = "" }: ReactiveGridBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    targetX: 0,
    targetY: 0,
    lerpX: 0,
    lerpY: 0,
    visible: false,
    radiusFactor: 0,
  });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const canvasEl = canvas;
    const context = ctx;

    const cell = 40;
    const maxRadius = 200;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function isDarkTheme() {
      const root = document.documentElement;
      const t = root.dataset.theme;
      if (t) return t === "dark" || t.startsWith("dark-");
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      canvasEl.width = Math.ceil(window.innerWidth * dpr);
      canvasEl.height = Math.ceil(window.innerHeight * dpr);
      canvasEl.style.width = `${window.innerWidth}px`;
      canvasEl.style.height = `${window.innerHeight}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw() {
      rafRef.current = requestAnimationFrame(draw);
      const s = stateRef.current;
      const noMotion = reduceMotion.matches;

      // Lerp position toward target
      const posEase = noMotion ? 1 : 0.10;
      s.lerpX += (s.targetX - s.lerpX) * posEase;
      s.lerpY += (s.targetY - s.lerpY) * posEase;

      // Fade radius in when visible, out when not
      const fadeEase = noMotion ? 1 : 0.08;
      s.radiusFactor += ((s.visible ? 1 : 0) - s.radiusFactor) * fadeEase;

      const width = window.innerWidth;
      const height = window.innerHeight;

      context.clearRect(0, 0, width, height);

      if (s.radiusFactor < 0.002) return;

      const dark = isDarkTheme();
      const lineColor = dark ? "206, 232, 226" : "64, 115, 105";
      const alpha = dark ? 0.18 : 0.16;

      context.lineWidth = 0.5;
      context.strokeStyle = `rgba(${lineColor}, ${alpha})`;

      for (let gx = 0; gx <= width; gx += cell) {
        context.beginPath();
        context.moveTo(gx, 0);
        context.lineTo(gx, height);
        context.stroke();
      }

      for (let gy = 0; gy <= height; gy += cell) {
        context.beginPath();
        context.moveTo(0, gy);
        context.lineTo(width, gy);
        context.stroke();
      }

      const radius = maxRadius * s.radiusFactor;
      const gradient = context.createRadialGradient(s.lerpX, s.lerpY, 0, s.lerpX, s.lerpY, radius);
      gradient.addColorStop(0, "rgba(0, 0, 0, 1)");
      gradient.addColorStop(0.58, "rgba(0, 0, 0, 0.48)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

      context.globalCompositeOperation = "destination-in";
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);
      context.globalCompositeOperation = "source-over";
    }

    function handlePointerMove(event: PointerEvent) {
      const s = stateRef.current;
      if (!s.visible) {
        // Snap lerp to cursor on first enter so it doesn't slide in from off-screen
        s.lerpX = event.clientX;
        s.lerpY = event.clientY;
        s.visible = true;
      }
      s.targetX = event.clientX;
      s.targetY = event.clientY;
    }

    function handlePointerLeave() {
      stateRef.current.visible = false;
    }

    const themeObserver = new MutationObserver(() => {});
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "class"],
    });

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerleave", handlePointerLeave);
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
      themeObserver.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 ${className}`}
    />
  );
}
