import "server-only";
import { crearClienteServidor } from "@/lib/supabase/server";
import { fechaCorta, horaBonita, hoyISO, partesCDMX, sumarDias } from "@/lib/fechas";
import { obtenerAgenda } from "@/lib/agenda";

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

/** Mensajes nuevos en la bandeja. Fase 6. */
export async function mensajesNuevos(): Promise<GrupoPendientes[]> {
  return [];
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
