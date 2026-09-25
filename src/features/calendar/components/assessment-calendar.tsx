"use client";

import { useRef } from "react";
import { addDays, addMonths, eachDayOfInterval, endOfMonth, endOfWeek, getDay, isSameMonth, parseISO, startOfMonth, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { civilDate, longDate, monthLabel } from "../calendar-date";
import { dayIndicator } from "../calendar-status";
import { AREAS, INDICATOR_LABEL, type CalendarSlot } from "../calendar.types";
import { StatusDot, toneClass } from "./status-mark";

type Props = { month: string; today: string; now: number; slots: CalendarSlot[]; selectedDate: string | null; onMonthChange: (month: string) => void; onSelect: (date: string) => void };

export function AssessmentCalendar({ month, today, now, slots, selectedDate, onMonthChange, onSelect }: Props) {
  const start = parseISO(month);
  const days = eachDayOfInterval({ start: startOfWeek(startOfMonth(start), { weekStartsOn: 1 }), end: endOfWeek(endOfMonth(start), { weekStartsOn: 1 }) });
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  return (
    <section id="agenda" className="scav-panel overflow-hidden" aria-label="Calendário de avaliações">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b px-4 py-5 sm:px-7 sm:py-6">
        <div><p className="scav-kicker mb-2 text-[10px]">PLANEJAMENTO MENSAL</p><h2 className="text-xl font-bold tracking-tight capitalize sm:text-2xl" aria-live="polite">{monthLabel(start)}</h2></div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="mr-2" onClick={() => onMonthChange(civilDate(startOfMonth(parseISO(today))))}>Hoje</Button>
          <Button variant="ghost" size="icon-sm" aria-label="Mês anterior" onClick={() => onMonthChange(civilDate(addMonths(start, -1)))}><ChevronLeft /></Button>
          <Button variant="ghost" size="icon-sm" aria-label="Próximo mês" onClick={() => onMonthChange(civilDate(addMonths(start, 1)))}><ChevronRight /></Button>
        </div>
      </div>
      <table className="w-full table-fixed border-collapse">
        <caption className="sr-only">Avaliações de {monthLabel(start)}. Selecione um dia para ver os detalhes. Use as setas para navegar entre dias.</caption>
        <thead><tr>{["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"].map((day, index) => <th key={day} scope="col" className={cn("border-b bg-slate-50/40 py-4 text-[10px] font-bold tracking-widest text-muted-foreground sm:text-xs", index === 0 && "bg-blue-50/70 text-primary")}>{day}</th>)}</tr></thead>
        <tbody>{Array.from({ length: days.length / 7 }, (_, week) => <tr key={week}>{days.slice(week * 7, week * 7 + 7).map((day) => {
          const date = civilDate(day);
          const daySlots = slots.filter((slot) => slot.date === date);
          const tone = dayIndicator(daySlots, now);
          const count = daySlots.reduce((sum, slot) => sum + slot.documents.length, 0);
          const currentMonth = isSameMonth(day, start);
          return <td key={date} className="border-r border-b p-0 align-top last:border-r-0">
            <button type="button" ref={(node) => { if (node) buttons.current.set(date, node); else buttons.current.delete(date); }}
              aria-label={`${longDate(date)}. ${daySlots.length ? `${count} avaliações. ${INDICATOR_LABEL[tone]}.` : "Sem avaliação agendada."}`}
              aria-current={date === today ? "date" : undefined}
              onClick={() => onSelect(date)}
              onKeyDown={(event) => {
                const offset = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 7, ArrowUp: -7 }[event.key];
                if (offset) { event.preventDefault(); buttons.current.get(civilDate(addDays(day, offset)))?.focus(); }
              }}
              className={cn("group flex min-h-24 w-full flex-col gap-1.5 p-1.5 text-left transition-colors hover:bg-slate-50 focus-visible:relative focus-visible:z-10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary sm:min-h-32 sm:p-2.5", getDay(day) === 1 && "bg-blue-50/35 hover:bg-blue-50", !currentMonth && "bg-slate-50/70 text-slate-400", selectedDate === date && "bg-blue-50 ring-2 ring-inset ring-primary")}>
              <span className={cn("mb-0.5 flex size-6 items-center justify-center rounded-full text-xs font-semibold sm:size-8 sm:text-sm", date === today ? "bg-primary text-white" : "text-inherit")}>{day.getDate()}</span>
              {daySlots.map((slot) => <span key={slot.id} className={cn("flex w-full items-center justify-center gap-1 rounded-md border px-0.5 py-1 text-[9px] font-semibold sm:justify-start sm:gap-1.5 sm:px-1.5 sm:text-[11px]", toneClass[dayIndicator([slot], now)])}><StatusDot tone={dayIndicator([slot], now)} /><span className="hidden truncate sm:inline">{AREAS.find((area) => area.id === slot.areaId)?.short}</span><span className="sm:ml-auto">{slot.documents.length}</span></span>)}
              {daySlots.length > 0 && <span className="mt-auto hidden pt-1 text-[10px] text-muted-foreground lg:block">{count} {count === 1 ? "avaliação" : "avaliações"}</span>}
            </button>
          </td>;
        })}</tr>)}</tbody>
      </table>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 bg-slate-50/40 px-4 py-4 text-[11px] text-muted-foreground sm:px-7">
        <span className="flex items-center gap-1.5"><StatusDot tone="danger" />Atraso ou ajuste</span>
        <span className="flex items-center gap-1.5"><StatusDot tone="review" />Em revisão</span>
        <span className="flex items-center gap-1.5"><StatusDot tone="approved" />Tudo aprovado</span>
        <span className="flex items-center gap-1.5"><StatusDot tone="neutral" />Pendente no prazo</span>
      </div>
    </section>
  );
}
