"use client";

import { useActionState } from "react";
import { createInviteAction } from "../invite-actions";
import { Button } from "@/components/ui/button";
import { INVITE_ROLES } from "../schemas";
import { Copy, MailPlus, CheckCircle2 } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
 COORDENACAO: "Coordenação",
 PROFESSOR: "Professor(a)",
 SECRETARIA: "Secretaria",
};

export function InviteForm() {
 const [state, action, pending] = useActionState(createInviteAction, {});

 async function copyUrl() {
 if (state.inviteUrl) {
 await navigator.clipboard.writeText(state.inviteUrl);
 }
 }

 return (
 <form action={action} className="space-y-6" aria-busy={pending}>
 <div>
 <label htmlFor="invite-email" className="text-sm font-medium">E-mail do convidado</label>
 <input
 id="invite-email"
 name="email"
 type="email"
 autoComplete="off"
 spellCheck={false}
 maxLength={191}
 required
 disabled={pending}
 placeholder="nome@escola.edu.br"
 className="scav-field mt-2 min-h-12"
 />
 </div>
 <div>
 <label htmlFor="invite-role" className="text-sm font-medium">Perfil</label>
 <select id="invite-role" name="role" required disabled={pending} className="scav-field mt-2 min-h-12">
 <option value="">Selecione…</option>
 {INVITE_ROLES.map((r) => (
 <option key={r} value={r}>{ROLE_LABELS[r]}</option>
 ))}
 </select>
 </div>
 <div aria-live="polite" aria-atomic="true" className="space-y-3">
 {state.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{state.error}</p>}
 {state.success && (
 <div className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
 <p className="flex items-center gap-2"><CheckCircle2 className="size-4" />{state.success}</p>
 {state.inviteUrl && (
 <button
 type="button"
 onClick={copyUrl}
 className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-green-700 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
 >
 <Copy className="size-3" />Copiar link do convite
 </button>
 )}
 </div>
 )}
 </div>
 <Button type="submit" size="lg" disabled={pending} className="h-12 w-full">
 {pending ? "Enviando…" : "Enviar convite"}<MailPlus />
 </Button>
 </form>
 );
}