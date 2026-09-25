import type { Metadata } from "next";
import { schoolToday } from "@/features/calendar/calendar-date";
import { createDemoData } from "@/features/calendar/demo-data";
import { DemoExperience } from "@/features/calendar/components/demo-experience";

export const metadata: Metadata = { title: "Demonstração", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function DemoPage() {
  const now = new Date();
  return <DemoExperience initialNow={now.toISOString()} initialData={createDemoData(schoolToday(now))} />;
}
