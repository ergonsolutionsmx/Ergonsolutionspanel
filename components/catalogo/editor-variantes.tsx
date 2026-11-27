"use client";

import { useActionState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { Campo, ErrorForm } from "@/components/ui/campo";
import { NOMBRE_VARIANTE, NOMBRES_VARIANTE, type Variante } from "@/lib/catalogo-tipos";
import { eliminarVariante, guardarVariante } from "@/app/(panel)/catalogo/acciones";

function FormularioVariante({ servicioId, variante }: { servicioId: string; variante?: Variante }) {
  const [estado, enviar, enviando] = useActionState(guardarVariante.bind(null, servicioId, variante?.id ?? null), undefined);
  const [borrando, startTransition] = useTransition();
  const sufijo = variante?.id ?? "nueva";
  const id = (campo: string) => `${campo}-${sufijo}`;

  return (
    <form action={enviar} className="grid gap-3 rounded-lg border border-white/70 bg-card p-4">
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <Campo id={id("nombre")} etiqueta={variante ? "Variante" : "Nueva variante"}>
            <NativeSelect id={id("nombre")} name="nombre" defaultValue={variante?.nombre ?? "basico"}>
              {NOMBRES_VARIANTE.map((n) => (
                <option key={n} value={n}>
                  {NOMBRE_VARIANTE[n]}
                </option>
              ))}
            </NativeSelect>
          </Campo>
        </div>
        {variante ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Eliminar variante ${NOMBRE_VARIANTE[variante.nombre]}`}
            className="text-red-700 hover:bg-red-50"
            disabled={borrando}
            onClick={() => {
              if (window.confirm(`¿Eliminar la variante ${NOMBRE_VARIANTE[variante.nombre]}?`))
                startTransition(() => eliminarVariante(servicioId, variante.id));
            }}
          >
            <Trash2 />
          </Button>
        ) : null}
      </div>
      <Campo id={id("que_incluye")} etiqueta="Qué incluye">
        <Textarea id={id("que_incluye")} name="que_incluye" rows={3} defaultValue={variante?.que_incluye ?? ""} />
      </Campo>
      <Campo id={id("entregables")} etiqueta="Entregables">
        <Textarea id={id("entregables")} name="entregables" rows={2} defaultValue={variante?.entregables ?? ""} />
      </Campo>
      <div className="grid gap-3 sm:grid-cols-3">
        <Campo id={id("tiempo_estimado")} etiqueta="Tiempo estimado">
          <Input id={id("tiempo_estimado")} name="tiempo_estimado" placeholder="Ej.: 2 semanas" defaultValue={variante?.tiempo_estimado ?? ""} />
        </Campo>
        <Campo id={id("precio_instalacion")} etiqueta="Instalación (MXN)">
          <Input
            id={id("precio_instalacion")}
            name="precio_instalacion"
            inputMode="decimal"
            placeholder="Por definir"
            defaultValue={variante?.precio_instalacion ?? ""}
          />
        </Campo>
        <Campo id={id("precio_mensual")} etiqueta="Mensualidad (MXN)">
          <Input
            id={id("precio_mensual")}
            name="precio_mensual"
            inputMode="decimal"
            placeholder="Por definir"
            defaultValue={variante?.precio_mensual ?? ""}
          />
        </Campo>
      </div>
      <ErrorForm mensaje={estado?.error} />
      <div className="flex items-center gap-3">
        <Button type="submit" variant={variante ? "outline" : "default"} disabled={enviando}>
          {variante ? null : <Plus />}
          {enviando ? "Guardando…" : variante ? "Guardar variante" : "Agregar variante"}
        </Button>
        {estado?.ok ? (
          <span role="status" className="text-sm text-emerald-700">
            {estado.ok}
          </span>
        ) : null}
      </div>
    </form>
  );
}

export function EditorVariantes({ servicioId, variantes }: { servicioId: string; variantes: Variante[] }) {
  return (
    <div className="grid gap-3">
      {variantes.map((v) => (
        <FormularioVariante key={`${v.id}-${v.nombre}-${v.precio_instalacion}-${v.precio_mensual}`} servicioId={servicioId} variante={v} />
      ))}
      <FormularioVariante key={`nueva-${variantes.length}`} servicioId={servicioId} />
    </div>
  );
}
