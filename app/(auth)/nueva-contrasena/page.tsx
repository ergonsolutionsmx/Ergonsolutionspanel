"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { guardarNuevaContrasena } from "../acciones";
import { Aviso, Campo } from "../campo";

export default function NuevaContrasenaPage() {
  const [estado, accion, enviando] = useActionState(guardarNuevaContrasena, undefined);

  return (
    <>
      <h1 className="mb-6 text-xl font-black text-ergon-navy">Nueva contraseña</h1>
      <form action={accion} className="grid gap-4">
        <Campo etiqueta="Contraseña nueva" name="contrasena" type="password" autoComplete="new-password" minLength={8} />
        <Campo etiqueta="Repítela" name="confirmar" type="password" autoComplete="new-password" minLength={8} />
        <Aviso estado={estado} />
        <Button type="submit" disabled={enviando}>
          {enviando ? "Guardando…" : "Guardar"}
        </Button>
      </form>
    </>
  );
}
