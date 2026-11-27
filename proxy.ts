import type { NextRequest } from "next/server";
import { actualizarSesion } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return actualizarSesion(request);
}

export const config = {
  matcher: [
    // Todo menos archivos estáticos, imágenes y el manifest/íconos de la PWA.
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|robots.txt|icon|apple-icon|brand/|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)",
  ],
};
