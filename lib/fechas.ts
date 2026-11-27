import { LOCALE, ZONA_HORARIA } from "@/lib/utils";

/** Fecha de hoy en Ciudad de México como "YYYY-MM-DD". */
export function hoyISO(ahora: Date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA_HORARIA }).format(ahora);
}

/** Suma días a una fecha "YYYY-MM-DD" (sin problemas de zona horaria). */
export function sumarDias(fecha: string, dias: number) {
  const d = new Date(`${fecha}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/** "23 nov" (o "23 nov 2027" si es de otro año). */
export function fechaCorta(fecha: string, hoy: string = hoyISO()) {
  const d = new Date(`${fecha}T12:00:00Z`);
  const mismoAnio = fecha.slice(0, 4) === hoy.slice(0, 4);
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    ...(mismoAnio ? {} : { year: "numeric" }),
  })
    .format(d)
    .replace(".", "");
}

/** "Hoy", "Mañana", "Ayer" o la fecha corta. */
export function fechaRelativa(fecha: string, hoy: string = hoyISO()) {
  if (fecha === hoy) return "Hoy";
  if (fecha === sumarDias(hoy, 1)) return "Mañana";
  if (fecha === sumarDias(hoy, -1)) return "Ayer";
  return fechaCorta(fecha, hoy);
}

export const FECHA_VALIDA = /^\d{4}-\d{2}-\d{2}$/;
