import "server-only";
import { crearClienteServidor } from "@/lib/supabase/server";
import { COLUMNAS_SERVICIO, COLUMNAS_VARIANTE, ORDEN_VARIANTE, type Servicio, type Variante } from "@/lib/catalogo-tipos";

const UUID = /^[0-9a-f-]{36}$/i;

function normalizarVariante(v: Variante): Variante {
  // numeric llega como texto desde PostgREST.
  return {
    ...v,
    precio_instalacion: v.precio_instalacion === null ? null : Number(v.precio_instalacion),
    precio_mensual: v.precio_mensual === null ? null : Number(v.precio_mensual),
  };
}

function ordenarVariantes(vs: Variante[]) {
  return vs.map(normalizarVariante).sort((a, b) => a.orden - b.orden || ORDEN_VARIANTE[a.nombre] - ORDEN_VARIANTE[b.nombre]);
}

export async function obtenerServicios(): Promise<Servicio[]> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("servicios")
    .select(`${COLUMNAS_SERVICIO}, variantes:servicio_variantes(${COLUMNAS_VARIANTE})`)
    .order("numero");
  return ((data ?? []) as unknown as Servicio[]).map((s) => ({ ...s, variantes: ordenarVariantes(s.variantes ?? []) }));
}

export async function obtenerServicio(id: string): Promise<Servicio | null> {
  if (!UUID.test(id)) return null;
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("servicios")
    .select(`${COLUMNAS_SERVICIO}, variantes:servicio_variantes(${COLUMNAS_VARIANTE})`)
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const s = data as unknown as Servicio;
  return { ...s, variantes: ordenarVariantes(s.variantes ?? []) };
}
