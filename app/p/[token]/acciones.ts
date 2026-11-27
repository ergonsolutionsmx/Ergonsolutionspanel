"use server";

import { refresh } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/server";

/** El prospecto acepta la propuesta desde su link (sin sesión). */
export async function aceptarDesdeLink(token: string): Promise<{ ok: boolean }> {
  if (!/^[0-9a-f]{48}$/.test(token)) return { ok: false };
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.rpc("aceptar_propuesta_publica", { p_token: token });
  refresh();
  return { ok: !error && (data as { ok?: boolean } | null)?.ok === true };
}
