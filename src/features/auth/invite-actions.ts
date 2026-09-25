"use server";

import { randomBytes } from "node:crypto";
import { addDays } from "date-fns";
import { authorizeUser } from "@/server/auth/authorization";
import { getPrisma } from "@/server/db/prisma";
import { sendInviteEmail } from "@/server/email/resend";
import { createInviteSchema, type CreateInviteState } from "./schemas";

const ROLE_LABELS: Record<string, string> = {
 GESTAO: "Gestão",
 COORDENACAO: "Coordenação",
 PROFESSOR: "Professor(a)",
 SECRETARIA: "Secretaria",
};

export async function createInviteAction(
  _previous: CreateInviteState,
  formData: FormData,
): Promise<CreateInviteState> {
  const user = await authorizeUser(["GESTAO"]);

  const parsed = createInviteSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { error: "Informe um e-mail válido e selecione um perfil." };
  }

  const { email, role } = parsed.data;

  // Verifica se já existe usuário ativo com esse e-mail
  const existing = await getPrisma().user.findUnique({
    where: { email },
    select: { id: true, isActive: true },
  });
  if (existing?.isActive) {
    return { error: "Já existe uma conta ativa com este e-mail." };
  }

  // Revoga convites anteriores não aceitos para o mesmo e-mail
  await getPrisma().userInvite.updateMany({
    where: { email, acceptedAt: null, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  const token = randomBytes(32).toString("base64url");
  const expiresAt = addDays(new Date(), 7);

  await getPrisma().userInvite.create({
    data: {
      email,
      token,
      role,
      invitedById: user.id,
      expiresAt,
    },
  });

  const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000";
  const inviteUrl = `${baseUrl}/convite/${token}`;

  try {
    await sendInviteEmail(email, inviteUrl, ROLE_LABELS[role]);
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? `Convite criado, mas falha ao enviar e-mail: ${err.message}`
          : "Convite criado, mas falha ao enviar e-mail.",
      inviteUrl,
    };
  }

  return { success: `Convite enviado para ${email}`, inviteUrl };
}