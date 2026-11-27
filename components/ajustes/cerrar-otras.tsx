"use client";

import { useTransition } from "react";
import { MonitorSmartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/avisos/toast";
import { crearClienteNavegador } from "@/lib/supabase/client";

/** Cierra la sesión en los demás dispositivos (esta sigue abierta). */
export function CerrarOtrasSesiones() {
  const [pendiente, startTransition] = useTransition();
  return (
    <Button
      variant="outline"
      loading={pendiente}
      onClick={() =>
        startTransition(async () => {
          const { error } = await crearClienteNavegador().auth.signOut({ scope: "others" });
          if (error) toast.error("No se pudieron cerrar las otras sesiones");
          else toast.success("Listo", "Se cerraron las sesiones en otros dispositivos.");
        })
      }
    >
      {pendiente ? null : <MonitorSmartphone />} Cerrar sesión en otros dispositivos
    </Button>
  );
}
