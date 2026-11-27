"use client";

import { useActionState, useEffect } from "react";
import { toast } from "@/components/avisos/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Campo, ErrorForm } from "@/components/ui/campo";
import { cambiarContrasena } from "@/app/(panel)/ajustes/acciones";

export function FormularioContrasena() {
  const [estado, enviar, enviando] = useActionState(cambiarContrasena, undefined);
  useEffect(() => {
    if (estado?.ok) toast.success(estado.ok);
  }, [estado]);
  return (
    <form action={enviar} className="grid max-w-sm gap-4">
      <Campo id="actual" etiqueta="Contraseña actual">
        <Input id="actual" name="actual" type="password" required autoComplete="current-password" />
      </Campo>
      <Campo id="nueva" etiqueta="Contraseña nueva">
        <Input id="nueva" name="nueva" type="password" required minLength={8} autoComplete="new-password" />
      </Campo>
      <Campo id="confirmar" etiqueta="Repite la nueva">
        <Input id="confirmar" name="confirmar" type="password" required minLength={8} autoComplete="new-password" />
      </Campo>
      <ErrorForm mensaje={estado?.error} />
      <div className="flex items-center gap-3">
        <Button type="submit" loading={enviando}>
          {enviando ? "Cambiando…" : "Cambiar contraseña"}
        </Button>
      </div>
    </form>
  );
}
