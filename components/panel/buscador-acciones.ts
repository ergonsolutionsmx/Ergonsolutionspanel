"use server";

import { obtenerUsuario } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";

/** Servicios del catálogo para el buscador (Ctrl/Cmd + K). */
export async function serviciosParaBuscar() {
  await obtenerUsuario();
  const supabase = await crearClienteServidor();
  const { data } = await supabase.from("servicios").select("id, numero, nombre").eq("activo", true).order("numero");
  return (data ?? []) as { id: string; numero: string; nombre: string }[];
}
