"use client";

import { useState } from "react";
import { Check, Megaphone, MessageCircle, Send, Users } from "lucide-react";
import { toast } from "sonner";
import { ChipSelect, TextArea } from "@/components/app/form";
import { PageBody, PageHeader } from "@/components/app/page-header";
import { StatTile } from "@/components/app/stat-tile";
import { Button } from "@/components/ui/button";
import { audience, personalize, SEGMENT_LABEL, whatsappLink, type Segment } from "@/modules/guests/guests";
import { RESTAURANT } from "@/modules/pos/demo-data";
import { newId, useNow, useStore } from "@/modules/pos/store";
import { cn } from "@/lib/utils";

const TEMPLATES: { id: string; label: string; segment: Segment; text: string }[] = [
  { id: "cumple", label: "Cumpleaños", segment: "cumpleanos", text: `¡Feliz cumpleaños, {nombre}! En ${RESTAURANT.name} te invitamos un postre este mes. Muestra este mensaje al pedir.` },
  { id: "extrano", label: "Te extrañamos", segment: "inactivos", text: `Hola {nombre}, hace rato no te vemos por ${RESTAURANT.name}. Esta semana tu primer Chuflay va por la casa.` },
  { id: "vip", label: "Noche VIP", segment: "vip", text: `{nombre}, eres de la casa: el viernes reservamos mesas para clientes frecuentes con música en vivo. ¿Te guardamos una?` },
  { id: "volver", label: "Segunda visita", segment: "nuevos", text: `Gracias por venir a ${RESTAURANT.name}, {nombre}. En tu próxima visita te esperan unas papas de regalo.` },
];

