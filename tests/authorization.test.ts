import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getCurrentUser: vi.fn(), findUnique: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/server/auth/session", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("@/server/db/prisma", () => ({ getPrisma: () => ({ areaCoordinator: { findUnique: mocks.findUnique } }) }));
import { authorizeUser, authorizeCoordinatorArea } from "@/server/auth/authorization";

beforeEach(() => {
  mocks.getCurrentUser.mockResolvedValue({ id: "coord-1", role: "COORDENACAO", isActive: true });
  mocks.findUnique.mockResolvedValue({ subjectArea: { isActive: true } });
});

it("responde 401 para anônimo e 403 para perfil incorreto", async () => {
  await expect(authorizeUser(["GESTAO"])).rejects.toMatchObject({ status: 403 });
  mocks.getCurrentUser.mockResolvedValue(null);
  await expect(authorizeUser()).rejects.toMatchObject({ status: 401 });
});

it("coordenação só recebe acesso à sua área ativa", async () => {
  await expect(authorizeCoordinatorArea("humanas")).resolves.toMatchObject({ id: "coord-1" });
  expect(mocks.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { subjectAreaId_coordinatorId: { subjectAreaId: "humanas", coordinatorId: "coord-1" } } }));
  mocks.findUnique.mockResolvedValue(null);
  await expect(authorizeCoordinatorArea("exatas")).rejects.toMatchObject({ status: 403 });
  mocks.findUnique.mockResolvedValue({ subjectArea: { isActive: false } });
  await expect(authorizeCoordinatorArea("humanas")).rejects.toMatchObject({ status: 403 });
});
