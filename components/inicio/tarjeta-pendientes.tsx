import Link from "next/link";
import { ArrowRight, CheckCheck, ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GrupoPendientes } from "@/lib/inicio";

export function TarjetaPendientes({
  titulo,
  icono: Icono,
  href,
  grupos,
}: {
  titulo: string;
  icono: LucideIcon;
  href: string;
  grupos: GrupoPendientes[];
}) {
  const total = grupos.reduce((s, g) => s + g.items.length, 0);
  // De 3 a 5 elementos por tarjeta; el resto con "Ver todo".
  const visibles = grupos.map((g, i) => {
    const antes = grupos.slice(0, i).reduce((s, x) => s + x.items.length, 0);
    return { ...g, items: g.items.slice(0, Math.max(0, 5 - antes)) };
  });
  const ocultos = total - visibles.reduce((s, g) => s + g.items.length, 0);

  return (
    <section className="tarjeta-viva flex flex-col rounded-[1.25rem] border border-white/70 bg-card shadow-sm" aria-labelledby={`tarjeta-${href}`}>
      <Link
        href={href}
        className="group flex items-center gap-3 rounded-t-[1.25rem] border-b px-4 py-3.5 hover:bg-muted/60"
      >
        <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-ergon-blue">
          <Icono className="size-[18px]" aria-hidden />
        </span>
        <h2 id={`tarjeta-${href}`} className="flex-1 font-black text-ergon-navy">
          {titulo}
        </h2>
        {total > 0 ? (
          <span className="rounded-full bg-ergon-navy px-2 py-0.5 text-xs font-black tabular-nums text-white">{total}</span>
        ) : null}
        <ChevronRight className="size-4 text-muted-foreground group-hover:translate-x-0.5 group-hover:text-ergon-blue" aria-hidden />
      </Link>

      <div className="flex-1 px-4 py-3">
        {total === 0 ? (
          <p className="flex flex-col items-center gap-1 py-5 text-center text-sm text-muted-foreground">
            <CheckCheck className="size-5 text-exito" aria-hidden />
            Nada pendiente
          </p>
        ) : (
          <div className="space-y-3">
            {visibles
              .filter((g) => g.items.length > 0)
              .map((g) => (
                <div key={g.nombre}>
                  <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">{g.nombre}</h3>
                  <ul className="-mx-2">
                    {g.items.map((item) => (
                      <li key={item.id}>
                        <Link href={item.href} className="flex items-baseline gap-2 rounded-md px-2 py-1.5 hover:bg-muted">
                          <span className={cn("min-w-0 flex-1 truncate text-sm font-bold", item.urgente && "text-error")}>
                            {item.titulo}
                          </span>
                          {item.detalle ? (
                            <span className={cn("shrink-0 text-xs text-muted-foreground", item.urgente && "text-error")}>
                              {item.detalle}
                            </span>
                          ) : null}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            {ocultos > 0 ? (
              <Link href={href} className="group flex items-center gap-1 text-xs font-bold text-ergon-blue">
                Ver todo ({ocultos} más) <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}
