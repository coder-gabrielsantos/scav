import type { NextAuthConfig } from "next-auth";
import { isRole } from "@/lib/access-policy";

/** Configuração sem banco ou provider: usada pelo Proxy para leitura do JWT. */
export const authConfig = {
  providers: [],
  pages: { signIn: "/login", error: "/login" },
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
        token.authVersion = user.authVersion;
      }
      if (!token.sub || !isRole(token.role) || !Number.isInteger(token.authVersion)) return null;
      return token;
    },
    session({ session, token }) {
      session.user.id = token.sub!;
      session.user.role = token.role!;
      return session;
    },
    // Não aceitar callback URLs externas, nem destinos fornecidos no login.
    redirect({ url, baseUrl }) {
      if (url === "/login" || url === `${baseUrl}/login`) return `${baseUrl}/login`;
      // Permitir redirecionamentos internos válidos do fluxo de auth
      const allowedPaths = ["/configurar-perfil", "/convite-aceito", "/acesso-negado"];
      for (const path of allowedPaths) {
        if (url === path || url === `${baseUrl}${path}`) return `${baseUrl}${path}`;
      }
      for (const reason of ["inactive", "no-invite", "unverified-email"]) {
        const path = `/acesso-negado?reason=${reason}`;
        if (url === path || url === `${baseUrl}${path}`) return `${baseUrl}${path}`;
      }
      return `${baseUrl}/dashboard`;
    },
  },
} satisfies NextAuthConfig;
