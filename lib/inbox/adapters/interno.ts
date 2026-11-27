import "server-only";
import type { AdaptadorCanal } from "./tipos";

/**
 * Avisos internos: los crea la base de datos (privado.crear_mensaje_interno)
 * cuando una propuesta se ve o vence, o una tarea se vence.
 */
export const adaptadorInterno: AdaptadorCanal = {
  canal: "interno",
  estado: () => ({
    configurado: true,
    faltan: [],
    descripcion: "Funcionando. Avisa de propuestas vistas o vencidas y de tareas vencidas.",
  }),
};
