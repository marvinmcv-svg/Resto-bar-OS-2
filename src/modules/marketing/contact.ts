// Sales contact for the landing page. Set the WhatsApp number (digits, with country code) to turn
// "Agenda una demo" into a WhatsApp chat; until then it opens the live demo.
export const SALES_WHATSAPP: string | null = null;

export function demoRequestHref(): string {
  if (!SALES_WHATSAPP) return "/entrar";
  const text = "Hola, quiero ver RestoBar OS en mi local.";
  return `https://wa.me/${SALES_WHATSAPP}?text=${encodeURIComponent(text)}`;
}
