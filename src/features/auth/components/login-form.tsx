"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { loginAction } from "../actions";
import { ArrowRight } from "lucide-react";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, {});
  const googleSignInStarted = useRef(false);
  const [googlePending, setGooglePending] = useState(false);
  const [googleError, setGoogleError] = useState(false);

  async function handleGoogleSignIn() {
    if (googleSignInStarted.current) return;
    googleSignInStarted.current = true;
    setGooglePending(true);
    setGoogleError(false);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch {
      googleSignInStarted.current = false;
      setGooglePending(false);
      setGoogleError(true);
    }
  }
  const inputClass =
    "mt-2 flex h-[52px] w-full rounded-lg border border-[#E2E8F0] bg-white px-4 text-[15px] text-[#111827] placeholder:text-[#94A3B8] outline-none transition focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <>
      <form action={action} className="space-y-5" aria-busy={pending}>
        <div>
          <label htmlFor="email" className="text-[13px] font-semibold text-[#334155]">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="seu@email.com"
            maxLength={191}
            required
            disabled={pending}
            className={inputClass}
            aria-describedby={state.error ? "login-error" : undefined}
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-[13px] font-semibold text-[#334155]">
              Senha
            </label>
            <Link
              href="#"
              className="text-[13px] font-medium text-[#4F46E5] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Esqueceu a senha?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            maxLength={128}
            required
            disabled={pending}
            className={inputClass}
            aria-describedby={state.error ? "login-error" : undefined}
          />
        </div>

        <div aria-live="polite" aria-atomic="true">
          {state.error && (
            <p
              id="login-error"
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-sm text-red-800"
            >
              {state.error}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={pending}
          className="flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#4F46E5] text-[15px] font-semibold text-white transition hover:bg-[#4338CA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Entrando…" : "Entrar"}
          {!pending && <ArrowRight className="size-4" />}
        </button>

        <p className="text-center text-[13px] text-[#64748B]">
          Não tem conta?{" "}
          <span className="font-semibold text-[#4F46E5]">
            Solicite um convite à gestão
          </span>
        </p>
      </form>

      {/* Separador OU */}
      <div className="relative my-7">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-[#E2E8F0]" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-[#FBFCFD] px-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#94A3B8]">
            OU
          </span>
        </div>
      </div>

      {/* Botão Google */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={googlePending}
        aria-busy={googlePending}
        className="flex h-[52px] w-full items-center justify-center gap-3 rounded-full border border-[#94A3B8] bg-white text-[15px] font-semibold text-[#1F2937] transition hover:bg-[#F9FAFB] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5]"
      >
        <svg className="size-5" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {googlePending ? "Redirecionando…" : "Entrar com Google"}
      </button>
      {googleError && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">
          Não foi possível iniciar o login com Google. Tente novamente.
        </p>
      )}
    </>
  );
}
