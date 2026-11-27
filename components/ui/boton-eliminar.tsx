"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

/** Botón que pide confirmación (ventana) antes de ejecutar una acción destructiva. */
export function BotonEliminar({
  accion,
  pregunta,
  texto = "Eliminar",
  detalle = "No se puede deshacer.",
}: {
  accion: () => Promise<void>;
  pregunta: string;
  texto?: string;
  detalle?: string;
}) {
  const [pendiente, startTransition] = useTransition();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive" disabled={pendiente}>
          <Trash2 /> {pendiente ? "Eliminando…" : texto}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{pregunta}</AlertDialogTitle>
          <AlertDialogDescription>{detalle}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={() => startTransition(() => accion())}>
            {texto}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
