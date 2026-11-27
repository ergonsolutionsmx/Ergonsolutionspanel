"use client";

import { useOptimistic, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CalendarDays, Check, ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";
import { fechaRelativa } from "@/lib/fechas";
import { ESTADOS_TAREA, estaVencida, NOMBRE_ESTADO, ordenarParaLista, type Catalogos, type Tarea } from "@/lib/tareas-tipos";
import { cambiarEstadoTarea } from "@/app/(panel)/proyectos/acciones";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar, EtiquetaPrioridad } from "./etiquetas";
import { DetalleTarea } from "./detalle-tarea";

/** Vista lista: agrupada por estado, con palomita para terminar (tachado animado). */
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
  const [detalle, setDetalle] = useState<string | null>(null);

  function alternar(t: Tarea) {
    const estado = t.estado === "hecha" ? "por_hacer" : "hecha";
    startTransition(async () => {
      aplicar({ id: t.id, estado });
      await cambiarEstadoTarea(t.id, estado);
    });
  }

  if (lista.length === 0) {
    return <EmptyState icono={ListTodo} titulo="No hay tareas" texto="Crea una con el botón “Tarea”." />;
  }

  const grupos = ESTADOS_TAREA.map((e) => ({ estado: e, tareas: lista.filter((t) => t.estado === e).sort(ordenarParaLista) })).filter((g) => g.tareas.length);

  return (
    <div className="space-y-5">
      {grupos.map((g) => (
        <section key={g.estado} aria-label={NOMBRE_ESTADO[g.estado]}>
          <h2 className="mb-2 flex items-center gap-2 text-sm font-black text-ergon-navy">
            {NOMBRE_ESTADO[g.estado]}
            <span className="rounded-full bg-card px-2 py-0.5 text-xs font-bold text-muted-foreground shadow-sm">{g.tareas.length}</span>
          </h2>
          <ul className="space-y-1.5">
            <AnimatePresence initial={false}>
              {g.tareas.map((t) => {
                const hecha = t.estado === "hecha";
                const vencida = estaVencida(t, catalogos.hoy);
                const proyecto = catalogos.proyectos.find((p) => p.id === t.proyecto_id);
                return (
                  <motion.li
                    key={t.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    className="flex items-center gap-3 rounded-2xl border border-white/70 bg-card px-3 py-2.5 shadow-sm"
                  >
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.85 }}
                      onClick={() => alternar(t)}
                      aria-label={hecha ? `Reabrir: ${t.titulo}` : `Terminar: ${t.titulo}`}
                      aria-pressed={hecha}
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                        hecha ? "border-exito bg-exito text-white" : "border-input hover:border-ergon-blue",
                      )}
                    >
                      <AnimatePresence>
                        {hecha ? (
                          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 600, damping: 20 }}>
                            <Check className="size-4" aria-hidden />
                          </motion.span>
                        ) : null}
                      </AnimatePresence>
                    </motion.button>
                    <button type="button" onClick={() => setDetalle(t.id)} className="min-w-0 flex-1 text-left">
                      <span className={cn("tachado inline-block max-w-full truncate align-top text-sm font-bold text-ergon-navy", hecha && "tachado-activo text-muted-foreground")}>{t.titulo}</span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                        {mostrarProyecto && proyecto ? <span className="truncate">{proyecto.nombre}</span> : null}
                        {t.fecha_limite ? (
                          <span className={cn("flex items-center gap-1", vencida && "font-bold text-error")}>
                            <CalendarDays className="size-3.5" aria-hidden />
                            {fechaRelativa(t.fecha_limite, catalogos.hoy)}
                          </span>
                        ) : null}
                      </span>
                    </button>
                    <EtiquetaPrioridad prioridad={t.prioridad} />
                    <Avatar perfil={catalogos.perfiles.find((p) => p.usuario_id === t.responsable_id)} />
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        </section>
      ))}
      <DetalleTarea tareaId={detalle} catalogos={catalogos} volver={volver} onCerrar={() => setDetalle(null)} />
    </div>
  );
}
