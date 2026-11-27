"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { pedirRecuperacion } from "../acciones";
import { Mail } from "lucide-react";
import { Aviso, Campo, EncabezadoAcceso } from "../campo";

export default function RecuperarPage() {
  const [estado, accion, enviando] = useActionState(pedirRecuperacion, undefined);

  return (
    <>
      <EncabezadoAcceso titulo="Recuperar contraseña" texto="Te mandamos un enlace a tu correo" />
      <form action={accion} className="grid gap-4">
        <Campo etiqueta="Correo" icono={Mail} name="correo" type="email" autoComplete="email" inputMode="email" />
        <Aviso estado={estado} />
        <Button type="submit" size="lg" loading={enviando} className="w-full">
          {enviando ? "Enviando…" : "Enviar enlace"}
        </Button>
        <Link href="/login" className="text-center text-sm text-white/60 underline-offset-4 hover:text-white hover:underline">
          Volver
        </Link>
      </form>
    </>
  );
}
