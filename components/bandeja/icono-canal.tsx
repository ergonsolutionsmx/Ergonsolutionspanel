import { Bell, Globe, Mail, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { NOMBRE_CANAL, type Canal } from "@/lib/inbox/tipos";

const ICONO = { formulario: Globe, correo: Mail, whatsapp: MessageCircle, interno: Bell } as const;
const COLOR = {
  formulario: "bg-ergon-blue/10 text-ergon-blue",
  correo: "bg-error/10 text-error",
  whatsapp: "bg-exito/10 text-exito",
  interno: "bg-ergon-navy/[0.07] text-ergon-navy",
} as const;

export function IconoCanal({ canal, className }: { canal: Canal; className?: string }) {
  const Icono = ICONO[canal];
  return (
    <span
      className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", COLOR[canal], className)}
      title={NOMBRE_CANAL[canal]}
    >
      <Icono className="size-4" aria-hidden />
      <span className="sr-only">{NOMBRE_CANAL[canal]}</span>
    </span>
  );
}
