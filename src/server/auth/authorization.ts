import "server-only";
import type { Role } from "@/generated/prisma/enums";
import { getCurrentUser } from "./session";
import { getPrisma } from "@/server/db/prisma";

export class AuthorizationError extends Error {
  constructor(public readonly status: 401 | 403) {
    super(status === 401 ? "Autenticação necessária." : "Acesso não permitido.");
    this.name = "AuthorizationError";
  }
}

// Para Server Actions e Route Handlers: capturar e retornar resultado/HTTP 401/403.
export async function authorizeUser(roles?: readonly Role[]) {
  const user = await getCurrentUser();
  if (!user) throw new AuthorizationError(401);
  if (!user.isActive || (roles && !roles.includes(user.role))) throw new AuthorizationError(403);
  return user;
}

export async function authorizeCoordinatorArea(subjectAreaId: string) {
  const user = await authorizeUser(["COORDENACAO"]);
  const membership = await getPrisma().areaCoordinator.findUnique({
    where: { subjectAreaId_coordinatorId: { subjectAreaId, coordinatorId: user.id } },
    select: { subjectArea: { select: { isActive: true } } },
  });
  if (!membership?.subjectArea.isActive) throw new AuthorizationError(403);
  return user;
}
