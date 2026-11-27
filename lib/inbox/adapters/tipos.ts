import type { Canal, MensajeEntrante } from "@/lib/inbox/tipos";

/** Estado de un canal según su configuración (sin revelar valores secretos). */
export type EstadoCanal = {
  /** Las variables necesarias están puestas. */
  configurado: boolean;
  /** Variables que faltan (solo los nombres). */
  faltan: string[];
  /** Explicación corta para Ajustes → Canales. */
  descripcion: string;
};

/** Interfaz común de todos los adaptadores de la bandeja. */
export interface AdaptadorCanal {
  canal: Canal;
  estado(): EstadoCanal;
  /** Convierte lo que llega del canal a mensajes normalizados. */
  normalizar?(entrada: unknown): MensajeEntrante[];
}

export function variablesFaltantes(nombres: string[]) {
  return nombres.filter((n) => !process.env[n]);
}
