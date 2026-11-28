"use client";

import { useRef } from "react";
import { useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import * as m from "motion/react-m";
import { cn } from "@/lib/utils";

/**
 * Tarjeta de acceso: vidrio oscuro sobre navy, con inclinación 3D al mover el mouse
 * (solo con mouse y sin "reducir movimiento") y una luz que recorre el borde.
 */
export function TarjetaAcceso({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reducir = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [6, -6]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), { stiffness: 200, damping: 20 });

  const mover = (e: React.PointerEvent) => {
    if (reducir || e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width - 0.5);
    y.set((e.clientY - r.top) / r.height - 0.5);
  };
  const salir = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={cn("relative z-10 w-full max-w-sm", className)}
      style={{ perspective: 1500 }}
    >
      <m.div ref={ref} style={{ rotateX, rotateY }} onPointerMove={mover} onPointerLeave={salir} className="group relative">
        {/* Luz que recorre el borde (detalle sutil) */}
        <div className="borde-luz pointer-events-none absolute -inset-px rounded-[1.75rem]" aria-hidden />
        <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/40 sm:p-8">
          {/* Patrón muy tenue */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage: "linear-gradient(135deg, white 0.5px, transparent 0.5px), linear-gradient(45deg, white 0.5px, transparent 0.5px)",
              backgroundSize: "30px 30px",
            }}
            aria-hidden
          />
          <div className="relative">{children}</div>
        </div>
      </m.div>
    </m.div>
  );
}
