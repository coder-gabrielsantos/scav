import type { CalendarDocument, CalendarSlot, Indicator } from "./calendar.types";

export function documentIndicator(document: CalendarDocument, deadline: string, now: number): Indicator {
  if (document.status === "CHANGES_REQUESTED") return "danger";
  if (document.status === "PENDING_SUBMISSION" && Date.parse(deadline) < now) return "danger";
  if (document.status === "UNDER_REVIEW") return "review";
  if (document.status === "APPROVED") return "approved";
  return "neutral";
}

export function dayIndicator(slots: CalendarSlot[], now: number): Indicator {
  const tones = slots.flatMap((slot) => slot.documents.map((document) => documentIndicator(document, slot.deadline, now)));
  if (tones.includes("danger")) return "danger";
  if (tones.includes("review")) return "review";
  if (slots.length > 0 && slots.every((slot) => slot.documents.length > 0) && tones.every((tone) => tone === "approved")) return "approved";
  return "neutral";
}

export function visibleSummary(slots: CalendarSlot[], now: number) {
  const documents = slots.flatMap((slot) => slot.documents);
  return {
    total: documents.length,
    pending: documents.filter((doc) => doc.status === "PENDING_SUBMISSION" || doc.status === "CHANGES_REQUESTED").length,
    review: documents.filter((doc) => doc.status === "UNDER_REVIEW").length,
    approved: documents.filter((doc) => doc.status === "APPROVED").length,
    attention: slots.reduce((sum, slot) => sum + slot.documents.filter((doc) => documentIndicator(doc, slot.deadline, now) === "danger").length, 0),
  };
}
