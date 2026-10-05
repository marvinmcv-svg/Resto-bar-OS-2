"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/brand/logo";
import { areasFor } from "@/components/app/areas";
import { useStore } from "@/modules/pos/store";
import { cn } from "@/lib/utils";

/** Slim icon rail for the tablet POS (tablet landscape and up). Shows only what the role can open. */
export function PosRail() {
  const pathname = usePathname();
  const { me } = useStore();
  // Service screens only; the back office is one tap away in the user menu.
  const items = me ? areasFor(me.role).filter((a) => a.group === "servicio" || a.href === "/resumen") : [];
  return (
    <nav
      aria-label="Principal"
      className="sticky top-0 hidden h-dvh w-[84px] shrink-0 flex-col items-center gap-2 border-r bg-card/50 py-4 lg:flex"
    >
      <Link href="/pos" aria-label="RestoBar OS" className="mb-4">
        <LogoMark className="size-11 rounded-[14px]" />
      </Link>
      {items.map(({ href, short, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "press flex w-[68px] flex-col items-center gap-1.5 rounded-[16px] py-2.5 text-[11px] font-semibold text-muted-foreground hover:bg-accent hover:text-foreground",
              active && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
            )}
          >
            <Icon className="size-[22px]" aria-hidden />
            {short}
          </Link>
        );
      })}
    </nav>
  );
}
