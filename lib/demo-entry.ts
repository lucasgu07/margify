/** URL de ingreso al dashboard en modo demo (setea cookie vía middleware). */
export const DEMO_DASHBOARD_ENTRY = "/dashboard?demo=1";

/** Ruta del dashboard con `?demo=1` para cualquier subpágina. */
export function demoDashboardHref(path = "/dashboard"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const [pathname, search] = normalized.split("?");
  const params = new URLSearchParams(search ?? "");
  params.set("demo", "1");
  const q = params.toString();
  return q ? `${pathname}?${q}` : `${pathname}?demo=1`;
}
