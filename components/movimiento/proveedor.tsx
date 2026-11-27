"use client";

import { LazyMotion, MotionConfig } from "motion/react";

// Las funciones de animación se cargan aparte, después de la primera pintura (más ligero al abrir).
const cargarFunciones = () => import("motion/react").then((mod) => mod.domMax);

/** Con "reducir movimiento" activo en el sistema, las animaciones se desactivan. */
export function ProveedorMovimiento({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={cargarFunciones} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
