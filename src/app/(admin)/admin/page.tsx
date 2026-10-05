"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Building2, CalendarClock, CircleCheck, Plus, Wallet, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { Field, TextInput } from "@/components/app/form";
import { Panel, PanelHeader } from "@/components/app/panel";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { FOUNDER_SEATS, type ClientRestaurant } from "@/modules/pos/demo-data";
import { formatBs, toMinor } from "@/modules/pos/money";
import { newId, useStore } from "@/modules/pos/store";
import { cn } from "@/lib/utils";

const GOAL = 20;

const STATUS: Record<ClientRestaurant["status"], { label: string; className: string }> = {
  activo: { label: "Pagando", className: "bg-status-good/14 text-status-good-ink" },
  prueba: { label: "Primeros 30 días", className: "bg-status-info/12 text-status-info" },
  instalacion: { label: "Instalación agendada", className: "bg-status-warning/18 text-status-warning-ink" },
};

function syncLabel(min?: number) {
  if (min === undefined) return "Aún sin instalar";
  if (min <= 1) return "En línea ahora";
  return `Conectado hace ${min} min`;
}

const dateLabel = (iso?: string) =>
  iso ? new Date(`${iso}T12:00:00`).toLocaleDateString("es-BO", { day: "numeric", month: "short" }) : "—";

