import Link from "next/link";
import type { Metadata } from "next";
import { logoutAction } from "@/features/auth/actions";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Acesso restrito" };

const REASONS: Record<string, { title: string; message: string; icon: typeof ShieldCheck }> = {
  "unverified-email": {
    title: "E-mail não verificado",
    message: "Não foi possível confirmar seu e-mail pelo Google. Use uma conta Google com e-mail verificado.",
    icon: ShieldAlert,
  },
  "no-invite": {
    title: "Convite necessário",
    message:
      "Não encontramos um convite válido para este e-mail. Solicite à gestão da escola que envie um novo convite.",
    icon: ShieldAlert,
  },
  inactive: {
    title: "Conta aguardando ativação",
    message:
      "Sua conta ainda não foi ativada pela gestão. Aguarde a aprovação ou entre em contato com a secretaria.",
    icon: ShieldCheck,
  },
};

export default async function AccessDeniedPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const params = await searchParams;
  const reason = params.reason ?? "";
  const info = REASONS[reason];
  const Icon = info?.icon ?? ShieldCheck;
  const title = info?.title ?? "Acesso restrito";
  const message =
    info?.message ??
    "Seu perfil não tem acesso a esta área. Volte ao seu painel para continuar.";

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-5 py-12">
      <section className="scav-panel w-full max-w-lg p-8 text-center sm:p-12">
        <span className="mx-auto mb-7 flex size-16 items-center justify-center rounded-2xl bg-secondary text-primary">
          <Icon className="size-8" />
        </span>
        <p className="scav-kicker">PERMISSÕES DE ACESSO</p>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight">{title}</h1>
        <p className="mt-4 text-sm leading-7 text-muted-foreground">{message}</p>
        {!info && (
          <Button asChild className="mt-7">
            <Link href="/dashboard">Voltar ao meu painel</Link>
          </Button>
        )}
        {info && (
          <Button asChild className="mt-7">
            <Link href="/login">Voltar ao login</Link>
          </Button>
        )}
        <form action={logoutAction} className="mt-5">
          <Button variant="link" type="submit">
            Sair e usar outra conta
          </Button>
        </form>
      </section>
    </main>
  );
}
