"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROLE_LABEL } from "@/modules/pos/permissions";
import { useStore } from "@/modules/pos/store";
import { cn } from "@/lib/utils";
import type { Role } from "@/modules/pos/types";
import { areasFor } from "./areas";
import { ROLE_TINT } from "./role-tint";

export function Avatar({ name, role, className }: { name: string; role: Role; className?: string }) {
  return (
    <span
      className={cn("grid size-9 shrink-0 place-items-center rounded-full text-[13px] font-semibold", ROLE_TINT[role], className)}
      aria-hidden
    >
      {name[0]}
    </span>
  );
}

/** Signed-in person, the areas their role can open, and "Cambiar de usuario". */
export function UserMenu({ compact = false, align = "end" }: { compact?: boolean; align?: "start" | "end" }) {
  const { me, dispatch } = useStore();
  const router = useRouter();
  if (!me) return null;
  const areas = areasFor(me.role);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "press flex h-11 items-center gap-2.5 rounded-full bg-secondary py-1 pl-1 text-left",
            compact ? "pr-1" : "pr-3.5",
          )}
          aria-label={`${me.name}, ${ROLE_LABEL[me.role]}. Menú de usuario`}
        >
          <Avatar name={me.name} role={me.role} />
          {!compact && (
            <span className="hidden leading-tight sm:block">
              <span className="block text-[13px] font-semibold">{me.name}</span>
              <span className="block text-[11px] text-muted-foreground">{ROLE_LABEL[me.role]}</span>
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-60 rounded-2xl p-1.5">
        <DropdownMenuLabel className="flex items-center gap-2.5 py-2">
          <Avatar name={me.name} role={me.role} className="size-8" />
          <span className="leading-tight">
            <span className="block text-[13px] font-semibold">{me.name}</span>
            <span className="block text-xs font-normal text-muted-foreground">{ROLE_LABEL[me.role]}</span>
          </span>
        </DropdownMenuLabel>
        {areas.length > 1 && <DropdownMenuSeparator />}
        {areas.length > 1 &&
          areas.map(({ href, label, icon: Icon }) => (
            <DropdownMenuItem key={href} asChild className="rounded-xl py-2">
              <Link href={href}>
                <Icon /> {label}
              </Link>
            </DropdownMenuItem>
          ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="rounded-xl py-2"
          onSelect={() => {
            dispatch({ type: "signOut" });
            router.push("/entrar");
          }}
        >
          <LogOut /> Cambiar de usuario
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
