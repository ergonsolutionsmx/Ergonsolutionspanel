// Tipos y catálogos de tareas y proyectos (se usan en servidor y en cliente).

export const ESTADOS_TAREA = ["por_hacer", "en_curso", "en_revision", "hecha"] as const;
export type EstadoTarea = (typeof ESTADOS_TAREA)[number];
export const NOMBRE_ESTADO: Record<EstadoTarea, string> = {
  por_hacer: "Por hacer",
  en_curso: "En progreso",
  en_revision: "En revisión",
  hecha: "Hecha",
};

export const PRIORIDADES = ["alta", "media", "baja"] as const;
export type Prioridad = (typeof PRIORIDADES)[number];
export const NOMBRE_PRIORIDAD: Record<Prioridad, string> = { alta: "Alta", media: "Media", baja: "Baja" };
export const PESO_PRIORIDAD: Record<Prioridad, number> = { alta: 0, media: 1, baja: 2 };

export const ESTADOS_PROYECTO = ["activo", "pausado", "terminado"] as const;
export type EstadoProyecto = (typeof ESTADOS_PROYECTO)[number];
export const NOMBRE_ESTADO_PROYECTO: Record<EstadoProyecto, string> = {
  activo: "Activo",
  pausado: "Pausado",
  terminado: "Terminado",
};

export type Tarea = {
  id: string;
  titulo: string;
  descripcion: string | null;
  proyecto_id: string | null;
  responsable_id: string | null;
  fecha_limite: string | null;
  prioridad: Prioridad;
  estado: EstadoTarea;
  orden: number;
  completada_en: string | null;
  creado_en: string;
  creado_por: string | null;
  /** Mensaje de la bandeja del que salió la tarea. */
  mensaje_id: string | null;
};

export const TIPOS_PROYECTO = ["sitio_web", "turnode", "software"] as const;
export type TipoProyecto = (typeof TIPOS_PROYECTO)[number];
export const NOMBRE_TIPO_PROYECTO: Record<TipoProyecto, string> = { sitio_web: "Sitio web", turnode: "Turnode", software: "Software" };

/** Etapas del Método Ergon. POR CONFIRMAR: nombres definitivos de cada etapa. */
/** Fases de un trabajo (en qué fase nos quedamos). Se pueden renombrar aquí. */
export const ETAPAS_METODO = ["analisis", "propuesta", "desarrollo", "revision", "entregado"] as const;
export type EtapaMetodo = (typeof ETAPAS_METODO)[number];
export const NOMBRE_ETAPA: Record<EtapaMetodo, string> = {
  analisis: "Análisis",
  propuesta: "Propuesta",
  desarrollo: "Desarrollo",
  revision: "Revisión",
  entregado: "Entregado",
};

export type Proyecto = {
  id: string;
  nombre: string;
  descripcion: string | null;
  cliente: string | null;
  tipo: TipoProyecto | null;
  etapa: EtapaMetodo | null;
  estado: EstadoProyecto;
  responsable_id: string | null;
  fecha_objetivo: string | null;
  creado_en: string;
};

export type PerfilCorto = { usuario_id: string; nombre: string; color: string };

/** Datos de apoyo que necesitan los componentes de tareas para pintar nombres. */
export type Catalogos = {
  perfiles: PerfilCorto[];
  proyectos: Pick<Proyecto, "id" | "nombre" | "estado" | "tipo">[];
  yoId: string;
  hoy: string;
};

export const COLUMNAS_TAREA =
  "id, titulo, descripcion, proyecto_id, responsable_id, fecha_limite, prioridad, estado, orden, completada_en, creado_en, creado_por, mensaje_id";
export const COLUMNAS_PROYECTO = "id, nombre, descripcion, cliente, tipo, etapa, estado, responsable_id, fecha_objetivo, creado_en";

/** Orden de la vista lista: fecha límite (sin fecha al final), luego prioridad. */
export function ordenarParaLista(a: Tarea, b: Tarea) {
  if (a.estado === "hecha" && b.estado !== "hecha") return 1;
  if (b.estado === "hecha" && a.estado !== "hecha") return -1;
  if (a.fecha_limite !== b.fecha_limite) {
    if (!a.fecha_limite) return 1;
    if (!b.fecha_limite) return -1;
    return a.fecha_limite < b.fecha_limite ? -1 : 1;
  }
  const p = PESO_PRIORIDAD[a.prioridad] - PESO_PRIORIDAD[b.prioridad];
  if (p !== 0) return p;
  return a.creado_en < b.creado_en ? -1 : 1;
}

export function estaVencida(t: Pick<Tarea, "fecha_limite" | "estado">, hoy: string) {
  return Boolean(t.fecha_limite && t.estado !== "hecha" && t.fecha_limite < hoy);
}
