"use client";

import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Canal } from "@/lib/inbox/tipos";
import { enviarMensajePrueba } from "@/app/(panel)/bandeja/acciones";

export function BotonPrueba({ canal }: { canal: Canal }) {
  const [pendiente, startTransition] = useTransition();
  const [listo, setListo] = useState(false);
  return (
    <div className="flex items-center gap-2">
      {listo ? (
        <span role="status" className="text-xs text-emerald-700">
          Creado en la bandeja
        </span>
      ) : null}
      <Button
        variant="outline"
        size="sm"
        disabled={pendiente}
        onClick={() =>
          startTransition(async () => {
            await enviarMensajePrueba(canal);
            setListo(true);
          })
        }
      >
        <Send /> Enviar mensaje de prueba
      </Button>
    </div>
  );
}
