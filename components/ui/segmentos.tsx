"use client";

import Link from "next/link";
import { useId } from "react";
import * as m from "motion/react-m";
import { cn } from "@/lib/utils";
import { gentleSpring } from "@/lib/motion";

type Opcion = { valor: string; etiqueta: React.ReactNode; href?: string };

/**
 * Pestañas tipo segmento con indicador animado que se desliza (layoutId).
 * Con `href` son links (cambian la URL); sin `href` llaman a `onCambio`.
 */
export function Segmentos({
  opciones,
  activo,
  onCambio,
  etiqueta,
  className,
  tamano = "md",
}: {
  opciones: Opcion[];
  activo: string;
  onCambio?: (valor: string) => void;
  etiqueta: string;
  className?: string;
  tamano?: "sm" | "md";
}) {
  const id = useId();
  return (
    <div role="tablist" aria-label={etiqueta} className={cn("inline-flex max-w-full overflow-x-auto rounded-full bg-ergon-navy/[0.06] p-1", className)}>
      {opciones.map((o) => {
        const sel = o.valor === activo;
        const clase = cn(
          "relative whitespace-nowrap rounded-full font-bold outline-none focus-visible:ring-2 focus-visible:ring-ring",
          tamano === "sm" ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm",
          sel ? "text-ergon-navy" : "text-muted-foreground hover:text-ergon-navy",
        );
        const contenido = (
          <>
            {sel ? (
              <m.span
                layoutId={`segmento-${id}`}
                transition={gentleSpring}
                className="absolute inset-0 rounded-full bg-white shadow-sm"
                aria-hidden
              />
            ) : null}
            <span className="relative z-[1] flex items-center gap-1.5">{o.etiqueta}</span>
          </>
        );
        return o.href ? (
          <Link key={o.valor} role="tab" aria-selected={sel} href={o.href} className={clase} scroll={false}>
            {contenido}
          </Link>
        ) : (
          <button key={o.valor} type="button" role="tab" aria-selected={sel} onClick={() => onCambio?.(o.valor)} className={clase}>
            {contenido}
          </button>
        );
      })}
    </div>
  );
}
