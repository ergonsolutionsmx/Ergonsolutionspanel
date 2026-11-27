"use client";

import { Logo } from "@/components/brand/logo";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { cn } from "@/lib/utils";
import { SECCIONES, estaActiva } from "./secciones";

const CERRADO = 72;
const ABIERTO = 248;

/**
 * Menú lateral (computadora): navy, se abre al pasar el mouse (72 → 248 px) encima del contenido.
 * También se abre al navegar con el teclado (focus).
 */
export function MenuLateral({ pie }: { pie?: React.ReactNode }) {
  const ruta = usePathname();
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="sticky top-0 z-40 hidden h-dvh shrink-0 md:block" style={{ width: CERRADO }}>
      <m.aside
        data-abierto={abierto}
        className="group/menu absolute inset-y-0 left-0 flex flex-col overflow-hidden bg-sidebar text-sidebar-foreground shadow-[8px_0_40px_-12px_rgb(11_31_68/0.45)]"
        initial={false}
        animate={{ width: abierto ? ABIERTO : CERRADO }}
        transition={{ type: "spring", stiffness: 420, damping: 38 }}
        onMouseEnter={() => setAbierto(true)}
        onMouseLeave={() => setAbierto(false)}
        onFocus={() => setAbierto(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setAbierto(false);
        }}
        aria-label="Menú"
      >
        {/* Luz de marca sutil arriba */}
        <div className="pointer-events-none absolute -left-20 -top-24 size-64 rounded-full bg-ergon-sky/20 blur-3xl" aria-hidden />

        <Link href="/inicio" className="relative flex h-20 shrink-0 items-center pl-[18px]" aria-label="Ergon Solutions · Inicio">
          <AnimatePresence initial={false} mode="wait">
            {abierto ? (
              <m.span key="logo" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                <Logo tono="light" prioridad className="w-36" />
              </m.span>
            ) : (
              <m.span key="icono" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
                <Logo variante="icon" tono="light" prioridad className="w-9" />
              </m.span>
            )}
          </AnimatePresence>
        </Link>

        <nav className="relative flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-3 py-2" aria-label="Principal">
          {SECCIONES.map(({ href, nombre, icono: Icono }) => {
            const activa = estaActiva(ruta, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={activa ? "page" : undefined}
                title={abierto ? undefined : nombre}
                className={cn(
                  "group/link relative flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold text-sidebar-foreground/70 outline-none hover:bg-white/[0.06] hover:text-white focus-visible:ring-2 focus-visible:ring-sidebar-accent",
                  activa && "bg-sidebar-active text-white",
                )}
              >
                {activa ? (
                  <m.span
                    layoutId="menu-activo"
                    className="absolute -left-3 top-2 bottom-2 w-1 rounded-r-full bg-sidebar-accent"
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                    aria-hidden
                  />
                ) : null}
                <Icono
                  className={cn(
                    "size-5 shrink-0 transition-transform duration-200 group-hover/link:-rotate-6 group-hover/link:scale-110 motion-reduce:transition-none",
                    activa ? "text-sidebar-accent" : "text-sidebar-foreground/60",
                  )}
                  strokeWidth={1.9}
                  aria-hidden
                />
                <span
                  className={cn(
                    "whitespace-nowrap transition-[opacity,transform] duration-200 group-hover/link:translate-x-0.5",
                    abierto ? "opacity-100" : "pointer-events-none opacity-0",
                  )}
                >
                  {nombre}
                </span>
              </Link>
            );
          })}
        </nav>

        {pie ? <div className="relative border-t border-white/10 p-3">{pie}</div> : null}
      </m.aside>
    </div>
  );
}
