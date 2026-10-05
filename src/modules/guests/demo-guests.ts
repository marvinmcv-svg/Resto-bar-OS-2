// Demo guest book, reservations, campaigns and 30 days of sales for "La Casona". Deterministic.
import type { DaySales } from "../analytics/analytics";
import { dateKey } from "../hr/time";
import type { Reservation } from "../reservations/reservations";
import type { Guest } from "./guests";

const bs = (n: number) => Math.round(n * 100);
const DAY = 24 * 3600_000;

export function seedGuests(now: number): Guest[] {
  const ago = (d: number) => now - d * DAY;
  const g = (id: string, name: string, phone: string, visits: number, spent: number, lastDays: number, extra: Partial<Guest> = {}): Guest => ({
    id, name, phone, visits, spentMinor: bs(spent), lastVisitAt: ago(lastDays), createdAt: ago(60), tags: [], optIn: true, ...extra,
  });
  const month = String(new Date(now).getMonth() + 1).padStart(2, "0");
  return [
    g("g-rojas", "Familia Rojas", "+591 70123401", 14, 6380, 0, { tags: ["vip"], birthday: `${month}-05`, notes: "Mesa 7 de siempre. Torta propia en cumpleaños." }),
    g("g-gabriela", "Gabriela Suárez", "+591 70123402", 9, 2140, 3, { tags: ["frecuente"], notes: "Chuflay con Rujero." }),
    g("g-andres", "Andrés Molina", "+591 70123403", 1, 186, 12),
    g("g-valeria", "Valeria Justiniano", "+591 70123404", 6, 1530, 41, { birthday: `${month}-22` }),
    g("g-carlos", "Carlos Peña", "+591 70123405", 22, 9870, 2, { tags: ["vip", "empresa"], notes: "Factura a nombre de su empresa: NIT 1023456028." }),
    g("g-lucia", "Lucía Vaca", "+591 70123406", 3, 610, 55, { tags: ["alergia"], notes: "Alergia al maní." }),
    g("g-diego", "Diego Arteaga", "+591 70123407", 5, 1120, 8),
    g("g-mariana", "Mariana Saucedo", "+591 70123408", 2, 390, 33, { optIn: false }),
    g("g-jose", "José Luis Paz", "+591 70123409", 11, 3010, 6, { tags: ["frecuente"], birthday: `${month}-28` }),
    g("g-sofia", "Sofía Cuéllar", "+591 70123410", 1, 240, 2),
    g("g-tomas", "Tomás Antelo", "+591 70123411", 4, 980, 72),
    g("g-patricia", "Patricia Ribera", "+591 70123412", 7, 1860, 15, { birthday: "02-14" }),
    g("g-ricardo", "Ricardo Gutiérrez", "+591 70123413", 1, 410, 38),
    g("g-elena", "Elena Montaño", "+591 70123414", 16, 5120, 1, { tags: ["vip"] }),
  ];
}

export function seedReservations(now: number): Reservation[] {
  const at = (dayOffset: number, h: number, m = 0) => {
    const d = new Date(now);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + dayOffset, h, m).getTime();
  };
  const r = (id: string, name: string, party: number, when: number, extra: Partial<Reservation> = {}): Reservation => ({
    id, name, party, at: when, durationMin: 120, status: "confirmada", createdBy: "s-daniela", ...extra,
  });
  return [
    r("r-1", "Gabriela Suárez", 4, at(0, 13), { guestId: "g-gabriela", phone: "+591 70123402", tableId: "m1", status: "sentada" }),
    r("r-2", "Carlos Peña", 6, at(0, 20), { guestId: "g-carlos", phone: "+591 70123405", tableId: "m3", notes: "Cena de trabajo, factura con NIT" }),
    r("r-3", "Familia Rojas", 8, at(0, 21), { guestId: "g-rojas", phone: "+591 70123401", tableId: "m7", notes: "Cumpleaños, traen torta" }),
    r("r-4", "Elena Montaño", 2, at(0, 21, 30), { guestId: "g-elena", phone: "+591 70123414", tableId: "t4" }),
    r("r-5", "Diego Arteaga", 4, at(0, 12, 30), { guestId: "g-diego", status: "no-show", tableId: "m9" }),
    r("r-6", "José Luis Paz", 5, at(1, 20, 30), { guestId: "g-jose", phone: "+591 70123409", tableId: "t3" }),
    r("r-7", "Sofía Cuéllar", 2, at(1, 13), { guestId: "g-sofia", phone: "+591 70123410", tableId: "m4" }),
    r("r-8", "Grupo Univalle", 12, at(2, 19, 30), { phone: "+591 70123499", notes: "Juntar mesas 7 y 3" }),
  ];
}

/** The 29 days before today (today comes from live sales). Weekends and Fridays sell more. */
export function seedSalesDays(now: number): DaySales[] {
  let a = 20261001;
  const rnd = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const base = [0.72, 0.78, 0.85, 0.95, 1.25, 1.35, 1.05]; // Mon..Sun
  const out: DaySales[] = [];
  for (let i = 29; i >= 1; i--) {
    const d = new Date(now - i * DAY);
    const w = (d.getDay() + 6) % 7;
    const trend = 1 + (29 - i) * 0.006;
    const orders = Math.round(48 * base[w] * trend * (0.9 + rnd() * 0.2));
    const ticket = 225 + rnd() * 30;
    const salesMinor = Math.round(orders * ticket) * 100;
    out.push({ date: dateKey(d), salesMinor, orders, tipsMinor: Math.round(salesMinor * 0.055 / 100) * 100 });
  }
  return out;
}

export interface Campaign {
  id: string;
  segment: string;
  message: string;
  recipients: number;
  at: number;
  by: string;
}

export function seedCampaigns(now: number): Campaign[] {
  return [
    {
      id: "cp-1", segment: "inactivos", recipients: 3, at: now - 9 * DAY, by: "s-roberto",
      message: "Hola {nombre}, te extrañamos en La Casona. Esta semana tu primer Chuflay va por la casa.",
    },
  ];
}
