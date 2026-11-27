import { Badge } from "@/components/ui/badge";
import { NOMBRE_ESTADO_PROPUESTA, type EstadoPropuesta } from "@/lib/propuestas-tipos";

const COLOR = {
  borrador: "gris",
  enviada: "azul",
  vista: "ambar",
  aceptada: "verde",
  rechazada: "rojo",
  vencida: "default",
} as const;

export function EtiquetaEstadoPropuesta({ estado }: { estado: EstadoPropuesta }) {
  return <Badge variant={COLOR[estado]}>{NOMBRE_ESTADO_PROPUESTA[estado]}</Badge>;
}
