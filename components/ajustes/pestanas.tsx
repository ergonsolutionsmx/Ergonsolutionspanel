"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const PESTANAS = [
  { href: "/ajustes", nombre: "Cuenta" },
  { href: "/ajustes/canales", nombre: "Canales" },
  { href: "/ajustes/demos", nombre: "Demos" },
  { href: "/ajustes/bitacora", nombre: "Bitácora" },
];

export function PestanasAjustes() {
  const ruta = usePathname();
  return (
    <nav aria-label="Secciones de ajustes" className="-mx-4 mb-6 overflow-x-auto px-4 md:mx-0 md:px-0">
      <div className="inline-flex rounded-full bg-ergon-navy/[0.06] p-1">
        {PESTANAS.map((p) => {
          const activa = ruta === p.href;
          return (
            <Link
              key={p.href}
              href={p.href}
              aria-current={activa ? "page" : undefined}
              className={cn(
                "whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-bold",
                activa ? "bg-white text-ergon-navy shadow-sm" : "text-muted-foreground hover:text-ergon-navy",
              )}
            >
              {p.nombre}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
