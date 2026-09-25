"use client";

import { useEffect, useRef, useState } from "react";
import { parseISO, startOfMonth } from "date-fns";
import { AlertCircle, ArrowRight, CalendarDays, ChevronRight, Plus, SlidersHorizontal, Sparkles, X } from "lucide-react";
import type { Role } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/button";
import { useWorkspaceFilters } from "@/components/layout/workspace-frame";
import { PrintingTable } from "@/features/printing/components/printing-table";
import { civilDate, nextAssessmentMonday, schoolToday, shortDate } from "../calendar-date";
import { dayIndicator, documentIndicator, visibleSummary } from "../calendar-status";
import { scopeDemoData } from "../demo-data";
import { reviewDemoDocument, scheduleDemoDate, submitDemoDocument } from "../demo-transitions";
import { AREAS, type CalendarData } from "../calendar.types";
import { AssessmentCalendar } from "./assessment-calendar";
import { AssessmentDaySheet } from "./assessment-day-sheet";
import { StatusDot } from "./status-mark";

export function AssessmentWorkspace({ initialData, initialNow, role }: { initialData: CalendarData; initialNow: string; role: Role }) {
  const [data, setData] = useState(initialData);
  const [now, setNow] = useState(Date.parse(initialNow));
  const today = schoolToday(new Date(now));
  const [month, setMonth] = useState(civilDate(startOfMonth(parseISO(schoolToday(new Date(initialNow))))));
  const { area } = useWorkspaceFilters();
  const [selected, setSelected] = useState<{ date: string; role: Role } | null>(null);
  const [notice, setNotice] = useState("");
  const objectUrls = useRef(new Set<string>());
  const previousFocus = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60_000);
    const urls = objectUrls.current;
    return () => { clearInterval(interval); urls.forEach((url) => URL.revokeObjectURL(url)); };
  }, []);
  const scoped = scopeDemoData(data, role, today);
  const slots = scoped.slots.filter((slot) => role !== "GESTAO" || area === "all" || slot.areaId === area);
  const monthSlots = slots.filter((slot) => slot.date.startsWith(month.slice(0, 7)));
  const summary = visibleSummary(monthSlots, now);
  const nextMonday = nextAssessmentMonday(today);
  const upcomingDates = [...new Set(slots.filter((slot) => slot.date >= today).map((slot) => slot.date))].sort().slice(0, 3);
  const issues = monthSlots.flatMap((slot) => slot.documents.filter((doc) => documentIndicator(doc, slot.deadline, now) === "danger").map((document) => ({ slot, document }))).slice(0, 3);
  const printing = role === "SECRETARIA";

  function openDate(date: string) {
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setSelected({ date, role });
  }
  function notify(message: string) { setNotice(message); }
  function upload(id: string, file: File) {
    if (role !== "PROFESSOR") return;
    const url = URL.createObjectURL(file);
    try {
      const updated = submitDemoDocument(data, id, { name: file.name, size: file.size, url, version: 1 });
      objectUrls.current.add(url);
      setData(updated);
      notify("PDF recebido. A prova agora está em revisão na demonstração.");
    } catch (error) { URL.revokeObjectURL(url); notify(error instanceof Error ? error.message : "Não foi possível enviar o PDF."); }
  }
  return <>
    <div id={printing ? "impressoes" : "calendario"} className="mb-7 flex flex-wrap items-end justify-between gap-6">
      <div className="max-w-3xl">
        <p className="scav-kicker mb-4 flex items-center gap-2"><Sparkles className="size-4" />{printing ? "PRONTAS PARA A SALA DE AULA" : "PANORAMA DAS AVALIAÇÕES"}</p>
        <h1 className="text-[30px] leading-tight font-extrabold tracking-[-0.045em] sm:text-[38px] 2xl:text-[46px]">{printing ? "Impressões da semana" : "Calendário de avaliações"}</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">{printing ? "Tudo organizado para a próxima segunda-feira." : role === "GESTAO" ? "Uma leitura clara das entregas para planejar as próximas decisões." : role === "PROFESSOR" ? "Suas próximas provas, prazos e devolutivas em um só lugar." : "Uma visão das entregas e revisões de Ciências Exatas."}</p>
      </div>
      {role === "GESTAO" && <Button className="h-11 rounded-full px-5 shadow-sm" onClick={() => { setMonth(civilDate(startOfMonth(parseISO(nextMonday)))); openDate(nextMonday); }}><Plus />Agendar avaliação</Button>}
    </div>

    <div aria-live="polite" aria-atomic="true">{notice && <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900"><span>{notice}</span><Button variant="ghost" size="icon-xs" aria-label="Dispensar mensagem" onClick={() => setNotice("")}><X /></Button></div>}</div>
    {printing ? <PrintingTable slots={scoped.slots} today={today} /> : <>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-xs text-muted-foreground"><span className="size-2.5 rounded-sm border border-blue-300 bg-blue-100" />Avaliações às segundas-feiras</p>
        <span className="flex items-center gap-2 rounded-full border bg-white px-4 py-2 text-xs text-muted-foreground"><SlidersHorizontal className="size-3.5 text-primary" />{role === "GESTAO" ? area === "all" ? "Todas as áreas" : AREAS.find((item) => item.id === area)?.label : role === "PROFESSOR" ? "Matemática · Clara Oliveira (exemplo)" : "Ciências Exatas"}</span>
      </div>
      <div className="grid items-start gap-6 2xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0"><AssessmentCalendar month={month} today={today} now={now} slots={slots} selectedDate={selected?.role === role ? selected.date : null} onMonthChange={setMonth} onSelect={openDate} /><p className="mt-4 text-xs text-muted-foreground">Selecione um dia para ver os detalhes. Prazos no horário de Brasília.</p></div>
        <aside className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-1" aria-label="Resumo e próximas avaliações">
          <section className="scav-panel p-5 2xl:p-6">
            <p className="scav-kicker mb-2 text-[10px]">NO HORIZONTE</p>
            <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold tracking-tight">Próximas avaliações</h2><CalendarDays className="size-4 text-primary" /></div>
            {upcomingDates.length ? upcomingDates.map((date) => {
              const forDate = slots.filter((slot) => slot.date === date);
              const total = forDate.flatMap((slot) => slot.documents).length;
              return <button key={date} onClick={() => { setMonth(civilDate(startOfMonth(parseISO(date)))); openDate(date); }} className="flex w-full items-center gap-3 rounded-lg border-b py-4 text-left transition last:border-0 hover:bg-blue-50/50 focus-visible:outline-2 focus-visible:outline-primary">
                <span className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl bg-secondary"><span className="text-[9px] font-bold text-primary">SEG</span><span className="text-xl font-bold text-foreground">{parseISO(date).getDate()}</span></span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{shortDate(date)} · {total} provas</span><span className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground"><StatusDot tone={dayIndicator(forDate, now)} />{visibleSummary(forDate, now).approved} de {total} aprovadas</span></span><ChevronRight className="size-3.5 text-slate-400" />
              </button>;
            }) : <p className="py-3 text-sm leading-relaxed text-muted-foreground">Nenhuma avaliação futura nesta seleção.</p>}
          </section>
          <section className="scav-panel p-5 2xl:p-6">
            <p className="scav-kicker mb-2 text-[10px]">ACOMPANHAMENTO</p>
            <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight"><AlertCircle className="size-4 text-rose-500" />Pontos de atenção</h2>
            {issues.length ? <div className="mt-2 divide-y">{issues.map(({ slot, document }) => <button key={document.id} className="block w-full rounded py-4 text-left focus-visible:outline-2 focus-visible:outline-primary" onClick={() => openDate(slot.date)}><span className="flex items-center justify-between text-sm font-semibold">{document.subject}<ArrowRight className="size-3.5 text-slate-400" /></span><span className="mt-1.5 flex items-center gap-1.5 text-xs leading-relaxed text-muted-foreground"><StatusDot tone="danger" />{document.status === "CHANGES_REQUESTED" ? "Ajuste solicitado" : "Envio atrasado"} · {shortDate(slot.date)}</span></button>)}</div> : <p className="mt-4 text-sm leading-relaxed text-muted-foreground">Tudo em dia nesta seleção.</p>}
          </section>
        </aside>
      </div>
    </>}
    <section id="fluxo" className="scav-panel mt-9 flex flex-wrap items-center gap-x-6 gap-y-4 px-5 py-6 text-xs text-muted-foreground"><span className="font-bold text-foreground">Do calendário à sala de aula</span>{["Gestão agenda", "Professor envia", "Coordenação aprova", "Secretaria imprime"].map((step, index) => <span key={step} className="flex items-center gap-2"><span className="flex size-7 items-center justify-center rounded-full bg-secondary text-[11px] font-bold text-primary">{index + 1}</span>{step}{index < 3 && <ChevronRight className="ml-2 hidden size-3 text-slate-300 sm:inline" />}</span>)}</section>
    {selected && selected.role === role && role !== "SECRETARIA" && <AssessmentDaySheet key={`${role}-${selected.date}`} role={role} date={selected.date} today={today} now={now} slots={scoped.slots.filter((slot) => slot.date === selected.date)}
      onClose={() => setSelected(null)} onRestoreFocus={() => previousFocus.current?.focus()}
      onSchedule={(areas, deadline) => { if (role !== "GESTAO") return; setData(scheduleDemoDate(data, selected.date, areas, deadline, today)); setSelected(null); notify("Agendamento atualizado na demonstração."); }}
      onUpload={upload} onReview={(id, approved, comment) => { if (role !== "COORDENACAO") return; try { setData(reviewDemoDocument(data, id, approved, comment)); notify(approved ? "Prova aprovada e liberada para impressão na demonstração." : "Solicitação de ajustes registrada na demonstração."); } catch (error) { notify(error instanceof Error ? error.message : "Não foi possível revisar a prova."); } }} />}
  </>;
}
