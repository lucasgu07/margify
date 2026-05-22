import { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

let engineReady: Promise<void> | null = null;

/** Una sola inicialización del motor para todas las instancias de Sparkles. */
export function ensureParticlesEngine(): Promise<void> {
  if (!engineReady) {
    engineReady = initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => undefined);
  }
  return engineReady;
}
