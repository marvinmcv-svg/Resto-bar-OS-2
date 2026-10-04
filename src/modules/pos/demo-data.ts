// Demo restaurant used for sales demos and design partners' training.
// "La Casona" is fictional. Prices are illustrative.
import type { Category, DiningTable, MenuItem, ModifierGroup, Order, Staff } from "./types";

const bs = (n: number) => Math.round(n * 100);

export const RESTAURANT = { name: "La Casona", location: "Equipetrol · Santa Cruz" };

export const STAFF: Staff[] = [
  { id: "s-marvin", name: "Marvin", role: "owner", pin: "0000" },
  { id: "s-daniela", name: "Daniela", role: "manager", pin: "1234" },
  { id: "s-carla", name: "Carla", role: "cashier", pin: "2222" },
  { id: "s-ana", name: "Ana", role: "waiter", pin: "1111" },
  { id: "s-luis", name: "Luis", role: "waiter", pin: "3333" },
];

export const CATEGORIES: Category[] = [
  { id: "picar", name: "Para picar", icon: "drumstick", station: "cocina" },
  { id: "platos", name: "Platos", icon: "utensils", station: "cocina" },
  { id: "cervezas", name: "Cervezas", icon: "beer", station: "barra" },
  { id: "cocteles", name: "Cócteles", icon: "martini", station: "barra" },
  { id: "sin-alcohol", name: "Sin alcohol", icon: "cup", station: "barra" },
  { id: "postres", name: "Postres", icon: "dessert", station: "cocina" },
];

const g = (id: string, name: string, options: [string, number][], required = false, multi = false): ModifierGroup => ({
  id, name, required, multi,
  options: options.map(([n, p], i) => ({ id: `${id}-${i}`, name: n, priceMinor: bs(p) })),
});

const item = (
  id: string, categoryId: string, name: string, price: number,
  extra: Partial<MenuItem> = {},
): MenuItem => ({ id, categoryId, name, priceMinor: bs(price), modifierGroups: [], available: true, ...extra });

export const MENU: MenuItem[] = [
  item("saltena", "picar", "Salteña de carne", 12, {
    image: "/menu/saltena.jpg", popular: true, description: "Jugosa, horneada cada mañana.",
    modifierGroups: [g("saltena-aji", "Ají", [["Normal", 0], ["Sin ají", 0], ["Llajua aparte", 0]], true)],
  }),
  item("cunape", "picar", "Cuñapé (4 u.)", 18, { image: "/menu/cunape.jpg", description: "Pan de queso recién salido del horno." }),
  item("tequenos", "picar", "Tequeños (6 u.)", 35, { image: "/menu/tequenos.jpg", description: "Con salsa de la casa." }),
  item("papas", "picar", "Papas fritas", 25, { image: "/menu/papas-fritas.jpg" }),
  item("alitas", "picar", "Alitas (8 u.)", 55, {
    image: "/menu/alitas.jpg", popular: true,
    modifierGroups: [g("alitas-salsa", "Salsa", [["BBQ", 0], ["Picante", 0], ["Miel mostaza", 0]], true)],
  }),
  item("majadito", "platos", "Majadito", 55, {
    image: "/menu/majadito.jpg", popular: true, description: "Arroz con charque, huevo y plátano frito.",
    modifierGroups: [g("majadito-huevo", "Huevo", [["Frito", 0], ["Sin huevo", 0], ["Doble huevo", 5]], true)],
  }),
  item("pique", "platos", "Pique macho", 85, {
    image: "/menu/pique-macho.jpg", popular: true, description: "Carne, chorizo, papas, locoto y huevo.",
    modifierGroups: [
      g("pique-tamano", "Tamaño", [["Personal", 0], ["Para compartir", 40]], true),
      g("pique-picante", "Picante", [["Suave", 0], ["Con locoto", 0]], true),
    ],
  }),
  item("silpancho", "platos", "Silpancho", 50, { image: "/menu/silpancho.jpg", description: "Milanesa fina sobre arroz y papa." }),
  item("sopa-mani", "platos", "Sopa de maní", 30, { image: "/menu/sopa-de-mani.jpg" }),
  item("hamburguesa", "platos", "Hamburguesa La Casona", 58, {
    image: "/menu/hamburguesa.jpg",
    modifierGroups: [
      g("burger-termino", "Término", [["Medio", 0], ["Tres cuartos", 0], ["Bien cocido", 0]], true),
      g("burger-extras", "Extras", [["Queso", 5], ["Tocino", 8], ["Huevo", 5]], false, true),
    ],
  }),
  item("pacena", "cervezas", "Paceña 620 ml", 25, { image: "/menu/cerveza.jpg", popular: true }),
  item("huari", "cervezas", "Huari 620 ml", 28),
  item("artesanal", "cervezas", "Cerveza artesanal", 35),
  item("chuflay", "cocteles", "Chuflay", 35, {
    image: "/menu/chuflay.jpg", popular: true, description: "Singani, ginger ale y limón.",
    modifierGroups: [g("chuflay-singani", "Singani", [["Casa Real", 0], ["Rujero", 10]], true)],
  }),
  item("mojito", "cocteles", "Mojito", 38, {
    image: "/menu/mojito.jpg",
    modifierGroups: [g("mojito-sabor", "Sabor", [["Clásico", 0], ["Maracuyá", 5]], true)],
  }),
  item("caipirina", "cocteles", "Caipiriña", 38),
  item("limonada", "sin-alcohol", "Limonada frozen", 20, { image: "/menu/limonada-frozen.jpg" }),
  item("maracuya", "sin-alcohol", "Jugo de maracuyá", 18, { image: "/menu/jugo-maracuya.jpg" }),
  item("refresco", "sin-alcohol", "Refresco 500 ml", 12),
  item("agua", "sin-alcohol", "Agua sin gas", 10),
  item("cheesecake", "postres", "Cheesecake de maracuyá", 30, { image: "/menu/cheesecake.jpg" }),
  item("helado", "postres", "Helado de canela", 18),
];

