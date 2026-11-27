import "server-only";
import { crearClienteServidor } from "@/lib/supabase/server";
import { instanteCDMX, partesCDMX, rangoDias, sumarDias } from "@/lib/fechas";
import type { EstadoTarea, Prioridad } from "@/lib/tareas-tipos";
import { COLUMNAS_EVENTO, ordenarItems, type Evento, type ItemAgenda } from "@/lib/agenda-tipos";

const UUID = /^[0-9a-f-]{36}$/i;

/** Eventos y tareas con fecha entre `desde` y `hasta` (incluidos), agrupados por día. */
export async function obtenerAgenda({
  desde,
  hasta,
  de,
  yoId,
}: {
  desde: string;
  hasta: string;
  de: string;
  yoId: string;
}): Promise<Record<string, ItemAgenda[]>> {
  const supabase = await crearClienteServidor();
  const responsable = de === "mias" ? yoId : UUID.test(de) ? de : null;

  let qEventos = supabase
    .from("eventos")
    .select(COLUMNAS_EVENTO)
    .lt("inicio", instanteCDMX(sumarDias(hasta, 1)))
    .gte("fin", instanteCDMX(desde))
    .order("inicio");
  let qTareas = supabase
    .from("tareas")
    .select("id, titulo, fecha_limite, estado, prioridad, responsable_id")
    .gte("fecha_limite", desde)
    .lte("fecha_limite", hasta);
  if (responsable) {
    qEventos = qEventos.eq("responsable_id", responsable);
    qTareas = qTareas.eq("responsable_id", responsable);
  }

  const [eventos, tareas] = await Promise.all([qEventos.limit(1000), qTareas.limit(1000)]);

  const porDia: Record<string, ItemAgenda[]> = {};
  const agregar = (item: ItemAgenda) => (porDia[item.dia] ??= []).push(item);

  for (const e of (eventos.data ?? []) as Evento[]) {
    const ini = partesCDMX(e.inicio);
    const fin = partesCDMX(e.fin);
    const primero = ini.fecha < desde ? desde : ini.fecha;
    const ultimo = fin.fecha > hasta ? hasta : fin.fecha;
    for (const dia of rangoDias(primero, ultimo)) {
      agregar({
        tipo: "evento",
        id: e.id,
        titulo: e.titulo,
        dia,
        todoElDia: e.todo_el_dia,
        hora: !e.todo_el_dia && dia === ini.fecha ? ini.hora : null,
        horaFin: !e.todo_el_dia && dia === fin.fecha ? fin.hora : null,
        continua: dia !== ini.fecha,
        lugar: e.lugar,
        responsable_id: e.responsable_id,
        reunion: e.tipo === "reunion",
        modalidad: e.modalidad,
        enlace: e.enlace,
      });
    }
  }

  for (const t of tareas.data ?? []) {
    agregar({
      tipo: "tarea",
      id: t.id,
      titulo: t.titulo,
      dia: t.fecha_limite,
      estado: t.estado as EstadoTarea,
      prioridad: t.prioridad as Prioridad,
      responsable_id: t.responsable_id,
    });
  }

  for (const dia of Object.keys(porDia)) porDia[dia].sort(ordenarItems);
  return porDia;
}

export async function obtenerEvento(id: string): Promise<Evento | null> {
  if (!UUID.test(id)) return null;
  const supabase = await crearClienteServidor();
  const { data } = await supabase.from("eventos").select(COLUMNAS_EVENTO).eq("id", id).maybeSingle();
  return (data as Evento) ?? null;
}
