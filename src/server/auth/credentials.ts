import "server-only";
import { loginSchema } from "@/features/auth/schemas";
import { getPrisma } from "@/server/db/prisma";
import { consumeLoginAttempt } from "./login-throttle";
import { verifyPassword } from "./password";

export async function authenticateCredentials(credentials: unknown) {
  const parsed = loginSchema.safeParse(credentials);
  if (!parsed.success) return null;
  const { email, password } = parsed.data;
  if (!(await consumeLoginAttempt(email))) return null;

  const user = await getPrisma().user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, role: true, isActive: true, passwordHash: true, authVersion: true },
  });
  const validPassword = await verifyPassword(password, user?.passwordHash ?? null);
  if (!user || !user.isActive || !validPassword) return null;

  return { id: user.id, name: user.name, email: user.email, role: user.role, authVersion: user.authVersion };
}
