import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/** Etiquetas de estado: siempre con texto (el color solo acompaña). */
const badgeVariants = cva("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold whitespace-nowrap", {
  variants: {
    variant: {
      default: "bg-secondary text-secondary-foreground",
      // Estados
      nuevo: "bg-info/10 text-info",
      pendiente: "bg-pendiente/15 text-sky-800",
      "en-progreso": "bg-info/10 text-info",
      enviada: "bg-ergon-navy/[0.07] text-ergon-navy",
      aceptada: "bg-exito/10 text-exito",
      vencida: "bg-error/10 text-error",
      // Prioridades
      alta: "bg-error/10 text-error",
      media: "bg-aviso/10 text-amber-800",
      baja: "bg-secondary text-muted-foreground",
      // Colores genéricos (compatibilidad)
      azul: "bg-info/10 text-blue-800",
      rojo: "bg-error/10 text-red-800",
      ambar: "bg-aviso/10 text-amber-900",
      verde: "bg-exito/10 text-emerald-800",
      gris: "bg-secondary text-slate-700",
    },
  },
  defaultVariants: { variant: "default" },
});

function Badge({ className, variant, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
