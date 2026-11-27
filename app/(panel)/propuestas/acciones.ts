"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { obtenerUsuario } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";
import { NOMBRE_VARIANTE, type NombreVariante } from "@/lib/catalogo-tipos";
import { DIAS_VIGENCIA } from "@/lib/propuestas-tipos";

export type EstadoForm = { error?: string; ok?: string } | undefined;

const UUID = /^[0-9a-f-]{36}$/i;
const texto = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const opcional = (fd: FormData, k: string) => texto(fd, k) || null;
const enDias = (dias: number) => new Date(Date.now() + dias * 86_400_000).toISOString();

function precio(fd: FormData, k: string): number | null | "error" {
  const limpio = texto(fd, k).replace(/[$,\s]/g, "");
  if (!limpio) return null;
  const n = Number(limpio);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : "error";
}

function datosProspecto(fd: FormData) {
  const nombre = texto(fd, "prospecto_nombre");
  if (!nombre) return { error: "Escribe el nombre del prospecto." } as const;
  return {
    datos: {
      prospecto_nombre: nombre,
      prospecto_negocio: opcional(fd, "prospecto_negocio"),
      prospecto_contacto: opcional(fd, "prospecto_contacto"),
      problema: opcional(fd, "problema"),
      solucion: opcional(fd, "solucion"),
      notas: opcional(fd, "notas"),
    },
  } as const;
}

// ---------------------------------------------------------------------------
// Propuesta
// ---------------------------------------------------------------------------

export async function crearPropuesta(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  await obtenerUsuario();
  const r = datosProspecto(fd);
  if ("error" in r) return { error: r.error };
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from("propuestas").insert(r.datos).select("id").single();
  if (error || !data) return { error: "No se pudo crear la propuesta." };
  // Si viene del Catálogo ("Agregar a propuesta"), el servicio entra de una vez.
  const servicioId = texto(fd, "servicio_id");
  if (UUID.test(servicioId)) {
    const { data: s } = await supabase.from("servicios").select("id, nombre, que_es").eq("id", servicioId).maybeSingle();
    if (s) {
      const { data: v } = await supabase
        .from("servicio_variantes")
        .select("id, nombre, que_incluye, precio_instalacion, precio_mensual")
        .eq("servicio_id", s.id)
        .order("orden")
        .limit(1)
        .maybeSingle();
      await supabase.from("propuesta_conceptos").insert({
        propuesta_id: data.id,
        servicio_id: s.id,
        variante_id: v?.id ?? null,
        titulo: v && v.nombre !== "unica" ? `${s.nombre} · ${NOMBRE_VARIANTE[v.nombre as NombreVariante]}` : s.nombre,
        descripcion: v?.que_incluye ?? s.que_es,
        precio_instalacion: v?.precio_instalacion ?? null,
        precio_mensual: v?.precio_mensual ?? null,
      });
    }
  }
  redirect(`/propuestas/${data.id}?paso=servicios`);
}

export async function actualizarPropuesta(id: string, _: EstadoForm, fd: FormData): Promise<EstadoForm> {
  await obtenerUsuario();
  if (!UUID.test(id)) return { error: "Propuesta no válida." };
  const r = datosProspecto(fd);
  if ("error" in r) return { error: r.error };
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("propuestas").update(r.datos).eq("id", id);
  if (error) return { error: "No se pudo guardar." };
  refresh();
  return { ok: "Guardado." };
}

/** Borrador → enviada: arranca la vigencia de 30 días del link. */
export async function marcarEnviada(id: string) {
  await obtenerUsuario();
  if (!UUID.test(id)) return;
  const supabase = await crearClienteServidor();
  await supabase
    .from("propuestas")
    .update({ estado: "enviada", enviada_en: new Date().toISOString(), vence_en: enDias(DIAS_VIGENCIA) })
    .eq("id", id)
    .eq("estado", "borrador");
  refresh();
}

/** Renovar 30 días desde hoy. Si estaba vencida, vuelve a enviada (o vista si ya la abrieron). */
export async function renovar(id: string) {
  await obtenerUsuario();
  if (!UUID.test(id)) return;
  const supabase = await crearClienteServidor();
  const { data } = await supabase.from("propuestas").select("estado, vista_en").eq("id", id).maybeSingle();
  if (!data || data.estado === "borrador") return;
  const estado = data.estado === "vencida" ? (data.vista_en ? "vista" : "enviada") : data.estado;
  await supabase.from("propuestas").update({ vence_en: enDias(DIAS_VIGENCIA), estado }).eq("id", id);
  refresh();
}

export async function marcarRespuesta(id: string, respuesta: "aceptada" | "rechazada") {
  await obtenerUsuario();
  if (!UUID.test(id) || !["aceptada", "rechazada"].includes(respuesta)) return;
  const supabase = await crearClienteServidor();
  await supabase.from("propuestas").update({ estado: respuesta, respondida_en: new Date().toISOString() }).eq("id", id);
  refresh();
}

export async function archivarPropuesta(id: string, archivada: boolean) {
  await obtenerUsuario();
  if (!UUID.test(id)) return;
  const supabase = await crearClienteServidor();
  await supabase.from("propuestas").update({ archivada }).eq("id", id);
  refresh();
}

