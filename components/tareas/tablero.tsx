"use client";

import { useMemo, useState, useTransition } from "react";
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
import { TarjetaTarea } from "./tarjeta-tarea";

type Columnas = Record<EstadoTarea, Tarea[]>;

const PUNTO_ESTADO: Record<EstadoTarea, string> = {
  por_hacer: "bg-slate-400",
  en_curso: "bg-ergon-blue",
  en_revision: "bg-amber-500",
  hecha: "bg-emerald-500",
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
}: {
  tareas: Tarea[];
  catalogos: Catalogos;
  volver: string;
  mostrarProyecto?: boolean;
}) {
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
    startTransition(() => moverTarea(id, estado, orden));
  }

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
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0">
        {ESTADOS_TAREA.map((estado) => (
          <Columna key={estado} estado={estado} tareas={columnas[estado]}>
            {columnas[estado].map((t) => (
              <TarjetaArrastrable key={t.id} tarea={t} catalogos={catalogos} volver={volver} mostrarProyecto={mostrarProyecto} />
            ))}
          </Columna>
        ))}
      </div>
      <DragOverlay>
        {activa ? (
          <TarjetaTarea tarea={activa} catalogos={catalogos} volver={volver} mostrarProyecto={mostrarProyecto} arrastrando />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function Columna({ estado, tareas, children }: { estado: EstadoTarea; tareas: Tarea[]; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: estado });
  return (
    <section
      aria-label={NOMBRE_ESTADO[estado]}
      className="flex w-[82vw] max-w-xs shrink-0 snap-start flex-col rounded-2xl bg-[#E9EEF5] md:w-auto md:max-w-none"
    >
      <h2 className="flex items-center justify-between px-3 pb-2 pt-3 text-sm font-black text-ergon-navy">
        <span className="flex items-center gap-2">
          <span className={cn("size-2.5 rounded-full", PUNTO_ESTADO[estado])} aria-hidden />
          {NOMBRE_ESTADO[estado]}
        </span>
        <span className="rounded-full bg-card px-2 py-0.5 text-xs font-bold text-muted-foreground">{tareas.length}</span>
      </h2>
      <SortableContext id={estado} items={tareas.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={cn("flex min-h-32 flex-1 flex-col gap-2 rounded-b-2xl p-2", isOver && "bg-accent")}
        >
          {children}
          {tareas.length === 0 ? (
            <p className="m-auto py-6 text-center text-xs text-muted-foreground">Suelta aquí</p>
          ) : null}
        </div>
      </SortableContext>
    </section>
  );
}

function TarjetaArrastrable(props: { tarea: Tarea; catalogos: Catalogos; volver: string; mostrarProyecto: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.tarea.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("touch-manipulation", isDragging && "opacity-40")}
      {...attributes}
      {...listeners}
      aria-roledescription="tarea arrastrable"
    >
      <TarjetaTarea {...props} />
    </div>
  );
}
