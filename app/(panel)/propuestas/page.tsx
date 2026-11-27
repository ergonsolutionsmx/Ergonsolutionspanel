import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, FilePlus2, FileText, Plus } from "lucide-react";
import { cn, pesos } from "@/lib/utils";
import { obtenerUsuario } from "@/lib/auth";
import { obtenerPropuestas, serviciosDePropuestas } from "@/lib/propuestas";
import { ESTADOS_PROPUESTA, NOMBRE_ESTADO_PROPUESTA, conIva, type EstadoPropuesta } from "@/lib/propuestas-tipos";
import { fechaCorta, hoyISO, partesCDMX } from "@/lib/fechas";
import { Titulo } from "@/components/panel/titulo";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { EtiquetaEstadoPropuesta } from "@/components/propuestas/etiqueta-estado";

export const metadata: Metadata = { title: "Propuestas" };

export default async function PropuestasPage({ searchParams }: PageProps<"/propuestas">) {
  await obtenerUsuario();
  const sp = await searchParams;
  const estado = (ESTADOS_PROPUESTA as readonly string[]).includes(String(sp.estado)) ? (sp.estado as EstadoPropuesta) : "";
  const archivadas = sp.archivadas === "1";
  const propuestas = await obtenerPropuestas({ estado, archivadas });
  const servicios = await serviciosDePropuestas(propuestas.map((p) => p.id));
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
        scroll={false}
        className={cn(
          "flex h-9 items-center whitespace-nowrap rounded-full border px-3.5 text-sm font-bold transition-colors",
          activo ? "border-ergon-navy bg-ergon-navy text-white" : "border-white/70 bg-card text-ergon-navy hover:bg-accent",
        )}
      >
        {nombre}
      </Link>
    );
  };

  const vigencia = (p: (typeof propuestas)[number]) => {
    const vence = p.vence_en ? partesCDMX(p.vence_en).fecha : null;
    return vence && (p.estado === "enviada" || p.estado === "vista") ? fechaCorta(vence, hoy) : null;
  };
  const total = (p: (typeof propuestas)[number]) => ({
    inst: conIva(p.total_instalacion, p.con_iva).total,
    mens: conIva(p.total_mensual, p.con_iva).total,
  });

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
        <Link href={archivadas ? "/propuestas" : "/propuestas?archivadas=1"} className="ml-auto text-sm font-bold text-primary hover:underline">
          {archivadas ? "Ver activas" : "Ver archivadas"}
        </Link>
      </div>

      {propuestas.length === 0 ? (
        <EmptyState
          icono={FileText}
          titulo="Sin propuestas"
          texto="Crea la primera desde el catálogo de servicios."
          accion={
            <Button asChild>
              <Link href="/propuestas/nueva">
                <FilePlus2 /> Nueva propuesta
              </Link>
            </Button>
          }
        />
      ) : (
        <>
          {/* Computadora: tabla */}
          <div className="hidden overflow-hidden rounded-[1.25rem] border border-white/70 bg-card shadow-sm md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  <th scope="col" className="px-4 py-3">Folio</th>
                  <th scope="col" className="px-4 py-3">Cliente</th>
                  <th scope="col" className="px-4 py-3">Servicios</th>
                  <th scope="col" className="px-4 py-3 text-right">Total</th>
                  <th scope="col" className="px-4 py-3">Estado</th>
                  <th scope="col" className="px-4 py-3">Link vence</th>
                  <th scope="col" className="w-10 px-2 py-3"><span className="sr-only">Abrir</span></th>
                </tr>
              </thead>
              <tbody>
                {propuestas.map((p) => {
                  const t = total(p);
                  const s = servicios[p.id] ?? [];
                  return (
                    <tr key={p.id} className="group relative border-b last:border-b-0 hover:bg-muted/60">
                      <td className="px-4 py-3 font-mono font-bold text-ergon-navy">
                        <Link href={`/propuestas/${p.id}`} className="after:absolute after:inset-0">
                          {p.folio}
                        </Link>
                      </td>
                      <td className="max-w-48 px-4 py-3">
                        <span className="block truncate font-bold">{p.prospecto_nombre}</span>
                        {p.prospecto_negocio ? <span className="block truncate text-xs text-muted-foreground">{p.prospecto_negocio}</span> : null}
                      </td>
                      <td className="max-w-56 px-4 py-3 text-muted-foreground">
                        <span className="line-clamp-2">{s.length ? s.join(", ") : "—"}</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                        <span className="font-bold">{pesos(t.inst)}</span>
                        <span className="block text-xs text-muted-foreground">
                          {pesos(t.mens)}/mes{p.con_iva ? " · c/IVA" : ""}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <EtiquetaEstadoPropuesta estado={p.estado} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">{vigencia(p) ?? "—"}</td>
                      <td className="px-2 py-3 text-muted-foreground">
                        <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Celular: tarjetas */}
          <ul className="space-y-2 md:hidden">
            {propuestas.map((p) => {
              const t = total(p);
              const v = vigencia(p);
              return (
                <li key={p.id}>
                  <Link href={`/propuestas/${p.id}`} className="block rounded-2xl border border-white/70 bg-card p-4 shadow-sm active:scale-[0.99]">
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-mono text-sm font-bold text-ergon-navy">{p.folio}</span>
                      <EtiquetaEstadoPropuesta estado={p.estado} />
                    </span>
                    <span className="mt-1 block truncate font-bold">{p.prospecto_nombre}</span>
                    <span className="block truncate text-xs text-muted-foreground">{(servicios[p.id] ?? []).join(", ") || "Sin servicios"}</span>
                    <span className="mt-2 flex items-end justify-between">
                      <span className="text-xs text-muted-foreground">{v ? `Vence ${v}` : ""}</span>
                      <span className="text-right text-sm tabular-nums">
                        <span className="font-bold">{pesos(t.inst)}</span> · {pesos(t.mens)}/mes
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </>
  );
}
