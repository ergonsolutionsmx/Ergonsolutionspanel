import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Pencil, Plus } from "lucide-react";
import { obtenerUsuario } from "@/lib/auth";
import { fechaCorta } from "@/lib/fechas";
import { leerFiltros, obtenerCatalogos, obtenerProyecto, obtenerTareas, porcentaje } from "@/lib/tareas";
import { Button } from "@/components/ui/button";
import { Avatar, BarraAvance, EtiquetaEstadoProyecto } from "@/components/tareas/etiquetas";
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

      <div className="mb-5 flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-black text-ergon-navy">{proyecto.nombre}</h1>
            <EtiquetaEstadoProyecto estado={proyecto.estado} />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Avatar perfil={responsable} /> {responsable?.nombre ?? "Sin responsable"}
            </span>
            {proyecto.fecha_objetivo ? (
              <span className="flex items-center gap-1">
                <CalendarDays className="size-4" aria-hidden /> {fechaCorta(proyecto.fecha_objetivo, catalogos.hoy)}
              </span>
            ) : null}
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

      {proyecto.descripcion ? <p className="mb-5 whitespace-pre-line text-sm">{proyecto.descripcion}</p> : null}

      <div className="mb-6 max-w-md space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {proyecto.hechas} de {proyecto.total} tareas hechas
          </span>
          <span className="font-black text-ergon-navy">{avance}%</span>
        </div>
        <BarraAvance valor={avance} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <PestanasVista conProyectos={false} />
        <FiltrosTareas catalogos={catalogos} conProyecto={false} />
      </div>

      {vista === "lista" ? (
        <ListaTareas tareas={tareas} catalogos={catalogos} volver={volver} mostrarProyecto={false} />
      ) : (
        <Tablero tareas={tareas} catalogos={catalogos} volver={volver} mostrarProyecto={false} />
      )}
    </>
  );
}
