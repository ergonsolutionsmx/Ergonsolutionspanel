"use client";

import { useTransition } from "react";
import { Archive, ArchiveRestore } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cambiarActivoServicio } from "@/app/(panel)/catalogo/acciones";

export function BotonArchivar({ id, activo, nombre }: { id: string; activo: boolean; nombre: string }) {
  const [pendiente, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="ghost"
      disabled={pendiente}
      onClick={() => {
        const pregunta = activo
          ? `¿Archivar "${nombre}"? Deja de aparecer en el catálogo, pero no se borra.`
          : `¿Reactivar "${nombre}"?`;
        if (window.confirm(pregunta)) startTransition(() => cambiarActivoServicio(id, !activo));
      }}
    >
      {activo ? <Archive /> : <ArchiveRestore />} {activo ? "Archivar servicio" : "Reactivar servicio"}
    </Button>
  );
}
