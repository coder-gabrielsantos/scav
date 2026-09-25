"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { setupProfileAction, type SetupProfileState } from "@/features/auth/setup-profile-action";
import { ArrowRight, School, ShieldAlert } from "lucide-react";

export default function ConfigurarPerfilPage() {
  const router = useRouter();
  const [state, action, pending] = useActionState(setupProfileAction, {});

  useEffect(() => {
    if (state.success) {
      router.replace("/dashboard");
      router.refresh();
    }
  }, [state.success, router]);

  const inputClass =
    "mt-2 flex h-[52px] w-full rounded-lg border border-[#E2E8F0] bg-white px-4 text-[15px] text-[#111827] placeholder:text-[#94A3B8] outline-none transition focus:border-[#4F46E5] focus:ring-2 focus:ring-[#4F46E5]/20 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F8FA] px-5 py-12">
      <div className="w-full max-w-[520px] rounded-2xl border border-[#ECEEF1] bg-[#FBFCFD] p-8 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-10">
        <div className="text-center">
          <h1 className="text-[28px] font-bold leading-tight tracking-tight text-[#111827]">
            Configure seu perfil
          </h1>
          <p className="mt-2 text-[15px] text-[#64748B]">
            Complete seus dados para começar a usar o SCAV
          </p>
        </div>

        <form action={action} className="mt-8 space-y-5" aria-busy={pending}>
          <div>
            <label htmlFor="name" className="text-[13px] font-semibold text-[#334155]">
              Seu nome completo
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Maria Silva"
              maxLength={191}
              required
              disabled={pending}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="institutionName" className="text-[13px] font-semibold text-[#334155]">
              Nome da instituição
            </label>
            <div className="relative">
              <School className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#94A3B8]" />
              <input
                id="institutionName"
                name="institutionName"
                type="text"
                placeholder="Escola Estadual Exemplo"
                maxLength={191}
                required
                disabled={pending}
                className={`${inputClass} pl-11`}
              />
            </div>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
            <p className="flex items-start gap-2 font-semibold">
              <ShieldAlert className="mt-0.5 size-4 shrink-0" />
              Perfil de acesso
            </p>
            <p className="mt-1.5 text-amber-800">
              Perfis de colaboradores são definidos pela gestão ao enviar convites. Este formulário altera apenas seus dados.
            </p>
          </div>

          <div aria-live="polite" aria-atomic="true">
            {state.error && (
              <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
                {state.error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={pending}
            className="flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#4F46E5] text-[15px] font-semibold text-white transition hover:bg-[#4338CA] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4F46E5] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Salvando…" : "Salvar e continuar"}
            {!pending && <ArrowRight className="size-4" />}
          </button>
        </form>
      </div>
    </main>
  );
}
