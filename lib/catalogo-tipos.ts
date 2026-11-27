// Tipos, catálogos y buscador del catálogo de servicios (servidor y cliente).

export const CATEGORIAS = [
  "Presencia y captación",
  "Agenda y atención",
  "Cobros y dinero",
  "Operación interna",
  "Datos y decisiones",
  "A la medida",
] as const;

export const ESTADOS_SERVICIO = ["listo", "pendiente", "proximamente"] as const;
export type EstadoServicio = (typeof ESTADOS_SERVICIO)[number];
export const NOMBRE_ESTADO_SERVICIO: Record<EstadoServicio, string> = {
  listo: "Listo",
  pendiente: "Pendiente",
  proximamente: "Próximamente",
};

export const DIFICULTADES = ["baja", "media", "alta"] as const;
export type Dificultad = (typeof DIFICULTADES)[number];
export const NOMBRE_DIFICULTAD: Record<Dificultad, string> = { baja: "Baja", media: "Media", alta: "Alta" };

export const NOMBRES_VARIANTE = ["basico", "estandar", "avanzado", "unica"] as const;
export type NombreVariante = (typeof NOMBRES_VARIANTE)[number];
export const NOMBRE_VARIANTE: Record<NombreVariante, string> = {
  basico: "Básico",
  estandar: "Estándar",
  avanzado: "Avanzado",
  unica: "Única",
};
export const ORDEN_VARIANTE: Record<NombreVariante, number> = { basico: 1, estandar: 2, avanzado: 3, unica: 1 };

export type Variante = {
  id: string;
  servicio_id: string;
  nombre: NombreVariante;
  que_incluye: string | null;
  entregables: string | null;
  tiempo_estimado: string | null;
  precio_instalacion: number | null;
  precio_mensual: number | null;
  orden: number;
};

export type Servicio = {
  id: string;
  numero: string;
  nombre: string;
  categorias: string[];
  estado: EstadoServicio;
  dificultad: Dificultad | null;
  lleva_ia: boolean;
  que_es: string | null;
  para_quien: string | null;
  problemas: string[];
  cuando_no_recomendar: string | null;
  entregables: string | null;
  link_drive: string | null;
  activo: boolean;
  variantes: Variante[];
};

export const COLUMNAS_SERVICIO =
  "id, numero, nombre, categorias, estado, dificultad, lleva_ia, que_es, para_quien, problemas, cuando_no_recomendar, entregables, link_drive, activo";
export const COLUMNAS_VARIANTE =
  "id, servicio_id, nombre, que_incluye, entregables, tiempo_estimado, precio_instalacion, precio_mensual, orden";

/** minúsculas y sin acentos: "Citas en línea" → "citas en linea". */
export function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/** Palabras vacías que no ayudan a buscar ("no me encuentran en google" → encuentran, google). */
const VACIAS = new Set(
  "a al con de del el en es la las lo los me mi mis no nos para por que se su sus te tu un una uno y o ya hay muy mas".split(" "),
);

function contiene(texto: string, palabra: string) {
  if (texto.includes(palabra)) return true;
  // Raíz de palabras largas: "encuentran" encuentra "encuentra", "agendar" encuentra "agenda".
  if (palabra.length > 6 && texto.includes(palabra.slice(0, 6))) return true;
  // Tolerar singular/plural: "citas" encuentra "cita" y al revés.
  if (palabra.length > 4 && palabra.endsWith("es") && texto.includes(palabra.slice(0, -2))) return true;
  if (palabra.length > 3 && palabra.endsWith("s") && texto.includes(palabra.slice(0, -1))) return true;
  return false;
}

/**
 * Buscador por problema: busca en nombre, problemas y "qué es".
 * Devuelve 0 si no coincide; mientras más alto, más relevante.
 * Todas las palabras de la búsqueda deben aparecer en algún campo.
 */
export function puntaje(s: Pick<Servicio, "numero" | "nombre" | "problemas" | "que_es">, busqueda: string) {
  const palabras = normalizar(busqueda)
    .split(/[^a-z0-9ñ]+/)
    .filter((p) => p.length > 1 && !VACIAS.has(p));
  if (palabras.length === 0) return 1;
  const nombre = normalizar(`${s.numero} ${s.nombre}`);
  const problemas = normalizar(s.problemas.join(" · "));
  const queEs = normalizar(s.que_es ?? "");
  let total = 0;
  for (const p of palabras) {
    const enNombre = contiene(nombre, p) ? 5 : 0;
    const enProblemas = contiene(problemas, p) ? 3 : 0;
    const enQueEs = contiene(queEs, p) ? 1 : 0;
    const suma = enNombre + enProblemas + enQueEs;
    if (suma === 0) return 0;
    total += suma;
  }
  return total;
}

/** Precio más bajo entre variantes, o null si todos están "por definir". */
export function precioDesde(variantes: Variante[], campo: "precio_instalacion" | "precio_mensual") {
  const precios = variantes.map((v) => v[campo]).filter((p): p is number => p !== null);
  return precios.length ? Math.min(...precios) : null;
}
