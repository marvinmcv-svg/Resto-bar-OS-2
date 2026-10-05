"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const DAY_SHORT = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

export function weekLabel(monday: Date) {
  const end = addDays(monday, 6);
  const f = (d: Date) => d.toLocaleDateString("es-BO", { day: "numeric", month: "short" });
  return `${f(monday)} – ${f(end)}`;
}

/** ‹ Semana › navigation shared by schedule and attendance. */
export function WeekNav({ monday, onChange, thisWeek }: { monday: Date; onChange: (d: Date) => void; thisWeek: Date }) {
  const current = monday.getTime() === thisWeek.getTime();
  return (
    <div className="flex items-center gap-1.5">
      <Button variant="secondary" size="icon-sm" aria-label="Semana anterior" onClick={() => onChange(addDays(monday, -7))}>
        <ChevronLeft />
      </Button>
      <span className="min-w-[150px] text-center text-[14px] font-semibold tabular">
        {current ? "Esta semana" : weekLabel(monday)}
        {current && <span className="block text-[11px] font-normal text-muted-foreground">{weekLabel(monday)}</span>}
      </span>
      <Button variant="secondary" size="icon-sm" aria-label="Semana siguiente" onClick={() => onChange(addDays(monday, 7))}>
        <ChevronRight />
      </Button>
    </div>
  );
}
