import type { Metadata, Viewport } from "next";
import { Chakra_Petch, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const display = Chakra_Petch({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Tropa dos Dados — Aprenda dados do seu jeito",
  description:
    "Aprenda dados assistindo, fazendo, jogando e do seu jeito. Trilhas, sandbox de SQL/Python/R/Excel, PDI personalizado e hackathons com prêmio em dinheiro.",
  metadataBase: new URL("https://tropadosdados.com.br"),
  openGraph: {
    title: "Tropa dos Dados",
    description:
      "Aprenda dados do seu jeito: assistindo, fazendo, jogando. Hackathons com prêmio real.",
    type: "website",
    locale: "pt_BR",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0f0d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth">
      <body className={`${display.variable} ${mono.variable} flex min-h-full flex-col font-sans`}>
        {children}
      </body>
    </html>
  );
}