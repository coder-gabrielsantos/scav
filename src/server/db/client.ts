import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../../generated/prisma/client";

// Factory reutilizada pelos scripts locais. Na aplicação, importar prisma.ts.
export function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL não configurada.");
  const adapter = new PrismaMariaDb(connectionString);
  return new PrismaClient({ adapter });
}
