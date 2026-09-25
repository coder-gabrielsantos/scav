import type { Role } from "@/generated/prisma/enums";

export const ROLE_HOME = {
  GESTAO: "/dashboard/gestao",
  COORDENACAO: "/dashboard/coordenacao",
  PROFESSOR: "/dashboard/professores",
  SECRETARIA: "/dashboard/secretaria",
} as const satisfies Record<Role, string>;

export const ROLE_LABEL = {
  GESTAO: "Gestão",
  COORDENACAO: "Coordenação",
  PROFESSOR: "Professores",
  SECRETARIA: "Secretaria",
} as const satisfies Record<Role, string>;
