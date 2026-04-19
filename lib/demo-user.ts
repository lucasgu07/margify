/**
 * Etiqueta de usuario en modo demo. Vive fuera de módulos "use client"
 * para poder consumirse desde Server Components (p. ej. `app/dashboard/layout.tsx`)
 * sin que Next intente resolverla contra el React Client Manifest.
 */
export const DEMO_USER_LABEL = {
  full_name: "Usuario demo",
  email: "demo@margify.app",
} as const;
