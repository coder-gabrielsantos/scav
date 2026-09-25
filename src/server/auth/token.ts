import "server-only";
import type { JWT } from "next-auth/jwt";
import { getPrisma } from "@/server/db/prisma";
import { isRole } from "@/lib/access-policy";

/** Verificação real: nunca confiar só no perfil que permaneceu no JWT. */
export async function validateSessionToken(token: JWT): Promise<JWT | null> {
  if (!token.sub || !isRole(token.role) || !Number.isInteger(token.authVersion)) return null;
  const user = await getPrisma().user.findUnique({
    where: { id: token.sub },
    select: { isActive: true, role: true, authVersion: true },
  });
  if (!user?.isActive || user.role !== token.role || user.authVersion !== token.authVersion) return null;
  return token;
}
