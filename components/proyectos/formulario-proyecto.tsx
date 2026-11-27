"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { Campo, ErrorForm } from "@/components/ui/campo";
import { ESTADOS_PROYECTO, NOMBRE_ESTADO_PROYECTO, type Catalogos, type Proyecto } from "@/lib/tareas-tipos";
import type { EstadoForm } from "@/app/(panel)/proyectos/acciones";

export function FormularioProyecto({
  accion,
  catalogos,
  proyecto,
  cancelar,
  textoBoton,
}: {
  accion: (estado: EstadoForm, fd: FormData) => Promise<EstadoForm>;
  catalogos: Catalogos;
  proyecto?: Proyecto;
  cancelar: string;
  textoBoton: string;
}) {
  const [estado, enviar, enviando] = useActionState(accion, undefined);

  return (
    <form action={enviar} className="grid gap-4">
      <Campo id="nombre" etiqueta="Nombre">
        <Input id="nombre" name="nombre" required maxLength={120} defaultValue={proyecto?.nombre ?? ""} autoFocus={!proyecto} />
      </Campo>
      <Campo id="descripcion" etiqueta="Descripción">
        <Textarea id="descripcion" name="descripcion" defaultValue={proyecto?.descripcion ?? ""} rows={4} />
      </Campo>
      <div className="grid gap-4 sm:grid-cols-3">
        <Campo id="estado" etiqueta="Estado">
          <NativeSelect id="estado" name="estado" defaultValue={proyecto?.estado ?? "activo"}>
            {ESTADOS_PROYECTO.map((e) => (
              <option key={e} value={e}>
                {NOMBRE_ESTADO_PROYECTO[e]}
              </option>
            ))}
          </NativeSelect>
        </Campo>
        <Campo id="responsable_id" etiqueta="Responsable">
          <NativeSelect id="responsable_id" name="responsable_id" defaultValue={proyecto ? (proyecto.responsable_id ?? "") : catalogos.yoId}>
            <option value="">Sin responsable</option>
            {catalogos.perfiles.map((p) => (
              <option key={p.usuario_id} value={p.usuario_id}>
                {p.usuario_id === catalogos.yoId ? `${p.nombre} (yo)` : p.nombre}
              </option>
            ))}
          </NativeSelect>
        </Campo>
        <Campo id="fecha_objetivo" etiqueta="Fecha objetivo">
          <Input id="fecha_objetivo" name="fecha_objetivo" type="date" defaultValue={proyecto?.fecha_objetivo ?? ""} />
        </Campo>
      </div>
      <ErrorForm mensaje={estado?.error} />
      <div className="flex gap-2">
        <Button type="submit" disabled={enviando}>
          {enviando ? "Guardando…" : textoBoton}
        </Button>
        <Button asChild variant="ghost">
          <Link href={cancelar}>Cancelar</Link>
        </Button>
      </div>
    </form>
  );
}
