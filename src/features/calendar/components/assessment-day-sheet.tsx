"use client";

import { useState } from "react";
import { getDay, parseISO } from "date-fns";
import { CalendarDays, Check, Clock3, ExternalLink, FileText, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PdfDropzone } from "@/features/assessments/components/pdf-dropzone";
import { deadlineInput, deadlineLabel, defaultDeadline, longDate, schoolInstant } from "../calendar-date";
import { AREAS, type AreaId, type CalendarDocument, type CalendarRole, type CalendarSlot } from "../calendar.types";
import { DocumentBadge } from "./status-mark";

type Props = {
  role: CalendarRole; date: string; today: string; now: number; slots: CalendarSlot[];
  onClose: () => void; onRestoreFocus: () => void;
  onSchedule: (areas: AreaId[], deadline: string) => void;
  onUpload: (id: string, file: File) => void;
  onReview: (id: string, approved: boolean, comment: string) => void;
};

function ReviewControls({ document, onReview }: { document: CalendarDocument; onReview: Props["onReview"] }) {
  const [editing, setEditing] = useState(false);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  return <div className="mt-4 border-t pt-4">
    <div className="flex flex-wrap gap-2">
      <Button size="sm" onClick={() => onReview(document.id, true, "")}><Check />Aprovar</Button>
      <Button size="sm" variant="outline" onClick={() => setEditing(!editing)}><MessageSquareText />Solicitar ajustes</Button>
    </div>
    {editing && <form className="mt-4" onSubmit={(event) => { event.preventDefault(); if (!comment.trim()) { setError("Descreva os ajustes necessários."); return; } onReview(document.id, false, comment); }}>
      <label htmlFor={`comment-${document.id}`} className="text-xs font-medium">Orientações para o professor</label>
      <textarea id={`comment-${document.id}`} autoFocus required maxLength={2000} value={comment} onChange={(event) => setComment(event.target.value)} rows={3} className="scav-field mt-2" placeholder="Explique o que precisa ser revisado…" />
      {error && <p role="alert" className="mb-2 text-xs text-rose-700">{error}</p>}
      <Button size="sm" variant="secondary" type="submit">Enviar solicitação</Button>
    </form>}
  </div>;
}

