import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "SCAV", template: "%s | SCAV" },
  description: "Sistema de Calendário e Avaliações",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-canvas font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