export const TABLES: DiningTable[] = [
  // Salón: 12-column grid
  { id: "m1", label: "1", zone: "salon", seats: 4, shape: "square", x: 1, y: 1, w: 2, h: 2 },
  { id: "m2", label: "2", zone: "salon", seats: 4, shape: "square", x: 4, y: 1, w: 2, h: 2 },
  { id: "m3", label: "3", zone: "salon", seats: 6, shape: "rect", x: 7, y: 1, w: 3, h: 2 },
  { id: "m4", label: "4", zone: "salon", seats: 2, shape: "round", x: 11, y: 1, w: 2, h: 2 },
  { id: "m5", label: "5", zone: "salon", seats: 4, shape: "round", x: 1, y: 4, w: 2, h: 2 },
  { id: "m6", label: "6", zone: "salon", seats: 4, shape: "round", x: 4, y: 4, w: 2, h: 2 },
  { id: "m7", label: "7", zone: "salon", seats: 8, shape: "rect", x: 7, y: 4, w: 4, h: 2 },
  { id: "m8", label: "8", zone: "salon", seats: 2, shape: "round", x: 11, y: 4, w: 2, h: 2 },
  { id: "m9", label: "9", zone: "salon", seats: 4, shape: "square", x: 1, y: 7, w: 2, h: 2 },
  { id: "m10", label: "10", zone: "salon", seats: 4, shape: "square", x: 4, y: 7, w: 2, h: 2 },
  // Terraza
  { id: "t1", label: "T1", zone: "terraza", seats: 4, shape: "round", x: 1, y: 1, w: 2, h: 2 },
  { id: "t2", label: "T2", zone: "terraza", seats: 4, shape: "round", x: 4, y: 1, w: 2, h: 2 },
  { id: "t3", label: "T3", zone: "terraza", seats: 6, shape: "rect", x: 7, y: 1, w: 3, h: 2 },
  { id: "t4", label: "T4", zone: "terraza", seats: 2, shape: "round", x: 1, y: 4, w: 2, h: 2 },
  { id: "t5", label: "T5", zone: "terraza", seats: 2, shape: "round", x: 4, y: 4, w: 2, h: 2 },
  { id: "t6", label: "T6", zone: "terraza", seats: 4, shape: "square", x: 7, y: 4, w: 2, h: 2 },
  // Barra
  ...["B1", "B2", "B3", "B4", "B5", "B6"].map((label, i) => ({
    id: label.toLowerCase(), label, zone: "barra" as const, seats: 1, shape: "round" as const, x: 1 + i * 2, y: 2, w: 2, h: 2,
  })),
];

export const ZONES: { id: DiningTable["zone"]; name: string }[] = [
  { id: "salon", name: "Salón" },
  { id: "terraza", name: "Terraza" },
  { id: "barra", name: "Barra" },
];

// ---------- Seeded live orders and today's history ----------

let seq = 0;
const uid = (p: string) => `${p}-${(++seq).toString(36)}`;

function line(itemId: string, qty: number, sentMinAgo: number | null, now: number, modIdx: number[] = []) {
  const it = MENU.find((m) => m.id === itemId)!;
  const modifiers = it.modifierGroups.flatMap((grp, gi) => {
    const o = grp.options[modIdx[gi] ?? 0];
    return grp.required || modIdx[gi] !== undefined ? [{ groupId: grp.id, optionId: o.id, name: o.name, priceMinor: o.priceMinor }] : [];
  });
  return {
    id: uid("l"), itemId, name: it.name, unitPriceMinor: it.priceMinor, qty, modifiers,
    sentAt: sentMinAgo === null ? undefined : now - sentMinAgo * 60000,
  };
}