export function AssessmentDaySheet({ role, date, today, now, slots, onClose, onRestoreFocus, onSchedule, onUpload, onReview }: Props) {
  const [areas, setAreas] = useState<AreaId[]>(slots.map((slot) => slot.areaId));
  const [deadline, setDeadline] = useState(deadlineInput(slots[0]?.deadline ?? defaultDeadline(date)));
  const [error, setError] = useState("");
  const canSchedule = getDay(parseISO(date)) === 1 && date >= today;
  const documents = slots.flatMap((slot) => slot.documents.map((document) => ({ slot, document })));
  return <Sheet open onOpenChange={(open) => { if (!open) onClose(); }}>
    <SheetContent className="w-full gap-0 overflow-y-auto bg-canvas sm:max-w-[540px]" onCloseAutoFocus={(event) => { event.preventDefault(); onRestoreFocus(); }}>
      <SheetHeader className="border-b bg-white px-6 py-8 pr-12 sm:px-8 sm:pr-12">
        <span className="scav-kicker mb-3 flex items-center gap-2"><CalendarDays className="size-4" />AVALIAÇÕES DO DIA</span>
        <SheetTitle className="text-2xl font-bold tracking-tight capitalize">{longDate(date)}</SheetTitle>
        <SheetDescription className="mt-2 leading-relaxed">{role === "GESTAO" ? "Defina as áreas e organize o prazo de entrega." : role === "PROFESSOR" ? "Envie a prova da sua disciplina e acompanhe a revisão." : "Confira os PDFs e libere as avaliações da sua área."}</SheetDescription>
      </SheetHeader>
      <div className="space-y-6 p-6 sm:p-8">
        {role === "GESTAO" && <form onSubmit={(event) => { event.preventDefault(); setError(""); try { onSchedule(areas, schoolInstant(deadline)); } catch (err) { setError(err instanceof Error ? err.message : "Verifique a data e o prazo."); } }} className="scav-panel space-y-6 p-5">
          {!canSchedule && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">O agendamento está disponível apenas para segundas-feiras que ainda não passaram.</p>}
          <fieldset disabled={!canSchedule} className="space-y-2 disabled:opacity-60">
            <legend className="mb-3 text-sm font-semibold">Quais áreas farão prova neste dia?</legend>
            {AREAS.map((area) => {
              const existing = slots.find((slot) => slot.areaId === area.id);
              const locked = Boolean(existing?.documents.some((doc) => doc.file || doc.status !== "PENDING_SUBMISSION"));
              return <label key={area.id} className="flex cursor-pointer items-center gap-3 rounded-xl border bg-white p-4 text-sm transition has-checked:border-blue-400 has-checked:bg-blue-50/60">
                <input type="checkbox" className="size-4 accent-primary" checked={areas.includes(area.id)} disabled={locked} onChange={(event) => setAreas(event.target.checked ? [...areas, area.id] : areas.filter((id) => id !== area.id))} />
                <span>{area.label}{locked && <span className="mt-0.5 block text-[11px] text-slate-500">Área com provas já enviadas</span>}</span>
              </label>;
            })}
          </fieldset>
          <div><label htmlFor="submission-deadline" className="text-sm font-semibold">Prazo de envio</label><input id="submission-deadline" type="datetime-local" required disabled={!canSchedule} value={deadline} onChange={(event) => setDeadline(event.target.value)} className="scav-field mt-2" /><p className="mt-1.5 text-xs text-slate-500">Horário de Brasília • anterior ao dia da avaliação.</p></div>
          {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
          <Button className="w-full" disabled={!canSchedule} type="submit">Salvar agendamento</Button>
        </form>}
        {documents.length > 0 && <h3 className="pt-2 text-xs font-semibold tracking-wider text-slate-500">{role === "GESTAO" ? "ACOMPANHAMENTO DAS PROVAS" : "PROVAS AGENDADAS"} · {documents.length}</h3>}
        {documents.map(({ slot, document }) => <article key={document.id} className="scav-panel p-5">
          <div className="mb-2 flex items-start justify-between gap-3"><div><h3 className="text-lg font-bold tracking-tight">{document.subject}</h3><p className="mt-1 text-xs text-slate-500">{document.teacher}</p></div><FileText className="size-5 shrink-0 text-blue-400" /></div>
          <DocumentBadge document={document} deadline={slot.deadline} now={now} />
          <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500"><Clock3 className="size-3.5" />Prazo: {deadlineLabel(slot.deadline)}</p>
          {document.feedback && <div className="mt-3 rounded-lg bg-rose-50 p-3 text-xs leading-relaxed text-rose-900"><p className="mb-1 font-semibold">Orientação da coordenação</p>{document.feedback}</div>}
          {document.file && <div className="mt-4"><p className="mb-2 truncate text-xs text-slate-500">{document.file.name} · versão {document.file.version}</p><Button asChild variant="outline" size="sm"><a href={document.file.url} target="_blank" rel="noopener noreferrer"><ExternalLink />Visualizar PDF<span className="sr-only"> de {document.subject} em nova aba</span></a></Button></div>}
          {role === "PROFESSOR" && (document.status === "PENDING_SUBMISSION" || document.status === "CHANGES_REQUESTED") && <PdfDropzone subject={document.subject} onFile={(file) => onUpload(document.id, file)} />}
          {role === "COORDENACAO" && document.status === "UNDER_REVIEW" && <ReviewControls document={document} onReview={onReview} />}
          {document.status === "APPROVED" && <p className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700"><Check className="size-3.5" />Liberada para impressão.</p>}
        </article>)}
        {!documents.length && role !== "GESTAO" && <div className="rounded-2xl border border-dashed bg-white p-8 text-center"><CalendarDays className="mx-auto mb-3 size-8 text-slate-300" /><h3 className="text-sm font-medium">Nenhuma avaliação para este dia</h3><p className="mt-2 text-xs leading-relaxed text-slate-500">Selecione uma segunda-feira destacada no calendário.</p></div>}
      </div>
    </SheetContent>
  </Sheet>;
}
