"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Campo, ErrorForm } from "@/components/ui/campo";
import type { Propuesta } from "@/lib/propuestas-tipos";
import type { EstadoForm } from "@/app/(panel)/propuestas/acciones";

export function FormularioProspecto({
  accion,
  propuesta,
  textoBoton,
  cancelar,
}: {
  accion: (e: EstadoForm, fd: FormData) => Promise<EstadoForm>;
  propuesta?: Propuesta;
  textoBoton: string;
  cancelar?: string;
}) {
  const [estado, enviar, enviando] = useActionState(accion, undefined);
  const p = propuesta;
  return (
    <form action={enviar} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Campo id="prospecto_nombre" etiqueta="Prospecto">
          <Input id="prospecto_nombre" name="prospecto_nombre" required maxLength={150} defaultValue={p?.prospecto_nombre ?? ""} autoFocus={!p} />
        </Campo>
        <Campo id="prospecto_negocio" etiqueta="Negocio">
          <Input id="prospecto_negocio" name="prospecto_negocio" maxLength={150} defaultValue={p?.prospecto_negocio ?? ""} />
        </Campo>
        <Campo id="prospecto_contacto" etiqueta="Contacto (tel. o correo)">
          <Input id="prospecto_contacto" name="prospecto_contacto" maxLength={150} defaultValue={p?.prospecto_contacto ?? ""} />
        </Campo>
      </div>
      <Campo id="problema" etiqueta="Problema detectado">
        <Textarea id="problema" name="problema" rows={3} defaultValue={p?.problema ?? ""} />
      </Campo>
      <Campo id="solucion" etiqueta="Solución propuesta">
        <Textarea id="solucion" name="solucion" rows={3} defaultValue={p?.solucion ?? ""} />
      </Campo>
      <Campo id="notas" etiqueta="Notas internas (no salen en el PDF ni en el link)">
        <Textarea id="notas" name="notas" rows={2} defaultValue={p?.notas ?? ""} />
      </Campo>
      <ErrorForm mensaje={estado?.error} />
      <div className="flex items-center gap-3">
        <Button type="submit" variant={p ? "outline" : "default"} disabled={enviando}>
          {enviando ? "Guardando…" : textoBoton}
        </Button>
        {cancelar ? (
          <Button asChild variant="ghost">
            <Link href={cancelar}>Cancelar</Link>
          </Button>
        ) : null}
        {estado?.ok ? (
          <span role="status" className="text-sm text-emerald-700">
            {estado.ok}
          </span>
        ) : null}
      </div>
    </form>
  );
}
