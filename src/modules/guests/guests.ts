// Guest book (CRM): who comes, how often, what they're worth, and who to invite back.

export type GuestTag = "vip" | "frecuente" | "alergia" | "empresa";

export interface Guest {
  id: string;
  name: string;
  phone?: string; // +591 7xxxxxxx
  birthday?: string; // MM-DD
  tags: GuestTag[];
  notes?: string;
  visits: number;
  spentMinor: number;
  lastVisitAt?: number;
  createdAt: number;
  /** Agreed to receive WhatsApp promotions. Marketing only targets these. */
  optIn: boolean;
}

export const TAG_LABEL: Record<GuestTag, string> = { vip: "VIP", frecuente: "Frecuente", alergia: "Alergia", empresa: "Empresa" };

export type Segment = "todos" | "vip" | "cumpleanos" | "inactivos" | "nuevos";

export const SEGMENT_LABEL: Record<Segment, string> = {
  todos: "Todos con permiso",
  vip: "VIP y frecuentes",
  cumpleanos: "Cumpleaños este mes",
  inactivos: "No vienen hace 30 días",
  nuevos: "Vinieron una vez",
};

const DAY = 24 * 3600_000;

export function averageTicketMinor(g: Guest): number {
  return g.visits > 0 ? Math.round(g.spentMinor / g.visits) : 0;
}

export function inSegment(g: Guest, s: Segment, now: number): boolean {
  switch (s) {
    case "todos":
      return true;
    case "vip":
      return g.tags.includes("vip") || g.tags.includes("frecuente") || g.visits >= 8;
    case "cumpleanos":
      return !!g.birthday && Number(g.birthday.slice(0, 2)) === new Date(now).getMonth() + 1;
    case "inactivos":
      return !!g.lastVisitAt && now - g.lastVisitAt > 30 * DAY;
    case "nuevos":
      return g.visits === 1;
  }
}

/** Marketing audience: only guests who opted in and have a phone. */
export function audience(guests: Guest[], s: Segment, now: number): Guest[] {
  return guests.filter((g) => g.optIn && !!g.phone && inSegment(g, s, now));
}

/** "70012345" / "591 7001-2345" -> "+591 70012345". Bolivian mobiles are 8 digits starting with 6 or 7. */
export function normalizePhone(input: string): string | null {
  const d = input.replace(/\D/g, "");
  const local = d.startsWith("591") ? d.slice(3) : d;
  return /^[67]\d{7}$/.test(local) ? `+591 ${local}` : null;
}

/** Opens WhatsApp with the message ready; the person sends it. */
export function whatsappLink(phone: string, text: string): string {
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}

/** Fills {nombre} with the guest's first name. */
export function personalize(template: string, g: Pick<Guest, "name">): string {
  return template.replace(/\{nombre\}/g, g.name.split(" ")[0]);
}
