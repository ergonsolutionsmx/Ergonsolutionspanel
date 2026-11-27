import "server-only";
import { crearClienteServidor } from "@/lib/supabase/server";
import { fechaCorta, horaBonita, hoyISO, sumarDias } from "@/lib/fechas";
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

/** Propuestas que vencen en ≤ 7 días y vistas sin respuesta. Fase 5. */
export async function propuestasPendientes(): Promise<GrupoPendientes[]> {
  return [];
}
