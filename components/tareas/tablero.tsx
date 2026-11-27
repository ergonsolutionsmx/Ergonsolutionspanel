"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { ESTADOS_TAREA, NOMBRE_ESTADO, type Catalogos, type EstadoTarea, type Tarea } from "@/lib/tareas-tipos";
import { moverTarea } from "@/app/(panel)/proyectos/acciones";
import { TaskCard } from "./tarjeta-tarea";
import { DetalleTarea } from "./detalle-tarea";
import { toast } from "@/components/avisos/toast";

type Columnas = Record<EstadoTarea, Tarea[]>;

const PUNTO_ESTADO: Record<EstadoTarea, string> = {
  por_hacer: "bg-muted-foreground",
  en_curso: "bg-ergon-blue",
  en_revision: "bg-aviso",
  hecha: "bg-exito",
};

function agrupar(tareas: Tarea[]): Columnas {
  const cols: Columnas = { por_hacer: [], en_curso: [], en_revision: [], hecha: [] };
  for (const t of [...tareas].sort((a, b) => a.orden - b.orden)) cols[t.estado].push(t);
  return cols;
}

function columnaDe(cols: Columnas, id: string): EstadoTarea | undefined {
  if ((ESTADOS_TAREA as readonly string[]).includes(id)) return id as EstadoTarea;
  return ESTADOS_TAREA.find((e) => cols[e].some((t) => t.id === id));
}

/** Calcula un "orden" entre los vecinos para no tener que renumerar todo. */
function ordenEntre(lista: Tarea[], indice: number) {
  const antes = lista[indice - 1]?.orden;
  const despues = lista[indice + 1]?.orden;
  if (antes === undefined && despues === undefined) return Date.now() / 1000;
  if (antes === undefined) return despues! - 1;
  if (despues === undefined) return antes + 1;
  return (antes + despues) / 2;
}

export function Tablero({
  tareas,
  catalogos,
  volver,
  mostrarProyecto = true,
  proyectoId,
}: {
  tareas: Tarea[];
  catalogos: Catalogos;
  volver: string;
  mostrarProyecto?: boolean;
  proyectoId?: string;
}) {
  const [detalle, setDetalle] = useState<string | null>(null);
  const [columnas, setColumnas] = useState<Columnas>(() => agrupar(tareas));
  const [activa, setActiva] = useState<Tarea | null>(null);
  const [origen, setOrigen] = useState<{ estado: EstadoTarea; indice: number } | null>(null);
  const [, startTransition] = useTransition();

  // Cuando el servidor manda datos nuevos (después de guardar), sincronizar.
  const [tareasPrevias, setTareasPrevias] = useState(tareas);
  if (tareas !== tareasPrevias && !activa) {
    setTareasPrevias(tareas);
    setColumnas(agrupar(tareas));
  }

  const sensores = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // En celular: mantener presionado para arrastrar (así se puede hacer scroll normal).
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function alIniciar({ active }: DragStartEvent) {
    const estado = columnaDe(columnas, String(active.id));
    if (!estado) return;
    const indice = columnas[estado].findIndex((t) => t.id === active.id);
    setActiva(columnas[estado][indice] ?? null);
    setOrigen({ estado, indice });
  }

  function alPasarEncima({ active, over }: DragOverEvent) {
    if (!over) return;
    const desde = columnaDe(columnas, String(active.id));
    const hacia = columnaDe(columnas, String(over.id));
    if (!desde || !hacia || desde === hacia) return;

    setColumnas((cols) => {
      const tarea = cols[desde].find((t) => t.id === active.id);
      if (!tarea) return cols;
      const destino = cols[hacia];
      const idxSobre = destino.findIndex((t) => t.id === over.id);
      const idx = idxSobre >= 0 ? idxSobre : destino.length;
      return {
        ...cols,
        [desde]: cols[desde].filter((t) => t.id !== active.id),
        [hacia]: [...destino.slice(0, idx), { ...tarea, estado: hacia }, ...destino.slice(idx)],
      };
    });
  }

  function alSoltar({ active, over }: DragEndEvent) {
    setActiva(null);
    const id = String(active.id);
    const estado = columnaDe(columnas, id);
    if (!over || !estado || !origen) return setOrigen(null);

    let lista = columnas[estado];
    const desdeIdx = lista.findIndex((t) => t.id === id);
    const sobreIdx = lista.findIndex((t) => t.id === over.id);
    if (sobreIdx >= 0 && sobreIdx !== desdeIdx) lista = arrayMove(lista, desdeIdx, sobreIdx);

    const indiceFinal = lista.findIndex((t) => t.id === id);
    const sinCambio = estado === origen.estado && indiceFinal === origen.indice;
    setOrigen(null);
    if (sinCambio) return;

    const orden = ordenEntre(lista, indiceFinal);
    lista = lista.map((t) => (t.id === id ? { ...t, estado, orden } : t));
    setColumnas((cols) => ({ ...cols, [estado]: lista }));
    guardar(id, estado, orden);
  }

  /** Guarda en Supabase; si falla, la tarjeta regresa y se avisa. */
  function guardar(id: string, estado: EstadoTarea, orden: number) {
    startTransition(async () => {
      const r = await moverTarea(id, estado, orden);
      if (!r.ok) {
        setColumnas(agrupar(tareas));
        toast.error("No se pudo mover la tarea", "Revisa tu conexión e inténtalo de nuevo.");
      }
    });
  }

  /** "Mover a…" (menú): la manda al final de la columna elegida. */
  function moverA(id: string, estado: EstadoTarea) {
    const desde = columnaDe(columnas, id);
    if (!desde || desde === estado) return;
    const tarea = columnas[desde].find((t) => t.id === id);
    if (!tarea) return;
    const destino = columnas[estado];
    const orden = (destino[destino.length - 1]?.orden ?? Date.now() / 1000) + 1;
    setColumnas((cols) => ({
      ...cols,
      [desde]: cols[desde].filter((t) => t.id !== id),
      [estado]: [...cols[estado], { ...tarea, estado, orden }],
    }));
    guardar(id, estado, orden);
    toast.success(`Movida a ${NOMBRE_ESTADO[estado]}`);
  }

  const nuevaEn = (estado: EstadoTarea) =>
    `/proyectos/tareas/nueva?estado=${estado}${proyectoId ? `&proyecto=${proyectoId}` : ""}&volver=${encodeURIComponent(volver)}`;

  function alCancelar() {
    setActiva(null);
    setOrigen(null);
    setColumnas(agrupar(tareas));
  }

  const anuncios = useMemo(
    () => ({
      onDragStart: () => "Tarea tomada. Usa las flechas para moverla.",
      onDragOver: ({ over }: { over: { id: string | number } | null }) =>
        over ? `Sobre ${NOMBRE_ESTADO[columnaDe(columnas, String(over.id)) ?? "por_hacer"]}` : "",
      onDragEnd: () => "Tarea soltada.",
      onDragCancel: () => "Movimiento cancelado.",
    }),
    [columnas],
  );

  return (
    <DndContext
      sensors={sensores}
      collisionDetection={closestCorners}
      onDragStart={alIniciar}
      onDragOver={alPasarEncima}
      onDragEnd={alSoltar}
      onDragCancel={alCancelar}
      accessibility={{ announcements: anuncios }}
    >
      <div className="-mx-4 flex snap-x snap-mandatory items-start gap-3 overflow-x-auto px-4 pb-4 md:mx-0 md:grid md:grid-cols-4 md:items-stretch md:overflow-visible md:px-0">
        {ESTADOS_TAREA.map((estado) => (
          <Columna key={estado} estado={estado} tareas={columnas[estado]} hrefNueva={nuevaEn(estado)}>
            {columnas[estado].map((t) => (
              <TarjetaArrastrable
                key={t.id}
                tarea={t}
                catalogos={catalogos}
                volver={volver}
                mostrarProyecto={mostrarProyecto}
                onAbrir={setDetalle}
                onMover={moverA}
              />
            ))}
          </Columna>
        ))}
      </div>
      <DragOverlay>
        {activa ? (
          <TaskCard tarea={activa} catalogos={catalogos} mostrarProyecto={mostrarProyecto} arrastrando />
        ) : null}
      </DragOverlay>
      <DetalleTarea tareaId={detalle} catalogos={catalogos} volver={volver} onCerrar={() => setDetalle(null)} />
    </DndContext>
  );
}

