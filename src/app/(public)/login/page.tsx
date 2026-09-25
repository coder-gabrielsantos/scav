import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { ROLE_HOME } from "@/lib/routes";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = { title: "Entrar" };

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect(ROLE_HOME[user.role]);
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.4fr_1fr]">
      {/* Painel de branding */}
      <aside className="relative hidden overflow-hidden bg-[#060809] lg:block">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#060809_70%)]" />
        <div className="relative flex h-full flex-col items-center justify-center px-12 text-center">
          <h1 className="font-display text-5xl font-bold uppercase tracking-[0.18em] text-[#F4F4F5] xl:text-6xl">SCAV</h1>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#94A3B8]">Sistema de Calendário e Avaliações</p>
        </div>
      </aside>

      {/* Painel de formulário */}
      <section className="flex items-center justify-center bg-[#F7F8FA] px-5 py-12 sm:px-10">
        <div className="w-full max-w-[460px] rounded-2xl border border-[#ECEEF1] bg-[#FBFCFD] p-8 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:p-10">
          <div className="text-center">
            <h2 className="text-[28px] font-bold leading-tight tracking-tight text-[#111827]">Bem-vindo</h2>
            <p className="mt-2 text-[15px] text-[#64748B]">Entre com e-mail e senha ou use o Google</p>
          </div>
          {error && (
            <p role="alert" className="mt-6 rounded-lg bg-red-50 p-3 text-sm text-red-800">
              Não foi possível concluir o login. Tente novamente ou entre em contato com a gestão.
            </p>
          )}
          <div className="mt-8"><LoginForm /></div>
          <p className="mt-8 text-center text-xs leading-relaxed text-[#94A3B8]">
            Ao entrar, você aceita os{" "}
            <Link href="#" className="text-[#4F46E5] hover:underline">termos de uso</Link>{" "}
            e a{" "}
            <Link href="#" className="text-[#4F46E5] hover:underline">política de privacidade</Link>.
          </p>
        </div>
      </section>
    </main>
  );
}
