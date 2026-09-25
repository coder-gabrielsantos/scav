import "server-only";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInviteEmail(email: string, inviteUrl: string, roleLabel: string) {
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? "SCAV <onboarding@resend.dev>",
    to: [email],
    subject: `Convite para entrar no SCAV como ${roleLabel}`,
    html: `
      <h2>Convite para o SCAV</h2>
      <p>Você foi convidado(a) para acessar o Sistema de Calendário e Avaliações com o perfil de <strong>${roleLabel}</strong>.</p>
      <p>Clique no link abaixo para aceitar o convite e criar sua conta:</p>
      <p><a href="${inviteUrl}">Aceitar convite</a></p>
      <p>Este link expira em 7 dias.</p>
    `,
  });
  if (error) throw new Error(`Falha ao enviar e-mail: ${error.message}`);
}