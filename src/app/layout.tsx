import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Listeny — Seu portal de ensino com a sua marca",
  description:
    "Plataforma white-label para professores e criadores: monte seu próprio portal com logo, cores e domínio próprios. Sua marca, seus alunos.",
  metadataBase: new URL("https://listeny.app"),
  applicationName: "Listeny",
  authors: [{ name: "N3 Labz" }],
  category: "education",
  keywords: [
    "plataforma de ensino white-label",
    "portal do professor",
    "criar área de membros",
    "vender curso com marca própria",
    "portal de cursos personalizado",
    "domínio próprio para curso",
  ],
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Listeny — Seu portal de ensino com a sua marca",
    description:
      "Monte seu próprio portal de ensino com logo, cores e domínio próprios.",
    url: "https://listeny.app",
    siteName: "Listeny",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Listeny — Seu portal de ensino com a sua marca",
    description:
      "Monte seu próprio portal de ensino com logo, cores e domínio próprios.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg text-ink font-sans">
        {children}
      </body>
    </html>
  );
}
