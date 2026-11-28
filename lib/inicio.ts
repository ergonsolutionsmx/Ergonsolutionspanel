import "server-only";
import { crearClienteServidor } from "@/lib/supabase/server";
import { fechaCorta, horaBonita, hoyISO, sumarDias, sumarMeses } from "@/lib/fechas";
import { obtenerAgenda } from "@/lib/agenda";

// ---------------------------------------------------------------------------
// Contadores por sección.

export type Contadores = {
  tareasHoy: number;
  tareasVencidas: number;
  eventosHoy: number;
  mensajesSinLeer: number;
  propuestasPendientes: number;
  propuestasPorVencer: number;
};

export async function contadores(yoId: string): Promise<Contadores> {
  const supabase = await crearClienteServidor();
  const hoy = hoyISO();
  const ahora = new Date();
  const enSiete = new Date(ahora.getTime() + 7 * 86_400_000).toISOString();
  const cuenta = { count: "exact" as const, head: true };
  const [hoyT, vencidas, mensajes, propuestas, porVencer, agenda] = await Promise.all([
    supabase.from("tareas").select("id", cuenta).neq("estado", "hecha").eq("fecha_limite", hoy),
    supabase.from("tareas").select("id", cuenta).neq("estado", "hecha").lt("fecha_limite", hoy),
    supabase.from("mensajes").select("id", cuenta).eq("estado", "nuevo"),
    supabase.from("propuestas").select("id", cuenta).in("estado", ["borrador", "enviada", "vista"]).eq("archivada", false),
    supabase
      .from("propuestas")
      .select("id", cuenta)
      .in("estado", ["enviada", "vista"])
      .eq("archivada", false)
      .gte("vence_en", ahora.toISOString())
      .lte("vence_en", enSiete),
    obtenerAgenda({ desde: hoy, hasta: hoy, de: "todos", yoId }),
  ]);
  return {
    tareasHoy: hoyT.count ?? 0,
    tareasVencidas: vencidas.count ?? 0,
    eventosHoy: (agenda[hoy] ?? []).filter((i) => i.tipo === "evento").length,
    mensajesSinLeer: mensajes.count ?? 0,
    propuestasPendientes: propuestas.count ?? 0,
    propuestasPorVencer: porVencer.count ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Inicio simple: resumen por sección, pendientes del día y trabajos en curso.

export type ResumenInicio = {
  tareasHoy: number;
  tareasVencidas: number;
  eventosHoy: number;
  proximoEvento: { titulo: string; cuando: string } | null;
  mensajes: number;
  propuestas: number;
  propuestasPorVencer: number;
  proyectosActivos: number;
  utilidadMes: number;
  porCobrar: number;
  cobrosVencidos: number;
};

export type PendienteHoy = {
  id: string;
  tipo: "evento" | "tarea" | "cobro" | "pago";
  titulo: string;
  detalle: string;
  href: string;
  urgente: boolean;
};

export type TrabajoEnCurso = {
  id: string;
  nombre: string;
  cliente: string | null;
  etapa: string | null;
  fechaObjetivo: string | null;
  hechas: number;
  total: number;
  siguiente: string | null;
  responsable: { nombre: string; color: string } | null;
};

/** Todo lo del Inicio en una sola ida a la base (consultas en paralelo). */
export async function inicioSimple(yoId: string): Promise<{ resumen: ResumenInicio; pendientes: PendienteHoy[]; trabajos: TrabajoEnCurso[] }> {
  const supabase = await crearClienteServidor();
  const hoy = hoyISO();
  const mes = hoy.slice(0, 7);
  const volver = encodeURIComponent("/inicio");
  const [c, agenda, tareas, proyectos, perfiles, pagados, pendientesFin] = await Promise.all([
    contadores(yoId),
    obtenerAgenda({ desde: hoy, hasta: sumarDias(hoy, 7), de: "todos", yoId }),
    supabase
      .from("tareas")
      .select("id, titulo, fecha_limite, responsable_id")
      .neq("estado", "hecha")
      .lte("fecha_limite", hoy)
      .order("fecha_limite", { ascending: true })
      .limit(20),
    supabase
      .from("proyectos")
      .select("id, nombre, cliente, etapa, fecha_objetivo, responsable_id, tareas(titulo, estado, fecha_limite)")
      .eq("estado", "activo")
      .order("fecha_objetivo", { ascending: true, nullsFirst: false })
      .limit(8),
    supabase.from("perfiles").select("usuario_id, nombre, color"),
    supabase.from("movimientos").select("tipo, total").eq("estado", "pagado").gte("pagado_en", `${mes}-01`).lt("pagado_en", sumarMeses(`${mes}-01`, 1)),
    supabase.from("movimientos").select("id, tipo, concepto, contraparte, total, vence").eq("estado", "pendiente").order("vence", { ascending: true, nullsFirst: false }).limit(100),
  ]);
  const perfil = new Map((perfiles.data ?? []).map((p) => [p.usuario_id, p]));
  const pesos = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });

  // Próximo evento (hoy o los siguientes 7 días).
  let proximoEvento: ResumenInicio["proximoEvento"] = null;
  for (const dia of Object.keys(agenda).sort()) {
    const ev = (agenda[dia] ?? []).find((i) => i.tipo === "evento");
    if (ev) {
      const hora = ev.todoElDia || ev.continua || !ev.hora ? "" : ` · ${horaBonita(ev.hora)}`;
      proximoEvento = { titulo: ev.titulo, cuando: `${dia === hoy ? "Hoy" : dia === sumarDias(hoy, 1) ? "Mañana" : fechaCorta(dia, hoy)}${hora}` };
      break;
    }
  }

  const fin = (pendientesFin.data ?? []).map((m) => ({ ...m, total: Number(m.total) }));
  const cobrar = fin.filter((m) => m.tipo === "ingreso");
  const pag = (pagados.data ?? []).map((m) => ({ tipo: m.tipo, total: Number(m.total) }));
  const suma = (l: { total: number }[]) => l.reduce((s, m) => s + m.total, 0);

  const resumen: ResumenInicio = {
    tareasHoy: c.tareasHoy,
    tareasVencidas: c.tareasVencidas,
    eventosHoy: c.eventosHoy,
    proximoEvento,
    mensajes: c.mensajesSinLeer,
    propuestas: c.propuestasPendientes,
    propuestasPorVencer: c.propuestasPorVencer,
    proyectosActivos: (proyectos.data ?? []).length,
    utilidadMes: suma(pag.filter((m) => m.tipo === "ingreso")) - suma(pag.filter((m) => m.tipo === "gasto")),
    porCobrar: suma(cobrar),
    cobrosVencidos: suma(cobrar.filter((m) => m.vence && m.vence < hoy)),
  };

  // Pendientes del día: eventos de hoy (por hora), tareas vencidas y de hoy, cobros y pagos que vencen hoy o ya vencieron.
  const pendientes: PendienteHoy[] = [
    ...(agenda[hoy] ?? []).flatMap((i) =>
      i.tipo === "evento"
        ? [{
            id: `e-${i.id}`,
            tipo: "evento" as const,
            titulo: i.titulo,
            detalle: i.todoElDia || i.continua || !i.hora ? "Todo el día" : horaBonita(i.hora),
            href: `/agenda/eventos/${i.id}?volver=${volver}`,
            urgente: false,
          }]
        : [],
    ),
    ...(tareas.data ?? []).map((t) => ({
      id: `t-${t.id}`,
      tipo: "tarea" as const,
      titulo: t.titulo,
      detalle: [perfil.get(t.responsable_id ?? "")?.nombre.split(" ")[0], t.fecha_limite < hoy ? `Venció ${fechaCorta(t.fecha_limite, hoy)}` : "Hoy"].filter(Boolean).join(" · "),
      href: `/proyectos/tareas/${t.id}?volver=${volver}`,
      urgente: t.fecha_limite < hoy,
    })),
    ...fin
      .filter((m) => m.vence && m.vence <= hoy)
      .map((m) => ({
        id: `f-${m.id}`,
        tipo: (m.tipo === "ingreso" ? "cobro" : "pago") as "cobro" | "pago",
        titulo: m.concepto,
        detalle: [m.contraparte, pesos.format(m.total), m.vence! < hoy ? `Venció ${fechaCorta(m.vence!, hoy)}` : "Vence hoy"].filter(Boolean).join(" · "),
        href: "/finanzas?vista=pendientes",
        urgente: m.vence! < hoy,
      })),
  ];

  const trabajos: TrabajoEnCurso[] = (proyectos.data ?? []).map((p) => {
    const ts = (p.tareas ?? []) as { titulo: string; estado: string; fecha_limite: string | null }[];
    const abiertas = ts.filter((t) => t.estado !== "hecha").sort((a, b) => (a.fecha_limite ?? "9999").localeCompare(b.fecha_limite ?? "9999"));
    const r = p.responsable_id ? perfil.get(p.responsable_id) : null;
    return {
      id: p.id,
      nombre: p.nombre,
      cliente: p.cliente,
      etapa: p.etapa,
      fechaObjetivo: p.fecha_objetivo,
      hechas: ts.length - abiertas.length,
      total: ts.length,
      siguiente: abiertas[0]?.titulo ?? null,
      responsable: r ? { nombre: r.nombre, color: r.color } : null,
    };
  });

  return { resumen, pendientes, trabajos };
}
