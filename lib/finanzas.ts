import "server-only";
import { crearClienteServidor } from "@/lib/supabase/server";
import { fechaCorta, hoyISO, rangoDias, sumarDias, sumarMeses } from "@/lib/fechas";
import type { PeriodoFlujo } from "@/components/ui/grafica-flujo";
import { LOCALE } from "@/lib/utils";
import {
  CATEGORIAS,
  COLUMNAS_MOVIMIENTO,
  COLUMNAS_RECURRENTE,
  type EstadoMovimiento,
  type Movimiento,
  type Recurrente,
  type TipoMovimiento,
} from "@/lib/finanzas-tipos";

const num = (v: unknown) => Number(v ?? 0);

function limpiar(m: Movimiento): Movimiento {
  return {
    ...m,
    subtotal: num(m.subtotal),
    tasa_iva: num(m.tasa_iva),
    retencion_isr: num(m.retencion_isr),
    retencion_iva: num(m.retencion_iva),
    iva: num(m.iva),
    total: num(m.total),
  };
}

/** Último día del mes "YYYY-MM". */
const finMes = (mes: string) => {
  const sig = sumarMeses(`${mes}-01`, 1);
  const d = new Date(`${sig}T12:00:00Z`);
  d.setUTCDate(0);
  return d.toISOString().slice(0, 10);
};
const etiquetaMes = (mes: string) =>
  new Intl.DateTimeFormat(LOCALE, { month: "short", timeZone: "UTC" }).format(new Date(`${mes}-15T12:00:00Z`)).replace(".", "");

export type PuntoMes = { clave: string; mes: string; ingresos: number; gastos: number; utilidad: number };
export type Kpi = { actual: number; anterior: number; serie: number[] };
export type RioPeriodo = {
  id: "mes" | "trimestre" | "anio";
  fuentes: { clave: string; valor: number }[];
  gastos: { clave: string; valor: number }[];
};
export type ResumenFinanzas = {
  mes: string;
  meses: PuntoMes[];
  cobrado: Kpi;
  gastado: Kpi;
  utilidad: Kpi;
  porCobrar: { total: number; vencido: number; cuantos: number };
  porPagar: { total: number; cuantos: number };
  gastosPorCategoria: { clave: string; monto: number; anterior: number }[];
  rio: RioPeriodo[];
  flujo: PeriodoFlujo[];
  recientes: Movimiento[];
  pendientes: Movimiento[];
};

