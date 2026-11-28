import { obtenerUsuario } from "@/lib/auth";
import { obtenerMovimientos } from "@/lib/finanzas";
import { MES_VALIDO, METODOS, NOMBRE_TIPO, nombreCategoria, type EstadoMovimiento, type TipoMovimiento } from "@/lib/finanzas-tipos";
import { hoyISO } from "@/lib/fechas";

const ESTADO: Record<EstadoMovimiento, string> = { pendiente: "Pendiente", pagado: "Pagado", cancelado: "Cancelado" };

/** Celda CSV segura: comillas escapadas y sin fórmulas (=, +, -, @) que Excel pudiera ejecutar. */
function celda(v: unknown) {
  let t = v === null || v === undefined ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(t) && !/^-?\d+(\.\d+)?$/.test(t)) t = `'${t}`;
  return /[",\n\r;]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
}

/** Movimientos en CSV (abre en Excel), con el IVA y las retenciones separados para el contador. */
export async function GET(request: Request) {
  await obtenerUsuario();
  const sp = new URL(request.url).searchParams;
  const tipo = sp.get("tipo") === "ingreso" || sp.get("tipo") === "gasto" ? (sp.get("tipo") as TipoMovimiento) : "";
  const estado = ["pendiente", "pagado", "cancelado"].includes(sp.get("estado") ?? "") ? (sp.get("estado") as EstadoMovimiento) : "";
  const mes = MES_VALIDO.test(sp.get("mes") ?? "") ? (sp.get("mes") as string) : "";
  const movimientos = await obtenerMovimientos({ tipo, estado, mes, categoria: sp.get("categoria") ?? "", q: (sp.get("q") ?? "").slice(0, 80) });

  const encabezado = ["Fecha", "Tipo", "Concepto", "Cliente o proveedor", "Categoría", "Subtotal", "IVA", "ISR retenido", "IVA retenido", "Total", "Estado", "Fecha límite", "Fecha de pago", "Método", "Folio factura", "Notas"];
  const filas = movimientos.map((m) => [
    m.fecha,
    NOMBRE_TIPO[m.tipo],
    m.concepto,
    m.contraparte,
    nombreCategoria(m.categoria),
    m.subtotal.toFixed(2),
    m.iva.toFixed(2),
    m.retencion_isr.toFixed(2),
    m.retencion_iva.toFixed(2),
    m.total.toFixed(2),
    ESTADO[m.estado],
    m.vence,
    m.pagado_en,
    METODOS.find((x) => x.valor === m.metodo)?.nombre ?? "",
    m.factura_folio,
    m.notas,
  ]);
  // BOM para que Excel lea bien los acentos.
  const csv = "﻿" + [encabezado, ...filas].map((f) => f.map(celda).join(",")).join("\r\n");
  const nombre = `finanzas-ergon-${mes || hoyISO()}.csv`;
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${nombre}"`,
      "Cache-Control": "no-store",
    },
  });
}
