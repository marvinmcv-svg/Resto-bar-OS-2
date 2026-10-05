import { Beer, Coffee, CupSoda, Drumstick, IceCreamCone, Martini, Pizza, Salad, UtensilsCrossed, Wine, type LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  drumstick: Drumstick,
  utensils: UtensilsCrossed,
  beer: Beer,
  martini: Martini,
  cup: CupSoda,
  dessert: IceCreamCone,
  wine: Wine,
  coffee: Coffee,
  salad: Salad,
  pizza: Pizza,
};

export const CATEGORY_ICON_KEYS = Object.keys(ICONS);

export const CATEGORY_ICON_LABEL: Record<string, string> = {
  drumstick: "Para picar", utensils: "Platos", beer: "Cerveza", martini: "Cóctel", cup: "Refresco",
  dessert: "Postre", wine: "Vino", coffee: "Café", salad: "Ensalada", pizza: "Pizza",
};

export function CategoryIcon({ icon, className }: { icon: string; className?: string }) {
  const Icon = ICONS[icon] ?? UtensilsCrossed;
  return <Icon className={className} aria-hidden />;
}