/** Todo lo del Resumen: base de efectivo (lo pagado cuenta en el mes en que se pagó). */
export async function resumenFinanzas(mes: string): Promise<ResumenFinanzas> {
  const supabase = await crearClienteServidor();
  const desde = sumarMeses(`${mes}-01`, -11);
  const hasta = finMes(mes);
  const [pagados, pendientes, recientes] = await Promise.all([
    supabase.from("movimientos").select(COLUMNAS_MOVIMIENTO).eq("estado", "pagado").gte("pagado_en", desde).lte("pagado_en", hasta).limit(5000),
    supabase.from("movimientos").select(COLUMNAS_MOVIMIENTO).eq("estado", "pendiente").order("vence", { ascending: true, nullsFirst: false }).limit(500),
    supabase.from("movimientos").select(COLUMNAS_MOVIMIENTO).neq("estado", "cancelado").order("fecha", { ascending: false }).order("creado_en", { ascending: false }).limit(5),
  ]);
  const lista = ((pagados.data ?? []) as Movimiento[]).map(limpiar);
  const pend = ((pendientes.data ?? []) as Movimiento[]).map(limpiar);

  const claves = Array.from({ length: 12 }, (_, i) => sumarMeses(`${mes}-01`, i - 11).slice(0, 7));
  const meses: PuntoMes[] = claves.map((clave) => ({ clave, mes: etiquetaMes(clave), ingresos: 0, gastos: 0, utilidad: 0 }));
  const porClave = Object.fromEntries(meses.map((p) => [p.clave, p]));
  for (const m of lista) {
    const p = porClave[(m.pagado_en ?? m.fecha).slice(0, 7)];
    if (!p) continue;
    if (m.tipo === "ingreso") p.ingresos += m.total;
    else p.gastos += m.total;
  }
  for (const p of meses) {
    p.ingresos = Math.round(p.ingresos * 100) / 100;
    p.gastos = Math.round(p.gastos * 100) / 100;
    p.utilidad = Math.round((p.ingresos - p.gastos) * 100) / 100;
  }

  const kpi = (campo: "ingresos" | "gastos" | "utilidad"): Kpi => ({
    actual: meses[11][campo],
    anterior: meses[10][campo],
    serie: meses.slice(-6).map((p) => p[campo]),
  });

  const hoy = hoyISO();
  const cobrar = pend.filter((m) => m.tipo === "ingreso");
  const pagar = pend.filter((m) => m.tipo === "gasto");

  // Gastos del mes por categoría (y el mes anterior para comparar).
  const anteriorClave = claves[10];
  const gastosPorCategoria = CATEGORIAS.gasto
    .map(({ clave }) => {
      const de = (c: string) =>
        lista.filter((m) => m.tipo === "gasto" && m.categoria === clave && (m.pagado_en ?? "").startsWith(c)).reduce((s, m) => s + m.total, 0);
      return { clave, monto: de(mes), anterior: de(anteriorClave) };
    })
    .filter((g) => g.monto > 0)
    .sort((a, b) => b.monto - a.monto);

  // Flujo del dinero: mes, últimos 3 meses y últimos 12.
  const periodo = (id: RioPeriodo["id"], n: number): RioPeriodo => {
    const desdeClave = claves[12 - n];
    const dentro = lista.filter((m) => (m.pagado_en ?? "").slice(0, 7) >= desdeClave);
    const suma = (tipo: TipoMovimiento, clave: string) =>
      dentro.filter((m) => m.tipo === tipo && m.categoria === clave).reduce((s, m) => s + m.total, 0);
    return {
      id,
      fuentes: CATEGORIAS.ingreso.map(({ clave }) => ({ clave, valor: suma("ingreso", clave) })),
      gastos: CATEGORIAS.gasto.map(({ clave }) => ({ clave, valor: suma("gasto", clave) })),
    };
  };

  // Gráfica de flujo: lo cobrado (A) y lo pagado (B) por día o por mes.
  const fin = hoy < hasta ? hoy : hasta;
  const porDia = (dias: string[], etiqueta: (d: string) => string) =>
    dias.map((d) => {
      const del = lista.filter((m) => m.pagado_en === d);
      return {
        etiqueta: etiqueta(d),
        a: del.filter((m) => m.tipo === "ingreso").reduce((x, m) => x + m.total, 0),
        b: del.filter((m) => m.tipo === "gasto").reduce((x, m) => x + m.total, 0),
      };
    });
  // El mes se ve como lo que se lleva acumulado (sube día a día, más fácil de leer que picos diarios).
  const acumular = (pts: { etiqueta: string; a: number; b: number }[]) => {
    let a = 0;
    let b = 0;
    return pts.map((p) => ({ etiqueta: p.etiqueta, a: (a += p.a), b: (b += p.b) }));
  };
  const diaSemana = new Intl.DateTimeFormat(LOCALE, { weekday: "short", day: "numeric", timeZone: "UTC" });
  const flujo: PeriodoFlujo[] = [
    { id: "semana", nombre: "Semana", puntos: porDia(rangoDias(sumarDias(fin, -6), fin), (d) => diaSemana.format(new Date(`${d}T12:00:00Z`)).replace(".", "")) },
    { id: "mes", nombre: "Mes", acumulado: true, puntos: acumular(porDia(rangoDias(`${mes}-01`, fin < `${mes}-01` ? `${mes}-01` : fin), (d) => fechaCorta(d, hoy))) },
    { id: "anio", nombre: "Año", puntos: meses.map((p) => ({ etiqueta: p.mes, a: p.ingresos, b: p.gastos })) },
  ];

  return {
    mes,
    meses,
    flujo,
    recientes: ((recientes.data ?? []) as Movimiento[]).map(limpiar),
    cobrado: kpi("ingresos"),
    gastado: kpi("gastos"),
    utilidad: kpi("utilidad"),
    porCobrar: {
      total: cobrar.reduce((s, m) => s + m.total, 0),
      vencido: cobrar.filter((m) => m.vence && m.vence < hoy).reduce((s, m) => s + m.total, 0),
      cuantos: cobrar.length,
    },
    porPagar: { total: pagar.reduce((s, m) => s + m.total, 0), cuantos: pagar.length },
    gastosPorCategoria,
    rio: [periodo("mes", 1), periodo("trimestre", 3), periodo("anio", 12)],
    pendientes: pend,
  };
}

export type FiltrosMovimientos = { tipo: TipoMovimiento | ""; estado: EstadoMovimiento | ""; mes: string; categoria: string; q: string };

export async function obtenerMovimientos(f: FiltrosMovimientos): Promise<Movimiento[]> {
  const supabase = await crearClienteServidor();
  let q = supabase.from("movimientos").select(COLUMNAS_MOVIMIENTO).order("fecha", { ascending: false }).order("creado_en", { ascending: false });
  if (f.tipo) q = q.eq("tipo", f.tipo);
  if (f.estado) q = q.eq("estado", f.estado);
  if (f.categoria) q = q.eq("categoria", f.categoria);
  if (f.mes) q = q.gte("fecha", `${f.mes}-01`).lte("fecha", finMes(f.mes));
  if (f.q) {
    const t = f.q.replace(/[%_,()]/g, " ").trim();
    if (t) q = q.or(`concepto.ilike.%${t}%,contraparte.ilike.%${t}%,factura_folio.ilike.%${t}%`);
  }
  const { data } = await q.limit(500);
  return ((data ?? []) as Movimiento[]).map(limpiar);
}

export async function obtenerRecurrentes(): Promise<Recurrente[]> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase.from("recurrentes").select(COLUMNAS_RECURRENTE).order("activo", { ascending: false }).order("proxima");
  return ((data ?? []) as Recurrente[]).map((r) => ({ ...r, subtotal: num(r.subtotal), tasa_iva: num(r.tasa_iva) }));
}

export async function proyectosParaFinanzas(): Promise<{ id: string; nombre: string }[]> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase.from("proyectos").select("id, nombre").neq("estado", "terminado").order("nombre");
  return data ?? [];
}

export async function obtenerPendientes(): Promise<Movimiento[]> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase.from("movimientos").select(COLUMNAS_MOVIMIENTO).eq("estado", "pendiente").order("vence", { ascending: true, nullsFirst: false }).limit(500);
  return ((data ?? []) as Movimiento[]).map(limpiar);
}
