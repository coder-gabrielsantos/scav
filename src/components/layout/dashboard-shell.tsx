import type { ReactNode } from "react";
import type { Role } from "@/generated/prisma/enums";
import { logoutAction } from "@/features/auth/actions";
import { WorkspaceFrame } from "./workspace-frame";

export function DashboardShell({ role, children }: { role: Role; children: ReactNode }) {
  return <WorkspaceFrame role={role} accountControls={<form action={logoutAction}><button type="submit" className="rounded underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4">Sair da conta</button></form>}>{children}</WorkspaceFrame>;
}
