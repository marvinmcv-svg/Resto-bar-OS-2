"use client";

import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { STAFF } from "@/modules/pos/demo-data";
import { staffById, useNow, useStore } from "@/modules/pos/store";
import type { Role } from "@/modules/pos/types";

export const ROLE_LABEL: Record<Role, string> = { owner: "Dueño", manager: "Encargada", cashier: "Cajera", waiter: "Mesero/a" };

export function PosHeader({ children }: { children?: React.ReactNode }) {
  const { state, dispatch } = useStore();
  const now = useNow(15000);
  const me = staffById(state.staffId)!;
  return (
    <header className="glass sticky top-0 z-30 flex h-16 items-center gap-3 border-b px-3 sm:px-5">
      <Link href="/pos" className="flex items-center gap-2.5" aria-label="Salón">
        <LogoMark className="size-9" />
      </Link>
      <div className="flex min-w-0 flex-1 items-center gap-3">{children}</div>
      <time className="hidden text-[15px] font-semibold tabular sm:block" suppressHydrationWarning>
        {new Date(now).toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" })}
      </time>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="press flex h-11 items-center gap-2.5 rounded-full bg-secondary py-1 pr-3.5 pl-1 text-left">
            <span className="grid size-9 place-items-center rounded-full bg-primary text-[13px] font-semibold text-primary-foreground">
              {me.name[0]}
            </span>
            <span className="hidden leading-tight sm:block">
              <span className="block text-[13px] font-semibold">{me.name}</span>
              <span className="block text-[11px] text-muted-foreground">{ROLE_LABEL[me.role]}</span>
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 rounded-2xl p-1.5">
          <DropdownMenuLabel>Cambiar de usuario</DropdownMenuLabel>
          {STAFF.map((s) => (
            <DropdownMenuItem key={s.id} className="rounded-xl py-2" onSelect={() => dispatch({ type: "setStaff", staffId: s.id })}>
              <span className="grid size-7 place-items-center rounded-full bg-secondary text-xs font-semibold">{s.name[0]}</span>
              <span className="flex-1">{s.name}</span>
              <span className="text-xs text-muted-foreground">{ROLE_LABEL[s.role]}</span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild className="rounded-xl py-2">
            <Link href="/resumen">
              <LayoutGrid /> Ir al resumen del dueño
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