export default function AdminPage() {
  const { state, me } = useStore();
  const [adding, setAdding] = useState(false);
  const clients = state.clients;
  const paying = clients.filter((c) => c.status === "activo");
  const mrr = paying.reduce((s, c) => s + c.monthlyMinor, 0);
  const seatsLeft = Math.max(0, FOUNDER_SEATS - clients.length);
  const progress = Math.min(1, paying.length / GOAL);

  return (
    <div className="mx-auto max-w-[1180px] px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
      <header className="animate-enter flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-muted-foreground">Plataforma RestoBar OS</p>
          <h1 className="mt-1 text-[28px] font-semibold sm:text-[34px]">Hola, {me?.name}</h1>
          <p className="mt-2 max-w-xl text-[15px] text-muted-foreground">
            Todos tus restaurantes clientes en un lugar: quién paga, quién está por instalarse y quién está en línea.
          </p>
        </div>
        <Button size="lg" onClick={() => setAdding(true)}>
          <Plus /> Nuevo restaurante
        </Button>
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Wallet} label="Ingreso mensual" value={formatBs(mrr)} note={`${paying.length} ${paying.length === 1 ? "local pagando" : "locales pagando"}`} />
        <Stat icon={Building2} label="Clientes" value={String(clients.length)} note={`${clients.filter((c) => c.status === "prueba").length} en sus primeros 30 días`} />
        <Stat icon={CalendarClock} label="Instalaciones" value={String(clients.filter((c) => c.status === "instalacion").length)} note="Agendadas" />
        <Stat icon={CircleCheck} label="Lugares fundador" value={`${seatsLeft} de ${FOUNDER_SEATS}`} note="Disponibles a Bs 350" />
      </div>

      <Panel className="animate-enter mt-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-[15px] font-semibold">Meta 2026: {GOAL} locales pagando</h2>
          <p className="text-[13px] text-muted-foreground tabular">
            {paying.length} de {GOAL} · faltan {GOAL - paying.length} al 31 de diciembre
          </p>
        </div>
        <div
          className="mt-3 h-2.5 overflow-hidden rounded-full bg-secondary"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={GOAL}
          aria-valuenow={paying.length}
          aria-label="Locales pagando"
        >
          <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${progress * 100}%` }} />
        </div>
      </Panel>

      <Panel className="animate-enter mt-4 p-2 sm:p-2">
        <div className="px-4 pt-3">
          <PanelHeader title="Restaurantes" subtitle="Plan Fundador · Bs 350/mes · sin contrato" />
        </div>
        <ul className="divide-y">
          {clients.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5">
              <span className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-ember-soft text-[16px] font-semibold text-primary">
                {c.name[0]}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold">{c.name}</span>
                <span className="block truncate text-[13px] text-muted-foreground">
                  {c.area} · {c.owner} · {c.tables} mesas
                </span>
              </span>
              <span className={cn("inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium", STATUS[c.status].className)}>
                {STATUS[c.status].label}
              </span>
              <span className="w-[190px] text-[13px] text-muted-foreground max-sm:hidden">
                <span className="flex items-center gap-1.5">
                  <span
                    className={cn("size-2 rounded-full", c.lastSyncMinAgo === undefined ? "bg-muted-foreground/40" : c.lastSyncMinAgo <= 5 ? "bg-status-good" : "bg-status-warning")}
                    aria-hidden
                  />
                  {syncLabel(c.lastSyncMinAgo)}
                </span>
                <span className="block text-[12px]">Instalación: {dateLabel(c.installedOn)}</span>
              </span>
              <span className="w-[86px] text-right text-[14px] font-medium tabular">{formatBs(c.monthlyMinor)}</span>
              {c.id === "c-casona" ? (
                <Button asChild variant="outline" size="sm">
                  <Link href="/resumen">
                    Ver local <ArrowUpRight />
                  </Link>
                </Button>
              ) : (
                <span className="w-[92px] max-sm:hidden" aria-hidden />
              )}
            </li>
          ))}
        </ul>
      </Panel>

      <NewClientSheet open={adding} onClose={() => setAdding(false)} />
    </div>
  );
}

function Stat({ icon: Icon, label, value, note }: { icon: LucideIcon; label: string; value: string; note: string }) {
  return (
    <section className="animate-enter rounded-[22px] border bg-card p-5 shadow-card">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-[12px] bg-ember-soft text-primary">
          <Icon className="size-5" aria-hidden />
        </span>
        <h2 className="text-[13px] font-medium text-muted-foreground">{label}</h2>
      </div>
      <p className="mt-4 text-[28px] leading-none font-semibold tracking-[-0.025em] tabular">{value}</p>
      <p className="mt-2 text-[12.5px] font-medium text-muted-foreground">{note}</p>
    </section>
  );
}

function NewClientSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { dispatch } = useStore();
  const [f, setF] = useState({ name: "", area: "", owner: "", whatsapp: "", installedOn: "", tables: "" });
  const [tried, setTried] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const errors = {
    name: !f.name.trim() ? "Escribe el nombre del local." : undefined,
    owner: !f.owner.trim() ? "¿Quién es el dueño?" : undefined,
    whatsapp: !/^\+?[\d\s]{8,15}$/.test(f.whatsapp.trim()) ? "Número de WhatsApp, ej. +591 70000000." : undefined,
    installedOn: !f.installedOn ? "Elige la fecha de instalación." : undefined,
  };
  const close = () => {
    setF({ name: "", area: "", owner: "", whatsapp: "", installedOn: "", tables: "" });
    setTried(false);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && close()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-[440px]">
        <SheetHeader className="border-b px-6 pt-6 pb-4">
          <SheetTitle className="text-[20px]">Nuevo restaurante</SheetTitle>
          <SheetDescription>Precio fundador Bs 350/mes. El primer mes se paga el día de la instalación.</SheetDescription>
        </SheetHeader>
        <form
          id="client-form"
          className="flex-1 space-y-4 overflow-y-auto px-6 py-5"
          onSubmit={(e) => {
            e.preventDefault();
            setTried(true);
            if (Object.values(errors).some(Boolean)) return;
            dispatch({
              type: "addClient",
              client: {
                id: newId(), name: f.name.trim(), area: f.area.trim() || "Santa Cruz", status: "instalacion", plan: "fundador",
                monthlyMinor: toMinor(350), installedOn: f.installedOn, owner: f.owner.trim(), whatsapp: f.whatsapp.trim(),
                tables: Number(f.tables) || 0,
              },
            });
            toast.success(`${f.name.trim()} agregado`, { description: "Instalación agendada." });
            close();
          }}
        >
          <Field label="Nombre del local" error={tried ? errors.name : undefined}>
            {(p) => <TextInput {...p} value={f.name} onChange={set("name")} placeholder="Ej. Pub El Cuarto" />}
          </Field>
          <Field label="Zona" hint="Opcional">
            {(p) => <TextInput {...p} value={f.area} onChange={set("area")} placeholder="Ej. Equipetrol" />}
          </Field>
          <Field label="Dueño" error={tried ? errors.owner : undefined}>
            {(p) => <TextInput {...p} value={f.owner} onChange={set("owner")} placeholder="Nombre" />}
          </Field>
          <Field label="WhatsApp del dueño" error={tried ? errors.whatsapp : undefined} hint="Ahí llega el cierre del día.">
            {(p) => <TextInput {...p} value={f.whatsapp} onChange={set("whatsapp")} inputMode="tel" placeholder="+591 70000000" />}
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Instalación" error={tried ? errors.installedOn : undefined}>
              {(p) => <TextInput {...p} type="date" value={f.installedOn} onChange={set("installedOn")} />}
            </Field>
            <Field label="Mesas" hint="Opcional">
              {(p) => <TextInput {...p} value={f.tables} onChange={set("tables")} inputMode="numeric" placeholder="12" />}
            </Field>
          </div>
        </form>
        <div className="flex justify-end gap-2 border-t px-6 py-4">
          <Button type="button" variant="outline" onClick={close}>
            Cancelar
          </Button>
          <Button type="submit" form="client-form">
            Agregar restaurante
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
