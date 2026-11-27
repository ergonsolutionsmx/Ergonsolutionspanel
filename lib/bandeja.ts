import "server-only";
import { crearClienteServidor } from "@/lib/supabase/server";
import { CANALES, COLUMNAS_MENSAJE, ESTADOS_MENSAJE, type Canal, type EstadoMensaje, type Mensaje } from "@/lib/inbox/tipos";

const UUID = /^[0-9a-f-]{36}$/i;

export type FiltrosBandeja = {
  canal: Canal | "";
  /** "" = todos menos archivados */
  estado: EstadoMensaje | "";
  /** "todos" | "mios" | "sin" | usuario_id */
  asignado: string;
};

export function leerFiltrosBandeja(sp: Record<string, string | string[] | undefined>): FiltrosBandeja {
  const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const canal = uno(sp.canal);
  const estado = uno(sp.estado);
  return {
    canal: (CANALES as readonly string[]).includes(canal) ? (canal as Canal) : "",
    estado: (ESTADOS_MENSAJE as readonly string[]).includes(estado) ? (estado as EstadoMensaje) : "",
    asignado: uno(sp.asignado) || "todos",
  };
}

export async function obtenerMensajes(f: FiltrosBandeja, yoId: string): Promise<Mensaje[]> {
  const supabase = await crearClienteServidor();
  let q = supabase.from("mensajes").select(COLUMNAS_MENSAJE).order("recibido_en", { ascending: false });
  if (f.canal) q = q.eq("canal", f.canal);
  q = f.estado ? q.eq("estado", f.estado) : q.neq("estado", "archivado");
  if (f.asignado === "mios") q = q.eq("asignado_a", yoId);
  else if (f.asignado === "sin") q = q.is("asignado_a", null);
  else if (UUID.test(f.asignado)) q = q.eq("asignado_a", f.asignado);
  const { data } = await q.limit(300);
  return (data ?? []) as Mensaje[];
}

export async function obtenerMensaje(id: string) {
  if (!UUID.test(id)) return null;
  const supabase = await crearClienteServidor();
  const [m, t] = await Promise.all([
    supabase.from("mensajes").select(COLUMNAS_MENSAJE).eq("id", id).maybeSingle(),
    supabase.from("tareas").select("id, titulo, estado").eq("mensaje_id", id).order("creado_en"),
  ]);
  if (!m.data) return null;
  return { mensaje: m.data as Mensaje, tareas: (t.data ?? []) as { id: string; titulo: string; estado: string }[] };
}

export async function contarNuevos() {
  const supabase = await crearClienteServidor();
  const { count } = await supabase.from("mensajes").select("id", { count: "exact", head: true }).eq("estado", "nuevo");
  return count ?? 0;
}
