import type { Metadata } from "next";
import Link from "next/link";
import { LOCALE, ZONA_HORARIA } from "@/lib/utils";
import { obtenerUsuario } from "@/lib/auth";
import { obtenerCatalogos } from "@/lib/tareas";
import {
  ACCIONES_BITACORA,
  POR_PAGINA,
  RUTA_REGISTRO,
  TABLAS_BITACORA,
  cambios,
  leerFiltrosBitacora,
  nombreRegistro,
  obtenerBitacora,
} from "@/lib/bitacora";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Avatar } from "@/components/tareas/etiquetas";

export const metadata: Metadata = { title: "Bitácora" };

const fechaHora = new Intl.DateTimeFormat(LOCALE, { timeZone: ZONA_HORARIA, dateStyle: "medium", timeStyle: "short" });

export default async function BitacoraPage({ searchParams }: PageProps<"/ajustes/bitacora">) {
  const usuario = await obtenerUsuario();
  const f = leerFiltrosBitacora(await searchParams);
  const [{ registros, total }, { perfiles }] = await Promise.all([obtenerBitacora(f), obtenerCatalogos(usuario.id)]);
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));

  const hrefPagina = (pagina: number) => {
    const p = new URLSearchParams(
      Object.entries({ ...f, pagina: String(pagina) }).filter(([, v]) => v !== "" && v !== "1") as [string, string][],
    );
    return p.size ? `/ajustes/bitacora?${p}` : "/ajustes/bitacora";
  };

  return (
    <div className="grid gap-4">
      {/* Filtros con un formulario GET: funcionan sin JavaScript. */}
      <form method="get" className="grid gap-3 rounded-lg border border-white/70 bg-card p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_9rem_9rem_auto] lg:items-end">
        <label className="grid gap-1 text-xs font-bold text-muted-foreground">
          Tipo
          <NativeSelect name="tabla" defaultValue={f.tabla}>
            <option value="">Todo</option>
            {Object.entries(TABLAS_BITACORA).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </NativeSelect>
        </label>
        <label className="grid gap-1 text-xs font-bold text-muted-foreground">
          Quién
          <NativeSelect name="usuario" defaultValue={f.usuario}>
            <option value="">Todos</option>
            {perfiles.map((p) => (
              <option key={p.usuario_id} value={p.usuario_id}>
                {p.nombre}
              </option>
            ))}
            <option value="sistema">Sistema (automático)</option>
          </NativeSelect>
        </label>
        <label className="grid gap-1 text-xs font-bold text-muted-foreground">
          Acción
          <NativeSelect name="accion" defaultValue={f.accion}>
            <option value="">Todas</option>
            {Object.entries(ACCIONES_BITACORA).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </NativeSelect>
        </label>
        <label className="grid gap-1 text-xs font-bold text-muted-foreground">
          Desde
          <Input type="date" name="desde" defaultValue={f.desde} />
        </label>
        <label className="grid gap-1 text-xs font-bold text-muted-foreground">
          Hasta
          <Input type="date" name="hasta" defaultValue={f.hasta} />
        </label>
        <div className="flex gap-2">
          <Button type="submit">Filtrar</Button>
          <Button asChild variant="ghost">
            <Link href="/ajustes/bitacora">Limpiar</Link>
          </Button>
        </div>
      </form>

      <p className="text-sm text-muted-foreground">
        {total} {total === 1 ? "registro" : "registros"}. Solo lectura.
      </p>

      {registros.length === 0 ? (
        <p className="rounded-lg border border-white/70 bg-card p-8 text-center text-sm text-muted-foreground">Sin registros.</p>
      ) : (
        <ul className="divide-y rounded-lg border border-white/70 bg-card">
          {registros.map((r) => {
            const perfil = perfiles.find((p) => p.usuario_id === r.usuario_id);
            const nombre = nombreRegistro(r);
            const ruta = r.tabla && r.registro_id && r.accion !== "delete" ? RUTA_REGISTRO[r.tabla]?.(r.registro_id) : undefined;
            const lista = r.accion === "update" ? cambios(r) : [];
            return (
              <li key={r.id} className="flex gap-3 px-4 py-3">
                {perfil ? (
                  <Avatar perfil={perfil} className="mt-0.5 size-7" />
                ) : (
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600" title="Sistema">
                    SIS
                  </span>
                )}
                <div className="min-w-0 flex-1 text-sm">
                  <p>
                    <strong>{perfil?.nombre ?? "Sistema"}</strong> {(ACCIONES_BITACORA[r.accion] ?? r.accion).toLowerCase()}{" "}
                    {r.tabla && r.accion !== "cambio_contrasena" ? (TABLAS_BITACORA[r.tabla] ?? r.tabla).toLowerCase() : ""}
                    {nombre ? (
                      <>
                        {" "}
                        {ruta ? (
                          <Link href={ruta} className="font-bold text-primary hover:underline">
                            {nombre}
                          </Link>
                        ) : (
                          <span className="font-bold">{nombre}</span>
                        )}
                      </>
                    ) : null}
                  </p>
                  {lista.length ? (
                    <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                      {lista.slice(0, 6).map((c) => (
                        <li key={c.campo}>
                          {c.campo}: <span className="line-through">{c.antes}</span> → <span className="text-foreground">{c.despues}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <p className="mt-1 text-xs text-muted-foreground">{fechaHora.format(new Date(r.creado_en))}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {paginas > 1 ? (
        <nav aria-label="Páginas" className="flex items-center justify-center gap-3 text-sm">
          {f.pagina > 1 ? (
            <Link href={hrefPagina(f.pagina - 1)} className="font-bold text-primary hover:underline">
              ‹ Anterior
            </Link>
          ) : null}
          <span className="text-muted-foreground">
            Página {f.pagina} de {paginas}
          </span>
          {f.pagina < paginas ? (
            <Link href={hrefPagina(f.pagina + 1)} className="font-bold text-primary hover:underline">
              Siguiente ›
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
