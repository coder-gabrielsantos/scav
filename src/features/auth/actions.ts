"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { loginSchema, type LoginState } from "./schemas";

export async function loginAction(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { error: "Informe um e-mail válido e sua senha." };
  try {
    await signIn("credentials", { ...parsed.data, redirectTo: "/dashboard" });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: error.type === "CredentialsSignin"
        ? "Não foi possível entrar. Confira suas credenciais ou tente novamente em 15 minutos."
        : "O acesso está temporariamente indisponível. Tente novamente mais tarde." };
    }
    // O redirecionamento do Next.js é uma exceção de controle; preservá-lo.
    throw error;
  }
  return {};
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
