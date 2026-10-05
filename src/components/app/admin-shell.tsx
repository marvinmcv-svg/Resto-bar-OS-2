"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Ellipsis, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Logo, LogoMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { RESTAURANT } from "@/modules/pos/demo-data";
import { useStore } from "@/modules/pos/store";
import { cn } from "@/lib/utils";
import { areasFor, GROUP_LABEL, type Area, type AreaGroup } from "./areas";
import { RequireRole } from "./require-role";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { reset, me } = useStore();
  const NAV = me ? areasFor(me.role) : [];
  const subtitle = me?.role === "admin" ? "Plataforma" : RESTAURANT.name;
  const [more, setMore] = useState(false);
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  // Phone tab bar: up to four, the current screen always among them, the rest under "Más".
  const tabs = NAV.length <= 5 ? NAV : [...NAV.slice(0, 4)];
  if (NAV.length > 5 && !tabs.some((a) => isActive(a.href))) {
    const current = NAV.find((a) => isActive(a.href));
    if (current) tabs[3] = current;
  }
  const groups = (Object.keys(GROUP_LABEL) as AreaGroup[])
    .map((g) => ({ g, items: NAV.filter((a) => a.group === g) }))
    .filter((x) => x.items.length);

  return (
    <div className="min-h-dvh lg:pl-[248px]">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-sidebar-border bg-sidebar px-4 py-5 lg:flex">
        <Logo subtitle={subtitle} className="px-2" />
        <nav className="no-scrollbar -mx-2 mt-6 flex flex-1 flex-col gap-4 overflow-y-auto px-2 pb-2" aria-label="Principal">
          {groups.map(({ g, items }) => (
            <div key={g}>
              <p className="mb-1 px-3 text-[11px] font-semibold tracking-[0.06em] text-muted-foreground/80 uppercase">{GROUP_LABEL[g]}</p>
              <div className="flex flex-col gap-0.5">
                {items.map((a) => (
                  <NavLink key={a.href} area={a} active={isActive(a.href)} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="space-y-3 border-t border-sidebar-border pt-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground"
            onClick={() => {
              reset();
              toast.success("Demo reiniciada", { description: "Datos de ejemplo de un día de servicio." });
            }}
          >
            <RotateCcw /> Reiniciar demo
          </Button>
          <div className="flex items-center justify-between gap-2 px-1">
            <UserMenu align="start" />
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
          <span className="text-[15px] font-semibold">{subtitle}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <ThemeToggle />
          <UserMenu compact />
        </span>
      </header>

      <main className="min-w-0 overflow-x-clip pb-24 lg:pb-0">
        <RequireRole>{children}</RequireRole>
      </main>

      {/* Mobile tab bar */}
      <nav
        className="glass fixed inset-x-3 bottom-3 z-30 flex h-16 items-center justify-around rounded-[22px] border shadow-float lg:hidden"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Principal"
      >
        {tabs.map(({ href, short, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={isActive(href) ? "page" : undefined}
            className={cn(
              "press flex min-w-14 flex-1 flex-col items-center gap-1 text-[11px] font-medium text-muted-foreground",
              isActive(href) && "text-primary",
            )}
          >
            <Icon className="size-[22px]" aria-hidden />
            {short}
          </Link>
        ))}
        {NAV.length > 5 && (
          <button
            onClick={() => setMore(true)}
            className="press flex min-w-14 flex-1 flex-col items-center gap-1 text-[11px] font-medium text-muted-foreground"
            aria-label="Más secciones"
          >
            <Ellipsis className="size-[22px]" aria-hidden />
            Más
          </button>
        )}
      </nav>

      <Sheet open={more} onOpenChange={setMore}>
        <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-[28px] px-4 pt-6 pb-8">
          <SheetTitle className="px-2 text-[17px]">Todas las secciones</SheetTitle>
          <div className="mt-2 space-y-4">
            {groups.map(({ g, items }) => (
              <div key={g}>
                <p className="mb-1.5 px-2 text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">{GROUP_LABEL[g]}</p>
                <div className="grid grid-cols-3 gap-2">
                  {items.map(({ href, short, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMore(false)}
                      aria-current={isActive(href) ? "page" : undefined}
                      className={cn(
                        "press flex flex-col items-center gap-1.5 rounded-2xl border bg-card px-2 py-3.5 text-[12.5px] font-medium",
                        isActive(href) && "border-primary/50 text-primary",
                      )}
                    >
                      <Icon className="size-[22px]" aria-hidden />
                      {short}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function NavLink({ area: { href, label, icon: Icon }, active }: { area: Area; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "press flex h-9 items-center gap-3 rounded-xl px-3 text-[14px] font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
        active && "bg-card text-foreground shadow-card",
      )}
    >
      <Icon className={cn("size-[18px]", active && "text-primary")} aria-hidden />
      {label}
    </Link>
  );
}
