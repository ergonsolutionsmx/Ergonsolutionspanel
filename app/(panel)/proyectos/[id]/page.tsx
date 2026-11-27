import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Pencil, Plus } from "lucide-react";
import { obtenerUsuario } from "@/lib/auth";
import { fechaCorta } from "@/lib/fechas";
import { leerFiltros, obtenerCatalogos, obtenerProyecto, obtenerTareas, porcentaje } from "@/lib/tareas";
import { Button } from "@/components/ui/button";
import { Avatar, EtiquetaEstadoProyecto } from "@/components/tareas/etiquetas";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Contador } from "@/components/movimiento/contador";
import { EtapasMetodo } from "@/components/proyectos/etapas";
import { NOMBRE_TIPO_PROYECTO } from "@/lib/tareas-tipos";
import { FiltrosTareas, PestanasVista } from "@/components/tareas/filtros";
import { Tablero } from "@/components/tareas/tablero";
import { ListaTareas } from "@/components/tareas/lista";

export const metadata: Metadata = { title: "Proyecto" };

export default async function ProyectoPage({ params, searchParams }: PageProps<"/proyectos/[id]">) {
  const usuario = await obtenerUsuario();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const proyecto = await obtenerProyecto(id);
  if (!proyecto) notFound();

  const catalogos = await obtenerCatalogos(usuario.id);
  const filtros = { ...leerFiltros(sp), proyecto: proyecto.id };
  const tareas = await obtenerTareas(filtros, usuario.id);
  const vista = sp.vista === "lista" ? "lista" : "tablero";
  const avance = porcentaje(proyecto);
  const responsable = catalogos.perfiles.find((p) => p.usuario_id === proyecto.responsable_id);

  const qs = new URLSearchParams(Object.entries(sp).flatMap(([k, v]) => (typeof v === "string" ? [[k, v]] : []))).toString();
  const volver = qs ? `/proyectos/${proyecto.id}?${qs}` : `/proyectos/${proyecto.id}`;

  return (
    <>
      <Link href="/proyectos?vista=proyectos" className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">
        <ArrowLeft className="size-4" aria-hidden /> Proyectos
      </Link>

      <section className="mb-4 rounded-[1.25rem] border border-white/70 bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-ergon-navy">{proyecto.nombre}</h1>
              <EtiquetaEstadoProyecto estado={proyecto.estado} />
              {proyecto.tipo ? <Badge variant="enviada">{NOMBRE_TIPO_PROYECTO[proyecto.tipo]}</Badge> : null}
            </div>
            {proyecto.cliente ? <p className="mt-0.5 text-sm font-bold text-muted-foreground">{proyecto.cliente}</p> : null}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Avatar perfil={responsable} /> {responsable?.nombre ?? "Sin responsable"}
              </span>
              <span className="flex items-center gap-1">
                <CalendarDays className="size-4" aria-hidden /> Inicio {fechaCorta(proyecto.creado_en.slice(0, 10), catalogos.hoy)}
                {proyecto.fecha_objetivo ? ` · Entrega ${fechaCorta(proyecto.fecha_objetivo, catalogos.hoy)}` : ""}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href={`/proyectos/${proyecto.id}/editar`}>
                <Pencil /> Editar
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/proyectos/tareas/nueva?proyecto=${proyecto.id}&volver=${encodeURIComponent(volver)}`}>
                <Plus /> Tarea
              </Link>
            </Button>
          </div>
        </div>
        {proyecto.descripcion ? <p className="mt-3 whitespace-pre-line text-sm">{proyecto.descripcion}</p> : null}
        <div className="mt-4 space-y-1.5">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-muted-foreground">
              {proyecto.hechas} de {proyecto.total} tareas hechas
            </span>
            <span className="text-2xl font-black text-ergon-navy">
              <Contador valor={avance} />%
            </span>
          </div>
          <Progress value={avance} className="h-2.5" aria-label="Avance del proyecto" />
        </div>
      </section>

      <div className="mb-5">
        <EtapasMetodo proyectoId={proyecto.id} etapa={proyecto.etapa} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <PestanasVista conProyectos={false} />
        <FiltrosTareas catalogos={catalogos} conProyecto={false} />
      </div>

      {vista === "lista" ? (
        <ListaTareas tareas={tareas} catalogos={catalogos} volver={volver} mostrarProyecto={false} />
      ) : (
        <Tablero tareas={tareas} catalogos={catalogos} volver={volver} mostrarProyecto={false} proyectoId={proyecto.id} />
      )}
    </>
  );
}
