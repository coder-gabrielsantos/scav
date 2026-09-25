import type { Metadata } from "next";
import { DemoSurface } from "@/features/calendar/demo-surface";
import { requireRole } from "@/server/auth/guards";

export const metadata: Metadata = { title: "Impressões da semana" };

export default async function SecretariatPage() {
  await requireRole("SECRETARIA");
  return <DemoSurface role="SECRETARIA" />;
}
