"use client";

import { useOptimistic, useTransition } from "react";
import * as m from "motion/react-m";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ETAPAS_METODO, NOMBRE_ETAPA, type EtapaMetodo } from "@/lib/tareas-tipos";
import { cambiarEtapa } from "@/app/(panel)/proyectos/acciones";

/** Fases del trabajo: tocar una fase la marca como la actual. */
export function EtapasMetodo({ proyectoId, etapa }: { proyectoId: string; etapa: EtapaMetodo | null }) {
  const [actual, setActual] = useOptimistic(etapa ?? "analisis");
  const [, startTransition] = useTransition();
  const idx = ETAPAS_METODO.indexOf(actual);
  return (
    <section aria-label="Fases del trabajo" className="rounded-[1.25rem] border border-white/70 bg-card p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-black text-ergon-navy">Fase del trabajo</h2>
      <ol className="flex gap-1 overflow-x-auto pb-1">
        {ETAPAS_METODO.map((e, i) => {
          const hecha = i < idx;
          const activa = i === idx;
          return (
            <li key={e} className="flex min-w-24 flex-1 flex-col items-center gap-1.5">
              <div className="flex w-full items-center">
                <span className={cn("h-0.5 flex-1 rounded-full", i === 0 ? "bg-transparent" : i <= idx ? "bg-ergon-blue" : "bg-border")} aria-hidden />
                <button
                  type="button"
                  aria-current={activa ? "step" : undefined}
                  aria-label={`${NOMBRE_ETAPA[e]}${activa ? " (actual)" : hecha ? " (hecha)" : ""}`}
                  onClick={() =>
                    startTransition(async () => {
                      setActual(e);
                      await cambiarEtapa(proyectoId, e);
                    })
                  }
                  className={cn(
                    "relative grid size-8 shrink-0 place-items-center rounded-full border-2 text-xs font-black outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    hecha && "border-ergon-blue bg-ergon-blue text-white",
                    activa && "border-ergon-blue bg-card text-ergon-blue",
                    !hecha && !activa && "border-border bg-card text-muted-foreground hover:border-ergon-blue/50",
                  )}
                >
                  {activa ? <m.span layoutId={`etapa-${proyectoId}`} className="absolute -inset-1 rounded-full ring-4 ring-ergon-blue/20" aria-hidden /> : null}
                  {hecha ? <Check className="size-4" aria-hidden /> : i + 1}
                </button>
                <span className={cn("h-0.5 flex-1 rounded-full", i === ETAPAS_METODO.length - 1 ? "bg-transparent" : i < idx ? "bg-ergon-blue" : "bg-border")} aria-hidden />
              </div>
              <span className={cn("text-center text-xs font-bold", activa ? "text-ergon-blue" : hecha ? "text-ergon-navy" : "text-muted-foreground")}>
                {NOMBRE_ETAPA[e]}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
