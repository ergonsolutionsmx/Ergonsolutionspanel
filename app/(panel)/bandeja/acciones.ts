"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { obtenerUsuario } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";
import { CANALES, ESTADOS_MENSAJE, NOMBRE_CANAL, type Canal, type EstadoMensaje } from "@/lib/inbox/tipos";

const UUID = /^[0-9a-f-]{36}$/i;

export async function cambiarEstadoMensaje(id: string, estado: EstadoMensaje) {
  await obtenerUsuario();
  if (!UUID.test(id) || !ESTADOS_MENSAJE.includes(estado)) return;
  const supabase = await crearClienteServidor();
  await supabase.from("mensajes").update({ estado }).eq("id", id);
  refresh();
}

/** Al abrir un mensaje nuevo, pasa a leído (sin refrescar la pantalla). */
export async function marcarLeidoSiNuevo(id: string) {
  await obtenerUsuario();
  if (!UUID.test(id)) return;
  const supabase = await crearClienteServidor();
  await supabase.from("mensajes").update({ estado: "leido" }).eq("id", id).eq("estado", "nuevo");
}

export async function asignarMensaje(id: string, usuarioId: string | null) {
  await obtenerUsuario();
  if (!UUID.test(id) || (usuarioId && !UUID.test(usuarioId))) return;
  const supabase = await crearClienteServidor();
  await supabase.from("mensajes").update({ asignado_a: usuarioId }).eq("id", id);
  refresh();
}

/** Convierte el mensaje en tarea (con enlace al mensaje) y abre la tarea. */
export async function convertirEnTarea(id: string) {
  const yo = await obtenerUsuario();
  if (!UUID.test(id)) return;
  const supabase = await crearClienteServidor();
  const { data: m } = await supabase
    .from("mensajes")
    .select("id, canal, remitente_nombre, remitente_contacto, asunto, cuerpo, asignado_a, estado")
    .eq("id", id)
    .maybeSingle();
  if (!m) return;

  const quien = m.remitente_nombre ?? m.remitente_contacto ?? "remitente";
  const titulo = (m.asunto ? `${m.asunto} · ${quien}` : `Atender a ${quien}`).slice(0, 200);
  const descripcion = [
    `Mensaje de ${quien}${m.remitente_contacto && m.remitente_nombre ? ` (${m.remitente_contacto})` : ""} por ${NOMBRE_CANAL[m.canal as Canal]}:`,
    "",
    m.cuerpo,
  ].join("\n");

  const { data: tarea } = await supabase
    .from("tareas")
    .insert({ titulo, descripcion, responsable_id: m.asignado_a ?? yo.id, mensaje_id: m.id, prioridad: "media" })
    .select("id")
    .single();
  if (!tarea) return;
  if (m.estado === "nuevo") await supabase.from("mensajes").update({ estado: "leido" }).eq("id", m.id);
  redirect(`/proyectos/tareas/${tarea.id}?volver=${encodeURIComponent(`/bandeja/${m.id}`)}`);
}

const EJEMPLOS: Record<Canal, { nombre: string; contacto: string | null; asunto: string | null; cuerpo: string }> = {
  formulario: {
    nombre: "Prueba · Formulario",
    contacto: "prueba@ejemplo.com",
    asunto: "Quiero información",
    cuerpo: "Hola, me interesa una agenda en línea para mi negocio. (Mensaje de prueba)",
  },
  correo: {
    nombre: "Prueba · Correo",
    contacto: "cliente@ejemplo.com",
    asunto: "Cotización de sitio web",
    cuerpo: "Buen día, ¿me pueden cotizar un sitio web? (Mensaje de prueba)",
  },
  whatsapp: {
    nombre: "Prueba · WhatsApp",
    contacto: "5512345678",
    asunto: null,
    cuerpo: "Hola, ¿tienen recordatorios de pago por WhatsApp? (Mensaje de prueba)",
  },
  interno: {
    nombre: "Ergon Solutions",
    contacto: null,
    asunto: "Aviso de prueba",
    cuerpo: "Este es un aviso interno de prueba.",
  },
};

/** Ajustes → Canales: crea un mensaje falso para probar la bandeja. */
export async function enviarMensajePrueba(canal: Canal) {
  await obtenerUsuario();
  if (!CANALES.includes(canal)) return;
  const e = EJEMPLOS[canal];
  const supabase = await crearClienteServidor();
  await supabase.from("mensajes").insert({
    canal,
    externo_id: `prueba-${randomUUID()}`,
    remitente_nombre: e.nombre,
    remitente_contacto: e.contacto,
    asunto: e.asunto,
    cuerpo: e.cuerpo,
    datos_crudos: { prueba: true, ...(canal === "interno" ? { link: "/bandeja" } : {}) },
  });
  refresh();
}