function Columna({ estado, tareas, hrefNueva, children }: { estado: EstadoTarea; tareas: Tarea[]; hrefNueva: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: estado });
  return (
    <section
      aria-label={NOMBRE_ESTADO[estado]}
      className="flex w-[84vw] max-w-xs shrink-0 snap-center flex-col rounded-[1.5rem] border border-white/60 bg-ergon-navy/[0.045] md:w-auto md:max-w-none"
    >
      <h2 className="flex items-center justify-between px-3.5 pb-2 pt-3.5 text-sm font-black text-ergon-navy">
        <span className="flex items-center gap-2">
          <span className={cn("size-2.5 rounded-full", PUNTO_ESTADO[estado])} aria-hidden />
          {NOMBRE_ESTADO[estado]}
        </span>
        <span className="flex items-center gap-1">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={tareas.length}
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 8, opacity: 0 }}
              className="min-w-6 rounded-full bg-card px-2 py-0.5 text-center text-xs font-bold tabular-nums text-muted-foreground shadow-sm"
            >
              {tareas.length}
            </motion.span>
          </AnimatePresence>
          <Link href={hrefNueva} aria-label={`Nueva tarea en ${NOMBRE_ESTADO[estado]}`} className="grid size-7 place-items-center rounded-full text-muted-foreground hover:bg-card hover:text-ergon-blue">
            <Plus className="size-4" aria-hidden />
          </Link>
        </span>
      </h2>
      <SortableContext id={estado} items={tareas.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={cn(
            "flex min-h-36 flex-1 flex-col gap-2 rounded-b-[1.5rem] p-2 transition-colors",
            isOver && "bg-ergon-blue/[0.07] outline-2 -outline-offset-4 outline-dashed outline-ergon-blue/40",
          )}
        >
          {children}
          {tareas.length === 0 ? (
            <Link href={hrefNueva} className="m-auto flex items-center gap-1 rounded-full px-3 py-6 text-center text-xs font-bold text-muted-foreground hover:text-ergon-blue">
              <Plus className="size-3.5" aria-hidden /> Agregar o suelta aquí
            </Link>
          ) : null}
        </div>
      </SortableContext>
    </section>
  );
}

function TarjetaArrastrable(props: {
  tarea: Tarea;
  catalogos: Catalogos;
  volver: string;
  mostrarProyecto: boolean;
  onAbrir: (id: string) => void;
  onMover: (id: string, estado: EstadoTarea) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.tarea.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("touch-manipulation rounded-2xl", isDragging && "opacity-30")}
      {...attributes}
      {...listeners}
      aria-roledescription="tarea arrastrable"
    >
      <TaskCard {...props} />
    </div>
  );
}
