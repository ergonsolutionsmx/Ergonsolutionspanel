import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Rutas que se pueden abrir sin sesión. */
const RUTAS_PUBLICAS = ["/login", "/recuperar", "/auth", "/p", "/api/inbox"];

function esPublica(ruta: string) {
  return RUTAS_PUBLICAS.some((p) => ruta === p || ruta.startsWith(`${p}/`));
}

/**
 * Refresca la sesión de Supabase en cada petición y manda a /login
 * a quien no tenga sesión e intente abrir el panel.
 */
export async function actualizarSesion(request: NextRequest) {
  let respuesta = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          respuesta = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            respuesta.cookies.set(name, value, options),
          );
          Object.entries(headers ?? {}).forEach(([k, v]) => respuesta.headers.set(k, v));
        },
      },
    },
  );

  // No meter código entre createServerClient y getClaims(): refresca el token.
  const { data } = await supabase.auth.getClaims();
  const conSesion = Boolean(data?.claims?.sub);
  const ruta = request.nextUrl.pathname;

  if (!conSesion && !esPublica(ruta)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = ruta && ruta !== "/" ? `?siguiente=${encodeURIComponent(ruta)}` : "";
    return NextResponse.redirect(url);
  }

  if (conSesion && ruta === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/inicio";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return respuesta;
}
