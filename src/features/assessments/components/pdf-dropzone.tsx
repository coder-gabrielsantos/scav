"use client";

import { useId, useState } from "react";
import { FileUp, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { validateLocalPdf } from "../pdf-validation";

export function PdfDropzone({ subject, onFile }: { subject: string; onFile: (file: File) => void }) {
  const id = useId();
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function accept(files: File[]) {
    if (busy) return;
    if (files.length !== 1) { setError("Selecione apenas um PDF por avaliação."); return; }
    setBusy(true); setError("");
    try {
      const validationError = await validateLocalPdf(files[0]);
      if (validationError) setError(validationError);
      else onFile(files[0]);
    } catch { setError("Não foi possível ler este arquivo. Tente outro PDF."); }
    finally { setBusy(false); }
  }
  return <div>
    <div className={cn("relative mt-5 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/50 px-4 py-8 text-center transition-colors focus-within:border-primary focus-within:ring-4 focus-within:ring-blue-100", dragging && "border-primary bg-blue-100/60")}
      onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
      onDrop={(event) => { event.preventDefault(); setDragging(false); void accept(Array.from(event.dataTransfer.files)); }}>
      <input id={id} aria-label={`Enviar PDF de ${subject}`} aria-describedby={`${id}-hint ${id}-error`} type="file" accept=".pdf,application/pdf" disabled={busy} className="sr-only" onChange={(event) => { if (event.target.files?.length) void accept(Array.from(event.target.files)); event.target.value = ""; }} />
      {busy ? <LoaderCircle className="mx-auto size-7 animate-spin text-primary" /> : <FileUp className="mx-auto size-8 text-primary" />}
      <label htmlFor={id} className="mt-4 block cursor-pointer text-sm font-bold text-primary">{busy ? "Verificando PDF…" : "Escolher PDF ou arrastar para cá"}</label>
      <p id={`${id}-hint`} className="mt-2 text-xs text-muted-foreground">Um arquivo PDF • até 20 MB</p>
    </div>
    <p id={`${id}-error`} role={error ? "alert" : undefined} className="mt-2 text-xs text-rose-700">{error}</p>
  </div>;
}
