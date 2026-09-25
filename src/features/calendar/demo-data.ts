import { addDays, parseISO } from "date-fns";
import type { Role } from "@/generated/prisma/enums";
import { civilDate, defaultDeadline, nextAssessmentMonday } from "./calendar-date";
import { AREAS, type AreaId, type CalendarData, type CalendarDocument, type CalendarSlot } from "./calendar.types";

// Somente personagens e registros fictícios. Nunca mapeia usuários reais.
export const DEMO_TEACHER_ID = "demo-clara";
export const DEMO_COORDINATOR_AREA: AreaId = "exatas";
const SUBJECTS = [
  { areaId: "exatas", subject: "Matemática", teacherId: DEMO_TEACHER_ID, teacher: "Clara Oliveira" },
  { areaId: "exatas", subject: "Física", teacherId: "demo-diego", teacher: "Diego Santos" },
  { areaId: "humanas", subject: "História", teacherId: "demo-ana", teacher: "Ana Ferreira" },
  { areaId: "humanas", subject: "Geografia", teacherId: "demo-lucas", teacher: "Lucas Almeida" },
  { areaId: "linguagens", subject: "Língua Portuguesa", teacherId: "demo-beatriz", teacher: "Beatriz Lima" },
] as const;

export function newDemoSlot(date: string, areaId: AreaId, deadline: string): CalendarSlot {
  return {
    id: `${date}-${areaId}`, date, areaId, deadline,
    documents: SUBJECTS.filter((subject) => subject.areaId === areaId).map(({ subject, teacherId, teacher }) => ({
      id: `${date}-${teacherId}`, subject, teacherId, teacher, status: "PENDING_SUBMISSION",
    })),
  };
}

export function createDemoData(today: string): CalendarData {
  const next = parseISO(nextAssessmentMonday(today));
  return { slots: [-21, -14, -7, 0, 7].flatMap((offset) => {
    const date = civilDate(addDays(next, offset));
    return AREAS.map((area) => {
      const slot = newDemoSlot(date, area.id, defaultDeadline(date));
      slot.documents = slot.documents.map((document): CalendarDocument => {
        let status: CalendarDocument["status"] = "APPROVED";
        if (offset === -14) status = document.teacherId === DEMO_TEACHER_ID ? "PENDING_SUBMISSION" : "CHANGES_REQUESTED";
        if (offset === -7) status = "UNDER_REVIEW";
        if (offset === 0) status = document.teacherId === DEMO_TEACHER_ID ? "CHANGES_REQUESTED" : area.id === "humanas" ? "APPROVED" : "UNDER_REVIEW";
        if (offset === 7) status = "PENDING_SUBMISSION";
        return { ...document, status,
          feedback: status === "CHANGES_REQUESTED" ? "Revise o enunciado da questão 3 e inclua o valor de cada questão." : undefined,
          file: status !== "PENDING_SUBMISSION" ? { name: `avaliacao-${date}.pdf`, url: "/demo/avaliacao-exemplo.pdf", size: 1215, version: 1 } : undefined,
        };
      });
      return slot;
    });
  }) };
}

export function scopeDemoData(data: CalendarData, role: Role, today: string): CalendarData {
  if (role === "GESTAO") return data;
  if (role === "COORDENACAO") return { slots: data.slots.filter((slot) => slot.areaId === DEMO_COORDINATOR_AREA) };
  if (role === "PROFESSOR") return { slots: data.slots.map((slot) => ({ ...slot, documents: slot.documents.filter((doc) => doc.teacherId === DEMO_TEACHER_ID) })).filter((slot) => slot.documents.length > 0) };
  return { slots: data.slots.filter((slot) => slot.date === nextAssessmentMonday(today)).map((slot) => ({ ...slot, documents: slot.documents.filter((doc) => doc.status === "APPROVED") })).filter((slot) => slot.documents.length > 0) };
}
