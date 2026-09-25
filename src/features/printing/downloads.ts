import type { CalendarSlot } from "@/features/calendar/calendar.types";

export function approvedForWeek(slots: CalendarSlot[], monday: string) {
  return slots.filter((slot) => slot.date === monday).flatMap((slot) => slot.documents.filter((doc) => doc.status === "APPROVED" && doc.file).map((document) => ({ slot, document })));
}

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = name;
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function fetchDemoPdf(url: string) {
  if (url !== "/demo/avaliacao-exemplo.pdf" && !url.startsWith("blob:")) throw new Error("Arquivo demonstrativo indisponível.");
  const response = await fetch(url);
  if (!response.ok) throw new Error("Não foi possível baixar o arquivo.");
  return response.blob();
}

export function safePdfName(subject: string, id: string) {
  const slug = subject.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return `${slug}-${id.replace(/[^a-zA-Z0-9-]/g, "")}.pdf`;
}
