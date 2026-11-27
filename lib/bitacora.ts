import "server-only";
import { crearClienteServidor } from "@/lib/supabase/server";
import { FECHA_VALIDA, instanteCDMX, sumarDias } from "@/lib/fechas";

export const TABLAS_BITACORA: Record<string, string> = {
  tareas: "Tarea",
  proyectos: "Proyecto",
  eventos: "Evento",
  servicios: "Servicio",
  servicio_variantes: "Variante de servicio",
  propuestas: "Propuesta",
  propuesta_conceptos: "Concepto de propuesta",
  mensajes: "Mensaje",
  canales_config: "Canal",
  demos: "Demo",
  perfiles: "Perfil",
  cuenta: "Cuenta",
};

export const ACCIONES_BITACORA: Record<string, string> = {
  insert: "Creó",
  update: "Editó",
  delete: "Borró",
  cambio_contrasena: "Cambió su contraseña",
};

/** Liga al registro, si todavía tiene página. */
export const RUTA_REGISTRO: Record<string, (id: string) => string> = {
  tareas: (id) => `/proyectos/tareas/${id}`,
  proyectos: (id) => `/proyectos/${id}`,
  eventos: (id) => `/agenda/eventos/${id}`,
  servicios: (id) => `/catalogo/${id}`,
  propuestas: (id) => `/propuestas/${id}`,
  mensajes: (id) => `/bandeja/${id}`,
};

export type Registro = {
  id: string;
  usuario_id: string | null;
  accion: string;
  tabla: string | null;
  registro_id: string | null;
  detalle: { antes?: Record<string, unknown>; despues?: Record<string, unknown> } & Record<string, unknown>;
  creado_en: string;
};

export type FiltrosBitacora = { tabla: string; usuario: string; accion: string; desde: string; hasta: string; pagina: number };
export const POR_PAGINA = 50;

export function leerFiltrosBitacora(sp: Record<string, string | string[] | undefined>): FiltrosBitacora {
  const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const pagina = Math.max(1, Number.parseInt(uno(sp.pagina), 10) || 1);
  return {
    tabla: uno(sp.tabla) in TABLAS_BITACORA ? uno(sp.tabla) : "",
    usuario: uno(sp.usuario),
    accion: uno(sp.accion) in ACCIONES_BITACORA ? uno(sp.accion) : "",
    desde: FECHA_VALIDA.test(uno(sp.desde)) ? uno(sp.desde) : "",
    hasta: FECHA_VALIDA.test(uno(sp.hasta)) ? uno(sp.hasta) : "",
    pagina,
  };
}

/** Para la línea de tiempo: los primeros `cantidad` registros con filtros ("Cargar más"). */
export async function obtenerBitacoraHasta(f: FiltrosBitacora, cantidad: number) {
  const supabase = await crearClienteServidor();
  let q = supabase
    .from("bitacora")
    .select("id, usuario_id, accion, tabla, registro_id, detalle, creado_en", { count: "exact" })
    .order("creado_en", { ascending: false });
  if (f.tabla) q = q.eq("tabla", f.tabla);
  if (f.accion) q = q.eq("accion", f.accion);
  if (f.usuario === "sistema") q = q.is("usuario_id", null);
  else if (/^[0-9a-f-]{36}$/i.test(f.usuario)) q = q.eq("usuario_id", f.usuario);
  const { data, count } = await q.range(0, cantidad - 1);
  return { registros: (data ?? []) as Registro[], total: count ?? 0 };
}

export async function obtenerBitacora(f: FiltrosBitacora) {
  const supabase = await crearClienteServidor();
  let q = supabase
    .from("bitacora")
    .select("id, usuario_id, accion, tabla, registro_id, detalle, creado_en", { count: "exact" })
    .order("creado_en", { ascending: false });
  if (f.tabla) q = q.eq("tabla", f.tabla);
  if (f.accion) q = q.eq("accion", f.accion);
  if (f.usuario === "sistema") q = q.is("usuario_id", null);
  else if (/^[0-9a-f-]{36}$/i.test(f.usuario)) q = q.eq("usuario_id", f.usuario);
  if (f.desde) q = q.gte("creado_en", instanteCDMX(f.desde));
  if (f.hasta) q = q.lt("creado_en", instanteCDMX(sumarDias(f.hasta, 1)));
  const desde = (f.pagina - 1) * POR_PAGINA;
  const { data, count } = await q.range(desde, desde + POR_PAGINA - 1);
  return { registros: (data ?? []) as Registro[], total: count ?? 0 };
}

const IGNORAR = new Set(["actualizado_en", "creado_en", "orden", "creado_por", "id"]);

function corto(v: unknown) {
  if (v === null || v === undefined || v === "") return "—";
  const t = typeof v === "string" ? v : JSON.stringify(v);
  return t.length > 60 ? `${t.slice(0, 57)}…` : t;
}

/** "estado: por_hacer → hecha" para cada campo que cambió. */
export function cambios(r: Registro) {
  const { antes, despues } = r.detalle ?? {};
  if (!antes || !despues) return [];
  return Object.keys(despues)
    .filter((k) => !IGNORAR.has(k) && JSON.stringify(antes[k]) !== JSON.stringify(despues[k]))
    .map((k) => ({ campo: k.replace(/_/g, " "), antes: corto(antes[k]), despues: corto(despues[k]) }));
}

/** Nombre legible del registro (título, nombre, folio…). */
export function nombreRegistro(r: Registro) {
  const d = (r.detalle?.despues ?? r.detalle?.antes ?? {}) as Record<string, unknown>;
  const valor = d.titulo ?? d.nombre ?? d.folio ?? d.asunto ?? d.prospecto_nombre ?? d.canal;
  return typeof valor === "string" ? valor : null;
}
