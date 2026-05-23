/**
 * Envío de alertas por WhatsApp Cloud API (Meta).
 * Producción: usar plantilla aprobada (WHATSAPP_ALERT_TEMPLATE_NAME).
 * @see https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-message-templates
 */

const GRAPH_VERSION = "v21.0";

function graphMessagesUrl(phoneNumberId: string): string {
  return `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`;
}

function getCredentials(): { token: string; phoneId: string } | null {
  const token = process.env.WHATSAPP_API_TOKEN?.trim();
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  if (!token || !phoneId) return null;
  return { token, phoneId };
}

/** Solo dígitos, con código de país (ej. 5491122334455). */
export function normalizeWhatsAppPhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return null;
  return digits;
}

function truncate(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export type WhatsAppAlertPayload = {
  title: string;
  message: string;
};

type SendResult = { ok: true } | { ok: false; error: string };

async function postWhatsApp(
  creds: { token: string; phoneId: string },
  body: Record<string, unknown>
): Promise<SendResult> {
  const res = await fetch(graphMessagesUrl(creds.phoneId), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${creds.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (res.ok) return { ok: true };

  let error = `http_${res.status}`;
  try {
    const json = (await res.json()) as { error?: { message?: string } };
    error = json.error?.message ?? error;
  } catch {
    /* ignore */
  }
  console.error("[whatsapp]", error);
  return { ok: false, error };
}

/**
 * Plantilla con 2 variables en el cuerpo:
 * {{1}} = título de la alerta, {{2}} = detalle.
 *
 * Ejemplo para crear en Meta → WhatsApp → Plantillas (es):
 *   margify_alert
 *   Cuerpo: "Alerta de Margify: *{{1}}*. {{2}} Revisá tu dashboard."
 */
async function sendTemplateMessage(
  creds: { token: string; phoneId: string },
  to: string,
  templateName: string,
  languageCode: string,
  title: string,
  detail: string
): Promise<SendResult> {
  return postWhatsApp(creds, {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: truncate(title, 80) },
            { type: "text", text: truncate(detail, 900) },
          ],
        },
      ],
    },
  });
}

/** Texto libre: solo sirve si el usuario te escribió en las últimas 24 h (ventana de servicio). */
async function sendTextMessage(
  creds: { token: string; phoneId: string },
  to: string,
  body: string
): Promise<SendResult> {
  return postWhatsApp(creds, {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body: body.slice(0, 4000) },
  });
}

/**
 * Envía alerta por WhatsApp.
 * Si WHATSAPP_ALERT_TEMPLATE_NAME está definido → plantilla (recomendado en prod).
 * Si no → mensaje de texto (solo útil en pruebas / ventana 24 h).
 */
export async function sendAlertWhatsApp(
  phone: string,
  payload: WhatsAppAlertPayload
): Promise<boolean> {
  const creds = getCredentials();
  if (!creds) {
    console.warn("[whatsapp] WHATSAPP_API_TOKEN o WHATSAPP_PHONE_NUMBER_ID faltantes");
    return false;
  }

  const to = normalizeWhatsAppPhone(phone);
  if (!to) {
    console.warn("[whatsapp] número inválido:", phone);
    return false;
  }

  const templateName = process.env.WHATSAPP_ALERT_TEMPLATE_NAME?.trim();
  const languageCode = process.env.WHATSAPP_ALERT_TEMPLATE_LANG?.trim() || "es";

  if (templateName) {
    const result = await sendTemplateMessage(
      creds,
      to,
      templateName,
      languageCode,
      payload.title,
      payload.message
    );
    return result.ok;
  }

  const fallback = `[Margify] ${payload.title}: ${payload.message}`;
  const result = await sendTextMessage(creds, to, fallback);
  if (!result.ok) {
    console.warn(
      "[whatsapp] falló texto libre; configurá WHATSAPP_ALERT_TEMPLATE_NAME con plantilla aprobada en Meta"
    );
  }
  return result.ok;
}
