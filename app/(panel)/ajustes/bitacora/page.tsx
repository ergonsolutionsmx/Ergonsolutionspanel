import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { obtenerUsuario } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";
import { TABLAS_BITACORA, leerFiltrosBitacora, obtenerBitacoraHasta } from "@/lib/bitacora";
import { agruparActividad } from "@/lib/actividad";
import { Button } from "@/components/ui/button";
import { LineaTiempo } from "@/components/actividad/linea-tiempo";
import { SeccionAjustes } from "@/components/ajustes/seccion";

export const metadata: Metadata = { title: "Bitácora" };

const POR_BLOQUE = 30;
const MODULOS = ["tareas", "proyectos", "eventos", "propuestas", "mensajes", "servicios", "demos", "cuenta"];

export default async function BitacoraPage({ searchParams }: PageProps<"/ajustes/bitacora">) {
  await obtenerUsuario();
  const sp = await searchParams;
  const f = leerFiltrosBitacora(sp);
  const cantidad = f.pagina * POR_BLOQUE;
  const supabase = await crearClienteServidor();
  const [{ registros, total }, { data: perfiles }] = await Promise.all([
    obtenerBitacoraHasta(f, cantidad),
    supabase.from("perfiles").select("usuario_id, nombre, color").order("nombre"),
  ]);
  const dias = agruparActividad(registros, perfiles ?? []);

  const href = (cambios: Record<string, string>) => {
    const p = new URLSearchParams({ tabla: f.tabla, usuario: f.usuario, ...cambios });
    for (const [k, v] of [...p.entries()]) if (!v || (k === "pagina" && v === "1")) p.delete(k);
    return p.size ? `/ajustes/bitacora?${p}` : "/ajustes/bitacora";
  };
  const chip = (activo: boolean, url: string, texto: string) => (
    <Link
      key={url + texto}
      href={url}
      scroll={false}
      aria-current={activo ? "true" : undefined}
      className={cn(
        "flex h-8 items-center whitespace-nowrap rounded-full border px-3 text-xs font-bold",
        activo ? "border-ergon-navy bg-ergon-navy text-white" : "border-white/70 bg-card text-ergon-navy hover:bg-accent",
      )}
    >
      {texto}
    </Link>
  );

  return (
    <SeccionAjustes titulo="Bitácora" descripcion="Historial de cambios en todo el panel. Solo lectura.">
      <div className="mb-5 space-y-2">
        <div className="-mx-5 flex gap-1.5 overflow-x-auto px-5 md:mx-0 md:flex-wrap md:px-0" aria-label="Quién">
          {chip(!f.usuario, href({ usuario: "" }), "Todos")}
          {(perfiles ?? []).map((p) => chip(f.usuario === p.usuario_id, href({ usuario: p.usuario_id }), p.nombre.split(" ")[0]))}
          {chip(f.usuario === "sistema", href({ usuario: "sistema" }), "Sistema")}
        </div>
        <div className="-mx-5 flex gap-1.5 overflow-x-auto px-5 md:mx-0 md:flex-wrap md:px-0" aria-label="Módulo">
          {chip(!f.tabla, href({ tabla: "" }), "Todo")}
          {MODULOS.map((m) => chip(f.tabla === m, href({ tabla: m }), TABLAS_BITACORA[m]))}
        </div>
      </div>

      <LineaTiempo dias={dias} />

      <div className="mt-5 flex flex-col items-center gap-2">
        <p className="text-xs text-muted-foreground">
          Mostrando {registros.length} de {total}
        </p>
        {registros.length < total ? (
          <Button asChild variant="outline">
            <Link href={href({ pagina: String(f.pagina + 1) })} scroll={false}>
              <ChevronDown /> Cargar más
            </Link>
          </Button>
        ) : null}
      </div>
    </SeccionAjustes>
  );
}
