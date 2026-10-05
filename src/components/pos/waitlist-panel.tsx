"use client";

import { useState } from "react";
import { Minus, Plus, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { ChipSelect, Field, TextInput } from "@/components/app/form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TABLES } from "@/modules/pos/demo-data";
import { newId, useNow, useStore } from "@/modules/pos/store";
import type { DiningTable, WaitlistEntry } from "@/modules/pos/types";
import { cn } from "@/lib/utils";

/** Waitlist on the floor plan: add a party, quote a wait, seat them at a free table that fits. */
export function WaitlistPanel({ onSeated }: { onSeated: (tableId: string) => void }) {
  const { state, dispatch, orderForTable, openTable } = useStore();
  const now = useNow(30000);
  const [adding, setAdding] = useState(false);
  const [seating, setSeating] = useState<WaitlistEntry | null>(null);

  const free = TABLES.filter((t) => !orderForTable(t.id));
  const fits = (party: number) => free.filter((t) => t.seats >= party).sort((a, b) => a.seats - b.seats);

  const seat = (entry: WaitlistEntry, t: DiningTable) => {
    openTable(t.id, entry.party);
    dispatch({ type: "setTableNote", tableId: t.id, note: { ...(state.tableNotes[t.id] ?? {}), name: entry.name } });
    dispatch({ type: "removeWaitlist", id: entry.id });
    setSeating(null);
    toast.success(`${entry.name} en la mesa ${t.label}`);
    onSeated(t.id);
  };

  return (
    <section aria-labelledby="waitlist-title">
      <div className="flex items-center justify-between">
        <h2 id="waitlist-title" className="text-[15px] font-semibold">
          Lista de espera <span className="text-muted-foreground tabular">{state.waitlist.length || ""}</span>
        </h2>
        <Button size="sm" variant="secondary" onClick={() => setAdding(true)}>
          <UserPlus /> Agregar
        </Button>
      </div>
      {state.waitlist.length === 0 ? (
        <p className="mt-3 rounded-2xl border border-dashed p-4 text-center text-[13px] text-muted-foreground">Nadie esperando.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {state.waitlist.map((w) => {
            const waited = Math.floor((now - w.addedAt) / 60000);
            const over = waited > w.quotedMin;
            const options = fits(w.party);
            return (
              <li key={w.id} className="flex items-center gap-3 rounded-2xl bg-card p-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary text-[13px] font-semibold">
                  <span className="flex items-center gap-0.5 tabular">
                    <Users className="size-3.5" aria-hidden />
                    {w.party}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-semibold">{w.name}</span>
                  <span className={cn("block text-xs tabular", over ? "text-status-critical" : "text-muted-foreground")}>
                    Esperando {waited} de {w.quotedMin} min
                  </span>
                </span>
                <Button size="sm" disabled={options.length === 0} onClick={() => setSeating(w)}>
                  {options.length ? "Sentar" : "Sin mesa"}
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <AddPartyDialog
        open={adding}
        onClose={() => setAdding(false)}
        onAdd={(e) => {
          dispatch({ type: "addWaitlist", entry: e });
          setAdding(false);
          toast(`${e.name} en lista de espera`, { description: `${e.party} personas · ~${e.quotedMin} min` });
        }}
      />

      <Dialog open={!!seating} onOpenChange={(v) => !v && setSeating(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl">Sentar a {seating?.name}</DialogTitle>
            <DialogDescription>{seating?.party} personas. Mesas libres donde entran:</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-2">
            {seating &&
              fits(seating.party).map((t) => (
                <Button key={t.id} variant="secondary" className="h-16 flex-col gap-0.5" onClick={() => seat(seating, t)}>
                  <span className="text-lg font-semibold">{t.zone === "salon" ? `Mesa ${t.label}` : t.label}</span>
                  <span className="text-[11px] text-muted-foreground">{t.seats} pers.</span>
                </Button>
              ))}
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                if (seating) dispatch({ type: "removeWaitlist", id: seating.id });
                setSeating(null);
              }}
            >
              Se fueron, quitar de la lista
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function AddPartyDialog({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (e: WaitlistEntry) => void }) {
  const [name, setName] = useState("");
  const [party, setParty] = useState(2);
  const [quote, setQuote] = useState("15");
  const [tried, setTried] = useState(false);
  const reset = () => {
    setName("");
    setParty(2);
    setQuote("15");
    setTried(false);
  };
  return (
    <Dialog open={open} onOpenChange={(v) => !v && (reset(), onClose())}>
      <DialogContent className="sm:max-w-sm">
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            setTried(true);
            if (!name.trim()) return;
            onAdd({ id: newId(), name: name.trim(), party, addedAt: Date.now(), quotedMin: Number(quote) });
            reset();
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-xl">Agregar a la espera</DialogTitle>
          </DialogHeader>
          <Field label="Nombre" error={tried && !name.trim() ? "¿A nombre de quién?" : undefined}>
            {(p) => <TextInput {...p} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Gabriela" autoFocus autoComplete="off" />}
          </Field>
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold">Personas</span>
            <span className="flex items-center gap-3">
              <Button type="button" variant="secondary" size="icon" aria-label="Menos" onClick={() => setParty((p) => Math.max(1, p - 1))}>
                <Minus />
              </Button>
              <span className="w-8 text-center text-2xl font-semibold tabular" aria-live="polite">{party}</span>
              <Button type="button" variant="secondary" size="icon" aria-label="Más" onClick={() => setParty((p) => Math.min(20, p + 1))}>
                <Plus />
              </Button>
            </span>
          </div>
          <div className="space-y-1.5">
            <p className="text-[13px] font-semibold">Tiempo de espera que le dices</p>
            <ChipSelect
              label="Tiempo de espera"
              value={quote}
              onChange={setQuote}
              options={["5", "10", "15", "20", "30", "45"].map((m) => ({ value: m, label: `${m} min` }))}
            />
          </div>
          <DialogFooter>
            <Button type="submit" size="lg" className="w-full">
              Agregar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
