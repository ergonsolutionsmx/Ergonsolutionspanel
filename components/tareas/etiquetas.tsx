import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  NOMBRE_ESTADO_PROYECTO,
  NOMBRE_PRIORIDAD,
  type EstadoProyecto,
  type PerfilCorto,
  type Prioridad,
} from "@/lib/tareas-tipos";

const COLOR_PRIORIDAD = { alta: "rojo", media: "ambar", baja: "gris" } as const;
export function EtiquetaPrioridad({ prioridad }: { prioridad: Prioridad }) {
  return <Badge variant={COLOR_PRIORIDAD[prioridad]}>{NOMBRE_PRIORIDAD[prioridad]}</Badge>;
}

const COLOR_PROYECTO = { activo: "verde", pausado: "ambar", terminado: "gris" } as const;
export function EtiquetaEstadoProyecto({ estado }: { estado: EstadoProyecto }) {
  return <Badge variant={COLOR_PROYECTO[estado]}>{NOMBRE_ESTADO_PROYECTO[estado]}</Badge>;
}

/** Círculo con iniciales del responsable. */
export function Avatar({ perfil, className }: { perfil?: PerfilCorto; className?: string }) {
  if (!perfil) {
    return (
      <span
        className={cn("flex size-6 shrink-0 items-center justify-center rounded-full border border-dashed text-[10px] text-muted-foreground", className)}
        title="Sin responsable"
      >
        —
      </span>
    );
  }
  const iniciales = perfil.nombre
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span
      className={cn("flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black text-white", className)}
      style={{ backgroundColor: perfil.color }}
      title={perfil.nombre}
    >
      {iniciales}
    </span>
  );
}

export function BarraAvance({ valor }: { valor: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary" role="progressbar" aria-valuenow={valor} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-ergon-blue" style={{ width: `${valor}%` }} />
    </div>
  );
}
