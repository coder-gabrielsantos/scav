// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { LoginForm } from "@/features/auth/components/login-form";

const signIn = vi.hoisted(() => vi.fn());

vi.mock("next-auth/react", () => ({ signIn }));
vi.mock("@/features/auth/actions", () => ({ loginAction: vi.fn() }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

it("inicia o login Google somente uma vez durante o redirecionamento", () => {
  signIn.mockReturnValue(new Promise(() => {}));
  render(<LoginForm />);

  const button = screen.getByRole("button", { name: "Entrar com Google" });
  fireEvent.click(button);
  fireEvent.click(button);

  expect(signIn).toHaveBeenCalledTimes(1);
  expect(signIn).toHaveBeenCalledWith("google", { callbackUrl: "/dashboard" });
  expect(screen.getByRole("button", { name: "Redirecionando…" }).hasAttribute("disabled")).toBe(true);
});
