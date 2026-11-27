import { Bell, Globe, Mail, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { NOMBRE_CANAL, type Canal } from "@/lib/inbox/tipos";

const ICONO = { formulario: Globe, correo: Mail, whatsapp: MessageCircle, interno: Bell } as const;
const COLOR = {
  formulario: "bg-blue-100 text-blue-700",
  correo: "bg-violet-100 text-violet-700",
  whatsapp: "bg-emerald-100 text-emerald-700",
  interno: "bg-slate-200 text-slate-700",
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
