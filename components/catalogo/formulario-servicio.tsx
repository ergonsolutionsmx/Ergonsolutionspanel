"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { Campo, ErrorForm } from "@/components/ui/campo";
import {
  CATEGORIAS,
  DIFICULTADES,
  ESTADOS_SERVICIO,
  NOMBRE_DIFICULTAD,
  NOMBRE_ESTADO_SERVICIO,
  type Servicio,
} from "@/lib/catalogo-tipos";
import type { EstadoForm } from "@/app/(panel)/catalogo/acciones";

export function FormularioServicio({
  accion,
  servicio,
  cancelar,
  textoBoton,
}: {
  accion: (e: EstadoForm, fd: FormData) => Promise<EstadoForm>;
  servicio?: Servicio;
  cancelar: string;
  textoBoton: string;
}) {
  const [estado, enviar, enviando] = useActionState(accion, undefined);
  const s = servicio;

  return (
    <form action={enviar} className="grid gap-4">
      <div className="grid grid-cols-[6rem_1fr] gap-4">
        <Campo id="numero" etiqueta="Número">
          <Input id="numero" name="numero" required inputMode="numeric" maxLength={3} defaultValue={s?.numero ?? ""} />
        </Campo>
        <Campo id="nombre" etiqueta="Nombre">
          <Input id="nombre" name="nombre" required maxLength={150} defaultValue={s?.nombre ?? ""} />
        </Campo>
      </div>

      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm font-bold">Categorías</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {CATEGORIAS.map((c) => (
            <label key={c} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="categorias"
                value={c}
                defaultChecked={s?.categorias.includes(c)}
                className="size-4 accent-ergon-blue"
              />
              {c}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-3">
        <Campo id="estado" etiqueta="Estado">
          <NativeSelect id="estado" name="estado" defaultValue={s?.estado ?? "pendiente"}>
            {ESTADOS_SERVICIO.map((e) => (
              <option key={e} value={e}>
                {NOMBRE_ESTADO_SERVICIO[e]}
              </option>
            ))}
          </NativeSelect>
        </Campo>
        <Campo id="dificultad" etiqueta="Dificultad">
          <NativeSelect id="dificultad" name="dificultad" defaultValue={s?.dificultad ?? ""}>
            <option value="">Por confirmar</option>
            {DIFICULTADES.map((d) => (
              <option key={d} value={d}>
                {NOMBRE_DIFICULTAD[d]}
              </option>
            ))}
          </NativeSelect>
        </Campo>
        <label className="flex items-center gap-2 self-end pb-2.5 text-sm font-bold">
          <input type="checkbox" name="lleva_ia" defaultChecked={s?.lleva_ia} className="size-5 accent-ergon-blue" />
          Lleva IA
        </label>
      </div>

      <Campo id="que_es" etiqueta="Qué es">
        <Textarea id="que_es" name="que_es" rows={4} defaultValue={s?.que_es ?? ""} />
      </Campo>
      <Campo id="para_quien" etiqueta="Para quién">
        <Textarea id="para_quien" name="para_quien" rows={2} defaultValue={s?.para_quien ?? ""} />
      </Campo>
      <Campo id="problemas" etiqueta="Problemas que resuelve (uno por renglón; los usa el buscador)">
        <Textarea id="problemas" name="problemas" rows={5} defaultValue={s?.problemas.join("\n") ?? ""} />
      </Campo>
      <Campo id="cuando_no_recomendar" etiqueta="Cuándo NO recomendarlo (uno por renglón)">
        <Textarea id="cuando_no_recomendar" name="cuando_no_recomendar" rows={4} defaultValue={s?.cuando_no_recomendar ?? ""} />
      </Campo>
      <Campo id="entregables" etiqueta="Entregables (uno por renglón)">
        <Textarea id="entregables" name="entregables" rows={4} defaultValue={s?.entregables ?? ""} />
      </Campo>
      <Campo id="link_drive" etiqueta="Link a su carpeta de Drive">
        <Input
          id="link_drive"
          name="link_drive"
          type="url"
          placeholder="https://drive.google.com/drive/folders/…"
          defaultValue={s?.link_drive ?? ""}
        />
      </Campo>

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
