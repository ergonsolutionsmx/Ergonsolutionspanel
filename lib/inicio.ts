import "server-only";
import { crearClienteServidor } from "@/lib/supabase/server";
import { fechaCorta, horaBonita, hoyISO, partesCDMX, sumarDias } from "@/lib/fechas";
import { obtenerAgenda } from "@/lib/agenda";
import { haceCuanto } from "@/lib/tiempo";

/** Un renglón dentro de una tarjeta del Inicio. Al tocarlo lleva al registro. */
export type Pendiente = {
  id: string;
  titulo: string;
  detalle?: string;
  href: string;
  /** Se marca en rojo (vencida, por vencer). */
  urgente?: boolean;
};

export type GrupoPendientes = {
  /** Sub-título dentro de la tarjeta, p. ej. "Vencidas", "Hoy". */
  nombre: string;
  items: Pendiente[];
};

// Cada función se llena en la fase de su módulo. Mientras, regresan vacío
// y la tarjeta muestra en qué fase se activa.

/** Tareas vencidas y de hoy (de los dos), sin terminar. */
export async function tareasPendientes(): Promise<GrupoPendientes[]> {
  const supabase = await crearClienteServidor();
  const hoy = hoyISO();
  const [tareas, perfiles] = await Promise.all([
    supabase
      .from("tareas")
      .select("id, titulo, fecha_limite, responsable_id, prioridad")
      .neq("estado", "hecha")
      .lte("fecha_limite", hoy)
      .order("fecha_limite", { ascending: true })
      .limit(50),
    supabase.from("perfiles").select("usuario_id, nombre"),
  ]);
  const nombre = new Map((perfiles.data ?? []).map((p) => [p.usuario_id, p.nombre.split(" ")[0]]));
  const volver = encodeURIComponent("/inicio");

  const aItem = (t: { id: string; titulo: string; fecha_limite: string; responsable_id: string | null }, vencida: boolean): Pendiente => ({
    id: t.id,
    titulo: t.titulo,
    detalle: [nombre.get(t.responsable_id ?? ""), vencida ? fechaCorta(t.fecha_limite, hoy) : null].filter(Boolean).join(" · "),
    href: `/proyectos/tareas/${t.id}?volver=${volver}`,
    urgente: vencida,
  });

  const lista = tareas.data ?? [];
  return [
    { nombre: "Vencidas", items: lista.filter((t) => t.fecha_limite < hoy).slice(0, 8).map((t) => aItem(t, true)) },
    { nombre: "Hoy", items: lista.filter((t) => t.fecha_limite === hoy).slice(0, 8).map((t) => aItem(t, false)) },
  ];
}

/** Eventos de hoy y mañana (de los dos). */
export async function eventosProximos(yoId: string): Promise<GrupoPendientes[]> {
  const hoy = hoyISO();
  const manana = sumarDias(hoy, 1);
  const porDia = await obtenerAgenda({ desde: hoy, hasta: manana, de: "todos", yoId });
  const volver = encodeURIComponent("/inicio");

  const grupo = (nombre: string, dia: string): GrupoPendientes => ({
    nombre,
    items: (porDia[dia] ?? []).flatMap((i) =>
      i.tipo === "evento"
        ? [
            {
              id: `${i.id}-${dia}`,
              titulo: i.titulo,
              detalle: i.todoElDia || i.continua || !i.hora ? "Todo el día" : horaBonita(i.hora),
              href: `/agenda/eventos/${i.id}?volver=${volver}`,
            },
          ]
        : [],
    ),
  });
  return [grupo("Hoy", hoy), grupo("Mañana", manana)];
}

/** Mensajes nuevos en la bandeja. */
export async function mensajesNuevos(): Promise<GrupoPendientes[]> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase
    .from("mensajes")
    .select("id, canal, remitente_nombre, remitente_contacto, asunto, recibido_en")
    .eq("estado", "nuevo")
    .order("recibido_en", { ascending: false })
    .limit(8);
  const canal: Record<string, string> = { formulario: "Formulario", correo: "Correo", whatsapp: "WhatsApp", interno: "Aviso" };
  return [
    {
      nombre: "Nuevos",
      items: (data ?? []).map((m) => ({
        id: m.id,
        titulo: m.asunto ?? m.remitente_nombre ?? m.remitente_contacto ?? "Mensaje",
        detalle: `${canal[m.canal] ?? ""} · ${haceCuanto(m.recibido_en)}`,
        href: `/bandeja/${m.id}`,
      })),
    },
  ];
}

