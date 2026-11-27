import { LOCALE, ZONA_HORARIA } from "@/lib/utils";

const rtf = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" });

/** "hace 5 minutos", "ayer", o la fecha corta si es más viejo. */
export function haceCuanto(fechaIso: string, ahora: Date = new Date()) {
  const fecha = new Date(fechaIso);
  const seg = Math.round((fecha.getTime() - ahora.getTime()) / 1000);
  const abs = Math.abs(seg);
  if (abs < 60) return "ahora";
  if (abs < 3600) return rtf.format(Math.round(seg / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(seg / 3600), "hour");
  if (abs < 86400 * 7) return rtf.format(Math.round(seg / 86400), "day");
  return new Intl.DateTimeFormat(LOCALE, { timeZone: ZONA_HORARIA, day: "numeric", month: "short" }).format(fecha);
}
