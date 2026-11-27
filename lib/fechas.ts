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

// ---------------------------------------------------------------------------
// Agenda: fechas y horas en hora de Ciudad de México
// ---------------------------------------------------------------------------

const partesFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: ZONA_HORARIA,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Un instante (timestamptz) → fecha y hora locales de CDMX. */
export function partesCDMX(iso: string) {
  const p = Object.fromEntries(partesFmt.formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  return { fecha: `${p.year}-${p.month}-${p.day}`, hora: `${p.hour}:${p.minute}` };
}

/** Desfase de CDMX respecto a UTC para una fecha, p. ej. "-06:00". */
function desfaseCDMX(fecha: string) {
  const nombre = new Intl.DateTimeFormat("en-US", { timeZone: ZONA_HORARIA, timeZoneName: "longOffset" })
    .formatToParts(new Date(`${fecha}T12:00:00Z`))
    .find((p) => p.type === "timeZoneName")?.value;
  return nombre?.match(/GMT([+-]\d{2}:\d{2})/)?.[1] ?? "-06:00";
}

/** Fecha y hora locales de CDMX → instante ISO con su desfase. */
export function instanteCDMX(fecha: string, hora = "00:00") {
  return `${fecha}T${hora}:00${desfaseCDMX(fecha)}`;
}

/** 0 = lunes … 6 = domingo. */
export function diaDeSemana(fecha: string) {
  return (new Date(`${fecha}T12:00:00Z`).getUTCDay() + 6) % 7;
}

export function inicioSemana(fecha: string) {
  return sumarDias(fecha, -diaDeSemana(fecha));
}

export function inicioMes(fecha: string) {
  return `${fecha.slice(0, 7)}-01`;
}

export function sumarMeses(fecha: string, meses: number) {
  const [a, m] = fecha.split("-").map(Number);
  const d = new Date(Date.UTC(a, m - 1 + meses, 1, 12));
  return d.toISOString().slice(0, 10);
}

/** Lista de fechas de `desde` a `hasta` (incluidas). */
export function rangoDias(desde: string, hasta: string) {
  const dias: string[] = [];
  for (let f = desde; f <= hasta; f = sumarDias(f, 1)) dias.push(f);
  return dias;
}

const fmt = (opciones: Intl.DateTimeFormatOptions) => (fecha: string) =>
  new Intl.DateTimeFormat(LOCALE, { timeZone: "UTC", ...opciones }).format(new Date(`${fecha}T12:00:00Z`));

export const nombreMes = fmt({ month: "long", year: "numeric" });
export const diaCorto = fmt({ weekday: "short" });
export const diaLargo = fmt({ weekday: "long", day: "numeric", month: "long" });

export function mayuscula(texto: string) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** "9:30" → "9:30 a. m." (formato corto de 12 h). */
export function horaBonita(hora: string) {
  const [h, m] = hora.split(":").map(Number);
  const sufijo = h < 12 ? "a. m." : "p. m.";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${sufijo}`;
}
