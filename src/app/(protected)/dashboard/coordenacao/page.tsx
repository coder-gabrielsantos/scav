import type { Metadata } from "next";
import { DemoSurface } from "@/features/calendar/demo-surface";
import { requireRole } from "@/server/auth/guards";

export const metadata: Metadata = { title: "Coordenação" };

export default async function CoordinationPage() {
  await requireRole("COORDENACAO");
  return <DemoSurface role="COORDENACAO" />;
}
