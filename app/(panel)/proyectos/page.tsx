import type { Metadata } from "next";
import Link from "next/link";
import { FolderPlus, Plus } from "lucide-react";
import { obtenerUsuario } from "@/lib/auth";
import { leerFiltros, obtenerCatalogos, obtenerProyectos, obtenerTareas } from "@/lib/tareas";
import { Titulo } from "@/components/panel/titulo";
import { Button } from "@/components/ui/button";
import { FiltrosTareas, PestanasVista } from "@/components/tareas/filtros";
import { Tablero } from "@/components/tareas/tablero";
import { ListaTareas } from "@/components/tareas/lista";
import { ListaProyectos } from "@/components/proyectos/lista-proyectos";

export const metadata: Metadata = { title: "Proyectos" };

export default async function ProyectosPage({ searchParams }: PageProps<"/proyectos">) {
  const usuario = await obtenerUsuario();
  const sp = await searchParams;
  const vista = sp.vista === "lista" || sp.vista === "proyectos" ? sp.vista : "tablero";
  const catalogos = await obtenerCatalogos(usuario.id);

  // Ruta actual, para regresar aquí después de abrir/editar una tarea.
  const qs = new URLSearchParams(
    Object.entries(sp).flatMap(([k, v]) => (typeof v === "string" ? [[k, v]] : [])),
  ).toString();
  const volver = qs ? `/proyectos?${qs}` : "/proyectos";

  const accion =
    vista === "proyectos" ? (
      <Button asChild>
        <Link href="/proyectos/nuevo">
          <FolderPlus /> Proyecto
        </Link>
      </Button>
    ) : (
      <Button asChild>
        <Link href={`/proyectos/tareas/nueva?volver=${encodeURIComponent(volver)}`}>
          <Plus /> Tarea
        </Link>
      </Button>
    );

  return (
    <>
      <Titulo accion={accion}>Proyectos y tareas</Titulo>
      <div className="mb-4">
        <PestanasVista />
      </div>

      {vista === "proyectos" ? (
        <ListaProyectos proyectos={await obtenerProyectos()} catalogos={catalogos} />
      ) : (
        <>
          <div className="mb-4">
            <FiltrosTareas catalogos={catalogos} />
          </div>
          {vista === "lista" ? (
            <ListaTareas tareas={await obtenerTareas(leerFiltros(sp), usuario.id)} catalogos={catalogos} volver={volver} />
          ) : (
            <Tablero tareas={await obtenerTareas(leerFiltros(sp), usuario.id)} catalogos={catalogos} volver={volver} />
          )}
        </>
      )}
    </>
  );
}
