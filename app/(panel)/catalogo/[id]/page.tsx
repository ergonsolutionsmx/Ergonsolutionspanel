import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, FolderOpen, Pencil } from "lucide-react";
import { pesos } from "@/lib/utils";
import { obtenerUsuario } from "@/lib/auth";
import { obtenerServicio } from "@/lib/catalogo";
import { NOMBRE_VARIANTE } from "@/lib/catalogo-tipos";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EtiquetaDificultad, EtiquetaEstadoServicio, EtiquetaIA } from "@/components/catalogo/etiquetas";
import { BotonArchivar } from "@/components/catalogo/boton-archivar";

export const metadata: Metadata = { title: "Servicio" };

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-white/70 bg-card p-4 md:p-5">
      <h2 className="mb-2 font-black text-ergon-navy">{titulo}</h2>
      {children}
    </section>
  );
}

function SinDefinir() {
  return <p className="text-sm text-muted-foreground">Sin definir. Se llena desde Editar.</p>;
}

function Lista({ texto, items }: { texto?: string | null; items?: string[] }) {
  const lineas = items ?? (texto ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
  if (!lineas.length) return <SinDefinir />;
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm">
      {lineas.map((l, i) => (
        <li key={i}>{l}</li>
      ))}
    </ul>
  );
}

function Precio({ valor, mensual = false }: { valor: number | null; mensual?: boolean }) {
  if (valor === null) return <span className="text-muted-foreground">Por definir</span>;
  return (
    <span className="font-bold">
      {pesos(valor)}
      {mensual ? "/mes" : ""}
    </span>
  );
}

export default async function ServicioPage({ params }: PageProps<"/catalogo/[id]">) {
  await obtenerUsuario();
  const { id } = await params;
  const s = await obtenerServicio(id);
  if (!s) notFound();

  return (
    <div className="max-w-4xl">
      <Link href="/catalogo" className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">
        <ArrowLeft className="size-4" aria-hidden /> Catálogo
      </Link>

      <div className="mb-5 flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <span className="mt-1 rounded bg-ergon-navy px-2 py-0.5 text-sm font-black text-white">{s.numero}</span>
            <h1 className="text-2xl font-black text-ergon-navy">{s.nombre}</h1>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <EtiquetaEstadoServicio estado={s.estado} />
            <EtiquetaDificultad dificultad={s.dificultad} />
            {s.lleva_ia ? <EtiquetaIA /> : null}
            {!s.activo ? <Badge className="bg-slate-800 text-white">Archivado</Badge> : null}
            {s.categorias.map((c) => (
              <Badge key={c} variant="gris">
                {c}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {s.link_drive ? (
            <Button asChild>
              <a href={s.link_drive} target="_blank" rel="noopener noreferrer">
                <FolderOpen /> Carpeta en Drive <ExternalLink className="size-3" aria-hidden />
              </a>
            </Button>
          ) : null}
          <Button asChild variant="outline">
            <Link href={`/catalogo/${s.id}/editar`}>
              <Pencil /> Editar
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        <Seccion titulo="Qué es">{s.que_es ? <p className="whitespace-pre-line text-sm">{s.que_es}</p> : <SinDefinir />}</Seccion>
        <div className="grid gap-4 md:grid-cols-2">
          <Seccion titulo="Para quién">{s.para_quien ? <p className="text-sm">{s.para_quien}</p> : <SinDefinir />}</Seccion>
          <Seccion titulo="Problemas que resuelve">
            <Lista items={s.problemas} />
          </Seccion>
        </div>

        <section>
          <h2 className="mb-2 font-black text-ergon-navy">Variantes</h2>
          {s.variantes.length === 0 ? (
            <div className="rounded-lg border border-white/70 bg-card p-4">
              <SinDefinir />
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-3">
              {s.variantes.map((v) => (
                <article key={v.id} className="flex flex-col gap-3 rounded-lg border border-white/70 bg-card p-4">
                  <h3 className="font-black text-ergon-navy">{NOMBRE_VARIANTE[v.nombre]}</h3>
                  {v.que_incluye ? <p className="text-sm">{v.que_incluye}</p> : <SinDefinir />}
                  {v.entregables ? (
                    <div>
                      <p className="text-xs font-bold uppercase text-muted-foreground">Entregables</p>
                      <p className="whitespace-pre-line text-sm">{v.entregables}</p>
                    </div>
                  ) : null}
                  <dl className="mt-auto grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 border-t pt-3 text-sm">
                    <dt className="text-muted-foreground">Tiempo</dt>
                    <dd>{v.tiempo_estimado ?? <span className="text-muted-foreground">Por definir</span>}</dd>
                    <dt className="text-muted-foreground">Instalación</dt>
                    <dd>
                      <Precio valor={v.precio_instalacion} />
                    </dd>
                    <dt className="text-muted-foreground">Mensualidad</dt>
                    <dd>
                      <Precio valor={v.precio_mensual} mensual />
                    </dd>
                  </dl>
                </article>
              ))}
            </div>
          )}
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          <Seccion titulo="Entregables">
            <Lista texto={s.entregables} />
          </Seccion>
          <Seccion titulo="Cuándo NO recomendarlo">
            <Lista texto={s.cuando_no_recomendar} />
          </Seccion>
        </div>

        <div>
          <BotonArchivar id={s.id} activo={s.activo} nombre={s.nombre} />
        </div>
      </div>
    </div>
  );
}
