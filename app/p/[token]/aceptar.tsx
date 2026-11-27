"use client";

import { useState, useTransition } from "react";
import { motion } from "motion/react";
import { CheckCircle2, ThumbsUp } from "lucide-react";
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
import { aceptarDesdeLink } from "./acciones";

export function BotonAceptar({ token, folio }: { token: string; folio: string }) {
  const [pendiente, startTransition] = useTransition();
  const [resultado, setResultado] = useState<"ok" | "error" | null>(null);

  if (resultado === "ok") {
    return (
      <motion.p
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        role="status"
        className="flex items-center gap-2 rounded-full bg-exito/10 px-4 py-2.5 text-sm font-bold text-exito"
      >
        <CheckCircle2 className="size-5" aria-hidden /> ¡Gracias! Recibimos tu aceptación.
      </motion.p>
    );
  }
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="lg" loading={pendiente} className="bg-exito from-exito to-exito shadow-none hover:from-emerald-700 hover:to-emerald-700">
          {pendiente ? null : <ThumbsUp />} Aceptar propuesta
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Aceptar la propuesta {folio}?</AlertDialogTitle>
          <AlertDialogDescription>Le avisaremos a Ergon Solutions para coordinar los siguientes pasos contigo.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Todavía no</AlertDialogCancel>
          <AlertDialogAction
            onClick={() =>
              startTransition(async () => {
                const r = await aceptarDesdeLink(token);
                setResultado(r.ok ? "ok" : "error");
              })
            }
          >
            Sí, acepto
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
      {resultado === "error" ? <p className="mt-2 text-sm text-error">No se pudo registrar. Intenta de nuevo o escríbenos.</p> : null}
    </AlertDialog>
  );
}
