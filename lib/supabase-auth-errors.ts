export type AppLocale = "es" | "en";

/** Idioma de la UI: `html lang`, navegador, o español por defecto (Margify LATAM). */
export function getClientAppLocale(): AppLocale {
  if (typeof document !== "undefined") {
    const htmlLang = document.documentElement.lang?.toLowerCase() ?? "";
    if (htmlLang.startsWith("en")) return "en";
    if (htmlLang.startsWith("es")) return "es";
  }
  if (typeof navigator !== "undefined") {
    const nav = navigator.language?.toLowerCase() ?? "";
    if (nav.startsWith("en")) return "en";
  }
  return "es";
}

type AuthErrorLike = { message?: string; code?: string } | string;

const ES_BY_CODE: Record<string, string> = {
  email_not_confirmed:
    "Confirmá tu email antes de ingresar. Revisá tu bandeja de entrada (y spam).",
  invalid_credentials: "Email o contraseña incorrectos.",
  user_already_exists: "Ya existe una cuenta con ese email. Probá iniciar sesión.",
  weak_password: "La contraseña es muy débil. Usá al menos 6 caracteres.",
  over_email_send_rate_limit:
    "Enviaste demasiados emails. Esperá un momento e intentá de nuevo.",
  over_request_rate_limit: "Demasiados intentos. Esperá un momento e intentá de nuevo.",
  signup_disabled: "El registro no está habilitado en este momento.",
  session_not_found: "Tu sesión expiró. Volvé a iniciar sesión.",
  user_not_found: "No encontramos una cuenta con ese email.",
  same_password: "La contraseña nueva tiene que ser distinta a la anterior.",
  validation_failed: "Revisá los datos ingresados e intentá de nuevo.",
};

/** Mensajes conocidos de Supabase Auth (inglés) → español rioplatense. */
const ES_BY_MESSAGE: ReadonlyArray<{ match: RegExp; text: string }> = [
  {
    match: /email not confirmed/i,
    text: "Confirmá tu email antes de ingresar. Revisá tu bandeja de entrada (y spam).",
  },
  {
    match: /invalid login credentials|invalid credentials/i,
    text: "Email o contraseña incorrectos.",
  },
  {
    match: /user already registered|already been registered/i,
    text: "Ya existe una cuenta con ese email. Probá iniciar sesión.",
  },
  {
    match: /password should be at least/i,
    text: "La contraseña debe tener al menos 6 caracteres.",
  },
  {
    match: /unable to validate email|invalid email/i,
    text: "El email no es válido. Revisá que esté bien escrito.",
  },
  {
    match: /email rate limit|rate limit exceeded/i,
    text: "Demasiados intentos. Esperá un momento e intentá de nuevo.",
  },
  {
    match: /only request this once every/i,
    text: "Por seguridad, tenés que esperar un poco antes de volver a intentar.",
  },
  {
    match: /signup.*disabled|signups not allowed/i,
    text: "El registro no está habilitado en este momento.",
  },
  {
    match: /network|fetch failed|failed to fetch/i,
    text: "Problema de conexión. Revisá tu internet e intentá de nuevo.",
  },
];

/**
 * Traduce errores de Supabase Auth al idioma de la app (español por defecto).
 */
export function translateSupabaseAuthError(
  error: AuthErrorLike,
  locale?: AppLocale
): string {
  const loc = locale ?? getClientAppLocale();
  const message = (typeof error === "string" ? error : error.message)?.trim() ?? "";
  const code = typeof error === "string" ? undefined : error.code?.toLowerCase();

  if (loc === "en") {
    return message || "Something went wrong. Please try again.";
  }

  if (code && ES_BY_CODE[code]) {
    return ES_BY_CODE[code];
  }

  for (const { match, text } of ES_BY_MESSAGE) {
    if (match.test(message)) {
      return text;
    }
  }

  if (message) {
    return "No pudimos completar la operación. Revisá los datos e intentá de nuevo.";
  }

  return "No pudimos completar la operación. Intentá de nuevo.";
}

export function isEmailNotConfirmedError(error: AuthErrorLike): boolean {
  const message = (typeof error === "string" ? error : error.message) ?? "";
  const code = typeof error === "string" ? undefined : error.code?.toLowerCase();
  return code === "email_not_confirmed" || /email not confirmed/i.test(message);
}

export function authConfirmationSentMessage(locale?: AppLocale): string {
  const loc = locale ?? getClientAppLocale();
  if (loc === "en") {
    return "We sent you a confirmation email. Check your inbox and spam folder.";
  }
  return "Te enviamos un email de confirmación. Revisá tu bandeja de entrada y la carpeta de spam.";
}

export function authConfirmationResentMessage(locale?: AppLocale): string {
  const loc = locale ?? getClientAppLocale();
  if (loc === "en") {
    return "Confirmation email sent again.";
  }
  return "Reenviamos el email de confirmación.";
}
