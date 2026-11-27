import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { fechaCorta } from "@/lib/fechas";
import { porcentaje, type ProyectoConAvance } from "@/lib/tareas";
import type { Catalogos } from "@/lib/tareas-tipos";
import { Avatar, BarraAvance, EtiquetaEstadoProyecto } from "@/components/tareas/etiquetas";

export function ListaProyectos({ proyectos, catalogos }: { proyectos: ProyectoConAvance[]; catalogos: Catalogos }) {
  if (proyectos.length === 0) {
    return <p className="rounded-lg border border-white/70 bg-card p-8 text-center text-sm text-muted-foreground">Sin proyectos</p>;
  }
  return (
    <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {proyectos.map((p) => {
        const avance = porcentaje(p);
        return (
          <li key={p.id}>
            <Link href={`/proyectos/${p.id}`} className="flex h-full flex-col gap-3 rounded-lg border border-white/70 bg-card p-4 shadow-sm hover:border-ergon-blue">
              <div className="flex items-start gap-2">
                <h2 className="flex-1 font-black text-ergon-navy">{p.nombre}</h2>
                <EtiquetaEstadoProyecto estado={p.estado} />
              </div>
              <div className="mt-auto space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {p.hechas} de {p.total} tareas
                  </span>
                  <span className="font-bold text-ergon-navy">{avance}%</span>
                </div>
                <BarraAvance valor={avance} />
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Avatar perfil={catalogos.perfiles.find((x) => x.usuario_id === p.responsable_id)} />
                {p.fecha_objetivo ? (
                  <span className="flex items-center gap-1">
                    <CalendarDays className="size-3" aria-hidden /> {fechaCorta(p.fecha_objetivo, catalogos.hoy)}
                  </span>
                ) : null}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
