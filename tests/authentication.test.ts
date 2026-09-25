import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findUnique: vi.fn(), consume: vi.fn(), verify: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/server/db/prisma", () => ({ getPrisma: () => ({ user: { findUnique: mocks.findUnique } }) }));
vi.mock("@/server/auth/login-throttle", () => ({ consumeLoginAttempt: mocks.consume }));
vi.mock("@/server/auth/password", () => ({ verifyPassword: mocks.verify }));

import { authenticateCredentials } from "@/server/auth/credentials";
import { validateSessionToken } from "@/server/auth/token";

const user = { id: "teacher-1", name: "Professor", email: "professor@example.test", role: "PROFESSOR", isActive: true, passwordHash: "private-hash", authVersion: 2 };
const credentials = { email: " PROFESSOR@example.test ", password: "Senha-teste-12345", role: "GESTAO" };

beforeEach(() => {
  mocks.findUnique.mockResolvedValue({ ...user });
  mocks.consume.mockResolvedValue(true);
  mocks.verify.mockResolvedValue(true);
});

describe("credenciais", () => {
  it("normaliza e-mail, ignora perfil enviado e não expõe hash", async () => {
    const result = await authenticateCredentials(credentials);
    expect(result).toEqual({ id: user.id, name: user.name, email: user.email, role: "PROFESSOR", authVersion: 2 });
    expect(mocks.consume).toHaveBeenCalledWith(user.email);
    expect(mocks.findUnique.mock.calls[0][0].where).toEqual({ email: user.email });
    expect(result).not.toHaveProperty("passwordHash");
  });
  it("nega payload inválido antes de consultar o banco", async () => {
    expect(await authenticateCredentials({ email: "inválido", password: [] })).toBeNull();
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });
  it("nega conta inativa mesmo com senha correta", async () => {
    mocks.findUnique.mockResolvedValue({ ...user, isActive: false });
    expect(await authenticateCredentials(credentials)).toBeNull();
  });
  it("nega usuário inexistente e ainda executa verificação de senha", async () => {
    mocks.findUnique.mockResolvedValue(null);
    expect(await authenticateCredentials(credentials)).toBeNull();
    expect(mocks.verify).toHaveBeenCalledWith(credentials.password, null);
  });
  it("nega senha incorreta", async () => {
    mocks.verify.mockResolvedValue(false);
    expect(await authenticateCredentials(credentials)).toBeNull();
  });
  it("limite bloqueia consulta de usuário e custo do hash", async () => {
    mocks.consume.mockResolvedValue(false);
    expect(await authenticateCredentials(credentials)).toBeNull();
    expect(mocks.findUnique).not.toHaveBeenCalled();
    expect(mocks.verify).not.toHaveBeenCalled();
  });
  it("falha de banco não concede acesso", async () => {
    mocks.findUnique.mockRejectedValue(new Error("Database unavailable"));
    await expect(authenticateCredentials(credentials)).rejects.toThrow();
  });
});

describe("revalidação da sessão no banco", () => {
  const token = { sub: user.id, role: "PROFESSOR" as const, authVersion: 2 };
  it("aceita apenas conta ativa com mesmo perfil e versão", async () => {
    expect(await validateSessionToken(token)).toEqual(token);
  });
  it.each([
    ["conta removida", null],
    ["conta desativada", { ...user, isActive: false }],
    ["perfil alterado", { ...user, role: "GESTAO" }],
    ["sessão revogada", { ...user, authVersion: 3 }],
  ])("invalida %s", async (_reason, storedUser) => {
    mocks.findUnique.mockResolvedValue(storedUser);
    expect(await validateSessionToken(token)).toBeNull();
  });
  it("nega token incompleto antes de consultar banco", async () => {
    expect(await validateSessionToken({ sub: user.id })).toBeNull();
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });
});