/** Propuestas que vencen en 7 días o menos, y vistas sin respuesta. */
export async function propuestasPendientes(): Promise<GrupoPendientes[]> {
  const supabase = await crearClienteServidor();
  const ahora = new Date();
  const enSiete = new Date(ahora.getTime() + 7 * 86_400_000).toISOString();
  const hoy = hoyISO();
  const [porVencer, vistas] = await Promise.all([
    supabase
      .from("propuestas")
      .select("id, folio, prospecto_nombre, vence_en")
      .in("estado", ["enviada", "vista"])
      .eq("archivada", false)
      .gte("vence_en", ahora.toISOString())
      .lte("vence_en", enSiete)
      .order("vence_en")
      .limit(8),
    supabase
      .from("propuestas")
      .select("id, folio, prospecto_nombre, vista_en")
      .eq("estado", "vista")
      .eq("archivada", false)
      .order("vista_en", { ascending: false })
      .limit(8),
  ]);
  return [
    {
      nombre: "Vencen pronto",
      items: (porVencer.data ?? []).map((p) => ({
        id: p.id,
        titulo: `${p.folio} · ${p.prospecto_nombre}`,
        detalle: fechaCorta(partesCDMX(p.vence_en).fecha, hoy),
        href: `/propuestas/${p.id}`,
        urgente: true,
      })),
    },
    {
      nombre: "Vistas sin respuesta",
      items: (vistas.data ?? []).map((p) => ({
        id: `v-${p.id}`,
        titulo: `${p.folio} · ${p.prospecto_nombre}`,
        href: `/propuestas/${p.id}`,
      })),
    },
  ];
}

// ---------------------------------------------------------------------------
// Rediseño del Inicio: contadores, gráfica, proyectos activos y actividad.

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

export type PuntoSemana = { semana: string; abiertas: number; completadas: number };

/** Tareas abiertas al cierre de cada semana y completadas en esa semana (últimas 8). */
export async function graficaTareas(): Promise<PuntoSemana[]> {
  const supabase = await crearClienteServidor();
  const { data } = await supabase.from("tareas").select("creado_en, completada_en").limit(5000);
  const tareas = data ?? [];
  const hoy = hoyISO();
  // Lunes de esta semana (CDMX) y las 7 anteriores.
  const dia = new Date(`${hoy}T12:00:00Z`).getUTCDay();
  const lunes = sumarDias(hoy, -((dia + 6) % 7));
  const fmt = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", timeZone: "UTC" });
  return Array.from({ length: 8 }, (_, i) => {
    const inicio = sumarDias(lunes, (i - 7) * 7);
    const fin = sumarDias(inicio, 7);
    const ini = Date.parse(`${inicio}T06:00:00Z`); // 00:00 CDMX
    const fn = Date.parse(`${fin}T06:00:00Z`);
    let abiertas = 0;
    let completadas = 0;
    for (const t of tareas) {
      const creada = Date.parse(t.creado_en);
      const hecha = t.completada_en ? Date.parse(t.completada_en) : null;
      if (hecha !== null && hecha >= ini && hecha < fn) completadas++;
      if (creada < fn && (hecha === null || hecha >= fn)) abiertas++;
    }
    return { semana: fmt.format(new Date(`${inicio}T12:00:00Z`)).replace(".", ""), abiertas, completadas };
  });
}

export type ProyectoActivo = {
  id: string;
  nombre: string;
  cliente: string | null;
  estado: string;
  avance: number;
  hechas: number;
  total: number;
  fechaObjetivo: string | null;
  responsables: { nombre: string; color: string }[];
};

export async function proyectosActivos(): Promise<ProyectoActivo[]> {
  const supabase = await crearClienteServidor();
  const [proyectos, perfiles] = await Promise.all([
    supabase
      .from("proyectos")
      .select("id, nombre, cliente, estado, fecha_objetivo, responsable_id, tareas(estado, responsable_id)")
      .eq("estado", "activo")
      .order("fecha_objetivo", { ascending: true, nullsFirst: false })
      .limit(5),
    supabase.from("perfiles").select("usuario_id, nombre, color"),
  ]);
  const perfil = new Map((perfiles.data ?? []).map((p) => [p.usuario_id, p]));
  return (proyectos.data ?? []).map((p) => {
    const tareas = (p.tareas ?? []) as { estado: string; responsable_id: string | null }[];
    const hechas = tareas.filter((t) => t.estado === "hecha").length;
    const ids = new Set([p.responsable_id, ...tareas.map((t) => t.responsable_id)].filter(Boolean) as string[]);
    return {
      id: p.id,
      nombre: p.nombre,
      cliente: p.cliente,
      estado: p.estado,
      hechas,
      total: tareas.length,
      avance: tareas.length ? Math.round((hechas / tareas.length) * 100) : 0,
      fechaObjetivo: p.fecha_objetivo,
      responsables: [...ids].flatMap((id) => {
        const x = perfil.get(id);
        return x ? [{ nombre: x.nombre, color: x.color }] : [];
      }),
    };
  });
}
