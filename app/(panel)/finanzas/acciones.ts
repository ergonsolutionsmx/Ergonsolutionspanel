"use server";

import { refresh } from "next/cache";
import { obtenerUsuario } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";
import { FECHA_VALIDA, hoyISO, sumarMeses } from "@/lib/fechas";
import { TASA_IVA, categoriaValida, type MetodoPago, type TipoMovimiento } from "@/lib/finanzas-tipos";

export type EstadoForm = { error?: string; ok?: string } | undefined;

const UUID = /^[0-9a-f-]{36}$/i;
const METODOS: MetodoPago[] = ["transferencia", "efectivo", "tarjeta", "otro"];
const texto = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const opcional = (fd: FormData, k: string) => texto(fd, k) || null;
const fecha = (fd: FormData, k: string) => (FECHA_VALIDA.test(texto(fd, k)) ? texto(fd, k) : null);

function monto(fd: FormData, k: string): number | null | "error" {
  const limpio = texto(fd, k).replace(/[$,\s]/g, "");
  if (!limpio) return null;
  const n = Number(limpio);
  return Number.isFinite(n) && n >= 0 && n < 1e10 ? Math.round(n * 100) / 100 : "error";
}

/** Ruta de factura válida: solo dentro de la carpeta del año/mes que genera el panel. */
const RUTA_FACTURA = /^\d{4}\/\d{2}\/[0-9a-f-]{36}\.(pdf|xml|jpg|jpeg|png|webp)$/i;

function leerMovimiento(fd: FormData) {
  const tipo = texto(fd, "tipo") as TipoMovimiento;
  if (tipo !== "ingreso" && tipo !== "gasto") return { error: "Elige si es ingreso o gasto." } as const;
  const concepto = texto(fd, "concepto");
  if (!concepto) return { error: "Escribe el concepto." } as const;
  const categoria = texto(fd, "categoria");
  if (!categoriaValida(tipo, categoria)) return { error: "Elige una categoría." } as const;
  const subtotal = monto(fd, "subtotal");
  if (subtotal === null || subtotal === "error") return { error: "Escribe un monto válido." } as const;
  const isr = monto(fd, "retencion_isr");
  const ivaRet = monto(fd, "retencion_iva");
  if (isr === "error" || ivaRet === "error") return { error: "Revisa las retenciones." } as const;
  const conIva = fd.get("con_iva") === "on" || fd.get("con_iva") === "true";
  const ivaMonto = conIva ? subtotal * TASA_IVA : 0;
  if ((isr ?? 0) + (ivaRet ?? 0) > subtotal + ivaMonto) return { error: "Las retenciones no pueden ser mayores al total." } as const;

  const estado = texto(fd, "estado") === "pagado" ? "pagado" : "pendiente";
  const hoy = hoyISO();
  const metodo = texto(fd, "metodo") as MetodoPago;
  const proyecto = texto(fd, "proyecto_id");
  const archivo = texto(fd, "factura_archivo");
  return {
    datos: {
      tipo,
      concepto,
      contraparte: opcional(fd, "contraparte"),
      categoria,
      proyecto_id: UUID.test(proyecto) ? proyecto : null,
      subtotal,
      tasa_iva: conIva ? TASA_IVA : 0,
      retencion_isr: isr ?? 0,
      retencion_iva: ivaRet ?? 0,
      estado,
      fecha: fecha(fd, "fecha") ?? hoy,
      vence: estado === "pendiente" ? fecha(fd, "vence") : null,
      pagado_en: estado === "pagado" ? (fecha(fd, "pagado_en") ?? hoy) : null,
      metodo: estado === "pagado" && METODOS.includes(metodo) ? metodo : null,
      factura_folio: opcional(fd, "factura_folio"),
      factura_archivo: RUTA_FACTURA.test(archivo) ? archivo : null,
      notas: opcional(fd, "notas"),
    },
  } as const;
}

export async function guardarMovimiento(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  await obtenerUsuario();
  const r = leerMovimiento(fd);
  if ("error" in r) return { error: r.error };
  const supabase = await crearClienteServidor();
  const id = texto(fd, "id");
  if (UUID.test(id)) {
    // Si cambió la factura, se borra el archivo anterior.
    const { data: antes } = await supabase.from("movimientos").select("factura_archivo").eq("id", id).maybeSingle();
    const { error } = await supabase.from("movimientos").update(r.datos).eq("id", id);
    if (error) return { error: "No se pudo guardar." };
    if (antes?.factura_archivo && antes.factura_archivo !== r.datos.factura_archivo) {
      await supabase.storage.from("facturas").remove([antes.factura_archivo]);
    }
  } else {
    const { error } = await supabase.from("movimientos").insert(r.datos);
    if (error) return { error: "No se pudo guardar." };
  }
  refresh();
  return { ok: r.datos.tipo === "ingreso" ? "Ingreso guardado" : "Gasto guardado" };
}

