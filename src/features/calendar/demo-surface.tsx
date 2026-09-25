import type { Role } from "@/generated/prisma/enums";
import { schoolToday } from "./calendar-date";
import { createDemoData, scopeDemoData } from "./demo-data";
import { AssessmentWorkspace } from "./components/assessment-workspace";

// Server Component: os dashboards recebem somente o recorte fictício de seu perfil.
export function DemoSurface({ role }: { role: Role }) {
  const now = new Date();
  const today = schoolToday(now);
  return <AssessmentWorkspace role={role} initialNow={now.toISOString()} initialData={scopeDemoData(createDemoData(today), role, today)} />;
}
