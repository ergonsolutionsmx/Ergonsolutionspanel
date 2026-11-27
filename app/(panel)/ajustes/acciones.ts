"use server";

import { obtenerUsuario } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";

export type EstadoPrueba = { ok?: string; error?: string } | undefined;

/** Crea una notificación de prueba para el usuario elegido. */
export async function enviarNotificacionPrueba(_: EstadoPrueba, formData: FormData): Promise<EstadoPrueba> {
  const yo = await obtenerUsuario();
  const destinatario = String(formData.get("destinatario") ?? "");
  const supabase = await crearClienteServidor();

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("usuario_id, nombre")
    .eq("usuario_id", destinatario)
    .maybeSingle();
  if (!perfil) return { error: "Usuario no encontrado." };

  const { error } = await supabase.from("notificaciones").insert({
    usuario_id: perfil.usuario_id,
    tipo: "prueba",
    titulo: "Notificación de prueba",
    cuerpo: `Enviada por ${yo.nombre}.`,
    link: "/inicio",
  });
  if (error) return { error: "No se pudo enviar." };

  return { ok: perfil.usuario_id === yo.id ? "Enviada. Revisa tu campanita." : `Enviada a ${perfil.nombre}.` };
}
