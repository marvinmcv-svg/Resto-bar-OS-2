"use client";

import { useEffect, useState } from "react";
import { Check, ChevronRight, KeyRound, Minus, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { ChipSelect, Field, TextInput } from "@/components/app/form";
import { Panel, PanelHeader } from "@/components/app/panel";
import { ROLE_DOT, ROLE_TINT } from "@/components/app/role-tint";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatBs } from "@/modules/pos/money";
import {
  assignableRoles, can, PERMISSION_LABEL, PERMISSIONS, ROLE_LABEL, ROLE_SUMMARY,
} from "@/modules/pos/permissions";
import { newId, useStore } from "@/modules/pos/store";
import type { Role, Staff } from "@/modules/pos/types";
import { cn } from "@/lib/utils";

const TEAM_ROLES: Role[] = ["owner", "manager", "cashier", "waiter", "bartender", "kitchen"];

export default function EquipoPage() {
  const { state, me } = useStore();
  const [editing, setEditing] = useState<Staff | "new" | null>(null);
  if (!me) return null;

  const assignable = assignableRoles(me.role);
  const team = state.staff.filter((s) => s.role !== "admin");
  const active = team.filter((s) => s.active !== false);
  const inactive = team.filter((s) => s.active === false);

  const salesBy = (id: string) => state.history.filter((o) => o.waiterId === id);

  return (
    <div className="mx-auto max-w-[1080px] px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
      <header className="animate-enter flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[13px] font-medium text-muted-foreground">{active.length} personas activas</p>
          <h1 className="mt-1 text-[28px] font-semibold sm:text-[34px]">Equipo y permisos</h1>
          <p className="mt-2 max-w-xl text-[15px] text-muted-foreground">
            Cada persona entra con su PIN y ve solo lo que su rol permite. Los permisos se validan también en la base de datos.
          </p>
        </div>
        <Button size="lg" onClick={() => setEditing("new")}>
          <UserPlus /> Agregar persona
        </Button>
      </header>

      <div className="mt-8 grid gap-4 xl:grid-cols-12">
        <Panel className="animate-enter p-2 sm:p-2 xl:col-span-7">
          <ul className="divide-y">
            {active.map((s) => {
              const orders = salesBy(s.id);
              const total = orders.reduce((sum, o) => sum + o.totalMinor, 0);
              const editable = assignable.includes(s.role) && s.id !== me.id;
              return (
                <li key={s.id}>
                  <button
                    disabled={!editable}
                    onClick={() => setEditing(s)}
                    className="press flex w-full items-center gap-3.5 rounded-[14px] px-4 py-3 text-left enabled:hover:bg-accent disabled:cursor-default"
                    aria-label={editable ? `Editar ${s.name}` : `${s.name}, ${ROLE_LABEL[s.role]}`}
                  >
                    <span className={cn("grid size-11 shrink-0 place-items-center rounded-full text-[16px] font-semibold", ROLE_TINT[s.role])}>
                      {s.name[0]}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-[15px] font-semibold">{s.name}</span>
                        {s.id === me.id && <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium">Tú</span>}
                      </span>
                      <span className="block truncate text-[13px] text-muted-foreground">
                        {ROLE_LABEL[s.role]}
                        {orders.length > 0 && ` · ${orders.length} cuentas hoy · ${formatBs(total)}`}
                      </span>
                    </span>
                    {editable && <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />}
                  </button>
                </li>
              );
            })}
          </ul>
          {inactive.length > 0 && (
            <div className="border-t px-4 pt-3 pb-2">
              <p className="text-[13px] font-semibold text-muted-foreground">Desactivados</p>
              <ul className="mt-1">
                {inactive.map((s) => (
                  <li key={s.id} className="flex items-center gap-3 py-2">
                    <span className="grid size-8 place-items-center rounded-full bg-secondary text-[13px] font-semibold text-muted-foreground">
                      {s.name[0]}
                    </span>
                    <span className="flex-1 text-[14px] text-muted-foreground">
                      {s.name} · {ROLE_LABEL[s.role]}
                    </span>
                    {assignable.includes(s.role) && (
                      <Button variant="outline" size="sm" onClick={() => setEditing(s)}>
                        Ver
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Panel>

        <Panel className="animate-enter xl:col-span-5">
          <PanelHeader title="Qué puede hacer cada rol" subtitle="Toca una persona para cambiar su rol o PIN." />
          <ul className="space-y-3.5">
            {TEAM_ROLES.map((r) => (
              <li key={r} className="flex gap-3">
                <span className={cn("mt-0.5 size-2.5 shrink-0 rounded-full", ROLE_DOT[r])} aria-hidden />
                <span>
                  <span className="block text-[14px] font-semibold">{ROLE_LABEL[r]}</span>
                  <span className="block text-[13px] leading-relaxed text-muted-foreground">{ROLE_SUMMARY[r]}</span>
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel className="animate-enter overflow-hidden p-0 sm:p-0 xl:col-span-12">
          <div className="px-5 pt-5 sm:px-6">
            <PanelHeader title="Permisos por rol" subtitle="La misma matriz protege la base de datos (ADR-010)." />
          </div>
          <div className="overflow-x-auto pb-2">
            <table className="w-full min-w-[720px] text-[13px]">
              <thead>
                <tr className="text-muted-foreground">
                  <th scope="col" className="px-6 py-2 text-left font-medium">Permiso</th>
                  {TEAM_ROLES.map((r) => (
                    <th key={r} scope="col" className="px-2 py-2 text-center font-medium">
                      {ROLE_LABEL[r]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSIONS.filter((p) => p !== "tenants.manage").map((p) => (
                  <tr key={p} className="border-t">
                    <th scope="row" className="px-6 py-2.5 text-left font-medium">
                      {PERMISSION_LABEL[p]}
                    </th>
                    {TEAM_ROLES.map((r) => (
                      <td key={r} className="px-2 py-2.5 text-center">
                        {can(r, p) ? (
                          <Check className="mx-auto size-4 text-status-good" aria-label="Sí" />
                        ) : (
                          <Minus className="mx-auto size-4 text-muted-foreground/50" aria-label="No" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <StaffSheet staff={editing} roles={assignable} onClose={() => setEditing(null)} />
    </div>
  );
}

function StaffSheet({ staff, roles, onClose }: { staff: Staff | "new" | null; roles: Role[]; onClose: () => void }) {
  const { state, dispatch, me } = useStore();
  const editing = staff && staff !== "new" ? staff : null;
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("waiter");
  const [pin, setPin] = useState("");
  const [tried, setTried] = useState(false);

  useEffect(() => {
    if (!staff) return;
    setTried(false);
    setName(editing?.name ?? "");
    setRole(editing?.role ?? "waiter");
    setPin(editing?.pin ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when a different person opens
  }, [staff]);

  const nameError = !name.trim() ? "Escribe el nombre." : undefined;
  const pinError = !/^\d{4}$/.test(pin)
    ? "El PIN tiene 4 números."
    : state.staff.some((s) => s.active !== false && s.id !== editing?.id && s.pin === pin)
      ? "Ese PIN ya lo usa otra persona."
      : undefined;

  const save = () => {
    setTried(true);
    if (nameError || pinError) return;
    dispatch({
      type: "upsertStaff",
      staff: { id: editing?.id ?? newId(), name: name.trim(), role, pin, active: editing?.active ?? true },
    });
    toast.success(editing ? `${name.trim()} actualizado` : `${name.trim()} ya puede entrar con su PIN`);
    onClose();
  };

  const suggestPin = () => {
    const used = new Set(state.staff.map((s) => s.pin));
    let p = "";
    do p = String(Math.floor(1000 + Math.random() * 9000));
    while (used.has(p));
    setPin(p);
  };

  return (
    <Sheet open={!!staff} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-[440px]">
        <SheetHeader className="border-b px-6 pt-6 pb-4">
          <SheetTitle className="text-[20px]">{editing ? editing.name : "Agregar persona"}</SheetTitle>
          <SheetDescription>
            {editing ? "Cambia su rol o su PIN. Los cambios valen desde su próximo ingreso." : "Entrará en cualquier dispositivo del local con su PIN."}
          </SheetDescription>
        </SheetHeader>
        <form
          id="staff-editor"
          className="flex-1 space-y-5 overflow-y-auto px-6 py-5"
          onSubmit={(e) => {
            e.preventDefault();
            save();
          }}
        >
          <Field label="Nombre" error={tried ? nameError : undefined}>
            {(p) => <TextInput {...p} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Sofía" autoComplete="off" />}
          </Field>
          <div className="space-y-1.5">
            <p className="text-[13px] font-semibold">Rol</p>
            <ChipSelect label="Rol" value={role} onChange={setRole} options={roles.map((r) => ({ value: r, label: ROLE_LABEL[r] }))} />
            <p className="text-[12px] text-muted-foreground">{ROLE_SUMMARY[role]}</p>
          </div>
          <Field label="PIN de 4 números" error={tried ? pinError : undefined} hint="Personal. No lo compartas.">
            {(p) => (
              <div className="flex gap-2">
                <TextInput
                  {...p}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="0000"
                  className="tabular tracking-[0.3em]"
                />
                <Button type="button" variant="outline" className="h-11 shrink-0" onClick={suggestPin}>
                  <KeyRound /> Generar
                </Button>
              </div>
            )}
          </Field>
        </form>
        <div className="flex items-center gap-2 border-t px-6 py-4">
          {editing && editing.id !== me?.id && (
            <Button
              type="button"
              variant="ghost"
              className={editing.active === false ? "" : "text-status-critical hover:text-status-critical"}
              onClick={() => {
                const next = editing.active === false;
                dispatch({ type: "setStaffActive", staffId: editing.id, active: next });
                toast(next ? `${editing.name} reactivado` : `${editing.name} desactivado`, {
                  description: next ? undefined : "Ya no puede entrar. Su historial queda en los reportes.",
                });
                onClose();
              }}
            >
              {editing.active === false ? "Reactivar" : "Desactivar"}
            </Button>
          )}
          <span className="flex-1" />
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="staff-editor">
            {editing ? "Guardar" : "Agregar"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
