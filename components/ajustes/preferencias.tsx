"use client";

import { useOptimistic, useTransition } from "react";
import { CalendarDays, FileText, Inbox, ListTodo, Wallet, type LucideIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/avisos/toast";
import { guardarPreferencia } from "@/app/(panel)/ajustes/acciones";

const OPCIONES: { clave: string; titulo: string; texto: string; icono: LucideIcon }[] = [
  { clave: "mensaje", titulo: "Mensajes nuevos", texto: "Cuando llega algo a la bandeja o te asignan un mensaje.", icono: Inbox },
  { clave: "tarea", titulo: "Tareas por vencer", texto: "Tareas asignadas y las que vencen hoy.", icono: ListTodo },
  { clave: "evento", titulo: "Eventos próximos", texto: "Reuniones y eventos de la agenda.", icono: CalendarDays },
  { clave: "propuesta", titulo: "Propuestas", texto: "Cuando una propuesta se ve, se acepta o está por vencer.", icono: FileText },
  { clave: "finanzas", titulo: "Finanzas", texto: "Cuando un cobro o un pago se vence.", icono: Wallet },
];

/** Interruptores de notificaciones: se guardan al momento. */
export function Preferencias({ preferencias }: { preferencias: Record<string, boolean> }) {
  const [valores, aplicar] = useOptimistic(preferencias, (p, c: { clave: string; activa: boolean }) => ({ ...p, [c.clave]: c.activa }));
  const [, startTransition] = useTransition();
  return (
    <ul className="divide-y">
      {OPCIONES.map((o) => {
        const activa = valores[o.clave] !== false;
        return (
          <li key={o.clave} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent text-ergon-blue">
              <o.icono className="size-4" aria-hidden />
            </span>
            <label htmlFor={`pref-${o.clave}`} className="min-w-0 flex-1 cursor-pointer">
              <span className="block text-sm font-bold text-ergon-navy">{o.titulo}</span>
              <span className="block text-xs text-muted-foreground">{o.texto}</span>
            </label>
            <Switch
              id={`pref-${o.clave}`}
              checked={activa}
              onCheckedChange={(v) =>
                startTransition(async () => {
                  aplicar({ clave: o.clave, activa: v });
                  const r = await guardarPreferencia(o.clave, v);
                  if (r.ok) toast.success("Guardado", `${o.titulo}: ${v ? "activadas" : "desactivadas"}.`);
                  else toast.error("No se pudo guardar");
                })
              }
            />
          </li>
        );
      })}
    </ul>
  );
}
