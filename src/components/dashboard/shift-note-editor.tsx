"use client";

import { useState } from "react";
import { Megaphone } from "lucide-react";
import { toast } from "sonner";
import { Panel, PanelHeader } from "@/components/app/panel";
import { TextArea } from "@/components/app/form";
import { Button } from "@/components/ui/button";
import { useStore } from "@/modules/pos/store";

/** Manager writes the pre-shift note; it shows on every POS device at sign-in. */
export function ShiftNoteEditor({ className }: { className?: string }) {
  const { state, dispatch, me, staffById } = useStore();
  const [text, setText] = useState(state.shiftNote?.text ?? "");
  const note = state.shiftNote;
  const seen = state.shiftNoteSeenBy.map((id) => staffById(id)?.name).filter(Boolean);
  const dirty = text.trim() !== (note?.text ?? "");

  return (
    <Panel className={className}>
      <PanelHeader
        title="Nota del turno"
        subtitle="Aparece en la caja y en los celulares de tu equipo al entrar."
        action={<Megaphone className="size-5 text-primary" aria-hidden />}
      />
      <label className="sr-only" htmlFor="shift-note">Nota del turno</label>
      <TextArea
        id="shift-note"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Ej. Hoy recomendar el pique para compartir. Mesa 7 reservada a las 21:00."
        className="min-h-24"
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[12.5px] text-muted-foreground">
          {note ? (seen.length ? `Leída por ${seen.join(", ")}` : "Nadie la leyó todavía") : "Sin nota para hoy"}
        </p>
        <div className="flex gap-2">
          {note && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                dispatch({ type: "setShiftNote", note: null });
                setText("");
              }}
            >
              Quitar
            </Button>
          )}
          <Button
            size="sm"
            disabled={!dirty || !text.trim() || !me}
            onClick={() => {
              if (!me) return;
              dispatch({ type: "setShiftNote", note: { text: text.trim(), by: me.id, at: Date.now() } });
              toast.success("Nota publicada", { description: "Tu equipo la verá al entrar." });
            }}
          >
            Publicar
          </Button>
        </div>
      </div>
    </Panel>
  );
}
