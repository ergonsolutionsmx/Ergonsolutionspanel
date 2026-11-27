"use client";

import { useActionState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Campo, ErrorForm } from "@/components/ui/campo";
import { eliminarDemo, guardarDemo } from "@/app/(panel)/ajustes/acciones";

type Demo = { id: string; nombre: string; descripcion: string | null; url: string | null; orden: number; activo: boolean };

function FormularioDemo({ demo, siguienteOrden }: { demo?: Demo; siguienteOrden: number }) {
  const [estado, enviar, enviando] = useActionState(guardarDemo.bind(null, demo?.id ?? null), undefined);
  const [borrando, startTransition] = useTransition();
  const id = (k: string) => `${k}-${demo?.id ?? "nueva"}`;
  return (
    <form action={enviar} className="grid gap-3 rounded-lg border bg-card p-4">
      {!demo ? <p className="font-bold">Nueva demo</p> : null}
      <div className="grid gap-3 sm:grid-cols-[1fr_6rem]">
        <Campo id={id("nombre")} etiqueta="Nombre">
          <Input id={id("nombre")} name="nombre" required maxLength={120} defaultValue={demo?.nombre ?? ""} />
        </Campo>
        <Campo id={id("orden")} etiqueta="Orden">
          <Input id={id("orden")} name="orden" inputMode="numeric" defaultValue={demo?.orden ?? siguienteOrden} />
        </Campo>
      </div>
      <Campo id={id("url")} etiqueta="URL">
        <Input id={id("url")} name="url" type="url" placeholder="https://…" defaultValue={demo?.url ?? ""} />
      </Campo>
      <Campo id={id("descripcion")} etiqueta="Descripción">
        <Textarea id={id("descripcion")} name="descripcion" rows={2} defaultValue={demo?.descripcion ?? ""} />
      </Campo>
      <label className="flex items-center gap-2 text-sm font-bold">
        <input type="checkbox" name="activo" defaultChecked={demo?.activo ?? true} className="size-4 accent-ergon-blue" />
        Visible en el lanzador
      </label>
      <ErrorForm mensaje={estado?.error} />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant={demo ? "outline" : "default"} disabled={enviando}>
          {demo ? null : <Plus />}
          {enviando ? "Guardando…" : demo ? "Guardar" : "Agregar demo"}
        </Button>
        {estado?.ok ? <span role="status" className="text-sm text-emerald-700">{estado.ok}</span> : null}
        {demo ? (
          <Button
            type="button"
            variant="ghost"
            className="ml-auto text-red-700 hover:bg-red-50"
            disabled={borrando}
            onClick={() => {
              if (window.confirm(`¿Quitar "${demo.nombre}" del lanzador?`)) startTransition(() => eliminarDemo(demo.id));
            }}
          >
            <Trash2 /> Quitar
          </Button>
        ) : null}
      </div>
    </form>
  );
}

export function EditorDemos({ demos }: { demos: Demo[] }) {
  const siguiente = demos.reduce((m, d) => Math.max(m, d.orden), 0) + 1;
  return (
    <div className="grid max-w-2xl gap-3">
      {demos.map((d) => (
        <FormularioDemo key={`${d.id}-${d.url}-${d.nombre}-${d.orden}-${d.activo}`} demo={d} siguienteOrden={siguiente} />
      ))}
      <FormularioDemo key={`nueva-${demos.length}`} siguienteOrden={siguiente} />
    </div>
  );
}
