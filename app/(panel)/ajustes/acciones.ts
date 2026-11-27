"use server";

import { refresh } from "next/cache";
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

// ---------------------------------------------------------------------------
// Perfil y contraseña
// ---------------------------------------------------------------------------

export type EstadoForm = { ok?: string; error?: string } | undefined;
const texto = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

export async function actualizarPerfil(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const yo = await obtenerUsuario();
  const nombre = texto(fd, "nombre");
  const color = texto(fd, "color");
  if (!nombre || nombre.length > 80) return { error: "Escribe tu nombre (máx. 80)." };
  if (!/^#[0-9a-f]{6}$/i.test(color)) return { error: "Elige un color válido." };
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("perfiles").update({ nombre, color: color.toUpperCase() }).eq("usuario_id", yo.id);
  if (error) return { error: "No se pudo guardar." };
  refresh();
  return { ok: "Perfil guardado." };
}

export async function cambiarContrasena(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  const yo = await obtenerUsuario();
  const actual = String(fd.get("actual") ?? "");
  const nueva = String(fd.get("nueva") ?? "");
  const confirmar = String(fd.get("confirmar") ?? "");
  if (nueva.length < 8) return { error: "La nueva debe tener al menos 8 caracteres." };
  if (nueva !== confirmar) return { error: "Las contraseñas nuevas no coinciden." };
  if (nueva === actual) return { error: "La nueva debe ser distinta a la actual." };

  const supabase = await crearClienteServidor();
  // Confirmar la contraseña actual antes de cambiarla.
  const { error: errorActual } = await supabase.auth.signInWithPassword({ email: yo.correo, password: actual });
  if (errorActual) return { error: "La contraseña actual no es correcta." };
  const { error } = await supabase.auth.updateUser({ password: nueva });
  if (error) return { error: "No se pudo cambiar. Intenta con otra contraseña." };

  await supabase.from("bitacora").insert({ accion: "cambio_contrasena", tabla: "cuenta", detalle: {} });
  return { ok: "Contraseña cambiada." };
}

// ---------------------------------------------------------------------------
// Demos
// ---------------------------------------------------------------------------

const UUID = /^[0-9a-f-]{36}$/i;

export async function guardarDemo(id: string | null, _: EstadoForm, fd: FormData): Promise<EstadoForm> {
  await obtenerUsuario();
  if (id && !UUID.test(id)) return { error: "Demo no válida." };
  const nombre = texto(fd, "nombre");
  const url = texto(fd, "url");
  const orden = Number(texto(fd, "orden") || 0);
  if (!nombre) return { error: "Escribe el nombre." };
  if (url && !/^https?:\/\/\S+$/.test(url)) return { error: "La URL debe empezar con https://" };
  if (!Number.isInteger(orden)) return { error: "El orden debe ser un número entero." };
  const datos = {
    nombre,
    descripcion: texto(fd, "descripcion") || null,
    url: url || null,
    orden,
    activo: fd.get("activo") === "on",
  };
  const supabase = await crearClienteServidor();
  const { error } = id ? await supabase.from("demos").update(datos).eq("id", id) : await supabase.from("demos").insert(datos);
  if (error) return { error: "No se pudo guardar." };
  refresh();
  return { ok: "Guardado." };
}

export async function eliminarDemo(id: string) {
  await obtenerUsuario();
  if (!UUID.test(id)) return;
  const supabase = await crearClienteServidor();
  await supabase.from("demos").delete().eq("id", id);
  refresh();
}
