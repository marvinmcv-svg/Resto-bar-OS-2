import Image from "next/image";
import { CATEGORIES } from "@/modules/pos/demo-data";
import type { MenuItem } from "@/modules/pos/types";
import { cn } from "@/lib/utils";
import { CategoryIcon } from "./category-icon";

/** Menu photo, or a calm category-icon tile when the restaurant hasn't uploaded one. */
export function ItemImage({ item, className, sizes = "200px" }: { item: MenuItem; className?: string; sizes?: string }) {
  const cat = CATEGORIES.find((c) => c.id === item.categoryId);
  if (item.image) {
    return (
      <div className={cn("relative overflow-hidden bg-muted", className)}>
        <Image src={item.image} alt={item.name} fill sizes={sizes} className="object-cover" />
      </div>
    );
  }
  return (
    <div className={cn("grid place-items-center bg-gradient-to-br from-muted to-secondary text-muted-foreground", className)}>
      <CategoryIcon icon={cat?.icon ?? "utensils"} className="size-[34%] opacity-70" />
    </div>
  );
}
