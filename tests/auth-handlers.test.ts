import { beforeAll, beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => {
  process.env.AUTH_SECRET = "test-only-secret-with-more-than-thirty-two-characters";
  process.env.AUTH_URL = "http://localhost:3000";
  return { findUnique: vi.fn(), upsert: vi.fn() };
});
vi.mock("server-only", () => ({}));
vi.mock("@/server/db/prisma", () => ({ getPrisma: () => ({ user: { findUnique: mocks.findUnique }, loginAttemptBucket: { upsert: mocks.upsert } }) }));

import { handlers } from "@/auth";
import { hashPassword } from "@/server/auth/password";

let passwordHash: string;
const password = "Teste-integracao-12345";
beforeAll(async () => { passwordHash = await hashPassword(password); });
beforeEach(() => { mocks.upsert.mockResolvedValue({ attempts: 1 }); });

function cookies(response: Response) {
  return response.headers.getSetCookie().map((cookie) => cookie.split(";")[0]).join("; ");
}

async function login() {
  const csrf = await handlers.GET(new NextRequest("http://localhost:3000/api/auth/csrf"));
  const { csrfToken } = await csrf.json();
  return handlers.POST(new NextRequest("http://localhost:3000/api/auth/callback/credentials", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", cookie: cookies(csrf), "X-Auth-Return-Redirect": "1" },
    body: new URLSearchParams({ csrfToken, email: "p@example.test", password, callbackUrl: "https://external.example/steal" }),
  }));
}

for (const role of ["GESTAO", "COORDENACAO", "PROFESSOR", "SECRETARIA"]) {
  it(`Auth.js: autentica ${role}, emite cookie HttpOnly e expõe sessão mínima`, async () => {
    mocks.findUnique.mockResolvedValue({ id: "user-1", name: "Usuário", email: "p@example.test", role, isActive: true, authVersion: 0, passwordHash });
    const response = await login();
    expect((await response.json()).url).toBe("http://localhost:3000/dashboard");
    const sessionCookie = response.headers.getSetCookie().find((cookie) => cookie.startsWith("authjs.session-token="));
    expect(sessionCookie).toContain("HttpOnly");
    expect(sessionCookie).toContain("SameSite=Lax");
    expect(sessionCookie).not.toContain(passwordHash);
    const sessionResponse = await handlers.GET(new NextRequest("http://localhost:3000/api/auth/session", { headers: { cookie: cookies(response) } }));
    const session = await sessionResponse.json();
    expect(session.user).toMatchObject({ id: "user-1", role });
    expect(session.user).not.toHaveProperty("passwordHash");
    expect(session.user).not.toHaveProperty("authVersion");
    // O mesmo cookie para de autenticar assim que a conta é desativada no banco.
    mocks.findUnique.mockResolvedValue({ isActive: false, role, authVersion: 0 });
    const revoked = await handlers.GET(new NextRequest("http://localhost:3000/api/auth/session", { headers: { cookie: cookies(response) } }));
    expect(await revoked.json()).toBeNull();
  });
}

it("Auth.js: bloqueia POST de credenciais sem CSRF antes de consultar o banco", async () => {
  const response = await handlers.POST(new NextRequest("http://localhost:3000/api/auth/callback/credentials", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", "X-Auth-Return-Redirect": "1" },
    body: new URLSearchParams({ email: "p@example.test", password }),
  }));
  expect((await response.json()).url).toContain("MissingCSRF");
  expect(mocks.findUnique).not.toHaveBeenCalled();
});
