import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck2, CheckCircle2, Mail } from "lucide-react";

export const metadata: Metadata = { title: "Convite Aceito" };

export default function ConviteAceitoPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-5 py-12">
      <section className="scav-panel w-full max-w-[480px] p-7 text-center sm:p-10">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="size-8 text-green-700" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight">Convite aceito!</h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          Sua conta está pronta. Entre com o mesmo e-mail Google do convite
          para acessar o painel com o perfil definido pela gestão.
        </p>
        <div className="mt-8 rounded-lg bg-blue-50 p-4 text-left text-sm text-blue-900">
          <p className="flex items-start gap-2">
            <Mail className="mt-0.5 size-4 shrink-0" />
            <span>Dúvidas? Entre em contato com a secretaria ou gestão da sua escola.</span>
          </p>
        </div>
        <div className="mt-8 border-t pt-6">
          <Link href="/login" className="rounded text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4">
            Voltar ao login
          </Link>
        </div>
      </section>
    </main>
  );
}
