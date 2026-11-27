import "server-only";

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

/** Tareas vencidas y de hoy (mías y de los dos). Fase 2. */
export async function tareasPendientes(): Promise<GrupoPendientes[]> {
  return [];
}

/** Eventos de hoy y mañana. Fase 3. */
export async function eventosProximos(): Promise<GrupoPendientes[]> {
  return [];
}

/** Mensajes nuevos en la bandeja. Fase 6. */
export async function mensajesNuevos(): Promise<GrupoPendientes[]> {
  return [];
}

/** Propuestas que vencen en ≤ 7 días y vistas sin respuesta. Fase 5. */
export async function propuestasPendientes(): Promise<GrupoPendientes[]> {
  return [];
}
