import { getDay, parseISO } from "date-fns";
import { newDemoSlot } from "./demo-data";
import { schoolInstant } from "./calendar-date";
import type { AreaId, CalendarData, CalendarDocument } from "./calendar.types";

export function scheduleDemoDate(data: CalendarData, date: string, areas: AreaId[], deadline: string, today: string): CalendarData {
  if (getDay(parseISO(date)) !== 1 || date < today) throw new Error("Escolha uma segunda-feira que ainda não passou.");
  if (!Number.isFinite(Date.parse(deadline)) || Date.parse(deadline) >= Date.parse(schoolInstant(`${date}T00:00`))) throw new Error("O prazo de envio deve ser anterior ao dia da avaliação.");
  const existing = data.slots.filter((slot) => slot.date === date);
  if (existing.some((slot) => !areas.includes(slot.areaId) && slot.documents.some((doc) => doc.file || doc.status !== "PENDING_SUBMISSION"))) {
    throw new Error("Uma área com provas enviadas não pode ser removida.");
  }
  return { slots: [...data.slots.filter((slot) => slot.date !== date), ...areas.map((areaId) => {
    const old = existing.find((slot) => slot.areaId === areaId);
    return old ? { ...old, deadline } : newDemoSlot(date, areaId, deadline);
  })] };
}

export function updateDemoDocument(data: CalendarData, id: string, update: (doc: CalendarDocument) => CalendarDocument): CalendarData {
  if (!data.slots.some((slot) => slot.documents.some((doc) => doc.id === id))) throw new Error("Prova não encontrada.");
  return { slots: data.slots.map((slot) => ({ ...slot, documents: slot.documents.map((doc) => doc.id === id ? update(doc) : doc) })) };
}

export function reviewDemoDocument(data: CalendarData, id: string, approved: boolean, comment: string): CalendarData {
  return updateDemoDocument(data, id, (doc) => {
    if (doc.status !== "UNDER_REVIEW" || !doc.file) throw new Error("A prova não está disponível para revisão.");
    if (!approved && !comment.trim()) throw new Error("Descreva os ajustes necessários para o professor.");
    return { ...doc, status: approved ? "APPROVED" : "CHANGES_REQUESTED", feedback: approved ? undefined : comment.trim() };
  });
}

export function submitDemoDocument(data: CalendarData, id: string, file: NonNullable<CalendarDocument["file"]>): CalendarData {
  return updateDemoDocument(data, id, (doc) => {
    if (doc.status !== "PENDING_SUBMISSION" && doc.status !== "CHANGES_REQUESTED") throw new Error("Esta prova não aceita um novo envio neste momento.");
    return { ...doc, status: "UNDER_REVIEW", feedback: undefined, file: { ...file, version: (doc.file?.version ?? 0) + 1 } };
  });
}
