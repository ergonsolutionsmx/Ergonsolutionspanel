"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Campo, ErrorForm } from "@/components/ui/campo";
import { cambiarContrasena } from "@/app/(panel)/ajustes/acciones";

export function FormularioContrasena() {
  const [estado, enviar, enviando] = useActionState(cambiarContrasena, undefined);
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
        <Button type="submit" variant="outline" disabled={enviando}>
          {enviando ? "Cambiando…" : "Cambiar contraseña"}
        </Button>
        {estado?.ok ? <span role="status" className="text-sm text-emerald-700">{estado.ok}</span> : null}
      </div>
    </form>
  );
}
