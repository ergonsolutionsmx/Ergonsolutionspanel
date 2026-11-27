"use server";

import { redirect } from "next/navigation";
import { obtenerUsuario, rutaSegura } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";
import { FECHA_VALIDA, instanteCDMX } from "@/lib/fechas";

export type EstadoForm = { error?: string } | undefined;

const UUID = /^[0-9a-f-]{36}$/i;
const HORA = /^\d{2}:\d{2}$/;
const texto = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

function datosEvento(fd: FormData) {
  const titulo = texto(fd, "titulo");
  if (!titulo) return { error: "Escribe un título." } as const;
  if (titulo.length > 200) return { error: "El título es muy largo (máx. 200)." } as const;

  const todoElDia = fd.get("todo_el_dia") === "on";
  const fechaInicio = texto(fd, "fecha_inicio");
  const fechaFin = texto(fd, "fecha_fin") || fechaInicio;
  if (!FECHA_VALIDA.test(fechaInicio) || !FECHA_VALIDA.test(fechaFin)) return { error: "Revisa las fechas." } as const;

  let inicio: string;
  let fin: string;
  if (todoElDia) {
    inicio = instanteCDMX(fechaInicio, "00:00");
    fin = instanteCDMX(fechaFin, "23:59");
  } else {
    const horaInicio = texto(fd, "hora_inicio");
    const horaFin = texto(fd, "hora_fin") || horaInicio;
    if (!HORA.test(horaInicio) || !HORA.test(horaFin)) return { error: "Revisa las horas." } as const;
    inicio = instanteCDMX(fechaInicio, horaInicio);
    fin = instanteCDMX(fechaFin, horaFin);
  }
  if (new Date(fin) < new Date(inicio)) return { error: "El fin no puede ser antes del inicio." } as const;

  const responsable = texto(fd, "responsable_id");
  return {
    datos: {
      titulo,
      todo_el_dia: todoElDia,
      inicio,
      fin,
      lugar: texto(fd, "lugar") || null,
      notas: texto(fd, "notas") || null,
      responsable_id: UUID.test(responsable) ? responsable : null,
    },
  } as const;
}

export async function crearEvento(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  await obtenerUsuario();
  const r = datosEvento(fd);
  if ("error" in r) return { error: r.error };
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("eventos").insert(r.datos);
  if (error) return { error: "No se pudo guardar el evento." };
  redirect(rutaSegura(fd.get("volver"), "/agenda"));
}

export async function actualizarEvento(id: string, _: EstadoForm, fd: FormData): Promise<EstadoForm> {
  await obtenerUsuario();
  if (!UUID.test(id)) return { error: "Evento no válido." };
  const r = datosEvento(fd);
  if ("error" in r) return { error: r.error };
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("eventos").update(r.datos).eq("id", id);
  if (error) return { error: "No se pudo guardar." };
  redirect(rutaSegura(fd.get("volver"), "/agenda"));
}

export async function eliminarEvento(id: string, volver: string) {
  await obtenerUsuario();
  if (UUID.test(id)) {
    const supabase = await crearClienteServidor();
    await supabase.from("eventos").delete().eq("id", id);
  }
  redirect(rutaSegura(volver, "/agenda"));
}
