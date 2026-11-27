"use client";

import Link from "next/link";
import * as m from "motion/react-m";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** Pasos con barra de avance animada. Cada paso es un link (?paso=…). */
export function Stepper({ pasos, actual }: { pasos: { valor: string; nombre: string; href: string }[]; actual: string }) {
  const idx = Math.max(0, pasos.findIndex((p) => p.valor === actual));
  return (
    <nav aria-label="Pasos" className="rounded-[1.25rem] border border-white/70 bg-card p-3 shadow-sm">
      <div className="relative mx-4 mb-2 mt-1 h-1 rounded-full bg-secondary" aria-hidden>
        <m.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-ergon-blue to-ergon-sky"
          initial={false}
          animate={{ width: `${(idx / Math.max(1, pasos.length - 1)) * 100}%` }}
          transition={{ type: "spring", stiffness: 160, damping: 24 }}
        />
      </div>
      <ol className="grid" style={{ gridTemplateColumns: `repeat(${pasos.length}, minmax(0, 1fr))` }}>
        {pasos.map((p, i) => {
          const hecho = i < idx;
          const activo = i === idx;
          return (
            <li key={p.valor} className="flex justify-center">
              <Link
                href={p.href}
                scroll={false}
                aria-current={activo ? "step" : undefined}
                className="flex flex-col items-center gap-1 rounded-xl px-2 py-1 text-center outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span
                  className={cn(
                    "grid size-8 place-items-center rounded-full border-2 text-xs font-black transition-colors",
                    hecho && "border-ergon-blue bg-ergon-blue text-white",
                    activo && "border-ergon-blue bg-card text-ergon-blue ring-4 ring-ergon-blue/15",
                    !hecho && !activo && "border-border bg-card text-muted-foreground",
                  )}
                >
                  {hecho ? <Check className="size-4" aria-hidden /> : i + 1}
                </span>
                <span className={cn("text-xs font-bold", activo ? "text-ergon-navy" : "text-muted-foreground")}>{p.nombre}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
