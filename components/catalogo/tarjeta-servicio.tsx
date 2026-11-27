import Link from "next/link";
import { pesos } from "@/lib/utils";
import { precioDesde, type Servicio } from "@/lib/catalogo-tipos";
import { EtiquetaDificultad, EtiquetaEstadoServicio, EtiquetaIA } from "./etiquetas";

export function TarjetaServicio({ servicio: s }: { servicio: Servicio }) {
  const instalacion = precioDesde(s.variantes, "precio_instalacion");
  const mensual = precioDesde(s.variantes, "precio_mensual");
  return (
    <Link
      href={`/catalogo/${s.id}`}
      className="flex h-full flex-col gap-2 rounded-lg border border-white/70 bg-card p-4 shadow-sm hover:border-ergon-blue"
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 rounded bg-ergon-navy px-1.5 py-0.5 text-xs font-black text-white">{s.numero}</span>
        <h3 className="flex-1 font-black leading-snug text-ergon-navy">{s.nombre}</h3>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <EtiquetaEstadoServicio estado={s.estado} />
        <EtiquetaDificultad dificultad={s.dificultad} />
        {s.lleva_ia ? <EtiquetaIA /> : null}
        {!s.activo ? <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-bold text-white">Archivado</span> : null}
      </div>
      {s.que_es ? <p className="line-clamp-2 text-sm text-muted-foreground">{s.que_es}</p> : null}
      <p className="mt-auto pt-1 text-xs font-bold text-ergon-navy">
        {instalacion !== null || mensual !== null
          ? [instalacion !== null ? `Desde ${pesos(instalacion)}` : null, mensual !== null ? `${pesos(mensual)}/mes` : null]
              .filter(Boolean)
              .join(" · ")
          : "Precio por definir"}
      </p>
    </Link>
  );
}
