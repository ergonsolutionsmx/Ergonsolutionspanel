"use client";

import { useOptimistic, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/avisos/toast";
import { cambiarIva } from "@/app/(panel)/propuestas/acciones";

/** "Agregar IVA (16%)": se elige en cada propuesta. */
export function InterruptorIva({ id, conIva }: { id: string; conIva: boolean }) {
  const [valor, aplicar] = useOptimistic(conIva);
  const [, startTransition] = useTransition();
  return (
    <label className="flex items-center justify-between gap-3 rounded-[1.25rem] border border-white/70 bg-card px-4 py-3 shadow-sm">
      <span>
        <span className="block text-sm font-bold text-ergon-navy">Agregar IVA (16%)</span>
        <span className="block text-xs text-muted-foreground">Se suma a los precios en el PDF y en el link.</span>
      </span>
      <Switch
        checked={valor}
        onCheckedChange={(v) =>
          startTransition(async () => {
            aplicar(v);
            await cambiarIva(id, v);
            toast.success(v ? "IVA agregado" : "IVA quitado");
          })
        }
      />
    </label>
  );
}
