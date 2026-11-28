// Tipos y catálogos de Finanzas (compartidos por servidor y cliente).

export type TipoMovimiento = "ingreso" | "gasto";
export type EstadoMovimiento = "pendiente" | "pagado" | "cancelado";
export type MetodoPago = "transferencia" | "efectivo" | "tarjeta" | "otro";
export type Frecuencia = "mensual" | "anual";

export type Movimiento = {
  id: string;
  tipo: TipoMovimiento;
  concepto: string;
  contraparte: string | null;
  categoria: string;
  proyecto_id: string | null;
  subtotal: number;
  tasa_iva: number;
  retencion_isr: number;
  retencion_iva: number;
  iva: number;
  total: number;
  estado: EstadoMovimiento;
  fecha: string;
  vence: string | null;
  pagado_en: string | null;
  metodo: MetodoPago | null;
  factura_folio: string | null;
  factura_archivo: string | null;
  recurrente_id: string | null;
  notas: string | null;
};

export type Recurrente = {
  id: string;
  tipo: TipoMovimiento;
  concepto: string;
  contraparte: string | null;
  categoria: string;
  proyecto_id: string | null;
  subtotal: number;
  tasa_iva: number;
  frecuencia: Frecuencia;
  dia: number;
  proxima: string;
  activo: boolean;
  notas: string | null;
};

export const COLUMNAS_MOVIMIENTO =
  "id, tipo, concepto, contraparte, categoria, proyecto_id, subtotal, tasa_iva, retencion_isr, retencion_iva, iva, total, estado, fecha, vence, pagado_en, metodo, factura_folio, factura_archivo, recurrente_id, notas";
export const COLUMNAS_RECURRENTE =
  "id, tipo, concepto, contraparte, categoria, proyecto_id, subtotal, tasa_iva, frecuencia, dia, proxima, activo, notas";

export const TASA_IVA = 0.16;

/** Categorías: llave guardada en la base → nombre y color (paleta Ergon + acentos). */
export const CATEGORIAS: Record<TipoMovimiento, { clave: string; nombre: string; color: string }[]> = {
  ingreso: [
    { clave: "desarrollo", nombre: "Desarrollo e instalación", color: "#2377c2" },
    { clave: "mensualidad", nombre: "Mensualidad o mantenimiento", color: "#4f6fe8" },
    { clave: "consultoria", nombre: "Consultoría", color: "#22b8cf" },
    { clave: "otro_ingreso", nombre: "Otro ingreso", color: "#8aa4d6" },
  ],
  gasto: [
    { clave: "herramientas", nombre: "Herramientas y suscripciones", color: "#4f6fe8" },
    { clave: "hosting", nombre: "Hosting y dominios", color: "#22b8cf" },
    { clave: "publicidad", nombre: "Publicidad", color: "#f59e0b" },
    { clave: "equipo", nombre: "Equipo", color: "#a78bfa" },
    { clave: "impuestos", nombre: "Impuestos", color: "#f472b6" },
    { clave: "comisiones", nombre: "Comisiones bancarias", color: "#94a3b8" },
    { clave: "otro_gasto", nombre: "Otro gasto", color: "#64748b" },
  ],
};

const TODAS = [...CATEGORIAS.ingreso, ...CATEGORIAS.gasto];
export const nombreCategoria = (clave: string) => TODAS.find((c) => c.clave === clave)?.nombre ?? clave;
export const colorCategoria = (clave: string) => TODAS.find((c) => c.clave === clave)?.color ?? "#64748b";
export const categoriaValida = (tipo: TipoMovimiento, clave: string) => CATEGORIAS[tipo].some((c) => c.clave === clave);

export const METODOS: { valor: MetodoPago; nombre: string }[] = [
  { valor: "transferencia", nombre: "Transferencia" },
  { valor: "efectivo", nombre: "Efectivo" },
  { valor: "tarjeta", nombre: "Tarjeta" },
  { valor: "otro", nombre: "Otro" },
];

export const NOMBRE_TIPO: Record<TipoMovimiento, string> = { ingreso: "Ingreso", gasto: "Gasto" };

/** Lo que entra o sale de verdad: subtotal + IVA − retenciones (igual que la columna de la base). */
export function calcularTotal(subtotal: number, conIva: boolean, isr = 0, ivaRetenido = 0) {
  const iva = conIva ? Math.round(subtotal * TASA_IVA * 100) / 100 : 0;
  return { iva, total: Math.round((subtotal + iva - isr - ivaRetenido) * 100) / 100 };
}

/** Situación de un pendiente según su fecha límite. */
export function situacion(m: Pick<Movimiento, "estado" | "vence">, hoy: string): "pagado" | "cancelado" | "vencido" | "hoy" | "pendiente" {
  if (m.estado !== "pendiente") return m.estado;
  if (!m.vence) return "pendiente";
  if (m.vence < hoy) return "vencido";
  if (m.vence === hoy) return "hoy";
  return "pendiente";
}

/** "2026-11" → mes válido o null. */
export const MES_VALIDO = /^\d{4}-(0[1-9]|1[0-2])$/;
