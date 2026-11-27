"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { Campo, ErrorForm } from "@/components/ui/campo";
import {
  ESTADOS_TAREA,
  NOMBRE_ESTADO,
  NOMBRE_PRIORIDAD,
  PRIORIDADES,
  type Catalogos,
  type Tarea,
} from "@/lib/tareas-tipos";
import type { EstadoForm } from "@/app/(panel)/proyectos/acciones";

type Accion = (estado: EstadoForm, fd: FormData) => Promise<EstadoForm>;

export function FormularioTarea({
  accion,
  catalogos,
  tarea,
  valoresIniciales,
  volver,
  textoBoton,
}: {
  accion: Accion;
  catalogos: Catalogos;
  tarea?: Tarea;
  valoresIniciales?: Partial<Tarea>;
  volver: string;
  textoBoton: string;
}) {
  const [estado, enviar, enviando] = useActionState(accion, undefined);
  const v = { ...valoresIniciales, ...tarea };
  // Solo se ofrecen proyectos no terminados, salvo el que ya tenga la tarea.
  const proyectos = catalogos.proyectos.filter((p) => p.estado !== "terminado" || p.id === v.proyecto_id);

  return (
    <form action={enviar} className="grid gap-4">
      <input type="hidden" name="volver" value={volver} />
      <Campo id="titulo" etiqueta="Título">
        <Input id="titulo" name="titulo" required maxLength={200} defaultValue={v.titulo ?? ""} autoFocus={!tarea} />
      </Campo>
      <Campo id="descripcion" etiqueta="Descripción">
        <Textarea id="descripcion" name="descripcion" defaultValue={v.descripcion ?? ""} rows={4} />
      </Campo>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo id="responsable_id" etiqueta="Responsable">
          <NativeSelect id="responsable_id" name="responsable_id" defaultValue={v.responsable_id ?? ""}>
            <option value="">Sin responsable</option>
            {catalogos.perfiles.map((p) => (
              <option key={p.usuario_id} value={p.usuario_id}>
                {p.usuario_id === catalogos.yoId ? `${p.nombre} (yo)` : p.nombre}
              </option>
            ))}
          </NativeSelect>
        </Campo>
        <Campo id="proyecto_id" etiqueta="Proyecto">
          <NativeSelect id="proyecto_id" name="proyecto_id" defaultValue={v.proyecto_id ?? ""}>
            <option value="">Sin proyecto</option>
            {proyectos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </NativeSelect>
        </Campo>
        <Campo id="fecha_limite" etiqueta="Fecha límite">
          <Input id="fecha_limite" name="fecha_limite" type="date" defaultValue={v.fecha_limite ?? ""} />
        </Campo>
        <Campo id="prioridad" etiqueta="Prioridad">
          <NativeSelect id="prioridad" name="prioridad" defaultValue={v.prioridad ?? "media"}>
            {PRIORIDADES.map((p) => (
              <option key={p} value={p}>
                {NOMBRE_PRIORIDAD[p]}
              </option>
            ))}
          </NativeSelect>
        </Campo>
        <Campo id="estado" etiqueta="Estado">
          <NativeSelect id="estado" name="estado" defaultValue={v.estado ?? "por_hacer"}>
            {ESTADOS_TAREA.map((e) => (
              <option key={e} value={e}>
                {NOMBRE_ESTADO[e]}
              </option>
            ))}
          </NativeSelect>
        </Campo>
      </div>
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
