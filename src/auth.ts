import "server-only";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { authConfig } from "@/auth.config";
import { authenticateCredentials } from "@/server/auth/credentials";
import { validateSessionToken } from "@/server/auth/token";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    Credentials({
      credentials: { email: { type: "email" }, password: { type: "password" } },
      authorize: authenticateCredentials,
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        if (profile?.email_verified !== true) return "/acesso-negado?reason=unverified-email";
        const { getPrisma } = await import("@/server/db/prisma");
        const email = user.email?.toLowerCase();
        if (!email) return "/acesso-negado?reason=unverified-email";

        // O JWT precisa identificar o usuário local, não o ID da conta Google.
        const existing = await getPrisma().user.findUnique({
          where: { email },
          select: { id: true, isActive: true, role: true, authVersion: true },
        });
        if (existing?.isActive) {
          user.id = existing.id;
          user.role = existing.role;
          user.authVersion = existing.authVersion;
          return true;
        }

        // Verifica convite válido pendente
        const invite = await getPrisma().userInvite.findFirst({
          where: { email, acceptedAt: null, revokedAt: null, expiresAt: { gte: new Date() } },
          orderBy: { createdAt: "desc" },
          select: { id: true, role: true, invitedBy: { select: { institutionName: true } } },
        });

        if (invite) {
          // O convite define o perfil; o Google verifica a posse do e-mail.
          const invitedUser = await getPrisma().user.upsert({
            where: { email },
            create: {
              email,
              name: user.name ?? null,
              image: user.image ?? null,
              role: invite.role,
              institutionName: invite.invitedBy.institutionName,
              isActive: true,
              accounts: {
                create: {
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  access_token: account.access_token ?? null,
                  refresh_token: account.refresh_token ?? null,
                  expires_at: account.expires_at ?? null,
                  token_type: account.token_type ?? null,
                  scope: account.scope ?? null,
                  id_token: account.id_token ?? null,
                  session_state: typeof account.session_state === "string" ? account.session_state : null,
                },
              },
            },
            update: {
              name: user.name ?? undefined,
              image: user.image ?? undefined,
              role: invite.role,
              institutionName: invite.invitedBy.institutionName,
              isActive: true,
            },
            select: { id: true, role: true, authVersion: true },
          });

          // Marca convite como aceito
          await getPrisma().userInvite.update({
            where: { id: invite.id },
            data: { acceptedAt: new Date() },
          });

          user.id = invitedUser.id;
          user.role = invitedUser.role;
          user.authVersion = invitedUser.authVersion;
          return true;
        }

        if (existing) return "/acesso-negado?reason=inactive";

        // Primeiro acesso sem convite: qualquer conta Google verificada pode
        // cadastrar sua própria instituição como Gestão.
        const manager = await getPrisma().user.upsert({
          where: { email },
          create: {
            email,
            name: user.name ?? null,
            image: user.image ?? null,
            role: "GESTAO",
            isActive: true,
            accounts: {
              create: {
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
            },
          },
          update: {},
          select: { id: true, role: true, isActive: true, authVersion: true },
        });
        if (!manager.isActive) return "/acesso-negado?reason=inactive";
        user.id = manager.id;
        user.role = manager.role;
        user.authVersion = manager.authVersion;
        return true;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
        token.authVersion = user.authVersion;
      }
      // Também verifica o banco em /api/auth/session e em cada auth() no servidor.
      return validateSessionToken(token);
    },
  },
});
