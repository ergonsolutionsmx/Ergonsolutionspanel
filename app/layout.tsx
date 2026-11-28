import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { ProveedorMovimiento } from "@/components/movimiento/proveedor";
import { Toaster } from "@/components/avisos/toast";
import { SCRIPT_TEMA } from "@/components/tema/tema";

// Tipografía: Geist (geométrica y limpia, en la línea de San Francisco de Apple), variable: cualquier grosor.
const fuenteMarca = Geist({
  variable: "--font-marca",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Ergon Solutions", template: "%s · Ergon Solutions" },
  description: "Panel interno de Ergon Solutions.",
  applicationName: "Ergon Solutions",
  // Vista previa al compartir links (p. ej. una propuesta por WhatsApp).
  metadataBase: process.env.APP_URL ? new URL(process.env.APP_URL) : undefined,
  openGraph: {
    siteName: "Ergon Solutions",
    locale: "es_MX",
    type: "website",
    images: [{ url: "/brand/og.png", width: 1200, height: 630, alt: "Ergon Solutions" }],
  },
  appleWebApp: { capable: true, title: "Ergon", statusBarStyle: "default" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#030b1d",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-MX" className={`${fuenteMarca.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* Tema claro/oscuro antes de pintar (sin parpadeo). */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body className="min-h-full font-sans">
        <ProveedorMovimiento>
          {children}
          <Toaster />
        </ProveedorMovimiento>
      </body>
    </html>
  );
}
