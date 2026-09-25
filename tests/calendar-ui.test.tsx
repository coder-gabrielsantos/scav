// @vitest-environment jsdom
import { afterEach, beforeAll, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { File as NodeFile } from "node:buffer";
import { DemoExperience } from "@/features/calendar/components/demo-experience";
import { createDemoData } from "@/features/calendar/demo-data";

beforeAll(() => {
  Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn(() => "blob:demo-test") });
  Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
});
afterEach(cleanup);

function setup() {
  render(<DemoExperience initialNow="2026-05-14T15:00:00Z" initialData={createDemoData("2026-05-14")} />);
  return userEvent.setup();
}

it("abre agendamento contextual e fecha o Sheet com Escape", async () => {
  const user = setup();
  await user.click(screen.getByRole("button", { name: "Agendar avaliação" }));
  const sheet = screen.getByRole("dialog");
  expect(within(sheet).getByText("Quais áreas farão prova neste dia?")).toBeTruthy();
  expect(within(sheet).getAllByRole("checkbox")).toHaveLength(3);
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).toBeNull();
});

it("simula envio, revisão e liberação para a Secretaria sem abrir calendário para ela", async () => {
  const user = setup();
  await user.selectOptions(screen.getByLabelText("Perfil de demonstração"), "PROFESSOR");
  await user.click(screen.getByRole("button", { name: /^segunda-feira, 18 de maio\./i }));
  let sheet = screen.getByRole("dialog");
  const pdf = new NodeFile(["%PDF-1.4\nexample"], "matematica.pdf", { type: "application/pdf" });
  await user.upload(within(sheet).getByLabelText("Enviar PDF de Matemática"), pdf as unknown as File);
  expect(await within(sheet).findByText("Em revisão")).toBeTruthy();
  expect(within(sheet).queryByLabelText("Enviar PDF de Matemática")).toBeNull();
  await user.keyboard("{Escape}");
  await user.selectOptions(screen.getByLabelText("Perfil de demonstração"), "COORDENACAO");
  await user.click(screen.getByRole("button", { name: /^segunda-feira, 18 de maio\./i }));
  sheet = screen.getByRole("dialog");
  await user.click(within(sheet).getAllByRole("button", { name: /^Aprovar$/ })[0]);
  expect(within(sheet).getByText("Aprovada")).toBeTruthy();
  await user.keyboard("{Escape}");
  await user.selectOptions(screen.getByLabelText("Perfil de demonstração"), "SECRETARIA");
  expect(screen.queryByRole("region", { name: "Calendário de avaliações" })).toBeNull();
  expect(screen.getByRole("button", { name: "Baixar PDF de Matemática" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Baixar pacote ZIP" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Baixar PDF de Física" })).toBeNull();
});
