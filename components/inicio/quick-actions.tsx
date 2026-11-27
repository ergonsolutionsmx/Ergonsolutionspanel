import Link from "next/link";
import { CalendarPlus, FilePlus2, ListPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FlowButton } from "@/components/ui/flow-button";

/** Accesos rápidos: Tarea, Evento y Propuesta. */
export function QuickActions() {
  return (
    <div className="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto sm:items-center">
      <Button asChild variant="outline" className="h-auto flex-col gap-1 rounded-2xl py-2.5 sm:h-11 sm:flex-row sm:rounded-full sm:py-2">
        <Link href="/proyectos/tareas/nueva?volver=%2Finicio">
          <ListPlus /> Tarea
        </Link>
      </Button>
      <Button asChild variant="outline" className="h-auto flex-col gap-1 rounded-2xl py-2.5 sm:h-11 sm:flex-row sm:rounded-full sm:py-2">
        <Link href="/agenda/eventos/nuevo?volver=%2Finicio">
          <CalendarPlus /> Evento
        </Link>
      </Button>
      <FlowButton asChild text="Propuesta" icon={<FilePlus2 className="size-4 sm:hidden" aria-hidden />} className="h-auto rounded-2xl py-2.5 max-sm:[&_.flow-texto]:flex-col max-sm:[&_.flow-texto]:gap-1 sm:h-11 sm:rounded-full">
        <Link href="/propuestas/nueva" />
      </FlowButton>
    </div>
  );
}
