"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import Select from "react-select";
import { CalendarCheck2, CalendarDays, CircleHelp, Gauge, Menu, Printer, ShieldCheck, SlidersHorizontal } from "lucide-react";
import type { Role } from "@/generated/prisma/enums";
import { ROLE_LABEL } from "@/lib/routes";
import { AREAS, type AreaId } from "@/features/calendar/calendar.types";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const FiltersContext = createContext<{ area: AreaId | "all"; setArea: (area: AreaId | "all") => void } | null>(null);

export function useWorkspaceFilters() {
  const context = useContext(FiltersContext);
  if (!context) throw new Error("Os filtros precisam de WorkspaceFrame.");
  return context;
}

function Sidebar({ role, accountControls, onNavigate }: { role: Role; accountControls?: ReactNode; onNavigate?: () => void }) {
  const { area, setArea } = useWorkspaceFilters();
  const printing = role === "SECRETARIA";
  return <>
    <div className="border-b border-white/10 px-7 py-7 xl:px-8">
      <div className="flex items-center gap-2.5"><CalendarCheck2 className="size-5 text-blue-300" /><span className="text-[23px] font-bold tracking-tight text-white">SCAV</span></div>
      <p className="mt-1.5 text-sm text-sidebar-muted">Calendário e avaliações</p>
    </div>
    <nav aria-label="Navegação principal" className="space-y-2 px-5 pt-8 xl:px-6">
      <a href={printing ? "#impressoes" : "#calendario"} onClick={onNavigate} aria-current="page" className="flex min-h-14 items-center gap-3 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white ring-1 ring-inset ring-white/5">{printing ? <Printer className="size-5" /> : <Gauge className="size-5" />}{printing ? "Impressões da semana" : "Visão geral"}<span className="ml-auto size-1.5 rounded-full bg-blue-300" /></a>
      {!printing && <a href="#agenda" onClick={onNavigate} className="flex min-h-12 items-center gap-3 rounded-xl px-4 py-3 text-sm text-sidebar-muted transition hover:bg-white/5 hover:text-white"><CalendarDays className="size-5" />Calendário de avaliações</a>}
      <a href="#fluxo" onClick={onNavigate} className="flex min-h-12 items-center gap-3 rounded-xl px-4 py-3 text-sm text-sidebar-muted transition hover:bg-white/5 hover:text-white"><CircleHelp className="size-5" />Fluxo de avaliações</a>
    </nav>
    <section className="mx-6 mt-8 border-t border-white/10 pt-7 xl:mx-8" aria-label="Filtros do painel">
      <h2 className="mb-6 flex items-center gap-2 text-xs font-semibold tracking-[0.13em] text-sidebar-muted"><SlidersHorizontal className="size-4" />{printing ? "ORGANIZAÇÃO DA SEMANA" : "FILTROS DO CALENDÁRIO"}</h2>
      <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-sidebar-muted">{printing ? "Disponibilidade" : "Área de conhecimento"}</p>
        {role === "GESTAO" ? <Select<{ value: AreaId | "all"; label: string }> aria-label="Filtrar por área" instanceId="workspace-area-filter" value={{ value: area, label: area === "all" ? "Todas as áreas" : AREAS.find((item) => item.id === area)?.label ?? "Todas as áreas" }} onChange={(option) => setArea(option?.value ?? "all")} options={[{ value: "all", label: "Todas as áreas" }, ...AREAS.map((item) => ({ value: item.id, label: item.label }))]} unstyled classNames={{ control: () => "w-full min-w-0 rounded-xl border border-white/15 bg-[#2b425c] text-sm font-medium text-white outline-none focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-300/20 cursor-pointer", valueContainer: () => "px-3 py-3.5", input: () => "text-white placeholder:text-white/60", singleValue: () => "text-white", menu: () => "mt-0 overflow-hidden rounded-b-xl border-x border-b border-white/15 bg-[#2b425c] shadow-lg", menuList: () => "py-0", option: ({ isFocused }) => `px-3 py-3 text-sm font-medium ${isFocused ? "bg-white/10 text-white" : "text-slate-200"} cursor-pointer`, indicatorSeparator: () => "hidden", dropdownIndicator: () => "pr-3 text-white/60", clearIndicator: () => "hidden" }} /> : <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-3.5 text-sm text-white">{printing ? "Somente provas aprovadas" : "Ciências Exatas"}</p>}
        <p className="mt-5 mb-2 text-[11px] font-bold uppercase tracking-wider text-sidebar-muted">{role === "PROFESSOR" ? "Sua disciplina" : "Dia de avaliação"}</p>
        <p className="flex items-center gap-2 text-sm text-slate-200"><CalendarDays className="size-4 text-blue-300" />{role === "PROFESSOR" ? "Matemática" : "Segundas-feiras"}</p>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-sidebar-muted">{printing ? "Uma lista pronta para organizar os arquivos da próxima segunda-feira." : "O painel acompanha a área selecionada e o mês exibido no calendário."}</p>
    </section>
    <div className="mx-6 mt-auto pt-10 pb-6 xl:mx-8">
      <div className="flex items-center gap-3 border-t border-white/10 pt-5"><span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-300/10 text-xs font-bold text-blue-200">{role.slice(0, 2)}</span><div><p className="text-sm font-semibold text-white">{ROLE_LABEL[role]}</p><p className="mt-1 text-xs text-sidebar-muted">Portal da escola</p></div></div>
      {accountControls && <div className="mt-4 text-sm text-sidebar-muted">{accountControls}</div>}
    </div>
  </>;
}

export function WorkspaceFrame({ role, children, toolbar, accountControls }: { role: Role; children: ReactNode; toolbar?: ReactNode; accountControls?: ReactNode }) {
  const [area, setArea] = useState<AreaId | "all">("all");
  const [mobileOpen, setMobileOpen] = useState(false);
  const printing = role === "SECRETARIA";
  return <FiltersContext.Provider value={{ area, setArea }}><div className="min-h-screen bg-canvas text-foreground">
    <a href="#conteudo" className="sr-only z-[60] rounded bg-white p-3 focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Ir para o conteúdo</a>
    <aside className="scav-sidebar fixed inset-y-0 left-0 hidden w-64 flex-col overflow-y-auto bg-sidebar lg:flex xl:w-72 2xl:w-80"><Sidebar role={role} accountControls={accountControls} /></aside>
    <div className="lg:ml-64 xl:ml-72 2xl:ml-80">
      <header className="flex min-h-22 flex-wrap items-center justify-between gap-3 border-b bg-canvas px-4 py-4 sm:px-8 xl:px-10 2xl:px-12">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}><SheetTrigger asChild><Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menu"><Menu /></Button></SheetTrigger><SheetContent side="left" className="scav-sidebar w-[min(320px,calc(100vw-24px))] gap-0 overflow-y-auto border-0 bg-sidebar text-white sm:max-w-80"><SheetHeader className="sr-only"><SheetTitle>Menu do SCAV</SheetTitle><SheetDescription>Navegação e filtros das avaliações.</SheetDescription></SheetHeader><Sidebar role={role} accountControls={accountControls} onNavigate={() => setMobileOpen(false)} /></SheetContent></Sheet>
          <span className="hidden sm:inline">Avaliações</span><span aria-hidden="true" className="hidden px-1 text-slate-300 sm:inline">/</span><span className="font-semibold text-foreground">{printing ? "Impressões da semana" : "Visão geral"}</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">{toolbar ?? <span className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground"><ShieldCheck className="size-4 text-primary" />{ROLE_LABEL[role]} · Portal da escola</span>}</div>
      </header>
      <main id="conteudo" tabIndex={-1} className="mx-auto max-w-[1720px] px-4 py-7 outline-none sm:px-8 sm:py-10 xl:px-10 2xl:px-12 2xl:py-12">{children}</main>
    </div>
  </div></FiltersContext.Provider>;
}
