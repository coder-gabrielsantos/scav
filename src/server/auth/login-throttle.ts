import "server-only";
import { createHash } from "node:crypto";
import { getPrisma } from "@/server/db/prisma";

export const LOGIN_WINDOW_MS = 15 * 60 * 1000;
export const LOGIN_ATTEMPT_LIMIT = 10;

export async function consumeLoginAttempt(email: string, now = Date.now()) {
  const window = Math.floor(now / LOGIN_WINDOW_MS);
  const key = createHash("sha256").update(`${email}:${window}`).digest("hex");
  const db = getPrisma();
  const bucket = await db.loginAttemptBucket.upsert({
    where: { key },
    create: { key, attempts: 1, expiresAt: new Date((window + 1) * LOGIN_WINDOW_MS) },
    update: { attempts: { increment: 1 } },
  }).catch(async (error: unknown) => {
    // MySQL pode disputar a criação do mesmo contador entre instâncias.
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return db.loginAttemptBucket.update({ where: { key }, data: { attempts: { increment: 1 } } });
    }
    throw error;
  });
  return bucket.attempts <= LOGIN_ATTEMPT_LIMIT;
}
