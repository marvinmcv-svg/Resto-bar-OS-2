import { Beer, CupSoda, Drumstick, IceCreamCone, Martini, UtensilsCrossed, type LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  drumstick: Drumstick,
  utensils: UtensilsCrossed,
  beer: Beer,
  martini: Martini,
  cup: CupSoda,
  dessert: IceCreamCone,
};

export function CategoryIcon({ icon, className }: { icon: string; className?: string }) {
  const Icon = ICONS[icon] ?? UtensilsCrossed;
  return <Icon className={className} aria-hidden />;
}
