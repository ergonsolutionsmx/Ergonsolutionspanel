"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "@/components/avisos/toast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Campo, ErrorForm } from "@/components/ui/campo";
import { actualizarPerfil } from "@/app/(panel)/ajustes/acciones";

/** Colores sugeridos (de la marca y complementarios). */
const COLORES = ["#1d3fb8", "#0EA5E9", "#06142e", "#7C3AED", "#059669", "#D97706", "#DC2626", "#DB2777"];

export function FormularioPerfil({ nombre, color, correo }: { nombre: string; color: string; correo: string }) {
  const [estado, enviar, enviando] = useActionState(actualizarPerfil, undefined);
  const [elegido, setElegido] = useState(color.toUpperCase());
  const [nombreVista, setNombreVista] = useState(nombre);
  const huboCambios = nombreVista.trim() !== nombre || elegido !== color.toUpperCase();
  useEffect(() => {
    if (estado?.ok) toast.success("Guardado", estado.ok);
  }, [estado]);
  const iniciales = nombreVista
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <form action={enviar} className="grid gap-4">
      <div className="flex items-center gap-4">
        <span
          className="flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-black text-white"
          style={{ backgroundColor: elegido }}
          aria-hidden
        >
          {iniciales || "?"}
        </span>
        <div className="text-sm">
          <p className="font-bold text-ergon-navy">{nombreVista || "Tu nombre"}</p>
          <p className="text-muted-foreground">Así te ven en el panel.</p>
        </div>
      </div>
      <Campo id="correo" etiqueta="Correo">
        <Input id="correo" value={correo} readOnly disabled aria-describedby="correo-ayuda" />
        <p id="correo-ayuda" className="text-xs text-muted-foreground">
          El correo de acceso no se cambia desde aquí.
        </p>
      </Campo>
      <Campo id="nombre" etiqueta="Nombre">
        <Input id="nombre" name="nombre" required maxLength={80} defaultValue={nombre} onChange={(e) => setNombreVista(e.target.value)} />
      </Campo>
      <fieldset>
        <legend className="mb-2 text-sm font-bold">Color</legend>
        <input type="hidden" name="color" value={elegido} />
        <div className="flex flex-wrap items-center gap-2">
          {COLORES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setElegido(c)}
              aria-label={`Color ${c}`}
              aria-pressed={elegido === c}
              className={cn("size-9 rounded-full ring-offset-2", elegido === c && "ring-2 ring-ergon-navy")}
              style={{ backgroundColor: c }}
            />
          ))}
          <label className="ml-1 flex items-center gap-2 text-sm text-muted-foreground">
            Otro
            <input
              type="color"
              value={elegido}
              onChange={(e) => setElegido(e.target.value.toUpperCase())}
              className="h-9 w-12 cursor-pointer rounded border"
            />
          </label>
        </div>
      </fieldset>
      <ErrorForm mensaje={estado?.error} />
      <div className="flex items-center gap-3">
        <Button type="submit" loading={enviando} disabled={!huboCambios}>
          {enviando ? "Guardando…" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
