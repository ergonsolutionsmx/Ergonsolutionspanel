import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Solo validar "navegación instantánea" en segmentos que lo pidan explícitamente.
    instantInsights: { validationLevel: "manual-warning" },
    // Reusar por 30 s las secciones ya visitadas: volver a una es instantáneo.
    // Las acciones que guardan datos llaman refresh()/revalidatePath, que limpian esta caché.
    staleTimes: { dynamic: 30 },
  },
  // Fuentes y logo que usa el PDF de propuestas (se leen del disco en el servidor).
  outputFileTracingIncludes: {
    "/propuestas/*/pdf": ["./lib/pdf/recursos/**/*"],
    "/p/*/pdf": ["./lib/pdf/recursos/**/*"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

export default nextConfig;
