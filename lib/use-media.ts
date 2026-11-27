"use client";

import { useSyncExternalStore } from "react";

/** true si la media query se cumple (p. ej. "(min-width: 768px)"). En el servidor: false. */
export function useMedia(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
