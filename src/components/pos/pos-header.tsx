"use client";

import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";
import { UserMenu } from "@/components/app/user-menu";
import { useNow } from "@/modules/pos/store";

export function PosHeader({ children }: { children?: React.ReactNode }) {
  const now = useNow(15000);
  return (
    <header className="glass sticky top-0 z-30 flex h-16 items-center gap-3 border-b px-3 sm:px-5">
      <Link href="/pos" className="flex items-center gap-2.5 lg:hidden" aria-label="Salón">
        <LogoMark className="size-9" />
      </Link>
      <div className="flex min-w-0 flex-1 items-center gap-3">{children}</div>
      <time className="hidden text-[15px] font-semibold tabular sm:block" suppressHydrationWarning>
        {new Date(now).toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" })}
      </time>
      <UserMenu />
    </header>
  );
}
