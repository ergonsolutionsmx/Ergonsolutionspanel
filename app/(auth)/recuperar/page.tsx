"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { pedirRecuperacion } from "../acciones";
import { Aviso, Campo } from "../campo";

export default function RecuperarPage() {
  const [estado, accion, enviando] = useActionState(pedirRecuperacion, undefined);

  return (
    <>
      <h1 className="mb-6 text-xl font-black text-ergon-navy">Recuperar contraseña</h1>
      <form action={accion} className="grid gap-4">
        <Campo etiqueta="Correo" name="correo" type="email" autoComplete="email" inputMode="email" />
        <Aviso estado={estado} />
        <Button type="submit" disabled={enviando}>
          {enviando ? "Enviando…" : "Enviar enlace"}
        </Button>
        <Link href="/login" className="text-center text-sm text-primary hover:underline">
          Volver
        </Link>
      </form>
    </>
  );
}
