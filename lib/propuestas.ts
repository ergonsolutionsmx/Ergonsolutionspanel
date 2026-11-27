import "server-only";
import { crearClienteServidor } from "@/lib/supabase/server";
import {
  COLUMNAS_CONCEPTO,
  COLUMNAS_PROPUESTA,
  type Concepto,
  type EstadoPropuesta,
  type Propuesta,
  type PropuestaParaCliente,
} from "@/lib/propuestas-tipos";

const UUID = /^[0-9a-f-]{36}$/i;

const numero = (v: unknown) => (v === null || v === undefined ? null : Number(v));

function limpiarPropuesta(p: Propuesta): Propuesta {
  return { ...p, total_instalacion: Number(p.total_instalacion), total_mensual: Number(p.total_mensual) };
}
function limpiarConcepto(c: Concepto): Concepto {
  return { ...c, precio_instalacion: numero(c.precio_instalacion), precio_mensual: numero(c.precio_mensual) };
}

export async function obtenerPropuestas({
  estado,
  archivadas,
}: {
  estado: EstadoPropuesta | "";
  archivadas: boolean;
}): Promise<Propuesta[]> {
  const supabase = await crearClienteServidor();
  let q = supabase.from("propuestas").select(COLUMNAS_PROPUESTA).eq("archivada", archivadas).order("creado_en", { ascending: false });
  if (estado) q = q.eq("estado", estado);
  const { data } = await q.limit(500);
  return ((data ?? []) as Propuesta[]).map(limpiarPropuesta);
}

export async function obtenerPropuesta(id: string): Promise<{ propuesta: Propuesta; conceptos: Concepto[] } | null> {
  if (!UUID.test(id)) return null;
  const supabase = await crearClienteServidor();
  const [p, c] = await Promise.all([
    supabase.from("propuestas").select(COLUMNAS_PROPUESTA).eq("id", id).maybeSingle(),
    supabase.from("propuesta_conceptos").select(COLUMNAS_CONCEPTO).eq("propuesta_id", id).order("orden"),
  ]);
  if (!p.data) return null;
  return {
    propuesta: limpiarPropuesta(p.data as Propuesta),
    conceptos: ((c.data ?? []) as Concepto[]).map(limpiarConcepto),
  };
}

export type ResultadoPublico =
  | { estado: "ok"; propuesta: PropuestaParaCliente }
  | { estado: "vencida"; folio: string }
  | { estado: "no_existe" };

/**
 * Lee la propuesta por su token público (sin sesión) con la función
 * propuesta_publica de la base de datos. Si `marcarVista`, la primera
 * apertura la marca como vista y avisa.
 */
export async function obtenerPropuestaPublica(token: string, marcarVista: boolean): Promise<ResultadoPublico> {
  if (!/^[0-9a-f]{48}$/.test(token)) return { estado: "no_existe" };
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.rpc("propuesta_publica", { p_token: token, p_marcar_vista: marcarVista });
  if (error || !data) return { estado: "no_existe" };
  const r = data as { estado: string; folio?: string; propuesta?: Record<string, unknown>; conceptos?: Record<string, unknown>[] };
  if (r.estado === "vencida") return { estado: "vencida", folio: String(r.folio ?? "") };
  if (r.estado !== "ok" || !r.propuesta) return { estado: "no_existe" };
  const p = r.propuesta;
  return {
    estado: "ok",
    propuesta: {
      folio: String(p.folio),
      prospecto_nombre: String(p.prospecto_nombre),
      prospecto_negocio: (p.prospecto_negocio as string) ?? null,
      problema: (p.problema as string) ?? null,
      solucion: (p.solucion as string) ?? null,
      enviada_en: (p.enviada_en as string) ?? null,
      vence_en: (p.vence_en as string) ?? null,
      total_instalacion: Number(p.total_instalacion),
      total_mensual: Number(p.total_mensual),
      creado_en: String(p.creado_en),
      conceptos: (r.conceptos ?? []).map((c) => ({
        titulo: String(c.titulo),
        descripcion: (c.descripcion as string) ?? null,
        precio_instalacion: numero(c.precio_instalacion),
        precio_mensual: numero(c.precio_mensual),
      })),
    },
  };
}

/** ¿La persona que abre el link es Jorge o Antonio? (para no marcarla como "vista"). */
export async function esMiembroConSesion() {
  const supabase = await crearClienteServidor();
  const { data } = await supabase.auth.getClaims();
  const id = data?.claims?.sub;
  if (!id) return false;
  const { data: perfil } = await supabase.from("perfiles").select("id").eq("usuario_id", id).maybeSingle();
  return Boolean(perfil);
}
