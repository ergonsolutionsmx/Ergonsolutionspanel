import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Estado vacío: icono, título, texto y acción opcional (estilo .gw-empty). */
export function EmptyState({
  icono: Icono,
  titulo,
  texto,
  accion,
  className,
  compacto = false,
}: {
  icono?: LucideIcon;
  titulo: string;
  texto?: string;
  accion?: React.ReactNode;
  className?: string;
  compacto?: boolean;
}) {
  return (
    <div className={cn("flex flex-col items-center text-center", compacto ? "px-4 py-8" : "px-4 py-14", className)}>
      {Icono ? (
        <span className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-secondary text-ergon-blue shadow-[inset_0_1px_0_white]">
          <Icono className="size-6" strokeWidth={1.7} aria-hidden />
        </span>
      ) : null}
      <h3 className="text-base font-bold text-ergon-navy">{titulo}</h3>
      {texto ? <p className="mt-1 max-w-sm text-sm text-muted-foreground">{texto}</p> : null}
      {accion ? <div className="mt-4">{accion}</div> : null}
    </div>
  );
}
