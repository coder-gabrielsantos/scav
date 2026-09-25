import "server-only";
import { createPrismaClient } from "./client";

const globalForPrisma = globalThis as unknown as {
  scavPrisma?: ReturnType<typeof createPrismaClient>;
};

// Inicialização preguiçosa: builds e requisições anônimas não abrem conexão.
export function getPrisma() {
  return (globalForPrisma.scavPrisma ??= createPrismaClient());
}
