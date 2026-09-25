import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/server/auth/password";

describe("senhas", () => {
  it("usa salt aleatório, valida senha e rejeita senha incorreta", async () => {
    const password = "Teste-local-12345";
    const first = await hashPassword(password);
    const second = await hashPassword(password);
    expect(first).not.toBe(second);
    expect(first).not.toContain(password);
    expect(await verifyPassword(password, first)).toBe(true);
    expect(await verifyPassword("Outra-senha-12345", first)).toBe(false);
  });
  it("rejeita ausência de hash, formato inválido e custo adulterado", async () => {
    expect(await verifyPassword("Teste-local-12345", null)).toBe(false);
    expect(await verifyPassword("Teste-local-12345", "scrypt$999999999$8$2$bad$bad")).toBe(false);
  });
  it("limita senhas antes de executar o algoritmo", async () => {
    await expect(hashPassword("curta")).rejects.toThrow();
    await expect(hashPassword("a".repeat(129))).rejects.toThrow();
    expect(await verifyPassword("a".repeat(129), null)).toBe(false);
  });
});
