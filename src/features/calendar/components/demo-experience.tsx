"use client";

import { useState } from "react";
import Select from "react-select";
import type { Role } from "@/generated/prisma/enums";
import { ROLE_LABEL } from "@/lib/routes";
import { WorkspaceFrame } from "@/components/layout/workspace-frame";
import type { CalendarData } from "../calendar.types";
import { AssessmentWorkspace } from "./assessment-workspace";

const ROLE_OPTIONS = Object.entries(ROLE_LABEL).map(([value, label]) => ({ value, label }));

export function DemoExperience({ initialData, initialNow }: { initialData: CalendarData; initialNow: string }) {
  const [role, setRole] = useState<Role>("GESTAO");
  return <WorkspaceFrame role={role} accountControls={<Select instanceId="demo-role-select" aria-label="Perfil de demonstração" value={ROLE_OPTIONS.find((option) => option.value === role)} onChange={(option) => option && setRole(option.value as Role)} options={ROLE_OPTIONS} unstyled classNames={{ control: () => "min-w-[160px] rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-foreground outline-none focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10 cursor-pointer", valueContainer: () => "px-1 py-0", input: () => "text-foreground", singleValue: () => "text-foreground", menu: () => "mt-1 overflow-hidden rounded-xl border border-border bg-white shadow-lg", menuList: () => "py-1", option: ({ isFocused }) => `px-3 py-2 text-sm font-medium ${isFocused ? "bg-secondary text-foreground" : "text-foreground"} cursor-pointer`, indicatorSeparator: () => "hidden", dropdownIndicator: () => "pl-2 text-muted-foreground", clearIndicator: () => "hidden" }} />}><AssessmentWorkspace role={role} initialData={initialData} initialNow={initialNow} /></WorkspaceFrame>;
}
