import type { Role } from "@/generated/prisma/enums";
import { ROLE_HOME } from "./routes";

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && Object.hasOwn(ROLE_HOME, value);
}

export function dashboardDestination(pathname: string, role: unknown): string | null {
  if (!isRole(role)) return "/login";
  if (pathname === "/dashboard" || pathname === "/dashboard/") return ROLE_HOME[role];
  const ownRoot = ROLE_HOME[role];
  if (pathname === ownRoot || pathname.startsWith(`${ownRoot}/`)) return null;
  return "/acesso-negado";
}
