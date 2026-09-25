import "dotenv/config";
import { createPrismaClient } from "../src/server/db/client";

const db = createPrismaClient();
try {
  const result = await db.loginAttemptBucket.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  console.log(`${result.count} contadores expirados removidos.`);
} finally {
  await db.$disconnect();
}
