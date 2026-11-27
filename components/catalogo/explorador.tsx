"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NativeSelect } from "@/components/ui/native-select";
import { Segmentos } from "@/components/ui/segmentos";
import { EmptyState } from "@/components/ui/empty-state";
import * as m from "motion/react-m";
import { fadeUp, stagger } from "@/lib/motion";
import { SearchX } from "lucide-react";
import {
  CATEGORIAS,
  DIFICULTADES,
  ESTADOS_SERVICIO,
  NOMBRE_DIFICULTAD,
  NOMBRE_ESTADO_SERVICIO,
  puntaje,
  type Servicio,
} from "@/lib/catalogo-tipos";
import { TarjetaServicio } from "./tarjeta-servicio";

type Filtros = { q: string; cat: string; estado: string; dif: string; ia: string; vista: string; archivados: string };
const CLAVES: (keyof Filtros)[] = ["q", "cat", "estado", "dif", "ia", "vista", "archivados"];

export function ExploradorCatalogo({ servicios }: { servicios: Servicio[] }) {
  const params = useSearchParams();
  const ruta = usePathname();
  const router = useRouter();
  const [f, setF] = useState<Filtros>(() =>
    Object.fromEntries(CLAVES.map((k) => [k, params.get(k) ?? ""])) as Filtros,
  );

  function cambiar(cambios: Partial<Filtros>) {
    const nuevo = { ...f, ...cambios };
    setF(nuevo);
    // Guardar en la URL para que al regresar de una ficha se conserve la búsqueda.
    const p = new URLSearchParams();
    for (const k of CLAVES) if (nuevo[k]) p.set(k, nuevo[k]);
    router.replace(p.size ? `${ruta}?${p}` : ruta, { scroll: false });
  }

  // Atajo: "/" enfoca el buscador.
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "/" && !/input|textarea|select/i.test(t.tagName)) {
        e.preventDefault();
        document.getElementById("buscar")?.focus();
      }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, []);

  const resultados = useMemo(() => {
    return servicios
      .filter((s) => (f.archivados === "1" ? true : s.activo))
      .filter((s) => !f.cat || s.categorias.includes(f.cat))
      .filter((s) => !f.estado || s.estado === f.estado)
      .filter((s) => !f.dif || (f.dif === "sin" ? s.dificultad === null : s.dificultad === f.dif))
      .filter((s) => !f.ia || (f.ia === "si" ? s.lleva_ia : !s.lleva_ia))
      .map((s) => ({ s, p: puntaje(s, f.q) }))
      .filter((x) => x.p > 0)
      .sort((a, b) => (f.q ? b.p - a.p : 0) || a.s.numero.localeCompare(b.s.numero))
      .map((x) => x.s);
  }, [servicios, f]);

  const porCategoria = f.vista === "categorias" && !f.q;
  const hayFiltros = Boolean(f.q || f.cat || f.estado || f.dif || f.ia);

  return (
    <div>
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <label htmlFor="buscar" className="sr-only">
          Buscar por problema
        </label>
        <input
          id="buscar"
          type="search"
          value={f.q}
          onChange={(e) => cambiar({ q: e.target.value })}
          placeholder="¿Qué problema tiene el cliente? Ej.: citas, WhatsApp, me deben dinero"
          className="h-12 w-full rounded-2xl border border-white/70 bg-card pl-10 pr-16 text-base shadow-sm outline-none focus-visible:border-ergon-blue focus-visible:ring-4 focus-visible:ring-ergon-blue/15"
          autoComplete="off"
        />
        {!f.q ? (
          <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border bg-muted px-1.5 py-0.5 text-[11px] font-bold text-muted-foreground md:block">/</kbd>
        ) : null}
        {f.q ? (
          <button
            type="button"
            onClick={() => cambiar({ q: "" })}
            aria-label="Borrar búsqueda"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0" aria-label="Categoría">
        {["", ...CATEGORIAS].map((c) => (
          <button
            key={c || "todas"}
            type="button"
            aria-pressed={f.cat === c}
            onClick={() => cambiar({ cat: c })}
            className={cn(
              "flex h-9 items-center whitespace-nowrap rounded-full border px-3.5 text-sm font-bold transition-colors",
              f.cat === c ? "border-ergon-navy bg-ergon-navy text-white" : "border-white/70 bg-card text-ergon-navy hover:bg-accent",
            )}
          >
            {c || "Todas"}
          </button>
        ))}
      </div>

      <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <NativeSelect aria-label="Estado" value={f.estado} onChange={(e) => cambiar({ estado: e.target.value })}>
          <option value="">Cualquier estado</option>
          {ESTADOS_SERVICIO.map((e) => (
            <option key={e} value={e}>
              {NOMBRE_ESTADO_SERVICIO[e]}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect aria-label="Dificultad" value={f.dif} onChange={(e) => cambiar({ dif: e.target.value })}>
          <option value="">Cualquier dificultad</option>
          {DIFICULTADES.map((d) => (
            <option key={d} value={d}>
              Dificultad {NOMBRE_DIFICULTAD[d].toLowerCase()}
            </option>
          ))}
          <option value="sin">Por confirmar</option>
        </NativeSelect>
        <NativeSelect aria-label="Inteligencia artificial" value={f.ia} onChange={(e) => cambiar({ ia: e.target.value })}>
          <option value="">Con o sin IA</option>
          <option value="si">Lleva IA</option>
          <option value="no">Sin IA</option>
        </NativeSelect>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Segmentos
          etiqueta="Vista"
          activo={f.vista}
          onCambio={(v) => cambiar({ vista: v })}
          opciones={[
            { valor: "", etiqueta: "Todos" },
            { valor: "categorias", etiqueta: "Por categoría" },
          ]}
        />
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {resultados.length} {resultados.length === 1 ? "servicio" : "servicios"}
        </p>
        {hayFiltros ? (
          <button
            type="button"
            onClick={() => cambiar({ q: "", cat: "", estado: "", dif: "", ia: "" })}
            className="text-sm font-bold text-primary hover:underline"
          >
            Quitar filtros
          </button>
        ) : null}
        <label className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={f.archivados === "1"}
            onChange={(e) => cambiar({ archivados: e.target.checked ? "1" : "" })}
            className="size-4 accent-ergon-blue"
          />
          Ver archivados
        </label>
      </div>

      {resultados.length === 0 ? (
        <EmptyState icono={SearchX} titulo="Ningún servicio coincide" texto="Prueba con otras palabras o quita filtros." />
      ) : porCategoria ? (
        <div className="space-y-8">
          {CATEGORIAS.map((c) => {
            const lista = resultados.filter((s) => s.categorias.includes(c));
            if (!lista.length) return null;
            return (
              <section key={c} aria-label={c}>
                <h2 className="mb-3 text-lg font-black text-ergon-navy">
                  {c} <span className="text-sm font-bold text-muted-foreground">· {lista.length}</span>
                </h2>
                <Rejilla servicios={lista} />
              </section>
            );
          })}
        </div>
      ) : (
        <Rejilla servicios={resultados} />
      )}
    </div>
  );
}

function Rejilla({ servicios }: { servicios: Servicio[] }) {
  return (
    <m.ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" variants={stagger(0.03)} initial="oculto" animate="visible">
      {servicios.map((s) => (
        <m.li key={s.id} variants={fadeUp}>
          <TarjetaServicio servicio={s} />
        </m.li>
      ))}
    </m.ul>
  );
}
