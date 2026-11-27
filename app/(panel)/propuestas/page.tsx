import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { cn, pesos } from "@/lib/utils";
import { obtenerUsuario } from "@/lib/auth";
import { obtenerPropuestas } from "@/lib/propuestas";
import { ESTADOS_PROPUESTA, NOMBRE_ESTADO_PROPUESTA, type EstadoPropuesta } from "@/lib/propuestas-tipos";
import { fechaCorta, hoyISO, partesCDMX } from "@/lib/fechas";
import { Titulo } from "@/components/panel/titulo";
import { Button } from "@/components/ui/button";
import { EtiquetaEstadoPropuesta } from "@/components/propuestas/etiqueta-estado";

export const metadata: Metadata = { title: "Propuestas" };

export default async function PropuestasPage({ searchParams }: PageProps<"/propuestas">) {
  await obtenerUsuario();
  const sp = await searchParams;
  const estado = (ESTADOS_PROPUESTA as readonly string[]).includes(String(sp.estado)) ? (sp.estado as EstadoPropuesta) : "";
  const archivadas = sp.archivadas === "1";
  const propuestas = await obtenerPropuestas({ estado, archivadas });
  const hoy = hoyISO();

  const chip = (valor: string, nombre: string, activo: boolean) => {
    const p = new URLSearchParams();
    if (valor) p.set("estado", valor);
    if (archivadas) p.set("archivadas", "1");
    return (
      <Link
        key={valor || "todas"}
        href={`/propuestas${p.size ? `?${p}` : ""}`}
        aria-current={activo ? "true" : undefined}
        className={cn(
          "flex h-9 items-center whitespace-nowrap rounded-full border px-3 text-sm font-bold",
          activo ? "border-ergon-navy bg-ergon-navy text-white" : "bg-card text-ergon-navy hover:bg-accent",
        )}
      >
        {nombre}
      </Link>
    );
  };

  return (
    <>
      <Titulo
        accion={
          <Button asChild>
            <Link href="/propuestas/nueva">
              <Plus /> Propuesta
            </Link>
          </Button>
        }
      >
        Propuestas
      </Titulo>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
          {chip("", "Todas", !estado)}
          {ESTADOS_PROPUESTA.map((e) => chip(e, NOMBRE_ESTADO_PROPUESTA[e], estado === e))}
        </div>
        <Link
          href={archivadas ? "/propuestas" : "/propuestas?archivadas=1"}
          className="ml-auto text-sm font-bold text-primary hover:underline"
        >
          {archivadas ? "Ver activas" : "Ver archivadas"}
        </Link>
      </div>

      {propuestas.length === 0 ? (
        <p className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">Sin propuestas</p>
      ) : (
        <ul className="divide-y rounded-lg border bg-card">
          {propuestas.map((p) => {
            const vence = p.vence_en ? partesCDMX(p.vence_en).fecha : null;
            return (
              <li key={p.id}>
                <Link href={`/propuestas/${p.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-muted">
                  <span className="w-28 shrink-0 font-mono text-sm font-bold text-ergon-navy">{p.folio}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold">{p.prospecto_nombre}</span>
                    {p.prospecto_negocio ? <span className="block truncate text-xs text-muted-foreground">{p.prospecto_negocio}</span> : null}
                  </span>
                  <EtiquetaEstadoPropuesta estado={p.estado} />
                  <span className="w-40 text-right text-sm">
                    <span className="font-bold">{pesos(p.total_instalacion)}</span>
                    <span className="block text-xs text-muted-foreground">{pesos(p.total_mensual)}/mes</span>
                  </span>
                  <span className="w-24 text-right text-xs text-muted-foreground">
                    {vence && (p.estado === "enviada" || p.estado === "vista") ? `Vence ${fechaCorta(vence, hoy)}` : null}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
