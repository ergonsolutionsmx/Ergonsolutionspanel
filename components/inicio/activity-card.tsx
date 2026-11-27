import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { DiaActividad } from "@/lib/actividad";
import { LineaTiempo } from "@/components/actividad/linea-tiempo";

/** Actividad reciente (mismo estilo que la Bitácora). */
export function ActivityCard({ dias }: { dias: DiaActividad[] }) {
  return (
    <section className="rounded-[1.25rem] border border-white/70 bg-card p-5 shadow-sm" aria-labelledby="actividad-reciente">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id="actividad-reciente" className="font-black text-ergon-navy">
          Actividad reciente
        </h2>
        <Link href="/ajustes/bitacora" className="group flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-ergon-blue">
          Ver bitácora <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </div>
      <LineaTiempo dias={dias} compacta />
    </section>
  );
}
