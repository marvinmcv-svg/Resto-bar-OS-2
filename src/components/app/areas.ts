import { BookOpen, Building2, ChefHat, LayoutGrid, LineChart, Users, type LucideIcon } from "lucide-react";
import { canAccess } from "@/modules/pos/permissions";
import type { Role } from "@/modules/pos/types";

export interface Area {
  href: string;
  label: string;
  short: string; // tab bar / rail label
  icon: LucideIcon;
  pos: boolean; // always-dark service screen
}

/** Every top-level screen, in navigation order. Each role sees the ones it can open. */
export const AREAS: Area[] = [
  { href: "/admin", label: "Clientes", short: "Clientes", icon: Building2, pos: false },
  { href: "/resumen", label: "Resumen", short: "Resumen", icon: LineChart, pos: false },
  { href: "/pos", label: "Salón y pedidos", short: "Salón", icon: LayoutGrid, pos: true },
  { href: "/cocina", label: "Pantalla de cocina", short: "Cocina", icon: ChefHat, pos: true },
  { href: "/menu", label: "Menú", short: "Menú", icon: BookOpen, pos: false },
  { href: "/equipo", label: "Equipo y permisos", short: "Equipo", icon: Users, pos: false },
];

export function areasFor(role: Role): Area[] {
  return AREAS.filter((a) => canAccess(role, a.href));
}
