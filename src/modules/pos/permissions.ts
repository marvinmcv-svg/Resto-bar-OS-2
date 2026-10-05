// What each role can do in the UI. Mirrors the RLS matrix (ADR-010, ADR-011); the database
// stays the source of truth, so hiding a button here is convenience, not security.
import type { Role } from "./types";

export type Permission =
  | "tenants.manage" // platform admin: client restaurants
  | "reports.view"
  | "menu.edit"
  | "menu.86" // mark an item sold out ("agotado") during service
  | "staff.manage"
  | "order.take"
  | "order.void" // without asking for a manager PIN
  | "payment.record"
  | "kds.view"
  | "cash.manage" // open, move and close the cash register
  | "hr.manage" // schedules, attendance, tips
  | "hr.pay.view" // CI, pay type and rate (ADR-012)
  | "time.clock"; // clock in and out

const MATRIX: Record<Role, Permission[]> = {
  admin: ["tenants.manage", "reports.view", "menu.edit", "menu.86", "staff.manage", "kds.view"],
  owner: [
    "reports.view", "menu.edit", "menu.86", "staff.manage", "order.take", "order.void", "payment.record", "kds.view",
    "cash.manage", "hr.manage", "hr.pay.view", "time.clock",
  ],
  manager: [
    "reports.view", "menu.edit", "menu.86", "staff.manage", "order.take", "order.void", "payment.record", "kds.view",
    "cash.manage", "hr.manage", "time.clock",
  ],
  cashier: ["order.take", "payment.record", "cash.manage", "time.clock"],
  waiter: ["order.take", "time.clock"],
  bartender: ["order.take", "menu.86", "kds.view", "time.clock"],
  kitchen: ["menu.86", "kds.view", "time.clock"],
};

export const ROLES: Role[] = ["admin", "owner", "manager", "cashier", "waiter", "bartender", "kitchen"];

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin plataforma",
  owner: "Dueño",
  manager: "Encargado/a",
  cashier: "Cajero/a",
  waiter: "Mesero/a",
  bartender: "Barman",
  kitchen: "Cocina",
};

export const ROLE_SUMMARY: Record<Role, string> = {
  admin: "Ve todos los restaurantes clientes, da de alta locales y da soporte.",
  owner: "Todo su restaurante: ventas, menú, equipo, sueldos, caja y anulaciones.",
  manager: "Opera el turno: menú, horarios, anulaciones, caja y propinas. No ve sueldos.",
  cashier: "Abre y cierra la caja, cobra y registra entradas y salidas de efectivo.",
  waiter: "Abre mesas y envía pedidos desde su celular. No cobra ni anula.",
  bartender: "Pedidos de barra, pantalla de barra y marca bebidas agotadas.",
  kitchen: "Pantalla de cocina: marca platos listos y agotados.",
};

export const PERMISSION_LABEL: Record<Permission, string> = {
  "tenants.manage": "Ver y dar de alta restaurantes",
  "reports.view": "Ver ventas y el cierre del día",
  "menu.edit": "Agregar, editar o quitar productos",
  "menu.86": "Marcar productos agotados",
  "staff.manage": "Gestionar equipo y PINs",
  "order.take": "Abrir mesas y tomar pedidos",
  "order.void": "Anular sin pedir PIN de encargado",
  "payment.record": "Cobrar y registrar pagos",
  "kds.view": "Usar la pantalla de cocina/barra",
  "cash.manage": "Abrir, mover y cerrar la caja",
  "hr.manage": "Horarios, asistencia y propinas",
  "hr.pay.view": "Ver CI, sueldos y datos personales",
  "time.clock": "Marcar entrada y salida",
};

export const PERMISSIONS = Object.keys(PERMISSION_LABEL) as Permission[];

export function can(role: Role | undefined, permission: Permission): boolean {
  return !!role && MATRIX[role].includes(permission);
}

/** Roles a person can hand out when creating staff. Nobody creates a peer above themselves. */
export function assignableRoles(role: Role): Role[] {
  if (role === "admin") return ["owner", "manager", "cashier", "waiter", "bartender", "kitchen"];
  if (role === "owner") return ["manager", "cashier", "waiter", "bartender", "kitchen"];
  if (role === "manager") return ["cashier", "waiter", "bartender", "kitchen"];
  return [];
}

/** The permission each app route needs. Longest prefix wins. */
const ROUTES: [string, Permission][] = [
  ["/admin", "tenants.manage"],
  ["/resumen", "reports.view"],
  ["/menu", "menu.edit"],
  ["/equipo", "staff.manage"],
  ["/cocina", "kds.view"],
  ["/caja", "cash.manage"],
  ["/pos", "order.take"],
];

export function permissionFor(path: string): Permission | null {
  const hit = ROUTES.filter(([p]) => path === p || path.startsWith(p + "/")).sort((a, b) => b[0].length - a[0].length)[0];
  return hit ? hit[1] : null;
}

export function canAccess(role: Role | undefined, path: string): boolean {
  const p = permissionFor(path);
  return p === null || can(role, p);
}

/** Where a role lands after signing in. */
export function homeFor(role: Role): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "owner":
    case "manager":
      return "/resumen";
    case "kitchen":
      return "/cocina";
    case "cashier":
      return "/caja";
    default:
      return "/pos";
  }
}
