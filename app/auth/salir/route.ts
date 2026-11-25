import { NextResponse, type NextRequest } from "next/server";
import { crearClienteServidor } from "@/lib/supabase/server";

/** Cierra la sesión (se usa cuando una cuenta no tiene perfil en el panel). */
export async function GET(request: NextRequest) {
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();
  const error = request.nextUrl.searchParams.get("error") === "sin-acceso" ? "?error=sin-acceso" : "";
  return NextResponse.redirect(`${request.nextUrl.origin}/login${error}`);
}
