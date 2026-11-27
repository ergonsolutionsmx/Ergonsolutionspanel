"use client";

import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { CalendarDays, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { fechaRelativa } from "@/lib/fechas";
import { estaVencida, NOMBRE_ESTADO, ordenarParaLista, type Catalogos, type Tarea } from "@/lib/tareas-tipos";
import { cambiarEstadoTarea } from "@/app/(panel)/proyectos/acciones";
import { Avatar, EtiquetaPrioridad } from "./etiquetas";
import { hrefTarea } from "./tarjeta-tarea";

export function ListaTareas({
  tareas,
  catalogos,
  volver,
  mostrarProyecto = true,
}: {
  tareas: Tarea[];
  catalogos: Catalogos;
  volver: string;
  mostrarProyecto?: boolean;
}) {
  // Se ve el cambio al instante; el servidor confirma y manda la lista nueva.
  const [lista, aplicar] = useOptimistic(tareas, (ls, cambio: Pick<Tarea, "id" | "estado">) =>
    ls.map((x) => (x.id === cambio.id ? { ...x, estado: cambio.estado } : x)),
  );
  const [, startTransition] = useTransition();

  function alternar(t: Tarea) {
    const estado = t.estado === "hecha" ? "por_hacer" : "hecha";
    startTransition(async () => {
      aplicar({ id: t.id, estado });
      await cambiarEstadoTarea(t.id, estado);
    });
  }

  const ordenadas = [...lista].sort(ordenarParaLista);

  if (ordenadas.length === 0) {
    return <p className="rounded-lg border border-white/70 bg-card p-8 text-center text-sm text-muted-foreground">Sin tareas</p>;
  }

  return (
    <ul className="divide-y rounded-lg border border-white/70 bg-card">
      {ordenadas.map((t) => {
        const hecha = t.estado === "hecha";
        const vencida = estaVencida(t, catalogos.hoy);
        const proyecto = catalogos.proyectos.find((p) => p.id === t.proyecto_id);
        return (
          <li key={t.id} className="flex items-center gap-3 px-3 py-3">
            <button
              type="button"
              onClick={() => alternar(t)}
              aria-label={hecha ? `Reabrir: ${t.titulo}` : `Terminar: ${t.titulo}`}
              aria-pressed={hecha}
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full border-2",
                hecha ? "border-emerald-600 bg-emerald-600 text-white" : "border-input hover:border-ergon-blue",
              )}
            >
              {hecha ? <Check className="size-4" aria-hidden /> : null}
            </button>
            <div className="min-w-0 flex-1">
              <Link
                href={hrefTarea(t.id, volver)}
                className={cn("block truncate text-sm font-bold hover:underline", hecha && "text-muted-foreground line-through")}
              >
                {t.titulo}
              </Link>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                {!hecha && t.estado !== "por_hacer" ? <span>{NOMBRE_ESTADO[t.estado]}</span> : null}
                {mostrarProyecto && proyecto ? <span className="truncate">{proyecto.nombre}</span> : null}
                {t.fecha_limite ? (
                  <span className={cn("flex items-center gap-1", vencida && "font-bold text-red-700")}>
                    <CalendarDays className="size-3" aria-hidden />
                    {fechaRelativa(t.fecha_limite, catalogos.hoy)}
                  </span>
                ) : null}
              </p>
            </div>
            <EtiquetaPrioridad prioridad={t.prioridad} />
            <Avatar perfil={catalogos.perfiles.find((p) => p.usuario_id === t.responsable_id)} />
          </li>
        );
      })}
    </ul>
  );
}
