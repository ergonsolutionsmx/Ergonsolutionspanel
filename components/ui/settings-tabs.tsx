"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as m from "motion/react-m";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { gentleSpring } from "@/lib/motion";

export type PestanaAjustes = { href: string; nombre: string; icono: LucideIcon; exacta?: boolean };

/**
 * Pestañas de Ajustes. Computadora: verticales con indicador animado.
 * Celular: horizontales con scroll arriba.
 */
export function SettingsTabs({ pestanas }: { pestanas: PestanaAjustes[] }) {
  const ruta = usePathname();
  const activa = (p: PestanaAjustes) => (p.exacta ? ruta === p.href : ruta === p.href || ruta.startsWith(`${p.href}/`));
  return (
    <nav aria-label="Secciones de ajustes" className="-mx-4 overflow-x-auto px-4 md:mx-0 md:overflow-visible md:px-0">
      <ul className="flex gap-1 md:flex-col md:gap-0.5">
        {pestanas.map((p) => {
          const sel = activa(p);
          return (
            <li key={p.href} className="relative">
              <Link
                href={p.href}
                aria-current={sel ? "page" : undefined}
                className={cn(
                  "relative flex items-center gap-2.5 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-bold outline-none focus-visible:ring-2 focus-visible:ring-ring md:rounded-xl md:py-2.5",
                  sel ? "text-ergon-navy" : "text-muted-foreground hover:bg-white/50 hover:text-ergon-navy",
                )}
              >
                {sel ? (
                  <m.span layoutId="ajustes-activa" transition={gentleSpring} className="absolute inset-0 rounded-full bg-white shadow-sm md:rounded-xl" aria-hidden />
                ) : null}
                {sel ? (
                  <m.span layoutId="ajustes-barra" transition={gentleSpring} className="absolute -left-2 top-2 bottom-2 hidden w-1 rounded-full bg-ergon-blue md:block" aria-hidden />
                ) : null}
                <p.icono className={cn("relative size-4", sel && "text-ergon-blue")} aria-hidden />
                <span className="relative">{p.nombre}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
