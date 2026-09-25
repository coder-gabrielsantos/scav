import type { Metadata } from "next";
import { DemoSurface } from "@/features/calendar/demo-surface";
import { requireRole } from "@/server/auth/guards";
import { InviteForm } from "@/features/auth/components/invite-form";
import { MailPlus } from "lucide-react";

export const metadata: Metadata = { title: "Gestão" };

export default async function ManagementPage() {
 await requireRole("GESTAO");
 return (
 <>
 <DemoSurface role="GESTAO" />
 <section className="mx-auto mt-10 max-w-2xl px-5 pb-12">
 <div className="scav-panel p-7 sm:p-10">
 <p className="scav-kicker flex items-center gap-2"><MailPlus className="size-4" />CONVIDAR USUÁRIOS</p>
 <h2 className="mt-4 text-2xl font-extrabold tracking-tight">Adicionar professores, coordenadores ou secretaria</h2>
 <p className="mt-2 text-sm leading-7 text-muted-foreground">Informe o e-mail institucional e o perfil. O convidado receberá um link único para criar a conta com Google.</p>
 <div className="mt-6"><InviteForm /></div>
 </div>
 </section>
 </>
 );
}
