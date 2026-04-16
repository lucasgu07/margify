/** Dígitos del número en formato internacional (sin +), ej. Argentina: 54911… */
export function getWhatsAppChatUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 10) return null;
  const text = encodeURIComponent("Hola, quiero información sobre Margify.");
  return `https://wa.me/${digits}?text=${text}`;
}
