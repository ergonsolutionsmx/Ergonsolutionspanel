import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ergon Solutions",
    short_name: "Ergon",
    description: "Panel interno de Ergon Solutions",
    lang: "es-MX",
    start_url: "/inicio",
    scope: "/",
    display: "standalone",
    background_color: "#F3F4F6",
    theme_color: "#06142e",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
