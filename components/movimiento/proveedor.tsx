"use client";

import { MotionConfig } from "motion/react";

/** Con "reducir movimiento" activo en el sistema, las animaciones se desactivan. */
export function ProveedorMovimiento({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
