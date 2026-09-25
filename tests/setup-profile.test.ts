import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ auth: vi.fn(), update: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/server/db/prisma", () => ({ getPrisma: () => ({ user: { update: mocks.update } }) }));

import { setupProfileAction } from "@/features/auth/setup-profile-action";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: "teacher-1", role: "PROFESSOR" } });
  mocks.update.mockResolvedValue({});
});

it("não permite alterar o perfil nem revoga a sessão ao salvar dados pessoais", async () => {
  const form = new FormData();
  form.set("name", "Professor(a) Exemplo");
  form.set("institutionName", "Escola Exemplo");
  form.set("role", "GESTAO");

  expect(await setupProfileAction({}, form)).toEqual({ success: true });
  expect(mocks.update).toHaveBeenCalledWith({
    where: { id: "teacher-1" },
    data: { name: "Professor(a) Exemplo", institutionName: "Escola Exemplo" },
  });
});
