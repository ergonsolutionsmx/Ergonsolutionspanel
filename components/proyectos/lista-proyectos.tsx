import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { fechaCorta } from "@/lib/fechas";
import { porcentaje, type ProyectoConAvance } from "@/lib/tareas";
import type { Catalogos } from "@/lib/tareas-tipos";
import { FolderKanban } from "lucide-react";
import { Avatar, EtiquetaEstadoProyecto } from "@/components/tareas/etiquetas";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { NOMBRE_ETAPA, NOMBRE_TIPO_PROYECTO } from "@/lib/tareas-tipos";

export function ListaProyectos({ proyectos, catalogos }: { proyectos: ProyectoConAvance[]; catalogos: Catalogos }) {
  if (proyectos.length === 0) {
    return <EmptyState icono={FolderKanban} titulo="Sin proyectos" texto="Crea uno con el botón “Proyecto”." />;
  }
  return (
    <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {proyectos.map((p) => {
        const avance = porcentaje(p);
        return (
          <li key={p.id}>
            <Link href={`/proyectos/${p.id}`} className="tarjeta-viva flex h-full flex-col gap-3 rounded-[1.25rem] border border-white/70 bg-card p-4 shadow-sm">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <h2 className="font-black text-ergon-navy">{p.nombre}</h2>
                  <p className="truncate text-xs text-muted-foreground">
                    {[p.cliente, p.tipo ? NOMBRE_TIPO_PROYECTO[p.tipo] : null, p.etapa ? NOMBRE_ETAPA[p.etapa] : null].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <EtiquetaEstadoProyecto estado={p.estado} />
              </div>
              <div className="mt-auto space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {p.hechas} de {p.total} tareas
                  </span>
                  <span className="font-bold text-ergon-navy">{avance}%</span>
                </div>
                <Progress value={avance} aria-label={`Avance de ${p.nombre}`} />
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
