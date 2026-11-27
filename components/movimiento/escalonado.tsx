"use client";

import { motion } from "motion/react";
import { fadeUp, stagger } from "@/lib/motion";

/** Contenedor cuyos hijos <Aparece> entran escalonados (fade + subir). */
export function Escalonado({ children, className, cada = 0.05 }: { children: React.ReactNode; className?: string; cada?: number }) {
  return (
    <motion.div className={className} variants={stagger(cada)} initial="oculto" animate="visible">
      {children}
    </motion.div>
  );
}

export function Aparece({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={fadeUp}>
      {children}
    </motion.div>
  );
}
