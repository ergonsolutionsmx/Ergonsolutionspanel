import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { crearClienteServidor } from "@/lib/supabase/server";
import { rutaSegura } from "@/lib/auth";

/**
 * Destino del enlace de "Recuperar contraseña".
 * Acepta los dos formatos de Supabase: ?code= (PKCE) o ?token_hash=&type=.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const siguiente = rutaSegura(searchParams.get("siguiente"), "/inicio");
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const tipo = searchParams.get("type") as EmailOtpType | null;

  const supabase = await crearClienteServidor();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${siguiente}`);
  } else if (tokenHash && tipo) {
    const { error } = await supabase.auth.verifyOtp({ type: tipo, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(`${origin}${siguiente}`);
  }

  return NextResponse.redirect(`${origin}/login?error=enlace-invalido`);
}
