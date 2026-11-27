"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SECCIONES, estaActiva } from "./secciones";
import { Campanita } from "@/components/notificaciones/campanita";

/** Menú lateral (computadora). */
export function MenuLateral({ pie }: { pie?: React.ReactNode }) {
  const ruta = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col bg-ergon-navy text-white md:flex">
      <div className="flex items-center justify-between gap-2 pb-4 pl-5 pr-3 pt-6">
        <Link href="/inicio">
          <Image
            src="/brand/logo-fondo-oscuro.png"
            alt="Ergon Solutions"
            width={180}
            height={57}
            priority
            className="h-auto w-36"
          />
        </Link>
        <Campanita lado="right" className="text-white/80 hover:bg-white/10 hover:text-white" />
      </div>
      <nav className="flex-1 space-y-0.5 px-3 py-3" aria-label="Principal">
        {SECCIONES.map(({ href, nombre, icono: Icono }) => {
          const activa = estaActiva(ruta, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={activa ? "page" : undefined}
              className={cn(
                "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-white/65 hover:bg-white/[0.06] hover:text-white",
                activa && "bg-white/10 text-white hover:bg-white/10",
              )}
            >
              {/* Indicador cian: acento de marca solo para la sección activa. */}
              {activa ? <span className="absolute -left-3 top-2 bottom-2 w-1 rounded-r-full bg-ergon-sky" aria-hidden /> : null}
              <Icono className={cn("size-5", activa ? "text-ergon-sky" : "text-white/55")} aria-hidden />
              {nombre}
            </Link>
          );
        })}
      </nav>
      {pie ? <div className="border-t border-white/10 p-3">{pie}</div> : null}
    </aside>
  );
}