/** WhatsApp campaigns to guests who opted in. Each message opens WhatsApp ready to send; nothing is sent automatically. */
export default function MarketingPage() {
  const { state, dispatch, me, staffById } = useStore();
  const now = useNow(60000);
  const [segment, setSegment] = useState<Segment>("cumpleanos");
  const [text, setText] = useState(TEMPLATES[0].text);
  const [sent, setSent] = useState<string[]>([]);
  const [prepared, setPrepared] = useState(false);

  const people = audience(state.guests, segment, now);
  const optedIn = state.guests.filter((g) => g.optIn && g.phone).length;
  const sample = people[0] ?? { name: "Gabriela" };

  return (
    <PageBody>
      <PageHeader
        eyebrow={`${optedIn} clientes aceptan promociones`}
        title="Marketing"
        description="Mensajes por WhatsApp a quien dijo que sí. Elige a quién, escribe una vez y envía con un toque por persona."
      />

      <div className="mt-7 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatTile icon={Users} label="Con permiso" value={String(optedIn)} note={`de ${state.guests.length} clientes`} />
        <StatTile icon={Megaphone} label="Campañas" value={String(state.campaigns.length)} />
        <StatTile icon={Send} label="Mensajes preparados" value={String(state.campaigns.reduce((s, c) => s + c.recipients, 0))} />
        <StatTile icon={MessageCircle} label="Canal" value="WhatsApp" note="Envío automático: próximamente" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <section className="space-y-5 rounded-[22px] border bg-card p-5 shadow-card xl:col-span-7" aria-label="Nueva campaña">
          <div>
            <h2 className="text-[15px] font-semibold">1. ¿A quién?</h2>
            <ChipSelect
              label="Segmento"
              className="mt-3"
              value={segment}
              onChange={(s) => {
                setSegment(s);
                setPrepared(false);
                setSent([]);
              }}
              options={(Object.keys(SEGMENT_LABEL) as Segment[]).map((s) => ({ value: s, label: `${SEGMENT_LABEL[s]} · ${audience(state.guests, s, now).length}` }))}
            />
          </div>
          <div>
            <h2 className="text-[15px] font-semibold">2. Mensaje</h2>
            <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Plantillas">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={text === t.text}
                  onClick={() => {
                    setText(t.text);
                    setSegment(t.segment);
                    setPrepared(false);
                    setSent([]);
                  }}
                  className={cn("press h-8 rounded-full border px-3 text-[12.5px] font-medium", text === t.text ? "border-primary bg-primary/12" : "bg-secondary text-muted-foreground")}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <label className="mt-3 block">
              <span className="sr-only">Mensaje</span>
              <TextArea value={text} onChange={(e) => setText(e.target.value)} className="min-h-28" />
            </label>
            <p className="mt-1.5 text-[12px] text-muted-foreground">{"{nombre}"} se reemplaza por el nombre de cada cliente.</p>
          </div>
          <div className="rounded-2xl bg-wa-surface p-4" aria-label="Vista previa">
            <p className="ml-auto max-w-[85%] rounded-[16px_4px_16px_16px] bg-wa-bubble px-3.5 py-2.5 text-[14px] leading-relaxed text-white">
              {personalize(text, sample)}
            </p>
          </div>
          <Button
            size="xl"
            className="w-full"
            disabled={people.length === 0 || !text.trim() || prepared}
            onClick={() => {
              if (!me) return;
              dispatch({ type: "logCampaign", campaign: { id: newId(), segment, message: text.trim(), recipients: people.length, at: Date.now(), by: me.id } });
              setPrepared(true);
              toast.success(`Campaña lista para ${people.length} ${people.length === 1 ? "cliente" : "clientes"}`, { description: "Toca Enviar en cada uno." });
            }}
          >
            {prepared ? (
              <>
                <Check /> Campaña preparada
              </>
            ) : (
              <>
                <Megaphone /> Preparar para {people.length} {people.length === 1 ? "cliente" : "clientes"}
              </>
            )}
          </Button>
        </section>

        <section className="rounded-[22px] border bg-card p-5 shadow-card xl:col-span-5" aria-label="Destinatarios">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[15px] font-semibold">3. Enviar</h2>
            <span className="text-[13px] text-muted-foreground tabular">
              {sent.length}/{people.length}
            </span>
          </div>
          {people.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-dashed p-8 text-center text-[14px] text-muted-foreground">Nadie con permiso en este segmento.</p>
          ) : (
            <ul className="mt-3 divide-y">
              {people.map((g) => {
                const done = sent.includes(g.id);
                return (
                  <li key={g.id} className="flex items-center gap-3 py-2.5">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ember-soft text-[13px] font-semibold text-primary">{g.name[0]}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-medium">{g.name}</span>
                      <span className="block text-[12px] text-muted-foreground">{g.phone}</span>
                    </span>
                    {done ? (
                      <span className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-status-good-ink">
                        <Check className="size-4" aria-hidden /> Abierto
                      </span>
                    ) : (
                      <Button asChild size="sm" variant={prepared ? "default" : "secondary"}>
                        <a
                          href={whatsappLink(g.phone!, personalize(text, g))}
                          target="_blank"
                          rel="noopener"
                          onClick={() => setSent((s) => [...s, g.id])}
                          aria-label={`Enviar a ${g.name} por WhatsApp`}
                        >
                          <MessageCircle /> Enviar
                        </a>
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <h3 className="mt-6 text-[13px] font-semibold text-muted-foreground">Campañas anteriores</h3>
          <ul className="mt-2 space-y-2">
            {state.campaigns.map((c) => (
              <li key={c.id} className="rounded-2xl bg-secondary/60 px-3.5 py-2.5 text-[12.5px]">
                <p className="font-medium">
                  {SEGMENT_LABEL[c.segment as Segment] ?? c.segment} · {c.recipients} clientes
                </p>
                <p className="truncate text-muted-foreground">
                  {new Date(c.at).toLocaleDateString("es-BO", { day: "numeric", month: "short" })} · {staffById(c.by)?.name} · “{c.message}”
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </PageBody>
  );
}
