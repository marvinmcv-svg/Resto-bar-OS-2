import type { Role } from "@/modules/pos/types";

/** Avatar tint per role: a soft wash of the chart palette with foreground text (AA in both themes). */
export const ROLE_TINT: Record<Role, string> = {
  admin: "bg-status-info/18 text-foreground",
  owner: "bg-primary/18 text-foreground",
  manager: "bg-chart-2/22 text-foreground",
  cashier: "bg-chart-3/22 text-foreground",
  waiter: "bg-chart-1/20 text-foreground",
  bartender: "bg-chart-5/24 text-foreground",
  kitchen: "bg-chart-4/26 text-foreground",
};

/** Solid dot color per role, for legends. */
export const ROLE_DOT: Record<Role, string> = {
  admin: "bg-status-info",
  owner: "bg-primary",
  manager: "bg-chart-2",
  cashier: "bg-chart-3",
  waiter: "bg-chart-1",
  bartender: "bg-chart-5",
  kitchen: "bg-chart-4",
};
