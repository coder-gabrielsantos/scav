import "dotenv/config";
import { loginSchema } from "../src/features/auth/schemas";
import { hashPassword } from "../src/server/auth/password";
import { createPrismaClient } from "../src/server/db/client";

async function main() {
  const parsed = loginSchema.safeParse({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
  const name = process.env.ADMIN_NAME?.trim();
  if (!parsed.success || !name || name.length > 100 || parsed.data.password.length < 12) {
    throw new Error("Configure ADMIN_EMAIL, ADMIN_NAME (até 100 caracteres) e ADMIN_PASSWORD (12 a 128 caracteres).");
  }
  const db = createPrismaClient();
  try {
    if (await db.user.findUnique({ where: { email: parsed.data.email }, select: { id: true } })) {
      throw new Error("O e-mail já está cadastrado. Nenhuma conta ou senha foi alterada.");
    }
    const passwordHash = await hashPassword(parsed.data.password);
    await db.user.create({ data: { email: parsed.data.email, name, passwordHash, role: "GESTAO", isActive: true } });
    console.log("Conta de Gestão criada e ativada.");
  } finally {
    delete process.env.ADMIN_PASSWORD;
    await db.$disconnect();
  }
}

main().catch((error: unknown) => {
  // Não imprimir erro do driver: pode conter detalhes da conexão.
  console.error(error instanceof Error && (error.message.startsWith("Configure ADMIN_") || error.message.startsWith("O e-mail"))
    ? error.message : "Não foi possível criar a conta. Verifique a conexão, as migrações e as variáveis de ambiente.");
  process.exitCode = 1;
});
