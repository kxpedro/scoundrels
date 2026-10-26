import type { Metadata } from "next";
import { Archivo_Black, Chakra_Petch, Inter, Share_Tech_Mono } from "next/font/google";
import { locales } from "@/i18n/config";
import { getDictionary, getLocale } from "@/i18n/dictionaries";
import { siteUrl } from "@/lib/site-url";
import "../globals.css";

const archivoBlack = Archivo_Black({ weight: "400", subsets: ["latin"], variable: "--font-archivo-black" });
const chakraPetch = Chakra_Petch({ weight: ["500", "700"], subsets: ["latin"], variable: "--font-chakra-petch" });
const shareTechMono = Share_Tech_Mono({ weight: "400", subsets: ["latin"], variable: "--font-share-tech-mono" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export async function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDictionary();
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: dict.meta.title, template: "%s · Scoundrels" },
    description: dict.meta.description,
    openGraph: { siteName: "Scoundrels" },
  };
}

/** Só o documento. O site público ganha cabeçalho/rodapé em (site); a redação tem a própria moldura. */
export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const lang = await getLocale();

  return (
    <html
      lang={lang === "pt" ? "pt-BR" : "en"}
      className={`${archivoBlack.variable} ${chakraPetch.variable} ${shareTechMono.variable} ${inter.variable}`}
    >
      <body className="flex min-h-dvh flex-col">{children}</body>
    </html>
  );
}
