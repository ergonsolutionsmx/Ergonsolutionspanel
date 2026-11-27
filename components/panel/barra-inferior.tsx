"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Ellipsis, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SECCIONES, estaActiva } from "./secciones";

const EN_BARRA = SECCIONES.filter((s) => s.enBarra);
const EN_MAS = SECCIONES.filter((s) => !s.enBarra);

/** Barra inferior (celular). Las secciones que no caben van en "Más". */
export function BarraInferior() {
  const ruta = usePathname();
  const [abierto, setAbierto] = useState(false);
  const masActivo = EN_MAS.some((s) => estaActiva(ruta, s.href));

  return (
    <>
      {abierto ? (
        <div className="fixed inset-0 z-40 bg-ergon-navy/20 backdrop-blur-[3px] md:hidden" onClick={() => setAbierto(false)}>
          <nav
            aria-label="Más secciones"
            className="vidrio-solido absolute inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] rounded-[1.375rem] p-2"
            onClick={(e) => e.stopPropagation()}
          >
            {EN_MAS.map(({ href, nombre, icono: Icono }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setAbierto(false)}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-3 py-3 text-base font-bold text-ergon-navy hover:bg-white/70",
                  estaActiva(ruta, href) && "bg-white shadow-sm",
                )}
              >
                <Icono className="size-5" aria-hidden />
                {nombre}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}

      <nav
        aria-label="Principal"
        className="vidrio-solido fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-50 rounded-[1.375rem] p-1 md:hidden"
      >
        <ul className="grid grid-cols-5 gap-1">
          {EN_BARRA.map(({ href, nombre, icono: Icono }) => {
            const activa = estaActiva(ruta, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={activa ? "page" : undefined}
                  className={cn(
                    "flex h-14 flex-col items-center justify-center gap-0.5 rounded-[1.1rem] text-[11px] font-bold text-ergon-navy/55",
                    activa && "bg-white text-ergon-navy shadow-sm",
                  )}
                >
                  <span className={cn("flex h-6 items-center justify-center", activa && "text-ergon-blue")}>
                    <Icono className="size-5" aria-hidden />
                  </span>
                  {nombre}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              aria-expanded={abierto}
              onClick={() => setAbierto((v) => !v)}
              className={cn(
                "flex h-14 w-full flex-col items-center justify-center gap-0.5 rounded-[1.1rem] text-[11px] font-bold text-ergon-navy/55",
                (abierto || masActivo) && "bg-white text-ergon-navy shadow-sm",
              )}
            >
              <span className={cn("flex h-6 items-center justify-center", (abierto || masActivo) && "text-ergon-blue")}>
                {abierto ? <X className="size-5" aria-hidden /> : <Ellipsis className="size-5" aria-hidden />}
              </span>
              Más
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
