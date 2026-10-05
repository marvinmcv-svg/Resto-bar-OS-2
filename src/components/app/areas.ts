import {
  BarChart3, BookOpen, Boxes, Building2, CalendarDays, ChefHat, CreditCard, Contact, LayoutGrid, LineChart, Megaphone, Users, Wallet,
  type LucideIcon,
} from "lucide-react";
import { canAccess } from "@/modules/pos/permissions";
import type { Role } from "@/modules/pos/types";

export type AreaGroup = "inicio" | "servicio" | "gestion" | "crecimiento";

export const GROUP_LABEL: Record<AreaGroup, string> = {
  inicio: "Inicio",
  servicio: "Servicio",
  gestion: "Gestión",
  crecimiento: "Clientes y ventas",
};

export interface Area {
  href: string;
  label: string;
  short: string; // tab bar / rail label
  icon: LucideIcon;
  pos: boolean; // always-dark service screen
  group: AreaGroup;
}

/** Every top-level screen, in navigation order. Each role sees the ones it can open. */
export const AREAS: Area[] = [
  { href: "/admin", label: "Clientes del SaaS", short: "Locales", icon: Building2, pos: false, group: "inicio" },
  { href: "/resumen", label: "Resumen", short: "Resumen", icon: LineChart, pos: false, group: "inicio" },
  { href: "/caja", label: "Caja", short: "Caja", icon: Wallet, pos: true, group: "servicio" },
  { href: "/pos", label: "Salón y pedidos", short: "Salón", icon: LayoutGrid, pos: true, group: "servicio" },
  { href: "/reservas", label: "Reservas", short: "Reservas", icon: CalendarDays, pos: false, group: "servicio" },
  { href: "/cocina", label: "Pantalla de cocina", short: "Cocina", icon: ChefHat, pos: true, group: "servicio" },
  { href: "/menu", label: "Menú", short: "Menú", icon: BookOpen, pos: false, group: "gestion" },
  { href: "/inventario", label: "Inventario", short: "Stock", icon: Boxes, pos: false, group: "gestion" },
  { href: "/equipo", label: "Personal", short: "Personal", icon: Users, pos: false, group: "gestion" },
  { href: "/pagos", label: "Pagos", short: "Pagos", icon: CreditCard, pos: false, group: "gestion" },
  { href: "/clientes", label: "Clientes", short: "Clientes", icon: Contact, pos: false, group: "crecimiento" },
  { href: "/marketing", label: "Marketing", short: "Marketing", icon: Megaphone, pos: false, group: "crecimiento" },
  { href: "/analitica", label: "Analítica", short: "Analítica", icon: BarChart3, pos: false, group: "crecimiento" },
];

export function areasFor(role: Role): Area[] {
  return AREAS.filter((a) => canAccess(role, a.href));
}
