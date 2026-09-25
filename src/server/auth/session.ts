import "server-only";
import { cache } from "react";
import { auth } from "@/auth";
import type { Role } from "@/generated/prisma/enums";

export type CurrentUser = {
  id: string;
  name: string | null;
  role: Role;
  isActive: boolean;
};

// cache() deduplica somente dentro da renderização atual, nunca entre usuários.
// auth() usa validateSessionToken(), que confere conta, perfil e versão no MySQL.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth();
  if (!session?.user?.id) return null;
  return { id: session.user.id, name: session.user.name ?? null, role: session.user.role, isActive: true };
});
