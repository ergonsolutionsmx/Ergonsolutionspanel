"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { guardarNuevaContrasena } from "../acciones";
import { Lock } from "lucide-react";
import { Aviso, Campo, EncabezadoAcceso } from "../campo";

export default function NuevaContrasenaPage() {
  const [estado, accion, enviando] = useActionState(guardarNuevaContrasena, undefined);

  return (
    <>
      <EncabezadoAcceso titulo="Nueva contraseña" texto="Mínimo 8 caracteres" />
      <form action={accion} className="grid gap-4">
        <Campo etiqueta="Contraseña nueva" icono={Lock} name="contrasena" type="password" autoComplete="new-password" minLength={8} />
        <Campo etiqueta="Repítela" icono={Lock} name="confirmar" type="password" autoComplete="new-password" minLength={8} />
        <Aviso estado={estado} />
        <Button type="submit" size="lg" loading={enviando} className="w-full">
          {enviando ? "Guardando…" : "Guardar"}
        </Button>
      </form>
    </>
  );
}
