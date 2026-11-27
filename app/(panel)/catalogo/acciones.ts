"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { obtenerUsuario } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";
import {
  CATEGORIAS,
  DIFICULTADES,
  ESTADOS_SERVICIO,
  NOMBRES_VARIANTE,
  ORDEN_VARIANTE,
  type NombreVariante,
} from "@/lib/catalogo-tipos";

export type EstadoForm = { error?: string; ok?: string } | undefined;

const UUID = /^[0-9a-f-]{36}$/i;
const texto = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const opcional = (fd: FormData, k: string) => texto(fd, k) || null;
const lineas = (fd: FormData, k: string) =>
  texto(fd, k)
    .split("\n")
    .map((l) => l.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean);

/** "$12,500.00" o "12500" → 12500; vacío → null (por definir). */
function precio(fd: FormData, k: string): number | null | "error" {
  const limpio = texto(fd, k).replace(/[$,\s]/g, "");
  if (!limpio) return null;
  const n = Number(limpio);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : "error";
}

function datosServicio(fd: FormData) {
  const numero = texto(fd, "numero").padStart(2, "0");
  const nombre = texto(fd, "nombre");
  if (!/^\d{2,3}$/.test(numero)) return { error: "El número debe ser de 2 o 3 dígitos (p. ej. 07)." } as const;
  if (!nombre) return { error: "Escribe el nombre." } as const;
  const link = texto(fd, "link_drive");
  if (link && !/^https:\/\//.test(link)) return { error: "El link de Drive debe empezar con https://" } as const;
  const estado = texto(fd, "estado");
  const dificultad = texto(fd, "dificultad");
  return {
    datos: {
      numero,
      nombre,
      categorias: fd.getAll("categorias").map(String).filter((c) => (CATEGORIAS as readonly string[]).includes(c)),
      estado: (ESTADOS_SERVICIO as readonly string[]).includes(estado) ? estado : "pendiente",
      dificultad: (DIFICULTADES as readonly string[]).includes(dificultad) ? dificultad : null,
      lleva_ia: fd.get("lleva_ia") === "on",
      que_es: opcional(fd, "que_es"),
      para_quien: opcional(fd, "para_quien"),
      problemas: lineas(fd, "problemas"),
      cuando_no_recomendar: opcional(fd, "cuando_no_recomendar"),
      entregables: opcional(fd, "entregables"),
      link_drive: link || null,
    },
  } as const;
}

function errorDuplicado(error: { code?: string } | null) {
  return error?.code === "23505" ? "Ya existe un servicio con ese número." : "No se pudo guardar.";
}

export async function crearServicio(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  await obtenerUsuario();
  const r = datosServicio(fd);
  if ("error" in r) return { error: r.error };
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.from("servicios").insert(r.datos).select("id").single();
  if (error || !data) return { error: errorDuplicado(error) };
  redirect(`/catalogo/${data.id}/editar`);
}

export async function actualizarServicio(id: string, _: EstadoForm, fd: FormData): Promise<EstadoForm> {
  await obtenerUsuario();
  if (!UUID.test(id)) return { error: "Servicio no válido." };
  const r = datosServicio(fd);
  if ("error" in r) return { error: r.error };
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("servicios").update(r.datos).eq("id", id);
  if (error) return { error: errorDuplicado(error) };
  redirect(`/catalogo/${id}`);
}

/** Archivar o reactivar (los servicios no se borran). */
export async function cambiarActivoServicio(id: string, activo: boolean) {
  await obtenerUsuario();
  if (!UUID.test(id)) return;
  const supabase = await crearClienteServidor();
  await supabase.from("servicios").update({ activo }).eq("id", id);
  refresh();
}

// ---------------------------------------------------------------------------
// Variantes
// ---------------------------------------------------------------------------

export async function guardarVariante(
  servicioId: string,
  varianteId: string | null,
  _: EstadoForm,
  fd: FormData,
): Promise<EstadoForm> {
  await obtenerUsuario();
  if (!UUID.test(servicioId) || (varianteId && !UUID.test(varianteId))) return { error: "Datos no válidos." };

  const nombre = texto(fd, "nombre") as NombreVariante;
  if (!NOMBRES_VARIANTE.includes(nombre)) return { error: "Elige el tipo de variante." };
  const instalacion = precio(fd, "precio_instalacion");
  const mensual = precio(fd, "precio_mensual");
  if (instalacion === "error" || mensual === "error") return { error: "Revisa los precios (solo números)." };

  const datos = {
    nombre,
    que_incluye: opcional(fd, "que_incluye"),
    entregables: opcional(fd, "entregables"),
    tiempo_estimado: opcional(fd, "tiempo_estimado"),
    precio_instalacion: instalacion,
    precio_mensual: mensual,
    orden: ORDEN_VARIANTE[nombre],
  };

  const supabase = await crearClienteServidor();
  const { error } = varianteId
    ? await supabase.from("servicio_variantes").update(datos).eq("id", varianteId).eq("servicio_id", servicioId)
    : await supabase.from("servicio_variantes").insert({ ...datos, servicio_id: servicioId });
  if (error) return { error: error.code === "23505" ? "Ese servicio ya tiene esa variante." : "No se pudo guardar." };

  refresh();
  return { ok: "Guardado." };
}

export async function eliminarVariante(servicioId: string, varianteId: string) {
  await obtenerUsuario();
  if (!UUID.test(servicioId) || !UUID.test(varianteId)) return;
  const supabase = await crearClienteServidor();
  await supabase.from("servicio_variantes").delete().eq("id", varianteId).eq("servicio_id", servicioId);
  refresh();
}
