"use client";

import Link from "next/link";
import * as m from "motion/react-m";
import { History } from "lucide-react";
import { cn } from "@/lib/utils";
import { fadeUp, stagger } from "@/lib/motion";
import { EmptyState } from "@/components/ui/empty-state";
import type { DiaActividad } from "@/lib/actividad";

function Iniciales({ nombre, color }: { nombre: string; color: string }) {
  const letras = nombre
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span className="relative z-[1] flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-black text-white ring-4 ring-card" style={{ backgroundColor: color }} aria-hidden>
      {letras}
    </span>
  );
}

/** Línea de tiempo de actividad (Inicio y Bitácora): agrupada por día, la línea se dibuja y los registros entran escalonados. */
export function LineaTiempo({ dias, compacta = false }: { dias: DiaActividad[]; compacta?: boolean }) {
  if (dias.length === 0) return <EmptyState icono={History} titulo="Sin actividad todavía" texto="Aquí verás quién hizo qué y cuándo." compacto />;
  return (
    <div className="space-y-5">
      {dias.map((d) => (
        <section key={d.dia}>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">{d.dia}</h3>
          <m.ol className="relative" variants={stagger(0.04)} initial="oculto" animate="visible">
            <m.span
              aria-hidden
              className="absolute bottom-4 left-4 top-4 w-px origin-top bg-border"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            />
            {d.entradas.map((e) => {
              const contenido = (
                <>
                  {e.quien ? (
                    <Iniciales nombre={e.quien.nombre} color={e.quien.color} />
                  ) : (
                    <span className="relative z-[1] flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-muted-foreground ring-4 ring-card">
                      Sis
                    </span>
                  )}
                  <span className="min-w-0 flex-1 pt-0.5">
                    <span className={cn("block text-sm leading-snug text-foreground", compacta && "truncate")}>
                      <span className="font-bold">{e.quien?.nombre.split(" ")[0] ?? "Sistema"}</span>{" "}
                      <span className="text-muted-foreground">{e.texto.charAt(0).toLowerCase() + e.texto.slice(1)}</span>
                    </span>
                    {!compacta && e.cambios?.length ? (
                      <span className="mt-1 block space-y-0.5 rounded-lg bg-muted px-2 py-1 text-xs text-muted-foreground">
                        {e.cambios.map((c) => (
                          <span key={c} className="block truncate">
                            {c}
                          </span>
                        ))}
                      </span>
                    ) : null}
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {e.modulo} · {e.hora}
                    </span>
                  </span>
                </>
              );
              return (
                <m.li key={e.id} variants={fadeUp}>
                  {e.href ? (
                    <Link href={e.href} className="-mx-2 flex items-start gap-3 rounded-xl px-2 py-2 hover:bg-muted">
                      {contenido}
                    </Link>
                  ) : (
                    <div className="flex items-start gap-3 py-2">{contenido}</div>
                  )}
                </m.li>
              );
            })}
          </m.ol>
        </section>
      ))}
    </div>
  );
}
