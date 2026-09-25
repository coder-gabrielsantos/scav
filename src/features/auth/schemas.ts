import { z } from "zod";
import type { Role } from "@/generated/prisma/enums";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().max(191).email(),
  password: z.string().min(1).max(128),
});

export type LoginState = { error?: string };

export const INVITE_ROLES: readonly Role[] = ["COORDENACAO", "PROFESSOR", "SECRETARIA"] as const;

export const createInviteSchema = z.object({
  email: z.string().trim().toLowerCase().max(191).email(),
  role: z.enum(INVITE_ROLES as unknown as [Role, ...Role[]]),
});

export type CreateInviteState = { error?: string; success?: string; inviteUrl?: string };
