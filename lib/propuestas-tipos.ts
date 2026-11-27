// Tipos y catálogos de propuestas (servidor y cliente).

export const ESTADOS_PROPUESTA = ["borrador", "enviada", "vista", "aceptada", "rechazada", "vencida"] as const;
export type EstadoPropuesta = (typeof ESTADOS_PROPUESTA)[number];
export const NOMBRE_ESTADO_PROPUESTA: Record<EstadoPropuesta, string> = {
  borrador: "Borrador",
  enviada: "Enviada",
  vista: "Vista",
  aceptada: "Aceptada",
  rechazada: "Rechazada",
  vencida: "Vencida",
};

/** Días que dura el link público. */
export const DIAS_VIGENCIA = 30;

export type Concepto = {
  id: string;
  propuesta_id: string;
  servicio_id: string | null;
  variante_id: string | null;
  titulo: string;
  descripcion: string | null;
  precio_instalacion: number | null;
  precio_mensual: number | null;
  cantidad: number;
  orden: number;
};

export type Propuesta = {
  id: string;
  folio: string;
  prospecto_nombre: string;
  prospecto_negocio: string | null;
  prospecto_contacto: string | null;
  problema: string | null;
  solucion: string | null;
  notas: string | null;
  estado: EstadoPropuesta;
  token_publico: string;
  enviada_en: string | null;
  vence_en: string | null;
  vista_en: string | null;
  respondida_en: string | null;
  total_instalacion: number;
  total_mensual: number;
  con_iva: boolean;
  archivada: boolean;
  creado_en: string;
  creado_por: string | null;
};

export const COLUMNAS_PROPUESTA =
  "id, folio, prospecto_nombre, prospecto_negocio, prospecto_contacto, problema, solucion, notas, estado, token_publico, enviada_en, vence_en, vista_en, respondida_en, total_instalacion, total_mensual, con_iva, archivada, creado_en, creado_por";
export const COLUMNAS_CONCEPTO =
  "id, propuesta_id, servicio_id, variante_id, titulo, descripcion, precio_instalacion, precio_mensual, cantidad, orden";

/** Lo que ve el prospecto (PDF y link público): sin notas internas. */
export type PropuestaParaCliente = {
  folio: string;
  prospecto_nombre: string;
  prospecto_negocio: string | null;
  problema: string | null;
  solucion: string | null;
  enviada_en: string | null;
  vence_en: string | null;
  total_instalacion: number;
  total_mensual: number;
  con_iva: boolean;
  creado_en: string;
  conceptos: { titulo: string; descripcion: string | null; cantidad: number; precio_instalacion: number | null; precio_mensual: number | null }[];
};

export function paraCliente(p: Propuesta, conceptos: Concepto[]): PropuestaParaCliente {
  return {
    folio: p.folio,
    prospecto_nombre: p.prospecto_nombre,
    prospecto_negocio: p.prospecto_negocio,
    problema: p.problema,
    solucion: p.solucion,
    enviada_en: p.enviada_en,
    vence_en: p.vence_en,
    total_instalacion: Number(p.total_instalacion),
    total_mensual: Number(p.total_mensual),
    con_iva: p.con_iva,
    creado_en: p.creado_en,
    conceptos: conceptos.map((c) => ({
      titulo: c.titulo,
      descripcion: c.descripcion,
      cantidad: c.cantidad ?? 1,
      precio_instalacion: c.precio_instalacion === null ? null : Number(c.precio_instalacion),
      precio_mensual: c.precio_mensual === null ? null : Number(c.precio_mensual),
    })),
  };
}

/** ¿Algún concepto tiene precio por definir? */
export function hayPreciosPorDefinir(conceptos: PropuestaParaCliente["conceptos"]) {
  return conceptos.some((c) => c.precio_instalacion === null && c.precio_mensual === null);
}

/** IVA en México. */
export const TASA_IVA = 0.16;

/** Subtotal, IVA y total. Si la propuesta no lleva IVA, el IVA es 0. */
export function conIva(subtotal: number, aplicar: boolean) {
  const iva = aplicar ? Math.round(subtotal * TASA_IVA * 100) / 100 : 0;
  return { subtotal, iva, total: subtotal + iva };
}
