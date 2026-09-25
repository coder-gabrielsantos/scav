"use client";

import { useState } from "react";
import { CheckCircle2, Download, FileArchive, FileText, LoaderCircle, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AREAS, type CalendarSlot } from "@/features/calendar/calendar.types";
import { longDate, nextAssessmentMonday, shortDate } from "@/features/calendar/calendar-date";
import { approvedForWeek, downloadBlob, fetchDemoPdf, safePdfName } from "../downloads";

export function PrintingTable({ slots, today }: { slots: CalendarSlot[]; today: string }) {
  const monday = nextAssessmentMonday(today);
  const rows = approvedForWeek(slots, monday);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  async function download(id?: string) {
    setBusy(id ?? "zip"); setMessage("");
    try {
      if (id) {
        const row = rows.find((item) => item.document.id === id);
        if (!row?.document.file) throw new Error("Prova não disponível.");
        downloadBlob(await fetchDemoPdf(row.document.file.url), safePdfName(row.document.subject, id));
      } else {
        const { default: JSZip } = await import("jszip");
        const zip = new JSZip();
        await Promise.all(rows.map(async ({ document }) => zip.file(safePdfName(document.subject, document.id), await (await fetchDemoPdf(document.file!.url)).arrayBuffer())));
        downloadBlob(await zip.generateAsync({ type: "blob" }), `scav-avaliacoes-${monday}.zip`);
      }
      setMessage("Download preparado. Confira a pasta de downloads do navegador.");
    } catch { setMessage("Não foi possível preparar o download. Tente novamente."); }
    finally { setBusy(null); }
  }
  return <section>
    <div className="scav-panel mb-7 flex flex-wrap items-center justify-between gap-5 p-6 sm:p-8">
      <div className="flex items-center gap-4"><span className="flex size-14 items-center justify-center rounded-2xl bg-secondary text-primary"><Printer className="size-6" /></span><div><p className="scav-kicker">PRÓXIMA SEGUNDA-FEIRA</p><h2 className="mt-2 text-xl font-bold tracking-tight capitalize sm:text-2xl">{longDate(monday)}</h2><p className="mt-2 text-sm text-muted-foreground">{rows.length} {rows.length === 1 ? "prova aprovada" : "provas aprovadas"} para impressão</p></div></div>
      <Button disabled={!rows.length || Boolean(busy)} onClick={() => void download()}>{busy === "zip" ? <LoaderCircle className="animate-spin" /> : <FileArchive />}Baixar pacote ZIP</Button>
    </div>
    <p role="status" className="mb-3 text-sm text-primary">{message}</p>
    <div className="scav-panel overflow-x-auto">
      <table className="w-full min-w-[620px] text-left text-sm">
        <caption className="sr-only">Provas aprovadas para {shortDate(monday)}</caption>
        <thead className="border-b bg-slate-50/60 text-xs uppercase tracking-wider text-muted-foreground"><tr><th scope="col" className="px-6 py-5 font-semibold">Disciplina / professor</th><th scope="col" className="px-6 py-5 font-semibold">Área</th><th scope="col" className="px-6 py-5 font-semibold">Status</th><th scope="col" className="px-6 py-5 font-semibold text-right">Arquivo</th></tr></thead>
        <tbody>{rows.map(({ slot, document }) => <tr key={document.id} className="border-b transition last:border-0 hover:bg-blue-50/25"><td className="px-6 py-6"><div className="flex items-center gap-3"><FileText className="size-5 text-primary" /><div><p className="font-bold">{document.subject}</p><p className="mt-2 text-sm text-muted-foreground">{document.teacher}</p></div></div></td><td className="px-6 py-6 text-slate-500">{AREAS.find((area) => area.id === slot.areaId)?.short}</td><td className="px-6 py-6"><span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-1 text-xs text-emerald-800"><CheckCircle2 className="size-3" />Aprovada</span></td><td className="px-6 py-6 text-right"><Button variant="outline" size="sm" disabled={Boolean(busy)} onClick={() => void download(document.id)} aria-label={`Baixar PDF de ${document.subject}`}>{busy === document.id ? <LoaderCircle className="animate-spin" /> : <Download />}Baixar PDF</Button></td></tr>)}</tbody>
      </table>
      {!rows.length && <div className="p-12 text-center"><FileText className="mx-auto mb-3 size-8 text-slate-300" /><h3 className="font-medium">Nenhuma prova liberada ainda</h3><p className="mt-2 text-sm text-slate-500">As avaliações aparecerão aqui após a aprovação da coordenação.</p></div>}
    </div>
    <p className="mt-5 flex items-center gap-2 text-xs leading-relaxed text-muted-foreground"><CheckCircle2 className="size-3.5 text-emerald-600" />A lista e o pacote incluem apenas as provas aprovadas da próxima segunda-feira.</p>
  </section>;
}
