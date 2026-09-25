import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const PREFIX = "scrypt$65536$8$2";
const SALT_BYTES = 16;
const KEY_BYTES = 64;

function derive(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_BYTES, { N: 65536, r: 8, p: 2, maxmem: 96 * 1024 * 1024 }, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });
}

export async function hashPassword(password: string) {
  if (password.length < 12 || password.length > 128) {
    throw new Error("A senha deve ter entre 12 e 128 caracteres.");
  }
  const salt = randomBytes(SALT_BYTES);
  const key = await derive(password, salt);
  return `${PREFIX}$${salt.toString("hex")}$${key.toString("hex")}`;
}

// Hash público sem usuário associado: mantém o custo para e-mails inexistentes.
const DUMMY_HASH = `${PREFIX}$${"0".repeat(SALT_BYTES * 2)}$${"0".repeat(KEY_BYTES * 2)}`;

export async function verifyPassword(password: string, storedHash: string | null) {
  if (!password || password.length > 128) return false;
  const hash = storedHash ?? DUMMY_HASH;
  const parts = hash.split("$");
  const validFormat = parts.length === 6 && parts.slice(0, 4).join("$") === PREFIX
    && /^[a-f0-9]{32}$/.test(parts[4]) && /^[a-f0-9]{128}$/.test(parts[5]);
  const safeParts = validFormat ? parts : DUMMY_HASH.split("$");
  const actual = await derive(password, Buffer.from(safeParts[4], "hex"));
  const expected = Buffer.from(safeParts[5], "hex");
  const matches = timingSafeEqual(actual, expected);
  return storedHash !== null && validFormat && matches;
}
