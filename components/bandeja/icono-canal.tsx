import { Bell, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { NOMBRE_CANAL, type Canal } from "@/lib/inbox/tipos";
import { LogoGmail, LogoWhatsApp } from "@/components/logos/marcas";

const COLOR = {
  formulario: "bg-ergon-blue/10 text-ergon-blue",
  correo: "bg-white ring-1 ring-ergon-navy/10",
  whatsapp: "bg-white ring-1 ring-ergon-navy/10",
  interno: "bg-ergon-navy/[0.07] text-ergon-navy",
} as const;

/** Icono del canal: logo oficial (Gmail, WhatsApp) o icono (formulario del sitio, aviso interno). */
export function IconoCanal({ canal, className }: { canal: Canal; className?: string }) {
  return (
    <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", COLOR[canal], className)} title={NOMBRE_CANAL[canal]}>
      {canal === "correo" ? (
        <LogoGmail aria-hidden titulo="" />
      ) : canal === "whatsapp" ? (
        <LogoWhatsApp aria-hidden titulo="" />
      ) : canal === "formulario" ? (
        <Globe className="size-4" aria-hidden />
      ) : (
        <Bell className="size-4" aria-hidden />
      )}
      <span className="sr-only">{NOMBRE_CANAL[canal]}</span>
    </span>
  );
}
