import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-sora",
  display: "swap",
});

const siteUrl = "https://nuvio.proyectosolmeca.com";
const title = "Nuvio — Tu aliado para hacer crecer tu negocio";
const description =
  "Nuvio reúne punto de venta, inventario, facturación CFDI 4.0, compras y contabilidad en una sola plataforma. Vende más rápido y conoce la salud financiera de tu negocio, sin ser contador.";
// Reseña para previews sociales (WhatsApp, Facebook, X): énfasis en punto de venta y salud financiera.
const shareDescription =
  "Vende más rápido con el punto de venta y conoce la salud financiera de tu negocio en tiempo real. Facturación CFDI 4.0, inventario, compras y contabilidad en una sola plataforma inteligente.";
const ogImage = {
  url: "/brand/og-nuvio.png",
  width: 1200,
  height: 630,
  alt: "Nuvio — Tu aliado para hacer crecer tu negocio",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: "%s · Nuvio",
  },
  description,
  keywords: [
    "punto de venta",
    "salud financiera",
    "facturación electrónica",
    "CFDI 4.0",
    "inventario",
    "compras",
    "contabilidad",
    "software empresarial",
    "PYMES",
    "Nuvio",
  ],
  authors: [{ name: "Nuvio" }],
  alternates: { canonical: "/" },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/brand/nuvio-icon.png", type: "image/png" },
    ],
    apple: [{ url: "/brand/nuvio-icon.png" }],
  },
  openGraph: {
    title,
    description: shareDescription,
    url: siteUrl,
    type: "website",
    locale: "es_MX",
    siteName: "Nuvio",
    images: [ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: shareDescription,
    images: [ogImage.url],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1a9cab" },
    { media: "(prefers-color-scheme: dark)", color: "#05191c" },
  ],
  width: "device-width",
  initialScale: 1,
};

/* Applies the saved / system theme before first paint to avoid a flash. */
const themeInit = `(function(){try{var q=new URLSearchParams(location.search).get('theme');if(q==='dark'||q==='light'){localStorage.setItem('nuvio-theme',q);}var t=localStorage.getItem('nuvio-theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${inter.variable} ${sora.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
