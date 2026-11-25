import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const ZONA_HORARIA = "America/Mexico_City";
export const LOCALE = "es-MX";

/** Fecha larga en español de México, en hora de CDMX. */
export function fechaLarga(fecha: Date = new Date()) {
  const texto = new Intl.DateTimeFormat(LOCALE, {
    timeZone: ZONA_HORARIA,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(fecha);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Moneda MXN. */
export function pesos(monto: number) {
  return new Intl.NumberFormat(LOCALE, { style: "currency", currency: "MXN" }).format(monto);
}
