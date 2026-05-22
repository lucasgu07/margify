/** Mensaje prellenado al abrir el botón de WhatsApp (ventas + tono natural para quien envía). */
export const WHATSAPP_DEFAULT_MESSAGE = [
  "Hola! Vi Margify y me interesa ver el margen real de mi negocio (ventas, costos y ads en un solo lugar).",
  "",
  "¿Me cuentan cómo puedo empezar?",
].join("\n");

/** Dígitos del número en formato internacional (sin +), ej. Argentina: 54911… */
export function getWhatsAppChatUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 10) return null;
  const text = encodeURIComponent(WHATSAPP_DEFAULT_MESSAGE);
  return `https://wa.me/${digits}?text=${text}`;
}
