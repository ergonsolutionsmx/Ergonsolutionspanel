"use client";

import { startTransition, useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { enviarNotificacionPrueba } from "./acciones";

export function ProbarNotificaciones({
  usuarios,
  yoId,
}: {
  usuarios: { usuario_id: string; nombre: string }[];
  yoId: string;
}) {
  const [estado, accion, enviando] = useActionState(enviarNotificacionPrueba, undefined);
  const [destinatario, setDestinatario] = useState(yoId);

  return (
    <form
      // Envío manual: con action={} React reinicia el formulario y se perdería el destinatario.
      onSubmit={(e) => {
        e.preventDefault();
        const datos = new FormData(e.currentTarget);
        startTransition(() => accion(datos));
      }}
      className="flex flex-wrap items-center gap-3"
    >
      <label htmlFor="destinatario" className="text-sm font-bold">
        Para
      </label>
      <select
        id="destinatario"
        name="destinatario"
        value={destinatario}
        onChange={(e) => setDestinatario(e.target.value)}
        className="h-10 rounded-md border border-input bg-card px-3 text-sm"
      >
        {usuarios.map((u) => (
          <option key={u.usuario_id} value={u.usuario_id}>
            {u.usuario_id === yoId ? `${u.nombre} (yo)` : u.nombre}
          </option>
        ))}
      </select>
      <Button type="submit" variant="outline" disabled={enviando}>
        {enviando ? "Enviando…" : "Enviar prueba"}
      </Button>
      {estado?.ok ? <p role="status" className="w-full text-sm text-ergon-navy">{estado.ok}</p> : null}
      {estado?.error ? <p role="alert" className="w-full text-sm text-red-700">{estado.error}</p> : null}
    </form>
  );
}
