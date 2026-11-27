"use client";

import { useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * Confirmación con ventana (en lugar de window.confirm).
 * const [confirmar, ventana] = useConfirmar(); … if (await confirmar("¿Borrar?")) …; y renderizar {ventana}.
 */
export function useConfirmar() {
  const [pregunta, setPregunta] = useState<{ titulo: string; texto?: string; accion?: string } | null>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);

  const confirmar = (titulo: string, opciones?: { texto?: string; accion?: string }) =>
    new Promise<boolean>((resolve) => {
      resolver.current = resolve;
      setPregunta({ titulo, ...opciones });
    });

  const cerrar = (v: boolean) => {
    resolver.current?.(v);
    resolver.current = null;
    setPregunta(null);
  };

  const ventana = (
    <AlertDialog open={!!pregunta} onOpenChange={(abierta) => !abierta && cerrar(false)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{pregunta?.titulo}</AlertDialogTitle>
          <AlertDialogDescription>{pregunta?.texto ?? "Confirma para continuar."}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => cerrar(false)}>Cancelar</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={() => cerrar(true)}>
            {pregunta?.accion ?? "Sí, continuar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return [confirmar, ventana] as const;
}
