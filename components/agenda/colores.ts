import type { ItemAgenda } from "@/lib/agenda-tipos";
import { horaBonita } from "@/lib/fechas";

/** Tipo visual de un renglón de la agenda (define su color). */
export type TipoVisual = "evento" | "reunion" | "tarea" | "vencida" | "hecha";

export function tipoVisual(item: ItemAgenda, hoy: string): TipoVisual {
  if (item.tipo === "evento") return item.reunion ? "reunion" : "evento";
  if (item.estado === "hecha") return "hecha";
  return item.dia < hoy ? "vencida" : "tarea";
}

/** Colores por tipo: evento azul de la marca, reunión cielo, tarea ámbar, vencida rojo. */
export const COLOR_TIPO: Record<TipoVisual, { punto: string; bloque: string; borde: string; texto: string; nombre: string }> = {
  evento: { punto: "bg-ergon-blue", bloque: "bg-ergon-blue/10", borde: "border-ergon-blue", texto: "text-ergon-navy", nombre: "Evento" },
  reunion: { punto: "bg-ergon-sky", bloque: "bg-ergon-sky/15", borde: "border-ergon-sky", texto: "text-ergon-navy", nombre: "Reunión" },
  tarea: { punto: "bg-aviso", bloque: "bg-aviso/10", borde: "border-aviso", texto: "text-ergon-navy", nombre: "Tarea" },
  vencida: { punto: "bg-error", bloque: "bg-error/10", borde: "border-error", texto: "text-error", nombre: "Tarea vencida" },
  hecha: { punto: "bg-exito", bloque: "bg-exito/10", borde: "border-exito", texto: "text-muted-foreground", nombre: "Tarea hecha" },
};

export function textoHoraItem(item: ItemAgenda) {
  if (item.tipo === "tarea") return "Fecha límite";
  if (item.todoElDia) return "Todo el día";
  if (item.continua && !item.horaFin) return "Continúa";
  if (item.continua && item.horaFin) return `Hasta ${horaBonita(item.horaFin)}`;
  if (item.hora && item.horaFin && item.horaFin !== item.hora) return `${horaBonita(item.hora)} – ${horaBonita(item.horaFin)}`;
  return item.hora ? horaBonita(item.hora) : "";
}

