"use client";

import { useTransition } from "react";
import { Archive, ArchiveRestore } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConfirmar } from "@/components/ui/confirmar";
import { cambiarActivoServicio } from "@/app/(panel)/catalogo/acciones";

export function BotonArchivar({ id, activo, nombre }: { id: string; activo: boolean; nombre: string }) {
  const [pendiente, startTransition] = useTransition();
  const [confirmar, ventana] = useConfirmar();
  return (
    <>
    {ventana}
    <Button
      type="button"
      variant="ghost"
      disabled={pendiente}
      onClick={async () => {
        const ok = activo
          ? await confirmar(`¿Archivar "${nombre}"?`, { texto: "Deja de aparecer en el catálogo, pero no se borra.", accion: "Archivar" })
          : await confirmar(`¿Reactivar "${nombre}"?`, { accion: "Reactivar" });
        if (ok) startTransition(() => cambiarActivoServicio(id, !activo));
      }}
    >
      {activo ? <Archive /> : <ArchiveRestore />} {activo ? "Archivar servicio" : "Reactivar servicio"}
    </Button>
    </>
  );
}
