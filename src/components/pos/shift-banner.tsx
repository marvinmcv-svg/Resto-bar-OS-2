"use client";

import { Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/modules/pos/store";

/** Toast's "Shift at a Glance": the manager's pre-shift note, shown once per person. */
export function ShiftBanner() {
  const { state, dispatch, me, staffById, itemById } = useStore();
  const note = state.shiftNote;
  if (!note || !me || state.shiftNoteSeenBy.includes(me.id)) return null;
  const out = state.unavailable.map((id) => itemById(id)?.name).filter(Boolean);
  const at = new Date(note.at).toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  return (
    <section
      className="animate-enter mx-auto mb-5 flex max-w-[980px] items-start gap-3.5 rounded-[20px] border border-primary/35 bg-primary/10 p-4"
      aria-label="Nota del turno"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-primary text-primary-foreground">
        <Megaphone className="size-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-semibold tracking-wide text-primary uppercase">
          Nota del turno · {staffById(note.by)?.name} · {at}
        </p>
        <p className="mt-1 text-[15px] leading-snug">{note.text}</p>
        {out.length > 0 && <p className="mt-1.5 text-[13px] text-muted-foreground">Agotado hoy: {out.join(", ")}</p>}
      </div>
      <Button size="sm" variant="secondary" onClick={() => dispatch({ type: "seenShiftNote", staffId: me.id })}>
        Entendido
      </Button>
    </section>
  );
}
