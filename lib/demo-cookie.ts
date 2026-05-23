/** Cookie que marca ingreso explícito por "Ver demo" en la landing (no usuarios registrados). */
export const DEMO_COOKIE = "margify_demo";

export function isDemoCookieActive(value: string | undefined): boolean {
  return value === "1";
}
