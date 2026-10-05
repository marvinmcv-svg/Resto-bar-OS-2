"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Clock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { attendanceFor, dateKey } from "@/modules/hr/time";
import { toast } from "sonner";
import { LogoMark } from "@/components/brand/logo";
import { ROLE_TINT } from "@/components/app/role-tint";
import { PinPad } from "@/components/pos/pin-pad";
import { InstallPrompt } from "@/components/app/pwa";
import { RESTAURANT } from "@/modules/pos/demo-data";
import { can, homeFor, ROLE_LABEL, ROLES } from "@/modules/pos/permissions";
import { newId, useNow, useStore } from "@/modules/pos/store";
import type { Staff } from "@/modules/pos/types";
import { cn } from "@/lib/utils";

/** Device sign-in: pick yourself, enter your PIN, land on your role's home screen. */
export default function EntrarPage() {
  const { state, dispatch } = useStore();
  const router = useRouter();
  const now = useNow(15000);
  const [who, setWho] = useState<Staff | null>(null);
  const [clockFor, setClockFor] = useState<Staff | null>(null);

  const order = (s: Staff) => ROLES.indexOf(s.role);
  const team = state.staff.filter((s) => s.active !== false && s.role !== "admin").sort((a, b) => order(a) - order(b));
  const platform = state.staff.filter((s) => s.active !== false && s.role === "admin");

  const signIn = (pin: string) => {
    if (!who || pin !== who.pin) return false;
    dispatch({ type: "signIn", staffId: who.id });
    const clocked = state.timeEntries.some((e) => e.staffId === who.id && !e.outAt);
    if (can(who.role, "time.clock") && !clocked) {
      setClockFor(who);
      return true;
    }
    toast.success(`Hola, ${who.name}`, { description: ROLE_LABEL[who.role] });
    router.push(homeFor(who.role));
    return true;
  };

  const finishClock = (clockIn: boolean) => {
    if (!clockFor) return;
    if (clockIn) {
      const at = Date.now();
      dispatch({ type: "clockIn", entry: { id: newId(), staffId: clockFor.id, inAt: at } });
      toast.success(`Entrada marcada a las ${new Date(at).toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" })}`, {
        description: `Buen turno, ${clockFor.name}`,
      });
    }
    router.push(homeFor(clockFor.role));
  };

  const todayShift = clockFor ? state.schedule.find((s) => s.staffId === clockFor.id && s.date === dateKey(new Date(now))) : undefined;
  const wouldBe = todayShift ? attendanceFor(todayShift, [{ id: "x", staffId: todayShift.staffId, inAt: now }], now) : null;

  return (
    <main className="dark relative min-h-dvh overflow-hidden bg-background text-foreground">
      {/* Soft ember glow behind the content, like a lock screen. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 size-[720px] -translate-x-1/2 rounded-full bg-primary/20 blur-[140px]"
      />
      <div className="relative mx-auto flex min-h-dvh max-w-[880px] flex-col px-4 py-8 sm:px-8">
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5" aria-label="RestoBar OS, inicio">
            <LogoMark className="size-10" />
            <span className="leading-tight">
              <span className="block text-[15px] font-semibold">RestoBar OS</span>
              <span className="block text-xs text-muted-foreground">{RESTAURANT.name} · {RESTAURANT.location}</span>
            </span>
          </Link>
          <time className="text-[15px] font-semibold tabular text-muted-foreground" suppressHydrationWarning>
            {new Date(now).toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" })}
          </time>
        </header>

        {clockFor ? (
          <section className="animate-enter mx-auto my-auto w-full max-w-[380px] py-10 text-center" aria-labelledby="clock-title">
            <span className={cn("mx-auto grid size-20 place-items-center rounded-full text-[30px] font-semibold", ROLE_TINT[clockFor.role])}>
              {clockFor.name[0]}
            </span>
            <h1 id="clock-title" className="mt-4 text-[26px] font-semibold">Hola, {clockFor.name}</h1>
            <p className="mt-1 text-[15px] text-muted-foreground">
              {todayShift ? `Tu turno de hoy: ${todayShift.start}–${todayShift.end}` : "Hoy no tienes turno programado."}
            </p>
            <p className="mt-6 text-[56px] leading-none font-semibold tracking-[-0.04em] tabular" suppressHydrationWarning>
              {new Date(now).toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" })}
            </p>
            {wouldBe?.kind === "late" && (
              <p className="mt-3 inline-block rounded-full bg-status-warning/18 px-3 py-1 text-[13px] font-semibold text-status-warning-ink">
                {wouldBe.minutesLate} min tarde
              </p>
            )}
            <Button size="xl" className="mt-8 w-full" onClick={() => finishClock(true)}>
              <Clock /> Marcar entrada
            </Button>
            <Button size="lg" variant="ghost" className="mt-2 w-full text-muted-foreground" onClick={() => finishClock(false)}>
              Ahora no
            </Button>
          </section>
        ) : !who ? (
          <section className="animate-enter my-auto py-10" aria-labelledby="who">
            <h1 id="who" className="text-center text-[30px] font-semibold tracking-[-0.02em] sm:text-[40px]">
              ¿Quién está entrando?
            </h1>
            <p className="mt-2 text-center text-[15px] text-muted-foreground">
              Cada persona entra con su PIN. Cada rol ve solo lo que le toca.
            </p>
            <ul className="mt-9 flex flex-wrap justify-center gap-3">
              {team.map((s) => (
                <li key={s.id} className="w-[calc(50%-6px)] sm:w-[calc(25%-9px)]">
                  <PersonButton staff={s} onClick={() => setWho(s)} />
                </li>
              ))}
            </ul>
            {platform.length > 0 && (
              <>
                <p className="mt-9 mb-3 text-center text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                  Equipo RestoBar OS
                </p>
                <ul className="mx-auto grid max-w-[220px] gap-3">
                  {platform.map((s) => (
                    <li key={s.id}>
                      <PersonButton staff={s} onClick={() => setWho(s)} />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        ) : (
          <section className="animate-enter mx-auto my-auto w-full max-w-[340px] py-10" aria-labelledby="pin-title">
            <button
              onClick={() => setWho(null)}
              className="press mb-6 flex h-10 items-center gap-1.5 rounded-full px-3 text-[14px] font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <ArrowLeft className="size-4" aria-hidden /> Volver
            </button>
            <div className="flex flex-col items-center text-center">
              <span className={cn("grid size-20 place-items-center rounded-full text-[30px] font-semibold", ROLE_TINT[who.role])}>
                {who.name[0]}
              </span>
              <h1 id="pin-title" className="mt-4 text-[24px] font-semibold">{who.name}</h1>
              <p className="text-[14px] text-muted-foreground">{ROLE_LABEL[who.role]}</p>
            </div>
            <PinPad
              className="mt-7"
              resetKey={who.id}
              hint={<>Ingresa tu PIN · demo: <span className="font-semibold text-foreground tabular">{who.pin}</span></>}
              onComplete={signIn}
            />
          </section>
        )}

        {!who && !clockFor && <InstallPrompt className="mx-auto mb-5 w-full max-w-md" />}
        <footer className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5" aria-hidden />
          Los permisos también se validan en la base de datos, no solo en la pantalla.
        </footer>
      </div>
    </main>
  );
}

function PersonButton({ staff, onClick }: { staff: Staff; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="press group flex w-full flex-col items-center gap-3 rounded-[22px] border bg-card/60 px-3 py-5 backdrop-blur-xl hover:border-primary/50 hover:bg-card"
      aria-label={`${staff.name}, ${ROLE_LABEL[staff.role]}`}
    >
      <span className={cn("grid size-14 place-items-center rounded-full text-[22px] font-semibold", ROLE_TINT[staff.role])}>
        {staff.name[0]}
      </span>
      <span className="leading-tight">
        <span className="block text-[15px] font-semibold">{staff.name}</span>
        <span className="mt-0.5 block text-[12px] text-muted-foreground">{ROLE_LABEL[staff.role]}</span>
      </span>
    </button>
  );
}
