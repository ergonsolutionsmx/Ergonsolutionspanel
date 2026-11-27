"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { obtenerUsuario, rutaSegura } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";
import { FECHA_VALIDA } from "@/lib/fechas";
import {
  ESTADOS_PROYECTO,
  ESTADOS_TAREA,
  PRIORIDADES,
  type EstadoTarea,
} from "@/lib/tareas-tipos";

export type EstadoForm = { error?: string } | undefined;

const UUID = /^[0-9a-f-]{36}$/i;
const texto = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const textoOpcional = (fd: FormData, k: string) => texto(fd, k) || null;
const uuidOpcional = (fd: FormData, k: string) => {
  const v = texto(fd, k);
  return UUID.test(v) ? v : null;
};
const fechaOpcional = (fd: FormData, k: string) => {
  const v = texto(fd, k);
  return FECHA_VALIDA.test(v) ? v : null;
};
function deLista<T extends string>(valor: string, lista: readonly T[], porDefecto: T): T {
  return (lista as readonly string[]).includes(valor) ? (valor as T) : porDefecto;
}

function datosTarea(fd: FormData) {
  const titulo = texto(fd, "titulo");
  if (!titulo) return { error: "Escribe un título." } as const;
  if (titulo.length > 200) return { error: "El título es muy largo (máx. 200)." } as const;
  return {
    datos: {
      titulo,
      descripcion: textoOpcional(fd, "descripcion"),
      proyecto_id: uuidOpcional(fd, "proyecto_id"),
      responsable_id: uuidOpcional(fd, "responsable_id"),
      fecha_limite: fechaOpcional(fd, "fecha_limite"),
      prioridad: deLista(texto(fd, "prioridad"), PRIORIDADES, "media"),
      estado: deLista(texto(fd, "estado"), ESTADOS_TAREA, "por_hacer"),
    },
  } as const;
}

// ---------------------------------------------------------------------------
// Tareas
// ---------------------------------------------------------------------------

export async function crearTarea(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  await obtenerUsuario();
  const r = datosTarea(fd);
  if ("error" in r) return { error: r.error };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("tareas").insert(r.datos);
  if (error) return { error: "No se pudo guardar la tarea." };

  redirect(rutaSegura(fd.get("volver"), "/proyectos"));
}

export async function actualizarTarea(id: string, _: EstadoForm, fd: FormData): Promise<EstadoForm> {
  await obtenerUsuario();
  if (!UUID.test(id)) return { error: "Tarea no válida." };
  const r = datosTarea(fd);
  if ("error" in r) return { error: r.error };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("tareas").update(r.datos).eq("id", id);
  if (error) return { error: "No se pudo guardar." };

  redirect(rutaSegura(fd.get("volver"), "/proyectos"));
}

/** Tablero: mover una tarea de columna y/o de lugar. */
export async function moverTarea(id: string, estado: EstadoTarea, orden: number) {
  await obtenerUsuario();
  if (!UUID.test(id) || !ESTADOS_TAREA.includes(estado) || !Number.isFinite(orden)) return;
  const supabase = await crearClienteServidor();
  await supabase.from("tareas").update({ estado, orden }).eq("id", id);
  refresh();
}

/** Lista: palomita para terminar / reabrir. */
export async function cambiarEstadoTarea(id: string, estado: EstadoTarea) {
  await obtenerUsuario();
  if (!UUID.test(id) || !ESTADOS_TAREA.includes(estado)) return;
  const supabase = await crearClienteServidor();
  await supabase.from("tareas").update({ estado }).eq("id", id);
  refresh();
}

export async function eliminarTarea(id: string, volver: string) {
  await obtenerUsuario();
  if (UUID.test(id)) {
    const supabase = await crearClienteServidor();
    await supabase.from("tareas").delete().eq("id", id);
  }
  redirect(rutaSegura(volver, "/proyectos"));
}

// ---------------------------------------------------------------------------
// Proyectos
// ---------------------------------------------------------------------------

function datosProyecto(fd: FormData) {
  const nombre = texto(fd, "nombre");
  if (!nombre) return { error: "Escribe un nombre." } as const;
  if (nombre.length > 120) return { error: "El nombre es muy largo (máx. 120)." } as const;
  return {
    datos: {
      nombre,
      descripcion: textoOpcional(fd, "descripcion"),
      estado: deLista(texto(fd, "estado"), ESTADOS_PROYECTO, "activo"),
      responsable_id: uuidOpcional(fd, "responsable_id"),
      fecha_objetivo: fechaOpcional(fd, "fecha_objetivo"),
    },
  } as const;
}

export async function crearProyecto(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  await obtenerUsuario();
  const r = datosProyecto(fd);
  if ("error" in r) return { error: r.error };

  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from("proyectos").insert(r.datos).select("id").single();
  if (error || !data) return { error: "No se pudo guardar el proyecto." };

  redirect(`/proyectos/${data.id}`);
}

export async function actualizarProyecto(id: string, _: EstadoForm, fd: FormData): Promise<EstadoForm> {
  await obtenerUsuario();
  if (!UUID.test(id)) return { error: "Proyecto no válido." };
  const r = datosProyecto(fd);
  if ("error" in r) return { error: r.error };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("proyectos").update(r.datos).eq("id", id);
  if (error) return { error: "No se pudo guardar." };

  redirect(`/proyectos/${id}`);
}

/** Borra el proyecto; sus tareas se conservan como tareas sueltas. */
export async function eliminarProyecto(id: string) {
  await obtenerUsuario();
  if (UUID.test(id)) {
    const supabase = await crearClienteServidor();
    await supabase.from("proyectos").delete().eq("id", id);
  }
  redirect("/proyectos?vista=proyectos");
}
