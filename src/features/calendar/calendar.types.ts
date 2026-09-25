import type { AssessmentStatus, Role } from "@/generated/prisma/enums";

export type CalendarRole = Exclude<Role, "SECRETARIA">;
export type Indicator = "danger" | "review" | "approved" | "neutral";
export type AreaId = "exatas" | "humanas" | "linguagens";
export type CalendarDocument = {
  id: string;
  subject: string;
  teacherId: string;
  teacher: string;
  status: AssessmentStatus;
  feedback?: string;
  file?: { name: string; url: string; size: number; version: number };
};
export type CalendarSlot = {
  id: string;
  date: string;
  areaId: AreaId;
  deadline: string;
  documents: CalendarDocument[];
};
export type CalendarData = { slots: CalendarSlot[] };

export const AREAS: { id: AreaId; label: string; short: string }[] = [
  { id: "exatas", label: "Ciências Exatas", short: "Exatas" },
  { id: "humanas", label: "Ciências Humanas", short: "Humanas" },
  { id: "linguagens", label: "Linguagens", short: "Linguagens" },
];

export const STATUS_LABEL = {
  PENDING_SUBMISSION: "Pendente de envio",
  UNDER_REVIEW: "Em revisão",
  APPROVED: "Aprovada",
  CHANGES_REQUESTED: "Ajuste solicitado",
} satisfies Record<AssessmentStatus, string>;

export const INDICATOR_LABEL: Record<Indicator, string> = {
  danger: "Requer atenção", review: "Em revisão", approved: "Tudo aprovado", neutral: "Envio pendente",
};
