"use client";

import { useSyncExternalStore } from "react";

const suscribir = () => () => {};

/**
 * false mientras React hidrata (igual que en el servidor) y true después.
 * Sirve para mostrar datos que el navegador ya cargó sin romper la hidratación.
 */
export function useHidratado() {
  return useSyncExternalStore(
    suscribir,
    () => true,
    () => false,
  );
}
