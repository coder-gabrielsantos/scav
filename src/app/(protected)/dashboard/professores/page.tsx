import type { Metadata } from "next";
import { DemoSurface } from "@/features/calendar/demo-surface";
import { requireRole } from "@/server/auth/guards";

export const metadata: Metadata = { title: "Professores" };

export default async function TeachersPage() {
  await requireRole("PROFESSOR");
  return <DemoSurface role="PROFESSOR" />;
}
