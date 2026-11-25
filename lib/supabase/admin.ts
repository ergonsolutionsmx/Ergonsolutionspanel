import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente con service role: SALTA la RLS. Solo para endpoints públicos
 * (bandeja, propuesta pública) y scripts. Nunca importarlo en código de cliente.
 */
export function crearClienteAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const llave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !llave) {
    throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, llave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
