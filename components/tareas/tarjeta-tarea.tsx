import Link from "next/link";
import { CalendarDays, FolderKanban } from "lucide-react";
import { cn } from "@/lib/utils";
import { fechaRelativa } from "@/lib/fechas";
import { estaVencida, type Catalogos, type Tarea } from "@/lib/tareas-tipos";
import { Avatar, EtiquetaPrioridad } from "./etiquetas";

export function hrefTarea(id: string, volver: string) {
  return `/proyectos/tareas/${id}?volver=${encodeURIComponent(volver)}`;
}

export function TarjetaTarea({
  tarea,
  catalogos,
  volver,
  mostrarProyecto = true,
  arrastrando = false,
}: {
  tarea: Tarea;
  catalogos: Catalogos;
  volver: string;
  mostrarProyecto?: boolean;
  arrastrando?: boolean;
}) {
  const responsable = catalogos.perfiles.find((p) => p.usuario_id === tarea.responsable_id);
  const proyecto = catalogos.proyectos.find((p) => p.id === tarea.proyecto_id);
  const vencida = estaVencida(tarea, catalogos.hoy);
  const hecha = tarea.estado === "hecha";

  return (
    <div
      className={cn(
        "rounded-md border bg-card p-3 shadow-sm",
        arrastrando && "rotate-1 shadow-lg ring-2 ring-ergon-blue",
        vencida && "border-red-300",
      )}
    >
      <Link
        href={hrefTarea(tarea.id, volver)}
        className={cn("block text-sm font-bold leading-snug hover:underline", hecha && "text-muted-foreground line-through")}
        draggable={false}
      >
        {tarea.titulo}
      </Link>
      {mostrarProyecto && proyecto ? (
        <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
          <FolderKanban className="size-3 shrink-0" aria-hidden /> {proyecto.nombre}
        </p>
      ) : null}
      <div className="mt-2 flex items-center gap-2">
        <EtiquetaPrioridad prioridad={tarea.prioridad} />
        {tarea.fecha_limite ? (
          <span className={cn("flex items-center gap-1 text-xs", vencida ? "font-bold text-red-700" : "text-muted-foreground")}>
            <CalendarDays className="size-3" aria-hidden />
            {fechaRelativa(tarea.fecha_limite, catalogos.hoy)}
          </span>
        ) : null}
        <span className="flex-1" />
        <Avatar perfil={responsable} />
      </div>
    </div>
  );
}
