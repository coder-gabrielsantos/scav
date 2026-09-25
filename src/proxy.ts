import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";
import { dashboardDestination } from "@/lib/access-policy";

const { auth } = NextAuth(authConfig);

// Next.js 16: proxy.ts substitui a convenção middleware.ts.
// Esta checagem é inicial; páginas/actions/APIs repetem autorização no servidor.
export const proxy = auth((request) => {
  const target = dashboardDestination(request.nextUrl.pathname, request.auth?.user.role);
  if (target) return NextResponse.redirect(new URL(target, request.nextUrl.origin));
  return NextResponse.next();
});

export const config = { matcher: ["/dashboard/:path*"] };
