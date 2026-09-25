import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ upsert: vi.fn(), update: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/server/db/prisma", () => ({ getPrisma: () => ({ loginAttemptBucket: mocks }) }));
import { consumeLoginAttempt, LOGIN_WINDOW_MS } from "@/server/auth/login-throttle";

beforeEach(() => { mocks.upsert.mockResolvedValue({ attempts: 1 }); });

it("permite até dez tentativas e bloqueia a décima primeira", async () => {
  mocks.upsert.mockResolvedValueOnce({ attempts: 10 }).mockResolvedValueOnce({ attempts: 11 });
  expect(await consumeLoginAttempt("p@example.test", 1000)).toBe(true);
  expect(await consumeLoginAttempt("p@example.test", 1000)).toBe(false);
  expect(mocks.upsert.mock.calls[0][0].update).toEqual({ attempts: { increment: 1 } });
});

it("isola e-mails e renova a chave na próxima janela", async () => {
  await consumeLoginAttempt("p@example.test", 1000);
  await consumeLoginAttempt("p@example.test", 2000);
  await consumeLoginAttempt("p@example.test", LOGIN_WINDOW_MS);
  await consumeLoginAttempt("q@example.test", 1000);
  const keys = mocks.upsert.mock.calls.map(([arg]) => arg.where.key);
  expect(keys[0]).toBe(keys[1]);
  expect(keys[0]).not.toBe(keys[2]);
  expect(keys[0]).not.toBe(keys[3]);
  expect(keys[0]).toMatch(/^[a-f0-9]{64}$/);
});

it("repete incremento após disputa na criação do contador", async () => {
  mocks.upsert.mockRejectedValueOnce({ code: "P2002" });
  mocks.update.mockResolvedValueOnce({ attempts: 11 });
  expect(await consumeLoginAttempt("p@example.test", 1000)).toBe(false);
  expect(mocks.update).toHaveBeenCalledOnce();
});

it("não ignora indisponibilidade do contador", async () => {
  mocks.upsert.mockRejectedValueOnce(new Error("Database unavailable"));
  await expect(consumeLoginAttempt("p@example.test")).rejects.toThrow();
});
