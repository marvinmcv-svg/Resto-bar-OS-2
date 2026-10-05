"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { canAccess, homeFor, permissionFor, ROLE_LABEL } from "@/modules/pos/permissions";
import { useStore } from "@/modules/pos/store";

/**
 * Route guard for the demo PIN session. Signed out → /entrar. Wrong role → a clear "Sin acceso"
 * screen, never a blank page. The real enforcement is RLS (ADR-010); this is the UX layer.
 */
export function RequireRole({ children }: { children: React.ReactNode }) {
  const { me, dispatch } = useStore();
  const pathname = usePathname();
  const router = useRouter();

  const isPublic = permissionFor(pathname) === null;

  useEffect(() => {
    if (!me && !isPublic) router.replace("/entrar");
  }, [me, isPublic, router]);

  if (isPublic) return <>{children}</>;
  if (!me) return null;
  if (canAccess(me.role, pathname)) return <>{children}</>;

  return (
    <div className="grid min-h-[70dvh] place-items-center px-6">
      <div className="animate-enter max-w-sm text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-[18px] bg-secondary">
          <Lock className="size-6 text-muted-foreground" aria-hidden />
        </span>
        <h1 className="mt-5 text-[22px] font-semibold">Sin acceso a esta pantalla</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
          Tu rol es <strong className="font-semibold text-foreground">{ROLE_LABEL[me.role]}</strong>. Pide a tu encargado que
          entre con su PIN si necesitas hacer esto.
        </p>
        <div className="mt-6 flex justify-center gap-2.5">
          <Button asChild size="lg">
            <Link href={homeFor(me.role)}>Ir a mi inicio</Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              dispatch({ type: "signOut" });
              router.push("/entrar");
            }}
          >
            Cambiar de usuario
          </Button>
        </div>
      </div>
    </div>
  );
}