/** Deterministic PRNG so the demo looks the same on every device. */
function mulberry32(a: number) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedLiveOrders(now: number): Order[] {
  seq = 0;
  const o = (tableId: string, waiterId: string, guests: number, minAgo: number, lines: ReturnType<typeof line>[], billRequested = false): Order => ({
    id: uid("o"), tableId, waiterId, guests, openedAt: now - minAgo * 60000, lines, payments: [], status: "open", billRequested,
  });
  return [
    o("m2", "s-ana", 3, 14, [line("pacena", 2, 12, now), line("saltena", 3, 12, now), line("chuflay", 1, null, now)]),
    o("m3", "s-luis", 6, 52, [line("pique", 2, 45, now, [1, 1]), line("pacena", 4, 48, now), line("majadito", 1, 45, now), line("limonada", 2, 45, now)], true),
    o("m5", "s-ana", 2, 33, [line("hamburguesa", 1, 28, now, [1]), line("silpancho", 1, 28, now), line("mojito", 2, 30, now, [1])]),
    o("m7", "s-luis", 7, 82, [line("alitas", 2, 75, now, [1]), line("pacena", 6, 78, now), line("tequenos", 2, 75, now), line("huari", 3, 40, now)]),
    o("t2", "s-ana", 4, 21, [line("chuflay", 4, 18, now, [1]), line("cunape", 2, 18, now)]),
    o("b3", "s-luis", 1, 9, [line("artesanal", 1, 8, now)]),
  ];
}

export interface HistoricOrder {
  id: string;
  closedAt: number;
  totalMinor: number;
  tipMinor: number;
  method: "cash" | "qr" | "card_external" | "transfer";
  items: { itemId: string; qty: number; totalMinor: number }[];
  waiterId: string;
}

export interface VoidRecord {
  id: string;
  at: number;
  itemName: string;
  qty: number;
  amountMinor: number;
  waiterId: string;
  approvedBy: string;
  reason: string;
  tableLabel: string;
}

/** Today's already-closed orders (12:00-21:30) so the owner dashboard has a full day. */
export function seedHistory(today: Date): { orders: HistoricOrder[]; voids: VoidRecord[]; lastWeekTotalMinor: number } {
  const rnd = mulberry32(20261004);
  const at = (h: number, m: number) => new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, m).getTime();
  // Arrivals per hour from 12 to 21 (lunch peak 13h, dinner peak 20-21h).
  const perHour: Record<number, number> = { 12: 4, 13: 9, 14: 6, 15: 2, 16: 2, 17: 3, 18: 5, 19: 8, 20: 11, 21: 9 };
  const methods: HistoricOrder["method"][] = ["qr", "qr", "qr", "cash", "cash", "card_external", "transfer"];
  const lunch = ["majadito", "pique", "silpancho", "sopa-mani", "hamburguesa", "saltena", "limonada", "maracuya", "refresco"];
  const night = ["pacena", "pacena", "huari", "chuflay", "mojito", "alitas", "tequenos", "papas", "pique", "hamburguesa", "artesanal"];
  const orders: HistoricOrder[] = [];
  for (const [h, n] of Object.entries(perHour).map(([h, n]) => [Number(h), n])) {
    for (let k = 0; k < n; k++) {
      const pool = h < 17 ? lunch : night;
      const count = 2 + Math.floor(rnd() * 4);
      const items: HistoricOrder["items"] = [];
      for (let j = 0; j < count; j++) {
        const pick = pool[Math.floor(rnd() * pool.length)];
        const it = MENU.find((m) => m.id === pick)!;
        const qty = it.categoryId === "cervezas" ? 1 + Math.floor(rnd() * 4) : 1 + Math.floor(rnd() * 2);
        items.push({ itemId: it.id, qty, totalMinor: it.priceMinor * qty });
      }
      const totalMinor = items.reduce((s, i) => s + i.totalMinor, 0);
      orders.push({
        id: `h-${h}-${k}`,
        closedAt: at(h, Math.floor(rnd() * 60)),
        totalMinor,
        tipMinor: rnd() < 0.45 ? Math.round((totalMinor * 0.1) / 100) * 100 : 0,
        method: methods[Math.floor(rnd() * methods.length)],
        items,
        waiterId: rnd() < 0.5 ? "s-ana" : "s-luis",
      });
    }
  }
  orders.sort((a, b) => a.closedAt - b.closedAt);
  const voids: VoidRecord[] = [
    { id: "v1", at: at(14, 22), itemName: "Pique macho", qty: 1, amountMinor: bs(85), waiterId: "s-ana", approvedBy: "s-daniela", reason: "Error de mesa", tableLabel: "6" },
    { id: "v2", at: at(21, 14), itemName: "Paceña 620 ml", qty: 3, amountMinor: bs(75), waiterId: "s-luis", approvedBy: "s-daniela", reason: "Cliente cambió de opinión", tableLabel: "7" },
  ];
  const total = orders.reduce((s, o) => s + o.totalMinor, 0);
  return { orders, voids, lastWeekTotalMinor: Math.round(total / 1.124) };
}
