"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SECCIONES, estaActiva } from "./secciones";

/** Menú lateral (computadora). */
export function MenuLateral({ pie }: { pie?: React.ReactNode }) {
  const ruta = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col bg-ergon-navy text-white md:flex">
      <Link href="/inicio" className="px-5 pb-4 pt-6">
        <Image
          src="/brand/logo-fondo-oscuro.png"
          alt="Ergon Solutions"
          width={180}
          height={57}
          priority
          className="h-auto w-40"
        />
      </Link>
      <nav className="flex-1 space-y-1 px-3 py-2" aria-label="Principal">
        {SECCIONES.map(({ href, nombre, icono: Icono }) => {
          const activa = estaActiva(ruta, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={activa ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-bold text-white/75 hover:bg-white/10 hover:text-white",
                activa && "bg-ergon-blue text-white hover:bg-ergon-blue",
              )}
            >
              <Icono className="size-5" aria-hidden />
              {nombre}
            </Link>
          );
        })}
      </nav>
      {pie ? <div className="border-t border-white/10 p-3">{pie}</div> : null}
    </aside>
  );
}
