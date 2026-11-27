import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { pesos } from "@/lib/utils";
import { precioDesde, type Servicio } from "@/lib/catalogo-tipos";
import { EtiquetaDificultad, EtiquetaEstadoServicio, EtiquetaIA } from "./etiquetas";

export function TarjetaServicio({ servicio: s }: { servicio: Servicio }) {
  const instalacion = precioDesde(s.variantes, "precio_instalacion");
  const mensual = precioDesde(s.variantes, "precio_mensual");
  return (
    <Link
      href={`/catalogo/${s.id}`}
      className="tarjeta-viva group flex h-full flex-col gap-2 rounded-[1.25rem] border border-white/70 bg-card p-4 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 rounded-lg bg-ergon-navy px-1.5 py-0.5 text-xs font-black text-white">{s.numero}</span>
        <h3 className="flex-1 font-black leading-snug text-ergon-navy">{s.nombre}</h3>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <EtiquetaEstadoServicio estado={s.estado} />
        <EtiquetaDificultad dificultad={s.dificultad} />
        {s.lleva_ia ? <EtiquetaIA /> : null}
        {!s.activo ? <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-bold text-white">Archivado</span> : null}
      </div>
      {s.categorias[0] ? <p className="text-xs font-bold text-ergon-blue">{s.categorias[0]}</p> : null}
      {s.que_es ? <p className="line-clamp-2 text-sm text-muted-foreground">{s.que_es}</p> : null}
      <p className="mt-auto flex items-center justify-between gap-2 pt-1 text-xs font-bold text-ergon-navy">
        <span>
        {instalacion !== null || mensual !== null
          ? [instalacion !== null ? `Desde ${pesos(instalacion)}` : null, mensual !== null ? `${pesos(mensual)}/mes` : null]
              .filter(Boolean)
              .join(" · ")
          : "Precio por definir"}
        </span>
        <span className="flex items-center gap-0.5 text-primary">
          Ver <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </span>
      </p>
    </Link>
  );
}
