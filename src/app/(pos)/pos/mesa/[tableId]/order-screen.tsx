"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, Flame, Plus, Search, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { CategoryIcon } from "@/components/pos/category-icon";
import { CheckoutDialog, type CheckoutResult } from "@/components/pos/checkout-dialog";
import { ItemImage } from "@/components/pos/item-image";
import { ModifierDialog } from "@/components/pos/modifier-dialog";
import { PosHeader } from "@/components/pos/pos-header";
import { StatusBadge } from "@/components/pos/status-badge";
import { TicketPanel } from "@/components/pos/ticket-panel";
import { VoidDialog } from "@/components/pos/void-dialog";
import { usePay } from "@/components/pos/use-pay";
import { GuestNoteDialog } from "@/components/pos/guest-note-dialog";
import { can } from "@/modules/pos/permissions";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { formatBs } from "@/modules/pos/money";
import { itemCount, orderTotalMinor, suggestUpsell, unsentLines } from "@/modules/pos/order";
import { tableById, useNow, useStore } from "@/modules/pos/store";
import { tableStatus } from "@/modules/pos/table-status";
import type { ChosenModifier, MenuItem, OrderLine } from "@/modules/pos/types";
import { cn } from "@/lib/utils";

export function OrderScreen({ tableId }: { tableId: string }) {
  const { state, dispatch, orderForTable, verifyManagerPin, staffById, activeMenu, me, register } = useStore();
  const payOrder = usePay();
  const router = useRouter();
  const now = useNow(15000);
  const table = tableById(tableId);
  const order = orderForTable(tableId);

  const [cat, setCat] = useState<string>("populares");
  const [query, setQuery] = useState("");
  const [modItem, setModItem] = useState<MenuItem | null>(null);
  const [voidLine, setVoidLine] = useState<OrderLine | null>(null);
  const [checkout, setCheckout] = useState(false);
  const [ticketOpen, setTicketOpen] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [dismissedUpsell, setDismissedUpsell] = useState<string[]>([]);

  // No open order (e.g. reloaded after it was paid): back to the floor.
  useEffect(() => {
    if (!order) router.replace("/pos");
  }, [order, router]);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q) return activeMenu.filter((m) => m.name.toLowerCase().includes(q));
    if (cat === "populares") return activeMenu.filter((m) => m.popular);
    return activeMenu.filter((m) => m.categoryId === cat);
  }, [cat, query, activeMenu]);

  const add = useCallback(
    (item: MenuItem, modifiers: ChosenModifier[] = [], qty = 1, note?: string) => {
      if (!order) return;
      dispatch({ type: "addLine", orderId: order.id, item, modifiers, qty, note });
      setFlash(item.id);
      setTimeout(() => setFlash((f) => (f === item.id ? null : f)), 450);
    },
    [order, dispatch],
  );

  const onVoidConfirm = useCallback(
    (approvedBy: string, reason: string) => {
      if (!order || !voidLine) return;
      dispatch({ type: "void", orderId: order.id, lineId: voidLine.id, approvedBy, reason, at: Date.now() });
      toast(`${voidLine.name} anulado`, { description: `Aprobó ${staffById(approvedBy)?.name}. Queda en el cierre del día.` });
      setVoidLine(null);
    },
    [order, voidLine, dispatch, staffById],
  );

  if (!order || !table) return null;

  const pay = (r: CheckoutResult) => {
    const remaining = payOrder(order, table.label, r);
    setCheckout(false);
    if (remaining <= 0) router.push("/pos");
  };

  const send = () => {
    const n = unsentLines(order).reduce((s, l) => s + l.qty, 0);
    dispatch({ type: "send", orderId: order.id, at: Date.now() });
    toast.success(`${n} ${n === 1 ? "ítem enviado" : "ítems enviados"}`, { description: "Comanda impresa en cocina y barra" });
  };

  const waiter = staffById(order.waiterId)?.name ?? "";
  const upsell = suggestUpsell(order, activeMenu.filter((m) => !dismissedUpsell.includes(m.id)), state.categories, state.unavailable);
  const ticket = (
    <TicketPanel
      order={order}
      tableLabel={table.label}
      waiter={waiter}
      onQty={(lineId, qty) => dispatch({ type: "setQty", orderId: order.id, lineId, qty })}
      onRemove={(lineId) => dispatch({ type: "removeUnsent", orderId: order.id, lineId })}
      onVoid={setVoidLine}
      onSend={send}
      onToggleBill={() => dispatch({ type: "requestBill", orderId: order.id, value: !order.billRequested })}
      onCheckout={() => setCheckout(true)}
      canCharge={can(me?.role, "payment.record")}
      upsell={upsell}
      onUpsell={(u) => {
        if (u.item.modifierGroups.length) setModItem(u.item);
        else add(u.item);
        setDismissedUpsell((d) => [...d, u.item.id]);
      }}
      guestNote={state.tableNotes[tableId]}
      onEditNote={() => setNoteOpen(true)}
    />
  );

  const status = tableStatus(order, now);

  return (
    <div className="flex h-dvh flex-col">
      <PosHeader>
        <Link
          href="/pos"
          onClick={() => order.lines.length === 0 && dispatch({ type: "cancelEmpty", orderId: order.id })}
          className="press flex h-10 items-center gap-1 rounded-full pr-3 pl-1.5 text-[14px] font-semibold text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-5" /> Salón
        </Link>
        <span className="truncate text-[15px] font-semibold">Mesa {table.label}</span>
        {status !== "occupied" && <StatusBadge status={status} className="hidden sm:inline-flex" />}
      </PosHeader>

      <div className="flex min-h-0 flex-1">
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="space-y-3 px-4 pt-4 sm:px-5">
            <label className="relative block">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-muted-foreground" aria-hidden />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar en el menú"
                aria-label="Buscar en el menú"
                className="h-12 w-full rounded-2xl border bg-card pr-4 pl-11 text-[15px] outline-none placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
              />
            </label>
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-5 sm:px-5" role="tablist" aria-label="Categorías">
              {[{ id: "populares", name: "Populares", icon: "flame" }, ...state.categories].map((c) => {
                const active = !query && cat === c.id;
                return (
                  <button
                    key={c.id}
                    role="tab"
                    aria-selected={active}
                    onClick={() => {
                      setQuery("");
                      setCat(c.id);
                    }}
                    className={cn(
                      "press flex h-11 shrink-0 items-center gap-2 rounded-2xl border px-4 text-[14px] font-semibold",
                      active ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {c.icon === "flame" ? <Flame className="size-[18px]" aria-hidden /> : <CategoryIcon icon={c.icon} className="size-[18px]" />}
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-3 pb-28 sm:px-5 lg:pb-6">
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {items.map((it) => {
                const out = state.unavailable.includes(it.id);
                return (
                  <li key={it.id}>
                    <button
                      disabled={out}
                      aria-label={`${it.name}, ${formatBs(it.priceMinor)}${out ? ", agotado" : ""}`}
                      onClick={() => (it.modifierGroups.length ? setModItem(it) : add(it))}
                      className={cn(
                        "press group relative flex w-full flex-col overflow-hidden rounded-[20px] border bg-card text-left hover:border-white/15 disabled:opacity-45",
                        flash === it.id && "ring-2 ring-primary",
                      )}
                    >
                      <ItemImage item={it} className="aspect-[4/3] w-full" sizes="(min-width:1280px) 240px, (min-width:640px) 30vw, 50vw" />
                      <span className="flex flex-1 flex-col p-3">
                        <span className="line-clamp-2 text-[14px] leading-snug font-semibold">{it.name}</span>
                        <span className="mt-1 text-[15px] font-semibold text-primary tabular">{formatBs(it.priceMinor)}</span>
                      </span>
                      {out ? (
                        <span className="absolute top-2.5 left-2.5 rounded-full bg-black/70 px-2.5 py-1 text-xs font-semibold text-white">Agotado</span>
                      ) : (
                        <span className="absolute right-2.5 bottom-2.5 grid size-9 place-items-center rounded-full bg-primary text-primary-foreground shadow-float transition-transform group-active:scale-90">
                          <Plus className="size-5" aria-hidden />
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
            {items.length === 0 && <p className="py-16 text-center text-muted-foreground">Nada coincide con “{query}”.</p>}
          </div>
        </main>

        <aside className="hidden w-[380px] shrink-0 border-l bg-card/40 lg:block">{ticket}</aside>
      </div>

      {/* Phone/tablet: ticket as a sheet */}
      <div className="fixed inset-x-3 bottom-3 z-20 lg:hidden" style={{ marginBottom: "env(safe-area-inset-bottom)" }}>
        <button
          onClick={() => setTicketOpen(true)}
          className="press glass flex h-16 w-full items-center gap-3 rounded-[22px] border px-4 shadow-float"
        >
          <span className="relative grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
            <ShoppingBag className="size-5" aria-hidden />
            {unsentLines(order).length > 0 && (
              <span className="absolute -top-1 -right-1 size-3 rounded-full border-2 border-card bg-status-warning" aria-label="Hay ítems por enviar" />
            )}
          </span>
          <span className="flex-1 text-left">
            <span className="block text-[15px] font-semibold">Ver pedido</span>
            <span className="block text-xs text-muted-foreground">{itemCount(order)} ítems</span>
          </span>
          <span className="text-lg font-semibold tabular">{formatBs(orderTotalMinor(order))}</span>
        </button>
      </div>
      <Sheet open={ticketOpen} onOpenChange={setTicketOpen}>
        <SheetContent side="bottom" className="h-[88dvh] rounded-t-[28px] p-0">
          <SheetTitle className="sr-only">Pedido de la mesa {table.label}</SheetTitle>
          {ticket}
        </SheetContent>
      </Sheet>

      <ModifierDialog
        item={modItem}
        onClose={() => setModItem(null)}
        onAdd={(mods, qty, note) => {
          if (modItem) add(modItem, mods, qty, note);
          setModItem(null);
        }}
      />
      <VoidDialog
        line={voidLine}
        onClose={() => setVoidLine(null)}
        verify={verifyManagerPin}
        onConfirm={onVoidConfirm}
        approver={me && can(me.role, "order.void") ? me : undefined}
      />
      <GuestNoteDialog
        open={noteOpen}
        tableLabel={table.label}
        note={state.tableNotes[tableId]}
        onClose={() => setNoteOpen(false)}
        onSave={(note) => {
          dispatch({ type: "setTableNote", tableId, note });
          setNoteOpen(false);
        }}
      />
      <CheckoutDialog
        order={order}
        tableLabel={table.label}
        open={checkout}
        onClose={() => setCheckout(false)}
        onPay={pay}
        cashAllowed={!!register}
      />
    </div>
  );
}