export async function marcarPagado(id: string, metodo: MetodoPago = "transferencia"): Promise<{ ok: boolean }> {
  await obtenerUsuario();
  if (!UUID.test(id)) return { ok: false };
  const supabase = await crearClienteServidor();
  const { error } = await supabase
    .from("movimientos")
    .update({ estado: "pagado", pagado_en: hoyISO(), metodo: METODOS.includes(metodo) ? metodo : "transferencia" })
    .eq("id", id)
    .eq("estado", "pendiente");
  refresh();
  return { ok: !error };
}

export async function borrarMovimiento(id: string): Promise<{ ok: boolean }> {
  await obtenerUsuario();
  if (!UUID.test(id)) return { ok: false };
  const supabase = await crearClienteServidor();
  const { data } = await supabase.from("movimientos").delete().eq("id", id).select("factura_archivo").maybeSingle();
  if (data?.factura_archivo) await supabase.storage.from("facturas").remove([data.factura_archivo]);
  refresh();
  return { ok: Boolean(data) };
}

/** Link temporal (5 min) para abrir una factura del bucket privado. */
export async function enlaceFactura(ruta: string): Promise<string | null> {
  await obtenerUsuario();
  if (!RUTA_FACTURA.test(ruta)) return null;
  const supabase = await crearClienteServidor();
  const { data } = await supabase.storage.from("facturas").createSignedUrl(ruta, 300);
  return data?.signedUrl ?? null;
}

/** Borra un archivo subido que al final no se guardó (p. ej. se cerró el formulario). */
export async function descartarFactura(ruta: string): Promise<void> {
  await obtenerUsuario();
  if (!RUTA_FACTURA.test(ruta)) return;
  const supabase = await crearClienteServidor();
  const { count } = await supabase.from("movimientos").select("id", { count: "exact", head: true }).eq("factura_archivo", ruta);
  if (!count) await supabase.storage.from("facturas").remove([ruta]);
}

// ---------------------------------------------------------------------------
// Recurrentes
// ---------------------------------------------------------------------------

export async function guardarRecurrente(_: EstadoForm, fd: FormData): Promise<EstadoForm> {
  await obtenerUsuario();
  const tipo = texto(fd, "tipo") as TipoMovimiento;
  if (tipo !== "ingreso" && tipo !== "gasto") return { error: "Elige si es ingreso o gasto." };
  const concepto = texto(fd, "concepto");
  if (!concepto) return { error: "Escribe el concepto." };
  const categoria = texto(fd, "categoria");
  if (!categoriaValida(tipo, categoria)) return { error: "Elige una categoría." };
  const subtotal = monto(fd, "subtotal");
  if (subtotal === null || subtotal === "error") return { error: "Escribe un monto válido." };
  const frecuencia = texto(fd, "frecuencia") === "anual" ? "anual" : "mensual";
  const inicio = fecha(fd, "proxima");
  if (!inicio) return { error: "Elige la fecha del primer cobro o pago." };
  const dia = Math.min(28, Number(inicio.slice(8, 10)));
  const proxima = `${inicio.slice(0, 8)}${String(dia).padStart(2, "0")}`;
  const proyecto = texto(fd, "proyecto_id");
  const conIva = fd.get("con_iva") === "on" || fd.get("con_iva") === "true";
  const datos = {
    tipo,
    concepto,
    contraparte: opcional(fd, "contraparte"),
    categoria,
    proyecto_id: UUID.test(proyecto) ? proyecto : null,
    subtotal,
    tasa_iva: conIva ? TASA_IVA : 0,
    frecuencia,
    dia,
    proxima,
    notas: opcional(fd, "notas"),
  };
  const supabase = await crearClienteServidor();
  const id = texto(fd, "id");
  const { error } = UUID.test(id)
    ? await supabase.from("recurrentes").update(datos).eq("id", id)
    : await supabase.from("recurrentes").insert(datos);
  if (error) return { error: "No se pudo guardar." };
  await supabase.rpc("finanzas_generar_recurrentes");
  refresh();
  return { ok: "Recurrente guardado" };
}

export async function cambiarRecurrente(id: string, activo: boolean): Promise<{ ok: boolean }> {
  await obtenerUsuario();
  if (!UUID.test(id)) return { ok: false };
  const supabase = await crearClienteServidor();
  const cambios: { activo: boolean; proxima?: string } = { activo };
  if (activo) {
    // Al reactivar no se cobran los periodos que estuvo en pausa: sigue desde hoy.
    const { data: r } = await supabase.from("recurrentes").select("proxima, frecuencia").eq("id", id).maybeSingle();
    if (r) {
      const hoy = hoyISO();
      let p = r.proxima as string;
      while (p < hoy) p = sumarMeses(p, r.frecuencia === "anual" ? 12 : 1).slice(0, 8) + p.slice(8, 10);
      cambios.proxima = p;
    }
  }
  const { error } = await supabase.from("recurrentes").update(cambios).eq("id", id);
  if (!error && activo) await supabase.rpc("finanzas_generar_recurrentes");
  refresh();
  return { ok: !error };
}

export async function borrarRecurrente(id: string): Promise<{ ok: boolean }> {
  await obtenerUsuario();
  if (!UUID.test(id)) return { ok: false };
  const supabase = await crearClienteServidor();
  const { error } = await supabase.from("recurrentes").delete().eq("id", id);
  refresh();
  return { ok: !error };
}
