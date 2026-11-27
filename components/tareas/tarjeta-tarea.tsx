"use client";

import { motion } from "motion/react";
import { ArrowRightLeft, CalendarDays, FolderKanban, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { fechaRelativa } from "@/lib/fechas";
import { ESTADOS_TAREA, NOMBRE_ESTADO, NOMBRE_TIPO_PROYECTO, estaVencida, type Catalogos, type EstadoTarea, type Tarea } from "@/lib/tareas-tipos";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, EtiquetaPrioridad } from "./etiquetas";

export function hrefTarea(id: string, volver: string) {
  return `/proyectos/tareas/${id}?volver=${encodeURIComponent(volver)}`;
}

/** Tarjeta de tarea (kanban): etiquetas, título, responsable y fecha límite. Tocarla abre el detalle. */
export function TaskCard({
  tarea,
  catalogos,
  mostrarProyecto = true,
  arrastrando = false,
  onAbrir,
  onMover,
}: {
  tarea: Tarea;
  catalogos: Catalogos;
  volver?: string;
  mostrarProyecto?: boolean;
  arrastrando?: boolean;
  onAbrir?: (id: string) => void;
  onMover?: (id: string, estado: EstadoTarea) => void;
}) {
  const responsable = catalogos.perfiles.find((p) => p.usuario_id === tarea.responsable_id);
  const proyecto = catalogos.proyectos.find((p) => p.id === tarea.proyecto_id);
  const vencida = estaVencida(tarea, catalogos.hoy);
  const hecha = tarea.estado === "hecha";

  return (
    <motion.div
      initial={arrastrando ? false : { opacity: 0, y: 6, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "group/tarjeta relative rounded-2xl border border-white/70 bg-card p-3 shadow-sm transition-[box-shadow,transform] duration-200 md:hover:-translate-y-0.5 md:hover:shadow-md",
        arrastrando && "rotate-2 scale-[1.02] shadow-lg ring-2 ring-ergon-blue",
        vencida && "border-error/40",
      )}
    >
      <div className="mb-2 flex flex-wrap items-center gap-1.5 pr-7">
        <EtiquetaPrioridad prioridad={tarea.prioridad} />
        {proyecto?.tipo ? <Badge variant="enviada">{NOMBRE_TIPO_PROYECTO[proyecto.tipo]}</Badge> : null}
        {vencida ? <Badge variant="vencida">Vencida</Badge> : null}
      </div>
      <button
        type="button"
        onClick={() => onAbrir?.(tarea.id)}
        draggable={false}
        className={cn(
          "block w-full text-left text-sm font-bold leading-snug text-ergon-navy outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-2 focus-visible:after:ring-ring",
          hecha && "text-muted-foreground",
        )}
      >
        <span className={cn("tachado", hecha && "tachado-activo")}>{tarea.titulo}</span>
      </button>
      {mostrarProyecto && proyecto ? (
        <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
          <FolderKanban className="size-3.5 shrink-0" aria-hidden /> {proyecto.nombre}
        </p>
      ) : null}
      <div className="mt-2.5 flex items-center gap-2">
        {tarea.fecha_limite ? (
          <span className={cn("flex items-center gap-1 text-xs", vencida ? "font-bold text-error" : "text-muted-foreground")}>
            <CalendarDays className="size-3.5" aria-hidden />
            {fechaRelativa(tarea.fecha_limite, catalogos.hoy)}
          </span>
        ) : null}
        <span className="flex-1" />
        <Avatar perfil={responsable} />
      </div>

      {onMover ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={`Mover "${tarea.titulo}" a…`}
            onPointerDown={(e) => e.stopPropagation()}
            className="absolute right-2 top-2 z-[2] grid size-7 place-items-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-ergon-navy focus-visible:ring-2 focus-visible:ring-ring md:opacity-0 md:group-hover/tarjeta:opacity-100 md:focus-visible:opacity-100 data-[state=open]:opacity-100"
          >
            <MoreHorizontal className="size-4" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl">
            <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground">
              <ArrowRightLeft className="size-3.5" aria-hidden /> Mover a…
            </DropdownMenuLabel>
            {ESTADOS_TAREA.filter((e) => e !== tarea.estado).map((e) => (
              <DropdownMenuItem key={e} onSelect={() => onMover(tarea.id, e)}>
                {NOMBRE_ESTADO[e]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </motion.div>
  );
}

/** Compatibilidad: nombre anterior. */
export const TarjetaTarea = TaskCard;
