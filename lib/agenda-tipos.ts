import type { EstadoTarea, Prioridad } from "@/lib/tareas-tipos";

export const VISTAS_AGENDA = ["dia", "semana", "mes", "lista"] as const;
export type VistaAgenda = (typeof VISTAS_AGENDA)[number];
export const NOMBRE_VISTA: Record<VistaAgenda, string> = { dia: "Día", semana: "Semana", mes: "Mes", lista: "Lista" };

export type Evento = {
  id: string;
  titulo: string;
  inicio: string;
  fin: string;
  todo_el_dia: boolean;
  lugar: string | null;
  notas: string | null;
  responsable_id: string | null;
  creado_en: string;
  creado_por: string | null;
};

export const COLUMNAS_EVENTO = "id, titulo, inicio, fin, todo_el_dia, lugar, notas, responsable_id, creado_en, creado_por";

/** Un renglón en la agenda: un evento (en uno de sus días) o una tarea con fecha. */
export type ItemAgenda =
  | {
      tipo: "evento";
      id: string;
      titulo: string;
      dia: string;
      todoElDia: boolean;
      /** Hora de inicio/fin locales, solo si el evento empieza/termina ese día. */
      hora: string | null;
      horaFin: string | null;
      /** El evento viene de un día anterior. */
      continua: boolean;
      lugar: string | null;
      responsable_id: string | null;
    }
  | {
      tipo: "tarea";
      id: string;
      titulo: string;
      dia: string;
      estado: EstadoTarea;
      prioridad: Prioridad;
      responsable_id: string | null;
    };

/** Orden dentro de un día: todo el día y tareas primero, luego por hora. */
export function ordenarItems(a: ItemAgenda, b: ItemAgenda) {
  const clave = (i: ItemAgenda) =>
    i.tipo === "tarea" ? "0" : i.todoElDia || i.continua || !i.hora ? "1" : `2${i.hora}`;
  const ca = clave(a);
  const cb = clave(b);
  return ca === cb ? a.titulo.localeCompare(b.titulo, "es") : ca < cb ? -1 : 1;
}
