import "server-only";
import { crearClienteServidor } from "@/lib/supabase/server";
import { hoyISO, sumarDias } from "@/lib/fechas";
import {
  COLUMNAS_PROYECTO,
  COLUMNAS_TAREA,
  type Catalogos,
  type PerfilCorto,
  type Proyecto,
  type Tarea,
} from "@/lib/tareas-tipos";

/** Las tareas "hechas" solo se muestran si se terminaron en estos últimos días. */
export const DIAS_HECHAS_VISIBLES = 30;

export type FiltrosTareas = {
  /** "todos" | "mias" | usuario_id */
  de: string;
  /** "" (todos) | "sueltas" | proyecto_id */
  proyecto: string;
  vencidas: boolean;
  /** "" (todas) | alta | media | baja */
  prioridad: string;
};

export function leerFiltros(sp: Record<string, string | string[] | undefined>): FiltrosTareas {
  const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  return {
    de: uno(sp.de) || "todos",
    proyecto: uno(sp.proyecto),
    vencidas: uno(sp.vencidas) === "1",
    prioridad: ["alta", "media", "baja"].includes(uno(sp.prioridad)) ? uno(sp.prioridad) : "",
  };
}

const UUID = /^[0-9a-f-]{36}$/i;

export async function obtenerCatalogos(yoId: string): Promise<Catalogos> {
  const supabase = await crearClienteServidor();
  const [perfiles, proyectos] = await Promise.all([
    supabase.from("perfiles").select("usuario_id, nombre, color").order("nombre"),
    supabase.from("proyectos").select("id, nombre, estado, tipo").order("nombre"),
  ]);
  return {
    perfiles: (perfiles.data ?? []) as PerfilCorto[],
    proyectos: (proyectos.data ?? []) as Catalogos["proyectos"],
    yoId,
    hoy: hoyISO(),
  };
}

export async function obtenerTareas(filtros: FiltrosTareas, yoId: string): Promise<Tarea[]> {
  const supabase = await crearClienteServidor();
  const hoy = hoyISO();
  const limiteHechas = `${sumarDias(hoy, -DIAS_HECHAS_VISIBLES)}T00:00:00-06:00`;

  let q = supabase
    .from("tareas")
    .select(COLUMNAS_TAREA)
    .or(`estado.neq.hecha,completada_en.gte.${limiteHechas}`)
    .order("orden", { ascending: true });

  if (filtros.de === "mias") q = q.eq("responsable_id", yoId);
  else if (UUID.test(filtros.de)) q = q.eq("responsable_id", filtros.de);

  if (filtros.proyecto === "sueltas") q = q.is("proyecto_id", null);
  else if (UUID.test(filtros.proyecto)) q = q.eq("proyecto_id", filtros.proyecto);

  if (filtros.vencidas) q = q.lt("fecha_limite", hoy).neq("estado", "hecha");
  if (filtros.prioridad) q = q.eq("prioridad", filtros.prioridad);

  const { data } = await q.limit(500);
  return (data ?? []) as Tarea[];
}

export async function obtenerTarea(id: string): Promise<Tarea | null> {
  if (!UUID.test(id)) return null;
  const supabase = await crearClienteServidor();
  const { data } = await supabase.from("tareas").select(COLUMNAS_TAREA).eq("id", id).maybeSingle();
  return (data as Tarea) ?? null;
}

export type ProyectoConAvance = Proyecto & { total: number; hechas: number };

export async function obtenerProyectos(): Promise<ProyectoConAvance[]> {
  const supabase = await crearClienteServidor();
  const [proyectos, tareas] = await Promise.all([
    supabase.from("proyectos").select(COLUMNAS_PROYECTO).order("creado_en", { ascending: false }),
    supabase.from("tareas").select("proyecto_id, estado").not("proyecto_id", "is", null),
  ]);
  const conteo = new Map<string, { total: number; hechas: number }>();
  for (const t of tareas.data ?? []) {
    const c = conteo.get(t.proyecto_id) ?? { total: 0, hechas: 0 };
    c.total++;
    if (t.estado === "hecha") c.hechas++;
    conteo.set(t.proyecto_id, c);
  }
  return ((proyectos.data ?? []) as Proyecto[]).map((p) => ({ ...p, ...(conteo.get(p.id) ?? { total: 0, hechas: 0 }) }));
}

export async function obtenerProyecto(id: string): Promise<ProyectoConAvance | null> {
  if (!UUID.test(id)) return null;
  const supabase = await crearClienteServidor();
  const [proyecto, tareas] = await Promise.all([
    supabase.from("proyectos").select(COLUMNAS_PROYECTO).eq("id", id).maybeSingle(),
    supabase.from("tareas").select("estado").eq("proyecto_id", id),
  ]);
  if (!proyecto.data) return null;
  const lista = tareas.data ?? [];
  return {
    ...(proyecto.data as Proyecto),
    total: lista.length,
    hechas: lista.filter((t) => t.estado === "hecha").length,
  };
}

export function porcentaje(p: { total: number; hechas: number }) {
  return p.total === 0 ? 0 : Math.round((p.hechas / p.total) * 100);
}
