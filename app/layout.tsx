import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Impulso",
  description: "Gera post com IA usando as cores da sua marca, agenda e publica no Instagram e Facebook.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
