"use client";

import { useActionState, useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { pesos } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { ErrorForm } from "@/components/ui/campo";
import { NOMBRE_VARIANTE, type Servicio } from "@/lib/catalogo-tipos";
import type { Concepto } from "@/lib/propuestas-tipos";
import {
  actualizarConcepto,
  agregarConceptoLibre,
  agregarDelCatalogo,
  eliminarConcepto,
} from "@/app/(panel)/propuestas/acciones";

function FilaConcepto({ concepto: c }: { concepto: Concepto }) {
  const [estado, enviar, enviando] = useActionState(actualizarConcepto.bind(null, c.id), undefined);
  const [borrando, startTransition] = useTransition();
  const id = (k: string) => `${k}-${c.id}`;
  return (
    <form action={enviar} className="grid gap-3 border-b p-4 last:border-b-0">
      <div className="flex items-start gap-2">
        <div className="grid flex-1 gap-2">
          <label htmlFor={id("titulo")} className="sr-only">
            Concepto
          </label>
          <Input id={id("titulo")} name="titulo" required defaultValue={c.titulo} className="font-bold" />
          <label htmlFor={id("descripcion")} className="sr-only">
            Descripción
          </label>
          <Textarea id={id("descripcion")} name="descripcion" rows={2} defaultValue={c.descripcion ?? ""} placeholder="Descripción" />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Quitar ${c.titulo}`}
          className="text-destructive hover:bg-destructive/10"
          disabled={borrando}
          onClick={() => startTransition(() => eliminarConcepto(c.id))}
        >
          <Trash2 />
        </Button>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1">
          <label htmlFor={id("cantidad")} className="text-xs font-bold text-muted-foreground">
            Cantidad
          </label>
          <Input id={id("cantidad")} name="cantidad" type="number" min={1} max={999} inputMode="numeric" defaultValue={c.cantidad ?? 1} className="w-20" />
        </div>
        <div className="grid gap-1">
          <label htmlFor={id("precio_instalacion")} className="text-xs font-bold text-muted-foreground">
            Instalación (MXN)
          </label>
          <Input
            id={id("precio_instalacion")}
            name="precio_instalacion"
            inputMode="decimal"
            placeholder="Por definir"
            defaultValue={c.precio_instalacion ?? ""}
            className="w-36"
          />
        </div>
        <div className="grid gap-1">
          <label htmlFor={id("precio_mensual")} className="text-xs font-bold text-muted-foreground">
            Mensualidad (MXN)
          </label>
          <Input
            id={id("precio_mensual")}
            name="precio_mensual"
            inputMode="decimal"
            placeholder="Por definir"
            defaultValue={c.precio_mensual ?? ""}
            className="w-36"
          />
        </div>
        <Button type="submit" variant="outline" size="sm" className="h-11 md:h-10" loading={enviando}>
          {enviando ? "Guardando…" : "Guardar"}
        </Button>
        {estado?.ok ? <span role="status" className="text-sm font-bold text-exito">{estado.ok}</span> : null}
        {(c.cantidad ?? 1) > 1 && (c.precio_instalacion !== null || c.precio_mensual !== null) ? (
          <span className="ml-auto text-sm font-bold text-ergon-navy">
            {c.precio_instalacion !== null ? pesos(Number(c.precio_instalacion) * c.cantidad) : ""}
            {c.precio_mensual !== null ? ` · ${pesos(Number(c.precio_mensual) * c.cantidad)}/mes` : ""}
          </span>
        ) : null}
      </div>
      <ErrorForm mensaje={estado?.error} />
    </form>
  );
}

function AgregarDelCatalogo({ propuestaId, servicios }: { propuestaId: string; servicios: Servicio[] }) {
  const [estado, enviar, enviando] = useActionState(agregarDelCatalogo.bind(null, propuestaId), undefined);
  const [servicioId, setServicioId] = useState("");
  const servicio = servicios.find((s) => s.id === servicioId);
  return (
    <form action={enviar} className="grid gap-2 sm:grid-cols-[1fr_12rem_5rem_auto] sm:items-end">
      <div className="grid gap-1">
        <label htmlFor="servicio_id" className="text-xs font-bold text-muted-foreground">
          Servicio del catálogo
        </label>
        <NativeSelect id="servicio_id" name="servicio_id" value={servicioId} onChange={(e) => setServicioId(e.target.value)} required>
          <option value="">Elige un servicio…</option>
          {servicios.map((s) => (
            <option key={s.id} value={s.id}>
              {s.numero} · {s.nombre}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="grid gap-1">
        <label htmlFor="variante_id" className="text-xs font-bold text-muted-foreground">
          Variante
        </label>
        <NativeSelect id="variante_id" name="variante_id" key={servicioId} disabled={!servicio?.variantes.length}>
          {servicio?.variantes.length ? (
            servicio.variantes.map((v) => (
              <option key={v.id} value={v.id}>
                {NOMBRE_VARIANTE[v.nombre]}
                {v.precio_instalacion !== null ? ` · ${pesos(v.precio_instalacion)}` : ""}
              </option>
            ))
          ) : (
            <option value="">Sin variantes</option>
          )}
        </NativeSelect>
      </div>
      <div className="grid gap-1">
        <label htmlFor="cantidad-nueva" className="text-xs font-bold text-muted-foreground">
          Cantidad
        </label>
        <Input id="cantidad-nueva" name="cantidad" type="number" min={1} max={999} inputMode="numeric" defaultValue={1} />
      </div>
      <Button type="submit" loading={enviando} disabled={!servicioId}>
        {enviando ? null : <Plus />} {enviando ? "Agregando…" : "Agregar"}
      </Button>
      <div className="sm:col-span-4">
        <ErrorForm mensaje={estado?.error} />
      </div>
    </form>
  );
}

export function EditorConceptos({
  propuestaId,
  conceptos,
  servicios,
  totalInstalacion,
  totalMensual,
}: {
  propuestaId: string;
  conceptos: Concepto[];
  servicios: Servicio[];
  totalInstalacion: number;
  totalMensual: number;
}) {
  const [agregando, startTransition] = useTransition();
  return (
    <div className="grid gap-4">
      <div className="rounded-[1.25rem] border border-white/70 bg-card p-4 shadow-sm">
        <AgregarDelCatalogo propuestaId={propuestaId} servicios={servicios} />
        <button
          type="button"
          onClick={() => startTransition(() => agregarConceptoLibre(propuestaId))}
          disabled={agregando}
          className="mt-3 text-sm font-bold text-primary hover:underline"
        >
          + Concepto libre (fuera del catálogo)
        </button>
      </div>

      <div className="overflow-hidden rounded-[1.25rem] border border-white/70 bg-card shadow-sm">
        {conceptos.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">Agrega servicios del catálogo.</p>
        ) : (
          conceptos.map((c) => (
            <FilaConcepto
              key={`${c.id}-${c.titulo}-${c.precio_instalacion}-${c.precio_mensual}-${c.descripcion}-${c.cantidad}`}
              concepto={c}
            />
          ))
        )}
      </div>

      <div className="flex flex-wrap justify-end gap-x-6 gap-y-1 rounded-[1.25rem] border border-white/70 bg-card px-5 py-3 text-sm shadow-sm" aria-live="polite">
        <span className="text-muted-foreground">
          Subtotal instalación <strong className="ml-1 text-base text-ergon-navy">{pesos(totalInstalacion)}</strong>
        </span>
        <span className="text-muted-foreground">
          Subtotal mensual <strong className="ml-1 text-base text-ergon-navy">{pesos(totalMensual)}</strong>
        </span>
      </div>
    </div>
  );
}
