import "server-only";
import { redirect } from "next/navigation";
import type { Role } from "@/generated/prisma/enums";
import { getCurrentUser } from "./session";

// Guardas de navegação. APIs devem retornar 401/403, sem redirecionar downloads.
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.isActive) redirect("/acesso-negado");
  return user;
}

export async function requireRole(role: Role) {
  const user = await requireUser();
  if (user.role !== role) redirect("/acesso-negado");
  return user;
}
