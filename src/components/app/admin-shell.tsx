"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, LayoutGrid, MonitorSmartphone, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Logo, LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { RESTAURANT } from "@/modules/pos/demo-data";
import { useStore } from "@/modules/pos/store";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";

const NAV = [
  { href: "/resumen", label: "Resumen", icon: LayoutGrid },
  { href: "/pos", label: "Punto de venta", icon: MonitorSmartphone },
  { href: "/menu", label: "Menú", icon: BookOpen },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { reset } = useStore();

  return (
    <div className="min-h-dvh lg:pl-[248px]">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-sidebar-border bg-sidebar px-4 py-5 lg:flex">
        <Logo subtitle={RESTAURANT.name} className="px-2" />
        <nav className="mt-8 flex flex-col gap-1" aria-label="Principal">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "press flex h-10 items-center gap-3 rounded-xl px-3 text-[14px] font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                  active && "bg-card text-foreground shadow-card",
                )}
              >
                <Icon className={cn("size-[18px]", active && "text-primary")} aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-3">
          <div className="rounded-2xl border bg-card p-3.5 shadow-card">
            <p className="text-[13px] font-semibold">Modo demo</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Datos de ejemplo de un día de servicio. Úsalo en tus demos con dueños.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full"
              onClick={() => {
                reset();
                toast.success("Demo reiniciada");
              }}
            >
              <RotateCcw /> Reiniciar demo
            </Button>
          </div>
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-full bg-secondary text-xs font-semibold">M</span>
              <div className="leading-tight">
                <p className="text-[13px] font-medium">Marvin</p>
                <p className="text-xs text-muted-foreground">Dueño</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
          <Link href="/creditos" className="block px-1 text-[11px] text-muted-foreground hover:text-foreground">
            Créditos de fotos
          </Link>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="glass sticky top-0 z-30 flex h-14 items-center justify-between border-b px-4 lg:hidden">
        <span className="flex items-center gap-2">
          <LogoMark className="size-8" />
          <span className="text-[15px] font-semibold">{RESTAURANT.name}</span>
        </span>
        <ThemeToggle />
      </header>

      <main className="pb-24 lg:pb-0">{children}</main>

      {/* Mobile tab bar */}
      <nav
        className="glass fixed inset-x-3 bottom-3 z-30 flex h-16 items-center justify-around rounded-[22px] border shadow-float lg:hidden"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Principal"
      >
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "press flex min-w-20 flex-col items-center gap-1 text-[11px] font-medium text-muted-foreground",
                active && "text-primary",
              )}
            >
              <Icon className="size-[22px]" aria-hidden />
              {label === "Punto de venta" ? "Caja" : label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
