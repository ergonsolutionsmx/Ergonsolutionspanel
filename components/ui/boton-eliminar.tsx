"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Botón que pide confirmación antes de ejecutar una acción destructiva. */
export function BotonEliminar({
  accion,
  pregunta,
  texto = "Eliminar",
}: {
  accion: () => Promise<void>;
  pregunta: string;
  texto?: string;
}) {
  const [pendiente, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="ghost"
      className="text-red-700 hover:bg-red-50 hover:text-red-800"
      disabled={pendiente}
      onClick={() => {
        if (window.confirm(pregunta)) startTransition(() => accion());
      }}
    >
      <Trash2 /> {pendiente ? "Eliminando…" : texto}
    </Button>
  );
}
