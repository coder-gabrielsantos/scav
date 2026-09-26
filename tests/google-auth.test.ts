import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextAuthConfig } from "next-auth";

const mocks = vi.hoisted(() => ({
  config: null as NextAuthConfig | null,
  findUnique: vi.fn(),
  findFirst: vi.fn(),
  upsert: vi.fn(),
  update: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next-auth", () => ({
  default: (config: NextAuthConfig) => {
    mocks.config = config;
    return { handlers: {}, auth: vi.fn(), signIn: vi.fn(), signOut: vi.fn() };
  },
}));
vi.mock("@/server/db/prisma", () => ({
  getPrisma: () => ({
    user: { findUnique: mocks.findUnique, upsert: mocks.upsert },
    userInvite: { findFirst: mocks.findFirst, update: mocks.update },
  }),
}));

import "@/auth";

const googleAccount = { provider: "google", type: "oidc", providerAccountId: "google-123" };
const googleProfile = { email_verified: true };

function signIn() {
  return mocks.config!.callbacks!.signIn!;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.findFirst.mockResolvedValue(null);
  mocks.upsert.mockResolvedValue({ id: "local-1", role: "GESTAO", isActive: true, authVersion: 0 });
  mocks.update.mockResolvedValue({});
});

describe("login com Google", () => {
  it("combina PKCE com state no fluxo OAuth", () => {
    const google = mocks.config!.providers[0] as { options?: { checks?: string[] } };
    expect(google.options?.checks).toEqual(["pkce", "state"]);
  });

  it("preserva os destinos de recusa sem permitir callback externo", async () => {
    const redirect = mocks.config!.callbacks!.redirect!;
    const baseUrl = "http://localhost:3000";
    expect(await redirect({ url: "/acesso-negado?reason=no-invite", baseUrl })).toBe(`${baseUrl}/acesso-negado?reason=no-invite`);
    expect(await redirect({ url: "https://example.test/elsewhere", baseUrl })).toBe(`${baseUrl}/dashboard`);
  });

  it("usa identidade, perfil e versão do banco na sessão", async () => {
    const stored = { id: "local-1", isActive: true, role: "GESTAO", authVersion: 3 };
    mocks.findUnique.mockResolvedValue(stored);
    const user = { id: "google-123", email: "GESTAO@EXAMPLE.TEST", name: "Gestão" };

    expect(await signIn()({ user, account: googleAccount, profile: googleProfile } as never)).toBe(true);
    expect(mocks.findUnique.mock.calls[0][0].where).toEqual({ email: "gestao@example.test" });
    expect(user).toMatchObject({ id: "local-1", role: "GESTAO", authVersion: 3 });

    const token = await mocks.config!.callbacks!.jwt!({ token: {}, user } as never);
    expect(token).toMatchObject({ sub: "local-1", role: "GESTAO", authVersion: 3 });
    expect(mocks.findUnique.mock.calls[1][0].where).toEqual({ id: "local-1" });
  });

  it("não aceita e-mail Google sem verificação", async () => {
    const result = await signIn()({
      user: { email: "gestao@example.test" },
      account: googleAccount,
      profile: { email_verified: false },
    } as never);
    expect(result).toBe("/acesso-negado?reason=unverified-email");
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it("cadastra novo gestor com Google verificado e emite identidade local", async () => {
    mocks.findUnique.mockImplementation(({ where }) => Promise.resolve(where.email
      ? null
      : { id: "local-1", isActive: true, role: "GESTAO", authVersion: 0 }));
    const user = { id: "google-123", email: "novo@example.test", name: "Novo gestor" };
    const result = await signIn()({
      user, account: googleAccount, profile: googleProfile,
    } as never);
    expect(result).toBe(true);
    expect(mocks.upsert.mock.calls[0][0].create).toMatchObject({ role: "GESTAO", isActive: true });
    expect(user).toMatchObject({ id: "local-1", role: "GESTAO", authVersion: 0 });
    const token = await mocks.config!.callbacks!.jwt!({ token: {}, user } as never);
    expect(token).toMatchObject({ sub: "local-1", role: "GESTAO", authVersion: 0 });
  });

  it("não ativa uma conta inativa sem convite", async () => {
    mocks.findUnique.mockResolvedValue({ id: "local-1", isActive: false });
    const result = await signIn()({
      user: { email: "inativo@example.test" }, account: googleAccount, profile: googleProfile,
    } as never);
    expect(result).toBe("/acesso-negado?reason=inactive");
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("ativa o usuário convidado com o perfil definido pela gestão", async () => {
    mocks.findUnique.mockResolvedValue(null);
    mocks.findFirst.mockResolvedValue({ id: "invite-1", role: "PROFESSOR", invitedBy: { institutionName: "Escola Exemplo" } });
    mocks.upsert.mockResolvedValue({ id: "teacher-1", role: "PROFESSOR", authVersion: 0 });
    const user = { email: "professor@example.test", name: "Professor" };
    const result = await signIn()({
      user,
      account: googleAccount,
      profile: googleProfile,
    } as never);
    expect(result).toBe(true);
    expect(mocks.upsert.mock.calls[0][0].create).toMatchObject({ isActive: true, role: "PROFESSOR", institutionName: "Escola Exemplo" });
    expect(user).toMatchObject({ id: "teacher-1", role: "PROFESSOR", authVersion: 0 });
    expect(mocks.update).toHaveBeenCalledWith({ where: { id: "invite-1" }, data: { acceptedAt: expect.any(Date) } });
  });
});