/** Solo los borradores se borran (las enviadas se archivan). */
export async function eliminarBorrador(id: string) {
  await obtenerUsuario();
  if (UUID.test(id)) {
    const supabase = await crearClienteServidor();
    await supabase.from("propuestas").delete().eq("id", id).eq("estado", "borrador");
  }
  redirect("/propuestas");
}

export async function duplicarPropuesta(id: string) {
  await obtenerUsuario();
  if (!UUID.test(id)) return;
  const supabase = await crearClienteServidor();
  const [{ data: p }, { data: conceptos }] = await Promise.all([
    supabase
      .from("propuestas")
      .select("prospecto_nombre, prospecto_negocio, prospecto_contacto, problema, solucion, notas")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("propuesta_conceptos")
      .select("servicio_id, variante_id, titulo, descripcion, precio_instalacion, precio_mensual, orden")
      .eq("propuesta_id", id)
      .order("orden"),
  ]);
  if (!p) return;
  const { data: nueva } = await supabase.from("propuestas").insert(p).select("id").single();
  if (!nueva) return;
  if (conceptos?.length) {
    await supabase.from("propuesta_conceptos").insert(conceptos.map((c) => ({ ...c, propuesta_id: nueva.id })));
  }
  redirect(`/propuestas/${nueva.id}`);
}

// ---------------------------------------------------------------------------
// Conceptos
// ---------------------------------------------------------------------------

/** Agrega un servicio del catálogo (con o sin variante) copiando descripción y precios. */
function cantidadValida(fd: FormData) {
  const n = Number.parseInt(String(fd.get("cantidad") ?? "1"), 10);
  return Number.isFinite(n) ? Math.min(999, Math.max(1, n)) : 1;
}

/** Revisión: activar o quitar el IVA (16%) de la propuesta. */
export async function cambiarIva(id: string, conIvaNuevo: boolean) {
  await obtenerUsuario();
  if (!UUID.test(id)) return;
  const supabase = await crearClienteServidor();
  await supabase.from("propuestas").update({ con_iva: conIvaNuevo }).eq("id", id);
  refresh();
}

export async function agregarDelCatalogo(propuestaId: string, _: EstadoForm, fd: FormData): Promise<EstadoForm> {
  await obtenerUsuario();
  const servicioId = texto(fd, "servicio_id");
  const varianteId = texto(fd, "variante_id");
  if (!UUID.test(propuestaId) || !UUID.test(servicioId)) return { error: "Elige un servicio." };
  const supabase = await crearClienteServidor();

  const { data: s } = await supabase.from("servicios").select("id, numero, nombre, que_es").eq("id", servicioId).maybeSingle();
  if (!s) return { error: "Servicio no encontrado." };
  let v: { id: string; nombre: NombreVariante; que_incluye: string | null; precio_instalacion: number | null; precio_mensual: number | null } | null = null;
  if (UUID.test(varianteId)) {
    const { data } = await supabase
      .from("servicio_variantes")
      .select("id, nombre, que_incluye, precio_instalacion, precio_mensual")
      .eq("id", varianteId)
      .eq("servicio_id", servicioId)
      .maybeSingle();
    v = data;
  }

  const { error } = await supabase.from("propuesta_conceptos").insert({
    propuesta_id: propuestaId,
    servicio_id: s.id,
    variante_id: v?.id ?? null,
    titulo: v && v.nombre !== "unica" ? `${s.nombre} · ${NOMBRE_VARIANTE[v.nombre]}` : s.nombre,
    descripcion: v?.que_incluye ?? s.que_es,
    precio_instalacion: v?.precio_instalacion ?? null,
    precio_mensual: v?.precio_mensual ?? null,
    cantidad: cantidadValida(fd),
  });
  if (error) return { error: "No se pudo agregar." };
  refresh();
  return { ok: "Agregado." };
}

export async function agregarConceptoLibre(propuestaId: string) {
  await obtenerUsuario();
  if (!UUID.test(propuestaId)) return;
  const supabase = await crearClienteServidor();
  await supabase.from("propuesta_conceptos").insert({ propuesta_id: propuestaId, titulo: "Concepto nuevo" });
  refresh();
}

export async function actualizarConcepto(id: string, _: EstadoForm, fd: FormData): Promise<EstadoForm> {
  await obtenerUsuario();
  if (!UUID.test(id)) return { error: "Concepto no válido." };
  const titulo = texto(fd, "titulo");
  if (!titulo) return { error: "Escribe el nombre del concepto." };
  const instalacion = precio(fd, "precio_instalacion");
  const mensual = precio(fd, "precio_mensual");
  if (instalacion === "error" || mensual === "error") return { error: "Revisa los precios (solo números)." };
  const supabase = await crearClienteServidor();
  const { error } = await supabase
    .from("propuesta_conceptos")
    .update({ titulo, descripcion: opcional(fd, "descripcion"), precio_instalacion: instalacion, precio_mensual: mensual, cantidad: cantidadValida(fd) })
    .eq("id", id);
  if (error) return { error: "No se pudo guardar." };
  refresh();
  return { ok: "Guardado." };
}

export async function eliminarConcepto(id: string) {
  await obtenerUsuario();
  if (!UUID.test(id)) return;
  const supabase = await crearClienteServidor();
  await supabase.from("propuesta_conceptos").delete().eq("id", id);
  refresh();
}
