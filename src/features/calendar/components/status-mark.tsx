import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { documentIndicator } from "../calendar-status";
import { STATUS_LABEL, type CalendarDocument, type Indicator } from "../calendar.types";

export const toneClass: Record<Indicator, string> = {
  danger: "bg-rose-50 text-rose-800 border-rose-100",
  review: "bg-amber-50 text-amber-900 border-amber-100",
  approved: "bg-emerald-50 text-emerald-800 border-emerald-100",
  neutral: "bg-slate-100 text-slate-600 border-slate-200",
};
const dotClass: Record<Indicator, string> = { danger: "bg-rose-500", review: "bg-amber-400", approved: "bg-emerald-500", neutral: "bg-slate-400" };

export function StatusDot({ tone }: { tone: Indicator }) {
  return <span aria-hidden="true" className={cn("inline-block size-1.5 shrink-0 rounded-full", dotClass[tone])} />;
}

export function DocumentBadge({ document, deadline, now }: { document: CalendarDocument; deadline: string; now: number }) {
  const tone = documentIndicator(document, deadline, now);
  return <Badge variant="outline" className={cn("gap-1.5 rounded-md px-2 py-1 font-medium", toneClass[tone])}><StatusDot tone={tone} />{document.status === "PENDING_SUBMISSION" && tone === "danger" ? "Envio atrasado" : STATUS_LABEL[document.status]}</Badge>;
}
