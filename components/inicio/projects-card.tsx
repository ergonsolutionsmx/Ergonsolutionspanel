import Link from "next/link";
import { ArrowRight, CalendarClock, FolderKanban } from "lucide-react";
import type { ProyectoActivo } from "@/lib/inicio";
import { fechaCorta } from "@/lib/fechas";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EmptyState } from "@/components/ui/empty-state";
import { Iniciales } from "@/components/panel/usuario";

/** Proyectos activos con su avance (porcentaje de tareas hechas). */
export function ProjectsCard({ proyectos }: { proyectos: ProyectoActivo[] }) {
  return (
    <section className="flex flex-col rounded-[1.25rem] border border-white/70 bg-card p-5 shadow-sm" aria-labelledby="proyectos-activos">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id="proyectos-activos" className="font-black text-ergon-navy">
          Proyectos activos
        </h2>
        <Link href="/proyectos?vista=proyectos" className="group flex items-center gap-1 text-xs font-bold text-muted-foreground hover:text-ergon-blue">
          Ver todo <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </div>
      {proyectos.length === 0 ? (
        <EmptyState icono={FolderKanban} titulo="Sin proyectos activos" texto="Cuando arranques uno, aquí verás su avance." compacto />
      ) : (
        <ul className="flex flex-col gap-5">
          {proyectos.map((p) => (
            <li key={p.id}>
              <Link href={`/proyectos/${p.id}`} className="-m-2 flex flex-col gap-2 rounded-xl p-2 hover:bg-muted">
                <span className="flex items-center justify-between gap-2">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-ergon-navy">{p.nombre}</span>
                    {p.cliente ? <span className="block truncate text-xs text-muted-foreground">{p.cliente}</span> : null}
                  </span>
                  <Badge variant="en-progreso">Activo</Badge>
                </span>
                <span className="flex items-center gap-3">
                  <Progress value={p.avance} aria-label={`Avance de ${p.nombre}`} />
                  <span className="w-10 shrink-0 text-right text-xs font-bold tabular-nums text-muted-foreground">{p.avance}%</span>
                </span>
                <span className="flex items-center justify-between gap-2">
                  <span className="flex -space-x-1.5">
                    {p.responsables.map((r) => (
                      <span key={r.nombre} title={r.nombre}>
                        <Iniciales nombre={r.nombre} color={r.color} className="size-6 text-[10px] ring-2 ring-card" />
                      </span>
                    ))}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarClock className="size-3.5" aria-hidden />
                    {p.fechaObjetivo ? `Entrega ${fechaCorta(p.fechaObjetivo)}` : "Sin fecha"} · {p.hechas}/{p.total} tareas
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
