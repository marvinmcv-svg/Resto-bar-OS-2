"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, LayoutGrid, LineChart } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/pos", label: "Salón", icon: LayoutGrid, match: (p: string) => p.startsWith("/pos") },
  { href: "/menu", label: "Menú", icon: BookOpen, match: (p: string) => p === "/menu" },
  { href: "/resumen", label: "Resumen", icon: LineChart, match: (p: string) => p === "/resumen" },
];

/** Slim icon rail for the tablet POS (tablet landscape and up). */
export function PosRail() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Principal"
      className="sticky top-0 hidden h-dvh w-[84px] shrink-0 flex-col items-center gap-2 border-r bg-card/50 py-4 lg:flex"
    >
      <Link href="/pos" aria-label="RestoBar OS" className="mb-4">
        <LogoMark className="size-11 rounded-[14px]" />
      </Link>
      {ITEMS.map(({ href, label, icon: Icon, match }) => {
        const active = match(pathname);
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
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
