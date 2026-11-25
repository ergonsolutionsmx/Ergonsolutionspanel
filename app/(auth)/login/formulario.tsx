"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { iniciarSesion } from "../acciones";
import { Aviso, Campo } from "../campo";

const ERRORES: Record<string, string> = {
  "sin-acceso": "Esta cuenta no tiene acceso al panel.",
  "enlace-invalido": "El enlace no es válido o ya venció. Pide uno nuevo.",
};

export function FormularioLogin() {
  const params = useSearchParams();
  const [estado, accion, enviando] = useActionState(iniciarSesion, undefined);
  const errorUrl = ERRORES[params.get("error") ?? ""];

  return (
    <form action={accion} className="grid gap-4">
      <input type="hidden" name="siguiente" value={params.get("siguiente") ?? "/inicio"} />
      <Campo
        etiqueta="Correo"
        name="correo"
        type="email"
        autoComplete="email"
        inputMode="email"
        defaultValue={estado?.correo}
      />
      <Campo etiqueta="Contraseña" name="contrasena" type="password" autoComplete="current-password" />
      <Aviso estado={estado ?? (errorUrl ? { error: errorUrl } : undefined)} />
      <Button type="submit" disabled={enviando}>
        {enviando ? "Entrando…" : "Entrar"}
      </Button>
      <Link href="/recuperar" className="text-center text-sm text-primary hover:underline">
        Olvidé mi contraseña
      </Link>
    </form>
  );
}
