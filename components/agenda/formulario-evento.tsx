"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { Campo, ErrorForm } from "@/components/ui/campo";
import type { PerfilCorto } from "@/lib/tareas-tipos";
import type { EstadoForm } from "@/app/(panel)/agenda/acciones";

export type ValoresEvento = {
  titulo: string;
  todoElDia: boolean;
  fechaInicio: string;
  horaInicio: string;
  fechaFin: string;
  horaFin: string;
  lugar: string;
  notas: string;
  responsableId: string;
};

export function FormularioEvento({
  accion,
  valores,
  perfiles,
  yoId,
  volver,
  textoBoton,
}: {
  accion: (estado: EstadoForm, fd: FormData) => Promise<EstadoForm>;
  valores: ValoresEvento;
  perfiles: PerfilCorto[];
  yoId: string;
  volver: string;
  textoBoton: string;
}) {
  const [estado, enviar, enviando] = useActionState(accion, undefined);
  const [todoElDia, setTodoElDia] = useState(valores.todoElDia);

  return (
    <form action={enviar} className="grid gap-4">
      <input type="hidden" name="volver" value={volver} />
      <Campo id="titulo" etiqueta="Título">
        <Input id="titulo" name="titulo" required maxLength={200} defaultValue={valores.titulo} autoFocus={!valores.titulo} />
      </Campo>

      <label className="flex items-center gap-2 text-sm font-bold">
        <input
          type="checkbox"
          name="todo_el_dia"
          checked={todoElDia}
          onChange={(e) => setTodoElDia(e.target.checked)}
          className="size-5 accent-ergon-blue"
        />
        Todo el día
      </label>

      <div className="grid grid-cols-2 gap-4">
        <Campo id="fecha_inicio" etiqueta="Inicio">
          <Input id="fecha_inicio" name="fecha_inicio" type="date" required defaultValue={valores.fechaInicio} />
        </Campo>
        {todoElDia ? (
          <div />
        ) : (
          <Campo id="hora_inicio" etiqueta="Hora">
            <Input id="hora_inicio" name="hora_inicio" type="time" required defaultValue={valores.horaInicio} />
          </Campo>
        )}
        <Campo id="fecha_fin" etiqueta="Fin">
          <Input id="fecha_fin" name="fecha_fin" type="date" defaultValue={valores.fechaFin} />
        </Campo>
        {todoElDia ? (
          <div />
        ) : (
          <Campo id="hora_fin" etiqueta="Hora">
            <Input id="hora_fin" name="hora_fin" type="time" defaultValue={valores.horaFin} />
          </Campo>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="lugar" etiqueta="Lugar">
          <Input id="lugar" name="lugar" defaultValue={valores.lugar} maxLength={200} />
        </Campo>
        <Campo id="responsable_id" etiqueta="De quién">
          <NativeSelect id="responsable_id" name="responsable_id" defaultValue={valores.responsableId}>
            <option value="">Los dos</option>
            {perfiles.map((p) => (
              <option key={p.usuario_id} value={p.usuario_id}>
                {p.usuario_id === yoId ? `${p.nombre} (yo)` : p.nombre}
              </option>
            ))}
          </NativeSelect>
        </Campo>
      </div>

      <Campo id="notas" etiqueta="Notas">
        <Textarea id="notas" name="notas" defaultValue={valores.notas} rows={3} />
      </Campo>

      <ErrorForm mensaje={estado?.error} />
      <div className="flex gap-2">
        <Button type="submit" disabled={enviando}>
          {enviando ? "Guardando…" : textoBoton}
        </Button>
        <Button asChild variant="ghost">
          <Link href={volver}>Cancelar</Link>
        </Button>
      </div>
    </form>
  );
}
