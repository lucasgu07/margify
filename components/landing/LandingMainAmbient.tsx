/**
 * Capa decorativa (degradados cian) detrás del bloque que la envuelve — en la landing,
 * el contenedor incluye header, main y footer para un solo fondo continuo.
 */
export function LandingMainAmbient() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      {/* Marco tipo “anillo” / óvalo que envuelve el contenido */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_105%_92%_at_50%_50%,transparent_38%,rgba(100,223,223,0.08)_58%,rgba(100,223,223,0.04)_72%,transparent_86%)]" />
      {/* Laterales en toda la altura */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_52%_120%_at_0%_50%,rgba(100,223,223,0.22),transparent_58%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_52%_120%_at_100%_50%,rgba(100,223,223,0.22),transparent_58%)]" />
      {/* Hero: arriba + esquina derecha */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_85%_70%_at_50%_-35%,rgba(100,223,223,0.28),transparent_52%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_50%_at_100%_18%,rgba(100,223,223,0.18),transparent_58%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(100,223,223,0.16)_0%,rgba(100,223,223,0.05)_18%,transparent_42%)]" />
      {/* Cierre inferior (simétrico al foco superior) */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_85%_70%_at_50%_135%,rgba(100,223,223,0.24),transparent_54%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(100,223,223,0.14)_0%,rgba(100,223,223,0.05)_20%,transparent_45%)]" />
    </div>
  );
}
