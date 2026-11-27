import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NOMBRE_DIFICULTAD, NOMBRE_ESTADO_SERVICIO, type Dificultad, type EstadoServicio } from "@/lib/catalogo-tipos";

const COLOR_ESTADO = { listo: "verde", pendiente: "ambar", proximamente: "gris" } as const;
export function EtiquetaEstadoServicio({ estado }: { estado: EstadoServicio }) {
  return <Badge variant={COLOR_ESTADO[estado]}>{NOMBRE_ESTADO_SERVICIO[estado]}</Badge>;
}

export function EtiquetaDificultad({ dificultad }: { dificultad: Dificultad | null }) {
  return (
    <Badge variant="default" title="Dificultad">
      Dificultad {dificultad ? NOMBRE_DIFICULTAD[dificultad].toLowerCase() : "por confirmar"}
    </Badge>
  );
}

export function EtiquetaIA() {
  return (
    <Badge variant="azul">
      <Sparkles className="size-3" aria-hidden /> IA
    </Badge>
  );
}
