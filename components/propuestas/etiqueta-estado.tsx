import { Badge } from "@/components/ui/badge";
import { NOMBRE_ESTADO_PROPUESTA, type EstadoPropuesta } from "@/lib/propuestas-tipos";

const COLOR = {
  borrador: "baja",
  enviada: "enviada",
  vista: "pendiente",
  aceptada: "aceptada",
  rechazada: "rojo",
  vencida: "vencida",
} as const;

export function EtiquetaEstadoPropuesta({ estado }: { estado: EstadoPropuesta }) {
  return <Badge variant={COLOR[estado]}>{NOMBRE_ESTADO_PROPUESTA[estado]}</Badge>;
}
