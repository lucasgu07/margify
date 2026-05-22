"use client";

import { useEffect, useId, useRef, useState } from "react";
import Particles from "@tsparticles/react";
import type { Container } from "@tsparticles/engine";
import type { ISourceOptions } from "@tsparticles/engine";
import { ensureParticlesEngine } from "@/lib/tsparticles-init";
import { useDocumentVisible } from "@/lib/use-document-visible";

type SparklesProps = {
  className?: string;
  size?: number;
  minSize?: number | null;
  density?: number;
  speed?: number;
  minSpeed?: number | null;
  opacity?: number;
  opacitySpeed?: number;
  minOpacity?: number | null;
  color?: string;
  background?: string;
  options?: ISourceOptions;
};

export function Sparkles({
  className,
  size = 1,
  minSize = null,
  density = 800,
  speed = 1,
  minSpeed = null,
  opacity = 1,
  opacitySpeed = 3,
  minOpacity = null,
  color = "var(--sparkles-color, #64DFDF)",
  background = "transparent",
  options = {},
}: SparklesProps) {
  const [isReady, setIsReady] = useState(false);
  const containerRef = useRef<Container | undefined>(undefined);
  const documentVisible = useDocumentVisible();

  useEffect(() => {
    void ensureParticlesEngine().then(() => setIsReady(true));
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (documentVisible) void container.play();
    else container.pause();
  }, [documentVisible]);

  const id = useId();

  const defaultOptions: ISourceOptions = {
    background: {
      color: { value: background },
    },
    fullScreen: { enable: false, zIndex: 0 },
    fpsLimit: 120,
    detectRetina: true,
    interactivity: {
      detectsOn: "canvas",
      events: {
        onClick: { enable: false },
        onHover: { enable: false },
        resize: { enable: true },
      },
    },
    particles: {
      color: { value: color },
      move: {
        enable: true,
        direction: "none",
        speed: { min: minSpeed ?? speed / 10, max: speed },
        straight: false,
      },
      number: { value: density },
      opacity: {
        value: { min: minOpacity ?? opacity / 10, max: opacity },
        animation: { enable: true, sync: false, speed: opacitySpeed },
      },
      size: { value: { min: minSize ?? size / 2.5, max: size } },
    },
    pauseOnBlur: true,
    pauseOnOutsideViewport: true,
  };

  if (!isReady) return null;

  return (
    <Particles
      id={id}
      options={{ ...defaultOptions, ...options }}
      className={className}
      particlesLoaded={async (container) => {
        containerRef.current = container;
        if (!documentVisible && container) container.pause();
      }}
    />
  );
}
