"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { NativeSelect } from "@/components/ui/native-select";
import type { Catalogos } from "@/lib/tareas-tipos";

function Chip({ activo, href, children }: { activo: boolean; href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={activo ? "true" : undefined}
      className={cn(
        "flex h-9 items-center gap-1 whitespace-nowrap rounded-full border px-3 text-sm font-bold",
        activo ? "border-ergon-navy bg-ergon-navy text-white" : "bg-card text-ergon-navy hover:bg-accent",
      )}
    >
      {children}
    </Link>
  );
}

/** Pestañas Tablero / Lista (/ Proyectos). */
export function PestanasVista({ conProyectos = true }: { conProyectos?: boolean }) {
  const params = useSearchParams();
  const ruta = usePathname();
  const vista = params.get("vista") ?? "tablero";
  const con = (v: string) => {
    const p = new URLSearchParams(params);
    p.set("vista", v);
    if (v === "proyectos") ["de", "proyecto", "vencidas"].forEach((k) => p.delete(k));
    return `${ruta}?${p}`;
  };
  const pestanas = [
    { v: "tablero", nombre: "Tablero" },
    { v: "lista", nombre: "Lista" },
    ...(conProyectos ? [{ v: "proyectos", nombre: "Proyectos" }] : []),
  ];
  return (
    <div role="tablist" className="inline-flex rounded-full bg-ergon-navy/[0.06] p-1">
      {pestanas.map(({ v, nombre }) => (
        <Link
          key={v}
          role="tab"
          aria-selected={vista === v}
          href={con(v)}
          scroll={false}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-bold",
            vista === v ? "bg-white text-ergon-navy shadow-sm" : "text-muted-foreground hover:text-ergon-navy",
          )}
        >
          {nombre}
        </Link>
      ))}
    </div>
  );
}

/** Filtros: de quién, proyecto y vencidas. */
export function FiltrosTareas({ catalogos, conProyecto = true }: { catalogos: Catalogos; conProyecto?: boolean }) {
  const params = useSearchParams();
  const ruta = usePathname();
  const router = useRouter();
  const de = params.get("de") ?? "todos";
  const proyecto = params.get("proyecto") ?? "";
  const vencidas = params.get("vencidas") === "1";

  const con = (cambios: Record<string, string | null>) => {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(cambios)) {
      if (v === null || v === "") p.delete(k);
      else p.set(k, v);
    }
    const qs = p.toString();
    return qs ? `${ruta}?${qs}` : ruta;
  };

  const otros = catalogos.perfiles.filter((p) => p.usuario_id !== catalogos.yoId);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
        <Chip activo={de === "todos"} href={con({ de: null })}>
          Todas
        </Chip>
        <Chip activo={de === "mias"} href={con({ de: "mias" })}>
          Mías
        </Chip>
        {otros.map((p) => (
          <Chip key={p.usuario_id} activo={de === p.usuario_id} href={con({ de: p.usuario_id })}>
            De {p.nombre.split(" ")[0]}
          </Chip>
        ))}
        <Chip activo={vencidas} href={con({ vencidas: vencidas ? null : "1" })}>
          <AlertTriangle className="size-4" aria-hidden /> Vencidas
        </Chip>
      </div>
      {conProyecto ? (
        <div className="w-full sm:ml-auto sm:w-56">
          <label htmlFor="filtro-proyecto" className="sr-only">
            Proyecto
          </label>
          <NativeSelect
            id="filtro-proyecto"
            value={proyecto}
            onChange={(e) => router.replace(con({ proyecto: e.target.value }), { scroll: false })}
          >
            <option value="">Todos los proyectos</option>
            <option value="sueltas">Sin proyecto (sueltas)</option>
            {catalogos.proyectos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </NativeSelect>
        </div>
      ) : null}
    </div>
  );
}
