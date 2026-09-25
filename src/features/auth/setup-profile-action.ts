"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { getPrisma } from "@/server/db/prisma";

export type SetupProfileState = { error?: string; success?: boolean };

const setupSchema = z.object({
  name: z.string().trim().min(1).max(191),
  institutionName: z.string().trim().min(1).max(191),
});

export async function setupProfileAction(
  _prev: SetupProfileState,
  formData: FormData,
): Promise<SetupProfileState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Sessão expirada. Faça login novamente." };

  const parsed = setupSchema.safeParse({
    name: formData.get("name"),
    institutionName: formData.get("institutionName"),
  });
  if (!parsed.success) {
    return { error: "Preencha todos os campos corretamente." };
  }

  const { name, institutionName } = parsed.data;

  await getPrisma().user.update({
    where: { id: session.user.id },
    data: {
      name,
      institutionName,
    },
  });

  return { success: true };
}
