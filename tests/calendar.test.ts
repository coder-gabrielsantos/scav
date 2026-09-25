import { describe, expect, it } from "vitest";
import { defaultDeadline, nextAssessmentMonday, schoolToday } from "@/features/calendar/calendar-date";
import { dayIndicator, documentIndicator } from "@/features/calendar/calendar-status";
import { createDemoData, scopeDemoData } from "@/features/calendar/demo-data";
import { reviewDemoDocument, scheduleDemoDate, submitDemoDocument } from "@/features/calendar/demo-transitions";
import { approvedForWeek, safePdfName } from "@/features/printing/downloads";
import type { CalendarSlot } from "@/features/calendar/calendar.types";

const today = "2026-05-14";
const now = Date.parse(`${today}T15:00:00Z`);
const data = createDemoData(today);
const slot = data.slots.find((item) => item.date === "2026-05-18" && item.areaId === "exatas")!;
const pending = { ...slot.documents[0], status: "PENDING_SUBMISSION" as const, file: undefined };

describe("datas da escola", () => {
  it("interpreta UTC no fuso da escola", () => expect(schoolToday(new Date("2026-05-15T01:00:00Z"))).toBe("2026-05-14"));
  it("segunda seguinte é estritamente posterior, inclusive na virada do ano", () => {
    expect(nextAssessmentMonday("2026-05-14")).toBe("2026-05-18");
    expect(nextAssessmentMonday("2026-05-18")).toBe("2026-05-25");
    expect(nextAssessmentMonday("2026-12-31")).toBe("2027-01-04");
  });
  it("prazo padrão é sexta-feira às 18h de Brasília", () => expect(defaultDeadline("2026-05-18")).toBe("2026-05-15T21:00:00.000Z"));
});

describe("indicadores", () => {
  it("atraso aparece apenas após o prazo", () => {
    expect(documentIndicator(pending, new Date(now).toISOString(), now)).toBe("neutral");
    expect(documentIndicator(pending, new Date(now - 1).toISOString(), now)).toBe("danger");
  });
  it("revisão após o prazo continua amarela", () => expect(documentIndicator({ ...pending, status: "UNDER_REVIEW" }, "2026-01-01T00:00:00Z", now)).toBe("review"));
  it("vermelho tem precedência sobre revisão", () => expect(dayIndicator([slot], now)).toBe("danger"));
  it("verde exige todas as provas aprovadas e todos os slots preenchidos", () => {
    const approved: CalendarSlot = { ...slot, documents: slot.documents.map((doc) => ({ ...doc, status: "APPROVED" })) };
    expect(dayIndicator([approved], now)).toBe("approved");
    expect(dayIndicator([approved, { ...slot, documents: [] }], now)).toBe("neutral");
    expect(dayIndicator([], now)).toBe("neutral");
    expect(dayIndicator([{ ...approved, documents: [...approved.documents, pending] }], now)).toBe("neutral");
  });
});

describe("fluxo demonstrativo", () => {
  it("reenvio gera nova versão, exige nova aprovação e libera a prova para impressão", () => {
    const id = slot.documents[0].id;
    const uploaded = submitDemoDocument(data, id, { name: "nova.pdf", size: 10, url: "blob:demo", version: 100 });
    const current = uploaded.slots.find((item) => item.id === slot.id)!.documents[0];
    expect(current.status).toBe("UNDER_REVIEW");
    expect(current.file?.version).toBe(2);
    expect(current.feedback).toBeUndefined();
    expect(approvedForWeek(uploaded.slots, "2026-05-18").some((row) => row.document.id === id)).toBe(false);
    const approved = reviewDemoDocument(uploaded, id, true, "");
    expect(approvedForWeek(approved.slots, "2026-05-18").some((row) => row.document.id === id)).toBe(true);
    expect(() => submitDemoDocument(approved, id, current.file!)).toThrow();
  });
  it("solicitação de ajustes exige comentário e só é aceita para prova em revisão", () => {
    const id = slot.documents[1].id;
    expect(() => reviewDemoDocument(data, id, false, "  ")).toThrow();
    expect(reviewDemoDocument(data, id, false, "Rever questão 1").slots.find((item) => item.id === slot.id)!.documents[1].feedback).toBe("Rever questão 1");
    expect(() => reviewDemoDocument(data, slot.documents[0].id, true, "")).toThrow();
  });
  it("agendamento cria pendências, rejeita dias inválidos e preserva provas enviadas", () => {
    const updated = scheduleDemoDate(data, "2026-06-01", ["exatas"], defaultDeadline("2026-06-01"), today);
    const created = updated.slots.find((item) => item.date === "2026-06-01")!;
    expect(created.documents).toHaveLength(2);
    expect(created.documents.every((doc) => doc.status === "PENDING_SUBMISSION")).toBe(true);
    expect(() => scheduleDemoDate(data, "2026-06-02", ["exatas"], defaultDeadline("2026-06-02"), today)).toThrow();
    expect(() => scheduleDemoDate(data, "2026-05-11", ["exatas"], defaultDeadline("2026-05-11"), today)).toThrow();
    expect(() => scheduleDemoDate(data, "2026-06-01", ["exatas"], "2026-06-01T12:00:00Z", today)).toThrow();
    expect(() => scheduleDemoDate(data, "2026-05-18", [], slot.deadline, today)).toThrow();
  });
});

describe("recortes demonstrativos", () => {
  it("professor recebe apenas suas provas e coordenador somente sua área", () => {
    expect(scopeDemoData(data, "PROFESSOR", today).slots.every((item) => item.documents.every((doc) => doc.teacherId === "demo-clara"))).toBe(true);
    expect(scopeDemoData(data, "COORDENACAO", today).slots.every((item) => item.areaId === "exatas")).toBe(true);
  });
  it("Secretaria recebe somente aprovadas da próxima segunda", () => {
    const scoped = scopeDemoData(data, "SECRETARIA", today);
    expect(scoped.slots).toHaveLength(1);
    expect(scoped.slots.every((item) => item.date === "2026-05-18" && item.documents.every((doc) => doc.status === "APPROVED"))).toBe(true);
    expect(approvedForWeek(data.slots, "2026-05-18")).toHaveLength(2);
    expect(approvedForWeek(data.slots, "2026-05-25")).toHaveLength(0);
  });
  it("nomes do ZIP removem caminhos e têm identificador único", () => {
    expect(safePdfName("Língua Portuguesa", "../id-1")).toBe("lingua-portuguesa-id-1.pdf");
  });
});
