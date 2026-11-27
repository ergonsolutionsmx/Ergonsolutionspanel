"use client";

import * as m from "motion/react-m";
import { fadeUp, stagger } from "@/lib/motion";

/** Contenedor cuyos hijos <Aparece> entran escalonados (fade + subir). */
export function Escalonado({ children, className, cada = 0.05 }: { children: React.ReactNode; className?: string; cada?: number }) {
  return (
    <m.div className={className} variants={stagger(cada)} initial="oculto" animate="visible">
      {children}
    </m.div>
  );
}

export function Aparece({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <m.div className={className} variants={fadeUp}>
      {children}
    </m.div>
  );
}
