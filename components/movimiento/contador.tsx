"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { animate, useInView, useReducedMotion } from "motion/react";

/** Número que sube desde 0 al aparecer (count-up). */
export function Contador({ valor, className }: { valor: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const visible = useInView(ref, { once: true });
  const reducir = useReducedMotion();

  // Antes de pintar: arranca en 0 (sin JS se queda el número real).
  useLayoutEffect(() => {
    if (!reducir && ref.current && valor > 0) ref.current.textContent = "0";
  }, [reducir, valor]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !visible) return;
    if (reducir) {
      el.textContent = String(valor);
      return;
    }
    const control = animate(0, valor, {
      duration: Math.min(1.1, 0.4 + valor * 0.04),
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        el.textContent = String(Math.round(v));
      },
    });
    return () => control.stop();
  }, [valor, visible, reducir]);

  return (
    <span ref={ref} className={className} aria-label={String(valor)}>
      {valor}
    </span>
  );
}
