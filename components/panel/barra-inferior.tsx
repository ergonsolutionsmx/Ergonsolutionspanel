"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import * as m from "motion/react-m";
import { Ellipsis } from "lucide-react";
import { cn } from "@/lib/utils";
import { gentleSpring } from "@/lib/motion";
import { SECCIONES, estaActiva } from "./secciones";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const EN_BARRA = SECCIONES.filter((s) => s.enBarra);
const EN_MAS = SECCIONES.filter((s) => !s.enBarra);

function Pastilla() {
  return (
    <m.span
      layoutId="barra-activa"
      transition={gentleSpring}
      className="absolute inset-0 rounded-[1.1rem] bg-primary shadow-[var(--shadow-accion)]"
      aria-hidden
    />
  );
}

/** Barra inferior (celular): 4 secciones + "Más", que abre una hoja desde abajo. */
export function BarraInferior() {
  const ruta = usePathname();
  const [abierto, setAbierto] = useState(false);
  const masActivo = EN_MAS.some((s) => estaActiva(ruta, s.href));


  return (
    <>
      <nav
        aria-label="Principal"
        className="vidrio-solido fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-50 rounded-[1.375rem] p-1 md:hidden"
      >
        <ul className="grid grid-cols-5 gap-1">
          {EN_BARRA.map(({ href, nombre, corto, icono: Icono }) => {
            const activa = estaActiva(ruta, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={activa ? "page" : undefined}
                  className={cn(
                    "relative flex h-14 flex-col items-center justify-center gap-0.5 rounded-[1.1rem] text-[11px] font-bold text-ergon-navy/60 outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    activa && "text-white",
                  )}
                >
                  {activa ? <Pastilla /> : null}
                  <Icono className="relative size-5" strokeWidth={1.9} aria-hidden />
                  <span className="relative">{corto ?? nombre}</span>
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              aria-expanded={abierto}
              aria-haspopup="dialog"
              onClick={() => setAbierto(true)}
              className={cn(
                "relative flex h-14 w-full flex-col items-center justify-center gap-0.5 rounded-[1.1rem] text-[11px] font-bold text-ergon-navy/60 outline-none focus-visible:ring-2 focus-visible:ring-ring",
                masActivo && "text-white",
              )}
            >
              {masActivo ? <Pastilla /> : null}
              <Ellipsis className="relative size-5" aria-hidden />
              <span className="relative">Más</span>
            </button>
          </li>
        </ul>
      </nav>

      <Sheet open={abierto} onOpenChange={setAbierto}>
        <SheetContent side="bottom" className="rounded-t-[1.75rem] border-0 px-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-2 md:hidden">
          <div className="mx-auto mb-1 mt-1 h-1.5 w-10 rounded-full bg-ergon-navy/15" aria-hidden />
          <SheetHeader className="px-2 pb-1 pt-2">
            <SheetTitle className="text-lg font-black text-ergon-navy">Más secciones</SheetTitle>
            <SheetDescription className="sr-only">Catálogo, Propuestas, Demos y Ajustes</SheetDescription>
          </SheetHeader>
          <nav aria-label="Más secciones" className="grid grid-cols-2 gap-2 px-1">
            {EN_MAS.map(({ href, nombre, icono: Icono }) => {
              const activa = estaActiva(ruta, href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setAbierto(false)}
                  aria-current={activa ? "page" : undefined}
                  className={cn(
                    "flex flex-col gap-3 rounded-2xl border bg-card p-4 text-base font-bold text-ergon-navy shadow-sm active:scale-[0.98]",
                    activa && "border-primary/40 bg-accent",
                  )}
                >
                  <span className={cn("flex size-10 items-center justify-center rounded-xl bg-secondary", activa && "bg-primary text-white")}>
                    <Icono className="size-5" aria-hidden />
                  </span>
                  {nombre}
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
