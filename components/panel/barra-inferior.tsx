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
        <div className="fixed inset-0 z-40 bg-black/30 md:hidden" onClick={() => setAbierto(false)}>
          <nav
            aria-label="Más secciones"
            className="absolute inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] mx-3 rounded-lg border bg-card p-2 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {EN_MAS.map(({ href, nombre, icono: Icono }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setAbierto(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-3 text-base font-bold text-ergon-navy hover:bg-accent",
                  estaActiva(ruta, href) && "bg-accent",
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
        className="fixed inset-x-0 bottom-0 z-50 border-t bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <ul className="grid grid-cols-5">
          {EN_BARRA.map(({ href, nombre, icono: Icono }) => {
            const activa = estaActiva(ruta, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={activa ? "page" : undefined}
                  className={cn(
                    "flex h-16 flex-col items-center justify-center gap-1 text-xs font-bold text-muted-foreground",
                    activa && "text-ergon-blue",
                  )}
                >
                  <Icono className="size-6" aria-hidden />
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
                "flex h-16 w-full flex-col items-center justify-center gap-1 text-xs font-bold text-muted-foreground",
                (abierto || masActivo) && "text-ergon-blue",
              )}
            >
              {abierto ? <X className="size-6" aria-hidden /> : <Ellipsis className="size-6" aria-hidden />}
              Más
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
