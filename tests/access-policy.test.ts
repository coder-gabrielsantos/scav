import { describe, expect, it } from "vitest";
import { dashboardDestination, isRole } from "@/lib/access-policy";
import { ROLE_HOME } from "@/lib/routes";

describe("rotas por perfil", () => {
  for (const [role, home] of Object.entries(ROLE_HOME)) {
    it(`${role}: entra pelo próprio painel`, () => {
      expect(dashboardDestination("/dashboard", role)).toBe(home);
      expect(dashboardDestination("/dashboard/", role)).toBe(home);
    });
    for (const [targetRole, path] of Object.entries(ROLE_HOME)) {
      it(`${role} → ${targetRole}`, () => {
        expect(dashboardDestination(path, role)).toBe(role === targetRole ? null : "/acesso-negado");
        expect(dashboardDestination(`${path}/detalhes`, role)).toBe(role === targetRole ? null : "/acesso-negado");
      });
    }
    it(`${role}: rejeita prefixos parecidos e rotas desconhecidas`, () => {
      expect(dashboardDestination(`${home}-outro`, role)).toBe("/acesso-negado");
      expect(dashboardDestination("/dashboard/desconhecido", role)).toBe("/acesso-negado");
    });
  }
  it.each([undefined, null, "ADMIN", "__proto__", "constructor", 0])("nega perfil inválido %s", (role) => {
    expect(isRole(role)).toBe(false);
    expect(dashboardDestination("/dashboard/gestao", role)).toBe("/login");
  });
});
