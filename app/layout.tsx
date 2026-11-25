import type { Metadata, Viewport } from "next";
import { Lato } from "next/font/google";
import "./globals.css";

// Tipografía de marca. POR CONFIRMAR: Lato vs Archivo + IBM Plex Sans.
const fuenteMarca = Lato({
  variable: "--font-marca",
  subsets: ["latin"],
  weight: ["400", "700", "900"],
});

export const metadata: Metadata = {
  title: { default: "Ergon Solutions", template: "%s · Ergon Solutions" },
  applicationName: "Ergon Solutions",
  appleWebApp: { capable: true, title: "Ergon", statusBarStyle: "default" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0B1F44",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-MX" className={`${fuenteMarca.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
