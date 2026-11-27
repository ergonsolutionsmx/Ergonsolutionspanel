"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SECCIONES, estaActiva } from "./secciones";
import { Campanita } from "@/components/notificaciones/campanita";

/** Menú lateral (computadora): panel de vidrio flotante. */
export function MenuLateral({ pie }: { pie?: React.ReactNode }) {
  const ruta = usePathname();

  return (
    <aside className="vidrio sticky top-4 hidden h-[calc(100dvh-2rem)] w-60 shrink-0 flex-col rounded-[1.5rem] text-ergon-navy md:flex">
      <div className="flex items-center justify-between gap-2 pb-3 pl-5 pr-3 pt-5">
        <Link href="/inicio">
          <Image
            src="/brand/logo-horizontal-claro.png"
            alt="Ergon Solutions"
            width={240}
            height={56}
            priority
            className="h-auto w-36"
          />
        </Link>
        <Campanita lado="right" className="rounded-full text-ergon-navy/75 hover:bg-white/70 hover:text-ergon-navy" />
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3" aria-label="Principal">
        {SECCIONES.map(({ href, nombre, icono: Icono }) => {
          const activa = estaActiva(ruta, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={activa ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-full px-3.5 py-2.5 text-sm font-bold text-ergon-navy/65 hover:bg-white/50 hover:text-ergon-navy",
                activa && "bg-white text-ergon-navy shadow-sm hover:bg-white",
              )}
            >
              <Icono className={cn("size-[1.15rem]", activa ? "text-ergon-blue" : "text-ergon-navy/50")} strokeWidth={1.9} aria-hidden />
              {nombre}
            </Link>
          );
        })}
      </nav>
      {pie ? <div className="m-3 mt-0 rounded-2xl bg-white/45 p-2.5">{pie}</div> : null}
    </aside>
  );
}
